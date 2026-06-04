import hashlib
from PIL import Image
import logging

logger = logging.getLogger(__name__)


class DefectDetector:
    """
    Vision model for detecting garment defects.

    For MVP/demo purposes, uses a deterministic hash-based classifier
    that returns consistent results for the same image.

    In production, this would use a real vision model (ResNet18, CLIP, etc).
    """

    def __init__(self, model_path=None, device=None):
        """
        Initialize the defect detector.

        Args:
            model_path: Optional path to a custom model checkpoint
            device: torch device (unused for demo mode)
        """
        # Define defect classes
        self.defect_classes = [
            "stain",
            "broken_stitch",
            "hole",
            "misaligned_seam",
            "color_deviation"
        ]

        logger.info("Initialized demo DefectDetector (hash-based)")

    def detect(self, image: Image.Image, confidence_threshold: float = 0.5):
        """
        Detect defects in a garment image.

        Uses a deterministic hash of the image to generate consistent results.
        In production, this would use actual computer vision inference.

        Args:
            image: PIL Image object
            confidence_threshold: Minimum confidence to report a defect

        Returns:
            dict with keys:
                - label: Defect type (or "no_defect" if below threshold)
                - confidence: Confidence score [0.0, 1.0]
        """
        try:
            # Ensure image is RGB
            if image.mode != "RGB":
                image = image.convert("RGB")

            # Resize to consistent size for hashing
            image_small = image.resize((64, 64))

            # Hash the image to get a deterministic value
            image_hash = hashlib.md5(image_small.tobytes()).digest()
            hash_value = int.from_bytes(image_hash[:4], "big")

            # Use hash to select a defect class deterministically
            class_idx = hash_value % len(self.defect_classes)
            defect_label = self.defect_classes[class_idx]

            # Generate confidence based on hash (0.6 - 0.95)
            confidence = 0.6 + (hash_value % 1000) / 2500.0

            # Apply confidence threshold
            if confidence < confidence_threshold:
                return {
                    "label": "no_defect",
                    "confidence": 1.0 - confidence
                }

            return {
                "label": defect_label,
                "confidence": float(confidence)
            }

        except Exception as e:
            logger.error(f"Error during defect detection: {e}")
            return {
                "label": "detection_error",
                "confidence": 0.0
            }
