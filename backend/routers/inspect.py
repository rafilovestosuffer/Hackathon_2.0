from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
import io
import logging
import os
import json
from PIL import Image
from models.vision.infer import DefectDetector
from rag.index import StandardsIndex
from llm.root_cause import RootCauseAnalyzer
from llm.prompts import get_root_cause_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["inspect"])

# Load demo responses if DEMO_MODE is enabled
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
DEMO_RESPONSES = {}

if DEMO_MODE:
    try:
        with open("data/demo_responses.json", "r") as f:
            DEMO_RESPONSES = json.load(f)
        logger.info(f"Demo mode enabled. Loaded {len(DEMO_RESPONSES)} demo responses.")
    except Exception as e:
        logger.warning(f"Failed to load demo responses: {e}")

# Initialize vision model once at startup
try:
    detector = DefectDetector()
    logger.info("Vision model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load vision model: {e}")
    detector = None

# Initialize RAG index once at startup
try:
    standards_index = StandardsIndex("data/standards/standards.txt")
    logger.info("RAG standards index loaded successfully")
except Exception as e:
    logger.error(f"Failed to load RAG standards index: {e}")
    standards_index = None

# Initialize LLM analyzer once at startup
try:
    analyzer = RootCauseAnalyzer()
    logger.info("LLM root-cause analyzer initialized")
except Exception as e:
    logger.error(f"Failed to initialize LLM analyzer: {e}")
    analyzer = None


class CitedStandard(BaseModel):
    source: str
    clause_id: str
    text: str


class DefectCard(BaseModel):
    defect: str
    confidence: float
    cited_standard: CitedStandard
    root_cause: str
    recommended_action: str
    pass_fail: str


# Mapping of defect labels to standard citations
DEFECT_STANDARDS = {
    "stain": {
        "source": "Buyer Spec v3",
        "clause_id": "4.2.1",
        "text": "Visible stains on visible areas are not acceptable."
    },
    "broken_stitch": {
        "source": "ISO 9001",
        "clause_id": "5.1.2",
        "text": "All stitching must be uniform and even with no broken threads."
    },
    "hole": {
        "source": "Buyer Spec v3",
        "clause_id": "4.1.3",
        "text": "No holes or tears are acceptable in visible areas."
    },
    "misaligned_seam": {
        "source": "Bangladesh RMG Code",
        "clause_id": "3.4.5",
        "text": "Seams must be aligned and symmetrical."
    },
    "color_deviation": {
        "source": "Buyer Spec v3",
        "clause_id": "4.3.2",
        "text": "Color must be uniform and match the approved swatch."
    },
    "no_defect": {
        "source": "Quality Assurance",
        "clause_id": "0.0",
        "text": "No defects detected. Item passes inspection."
    },
    "detection_error": {
        "source": "System",
        "clause_id": "N/A",
        "text": "Error during defect detection. Manual review required."
    }
}


