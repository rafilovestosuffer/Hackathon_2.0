"""Root-cause analysis using LLM."""

import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class RootCauseAnalyzer:
    """
    Analyzer for generating root-cause explanations.

    For MVP, uses intelligent rule-based analysis. For production,
    replace with actual LLM (e.g., Mistral-7B-4bit via transformers).
    """

    # Defect-specific analysis templates
    DEFECT_ANALYSIS = {
        "stain": {
            "root_cause": "Water contamination or improper handling during washing/finishing process. Possible contact with dirty equipment or inadequate quality control measures.",
            "recommended_action": "Re-wash with clean water, inspect for permanent staining, apply stain remover if necessary, and increase washing quality checks."
        },
        "broken_stitch": {
            "root_cause": "Thread tension misconfiguration or poor thread quality causing thread breakage during sewing. May indicate inadequate equipment maintenance.",
            "recommended_action": "Recalibrate thread tension settings, replace with high-quality thread, perform equipment maintenance, and increase QC sampling."
        },
        "hole": {
            "root_cause": "Fabric defect, excessive mechanical stress during handling, or sewing machine needle damage. Possible damage during transportation or storage.",
            "recommended_action": "Inspect fabric supplier quality, check sewing machine settings and needles, improve handling procedures, and replace damaged unit."
        },
        "misaligned_seam": {
            "root_cause": "Pattern marking error, operator inattention, or incorrect sewing machine setup. Inadequate worker training or supervision.",
            "recommended_action": "Review pattern markings, retrain sewing operator on alignment procedures, calibrate sewing guide, and increase in-line QC checks."
        },
        "color_deviation": {
            "root_cause": "Dye lot variation, inadequate color matching, or inconsistent dyeing process conditions. Possible supplier quality issue.",
            "recommended_action": "Verify dye lot consistency, perform color swatch matching before production, optimize dyeing process parameters, and test supplier samples."
        },
        "no_defect": {
            "root_cause": "No defects detected. Garment meets all quality standards.",
            "recommended_action": "Continue current production practices. Release for shipment after final inspection."
        },
        "detection_error": {
            "root_cause": "Unable to analyze garment due to detection system error.",
            "recommended_action": "Perform manual inspection by senior QA inspector. Check system logs and retry analysis."
        }
    }

    def __init__(self):
        """Initialize the root-cause analyzer."""
        logger.info("Initialized RootCauseAnalyzer (mock/rule-based mode)")

    def analyze(self, prompt: str, defect_label: str = None, standards: list = None) -> Dict[str, Any]:
        """
        Analyze root cause and generate recommendations.

        Args:
            prompt: Formatted prompt (for compatibility with real LLM)
            defect_label: Detected defect type (optional, used for intelligent fallback)
            standards: Retrieved quality standards (optional)

        Returns:
            Dictionary with keys: root_cause, recommended_action, pass_fail, cited_standard
        """
        try:
            # Try to parse defect label from prompt if not provided
            if not defect_label and "Defect Detected:" in prompt:
                parts = prompt.split("Defect Detected:")[1].split("\n")[0].strip()
                defect_label = parts.lower().replace(" ", "_")

            # Get analysis for this defect
            analysis = self.DEFECT_ANALYSIS.get(
                defect_label,
                self.DEFECT_ANALYSIS["detection_error"]
            )

            # Select cited standard
            cited_standard = {"source": "Quality Standard", "clause_id": "0.0"}
            if standards and len(standards) > 0:
                cited_standard = {
                    "source": standards[0].get("source", "Quality Standard"),
                    "clause_id": standards[0].get("clause_id", "0.0")
                }

            # Build response
            result = {
                "root_cause": analysis["root_cause"],
                "recommended_action": analysis["recommended_action"],
                "pass_fail": "pass" if defect_label == "no_defect" else "fail",
                "cited_standard": cited_standard
            }

            logger.info(f"Generated root-cause analysis for: {defect_label}")
            return result

        except Exception as e:
            logger.error(f"Error during root-cause analysis: {e}")
            return self._get_fallback_response(defect_label)

    def _get_fallback_response(self, defect_label: str = None) -> Dict[str, Any]:
        """Get fallback response when analysis fails."""
        return {
            "root_cause": "Unable to determine root cause. Manual review required.",
            "recommended_action": "Perform detailed manual inspection and consult with senior QA specialist.",
            "pass_fail": "fail" if defect_label != "no_defect" else "pass",
            "cited_standard": {
                "source": "System Error",
                "clause_id": "N/A"
            }
        }
