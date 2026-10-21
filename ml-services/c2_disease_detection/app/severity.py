"""
Disease Severity Assessment Module
AgriGuard Research Project (J26-IT-420 - SLIIT)

Implements scientifically defensible disease severity evaluation.
CRITICAL RESEARCH CONSTRAINT:
Grad-CAM heatmaps indicate convolutional network attribution, NOT validated
lesion boundaries. We strictly forbid deriving severity percentages from
uncalibrated Grad-CAM activation thresholds.
When independent lesion segmentation masks or expert severity annotations are
unavailable, severity is transparently returned as 'UNAVAILABLE'.
"""

from typing import Dict, Optional, Tuple
import numpy as np

SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH"]

def assess_severity_from_mask(
    lesion_mask: np.ndarray,
    leaf_mask: Optional[np.ndarray] = None
) -> Tuple[str, float]:
    """
    Computes disease severity from verified binary lesion segmentation masks.
    - LOW: < 15% visible affected area
    - MEDIUM: 15% - 40% visible affected area
    - HIGH: > 40% visible affected area or apical meristem necrosis
    """
    if leaf_mask is not None:
        total_leaf_pixels = np.count_nonzero(leaf_mask)
        if total_leaf_pixels == 0:
            return "UNAVAILABLE", 0.0
        lesion_pixels = np.count_nonzero(lesion_mask & leaf_mask)
        severity_ratio = lesion_pixels / float(total_leaf_pixels)
    else:
        total_pixels = lesion_mask.size
        lesion_pixels = np.count_nonzero(lesion_mask)
        severity_ratio = lesion_pixels / float(total_pixels)

    severity_percentage = round(severity_ratio * 100.0, 2)

    if severity_percentage < 15.0:
        level = "LOW"
    elif severity_percentage <= 40.0:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return level, severity_percentage

def evaluate_disease_severity(
    predicted_disease: str,
    confidence: float,
    lesion_mask: Optional[np.ndarray] = None
) -> Dict[str, object]:
    """
    Evaluates severity for a detected plant disease.
    If the plant is healthy, returns NOT_APPLICABLE / HEALTHY.
    If diseased and verified lesion mask is provided, computes calibrated severity.
    If diseased without verified mask/expert annotation, returns UNAVAILABLE.
    """
    is_healthy = "HEALTHY" in predicted_disease.upper()

    if is_healthy:
        return {
            "severity": "HEALTHY",
            "severityStatus": "NOT_APPLICABLE",
            "severityScore": 0.0,
            "severityMethod": "Healthy specimen baseline (no pathological lesions detected)."
        }

    # If confidence is below threshold, severity cannot be reliably assessed
    if confidence < 0.60:
        return {
            "severity": None,
            "severityStatus": "UNAVAILABLE",
            "severityScore": None,
            "severityMethod": "Prediction confidence is below 60%; severity assessment withheld pending expert verification."
        }

    # If an external verified mask is supplied
    if lesion_mask is not None:
        level, score = assess_severity_from_mask(lesion_mask)
        return {
            "severity": level,
            "severityStatus": "COMPLETED",
            "severityScore": score,
            "severityMethod": "Pixel-level lesion area quantification from verified mask."
        }

    # In the absence of validated independent severity masks or multi-class severity models:
    return {
        "severity": None,
        "severityStatus": "UNAVAILABLE",
        "severityScore": None,
        "severityMethod": (
            "Severity assessment requires validated lesion segmentation masks or expert severity annotations. "
            "In accordance with research integrity standards, severity is not inferred from raw Grad-CAM heatmaps."
        )
    }