@router.post("/inspect")
async def inspect(
    image: UploadFile = File(...),
    product_type: str = Form(default="shirt")
):
    """
    Inspect a garment image for defects.

    Uses vision model to detect defects and returns a DefectCard.
    """
    try:
        # Validate file type
        if image.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid image format. Please upload a JPG or PNG image."
            )

        # Read and validate image
        try:
            contents = await image.read()
        except Exception as e:
            logger.error(f"Failed to read image: {e}")
            raise HTTPException(
                status_code=400,
                detail="Failed to read image file."
            )

        # Validate file size (8MB max)
        if len(contents) > 8 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image file is too large. Maximum size is 8MB."
            )

        # Verify it's a valid image
        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()
            # Reopen image since verify() closes the file
            img = Image.open(io.BytesIO(contents))
        except Exception as e:
            logger.error(f"Invalid image file: {e}")
            raise HTTPException(
                status_code=400,
                detail="Invalid image file. Please ensure it's a valid JPG or PNG."
            )

        # Check for demo mode
        if DEMO_MODE and image.filename in DEMO_RESPONSES:
            demo_response = DEMO_RESPONSES[image.filename]
            logger.info(f"Demo mode: returning pre-recorded response for {image.filename}")
            return DefectCard(
                defect=demo_response["defect"],
                confidence=demo_response["confidence"],
                cited_standard=CitedStandard(**demo_response["cited_standard"]),
                root_cause=demo_response["root_cause"],
                recommended_action=demo_response["recommended_action"],
                pass_fail=demo_response["pass_fail"]
            )

        # Run vision detection
        if detector is None:
            logger.error("Vision model not available")
            defect_label = "detection_error"
            confidence = 0.0
        else:
            try:
                vision_result = detector.detect(img)
                defect_label = vision_result["label"]
                confidence = vision_result["confidence"]
            except Exception as e:
                logger.error(f"Vision detection error: {e}")
                defect_label = "detection_error"
                confidence = 0.0

        # Retrieve relevant standards using RAG
        standards_list = []
        if standards_index is not None:
            try:
                standards_list = standards_index.retrieve(defect_label, k=1)
                logger.info(f"Retrieved {len(standards_list)} standards for {defect_label}")
            except Exception as e:
                logger.error(f"RAG retrieval error: {e}")
                standards_list = []

        # Use first retrieved standard or fallback
        if standards_list:
            standard = {
                "source": standards_list[0]["source"],
                "clause_id": standards_list[0]["clause_id"],
                "text": standards_list[0]["text"]
            }
        else:
            # Fallback standards if RAG not available
            fallback_standards = {
                "stain": {
                    "source": "Buyer Spec v3",
                    "clause_id": "4.2.1",
                    "text": "Visible stains on visible areas are not acceptable."
                },
                "broken_stitch": {
                    "source": "ISO 9001",
                    "clause_id": "5.1.2",
                    "text": "All stitching must be uniform and even with no broken threads."
                },
                "hole": {
                    "source": "Buyer Spec v3",
                    "clause_id": "4.1.3",
                    "text": "No holes or tears are acceptable in visible areas."
                },
                "misaligned_seam": {
                    "source": "Bangladesh RMG Code",
                    "clause_id": "3.4.5",
                    "text": "Seams must be aligned and symmetrical."
                },
                "color_deviation": {
                    "source": "Buyer Spec v3",
                    "clause_id": "4.3.2",
                    "text": "Color must be uniform and match the approved swatch."
                },
                "no_defect": {
                    "source": "Quality Assurance",
                    "clause_id": "0.0",
                    "text": "No defects detected. Item passes inspection."
                },
                "detection_error": {
                    "source": "System",
                    "clause_id": "N/A",
                    "text": "Error during defect detection. Manual review required."
                }
            }
            standard = fallback_standards.get(
                defect_label,
                fallback_standards["detection_error"]
            )

        # Use LLM for root-cause analysis
        llm_result = None
        if analyzer is not None:
            try:
                # Get standards for context
                retrieved_standards = standards_list if standards_list else [standard]

                # Generate prompt for LLM
                prompt = get_root_cause_prompt(
                    defect_label,
                    confidence,
                    retrieved_standards,
                    product_type
                )

                # Run LLM analysis
                llm_result = analyzer.analyze(prompt, defect_label, retrieved_standards)
                logger.info(f"LLM analysis completed for {defect_label}")
            except Exception as e:
                logger.error(f"LLM analysis error: {e}")
                llm_result = None

        # Use LLM result if available, otherwise use stub
        if llm_result:
            root_cause = llm_result.get("root_cause", f"Detected {defect_label.replace('_', ' ')} in garment.")
            recommended_action = llm_result.get("recommended_action", "Review and remediate as per standard.")
            pass_fail = llm_result.get("pass_fail", "fail")
            cited_standard_dict = llm_result.get("cited_standard", standard)
        else:
            root_cause = f"Detected {defect_label.replace('_', ' ')} in garment. Manual review recommended."
            recommended_action = "Review and remediate defect as per standard."
            pass_fail = "pass" if defect_label == "no_defect" else "fail"
            cited_standard_dict = standard

        # Return response
        return DefectCard(
            defect=defect_label,
            confidence=confidence,
            cited_standard=CitedStandard(**cited_standard_dict),
            root_cause=root_cause,
            recommended_action=recommended_action,
            pass_fail=pass_fail
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in inspect endpoint: {e}")
        # Return a safe fallback response
        return DefectCard(
            defect="inspection_error",
            confidence=0.0,
            cited_standard=CitedStandard(
                source="System",
                clause_id="N/A",
                text="An unexpected error occurred during inspection. Please retry or contact support."
            ),
            root_cause="System error occurred during defect detection process.",
            recommended_action="Please retry the inspection. If the problem persists, contact system administrator.",
            pass_fail="fail"
        )
