"""
Inference Pipeline for Component 2 Deep Learning Models
AgriGuard Research Project (J26-IT-420 - SLIIT)

Coordinates forward pass, softmax probabilities, crop-disease routing,
severity evaluation, Grad-CAM generation, and agricultural guidance attachment.
"""

import time
from typing import Optional
from PIL import Image
import torch
import torch.nn.functional as F
from fastapi import HTTPException

try:
    from app.model_loader import registry, CROP_DISEASE_MAPPING, DISEASE_CLASSES
    from app.severity import evaluate_disease_severity
    from app.gradcam import GradCAMExplainer, image_to_base64_png
    from app.guidance import get_guidance_for_prediction
    from app.schemas import DiseasePredictionResponse
except ImportError:
    from model_loader import registry, CROP_DISEASE_MAPPING, DISEASE_CLASSES
    from severity import evaluate_disease_severity
    from gradcam import GradCAMExplainer, image_to_base64_png
    from guidance import get_guidance_for_prediction
    from schemas import DiseasePredictionResponse

def run_disease_inference(
    input_tensor: torch.Tensor,
    original_image: Image.Image,
    crop_type: str,
    include_gradcam: bool = True
) -> DiseasePredictionResponse:
    start_time = time.perf_counter()

    if not registry.is_ready:
        raise HTTPException(
            status_code=503,
            detail="Component 2 Deep Learning model is not loaded or inference engine is unavailable."
        )

    norm_crop = crop_type.strip().upper()
    if norm_crop not in CROP_DISEASE_MAPPING:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop '{crop_type}'. Supported crops: {list(CROP_DISEASE_MAPPING.keys())}"
        )

    model = registry.efficientnet_model
    device = registry.device
    tensor = input_tensor.to(device)

    try:
        with torch.no_grad():
            logits = model(tensor)
            probabilities = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()

        class_names = registry.classes
        all_probs_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(class_names, probabilities)
        }

        # Global top prediction across all crops
        global_top_idx = int(probabilities.argmax())
        global_top_class = class_names[global_top_idx]
        global_top_prob = float(probabilities[global_top_idx])

        # Filter valid classes for the requested crop
        valid_crop_classes = CROP_DISEASE_MAPPING[norm_crop]
        valid_indices = [class_names.index(c) for c in valid_crop_classes if c in class_names]

        # Calculate crop-specific normalized probabilities
        crop_probs = probabilities[valid_indices]
        crop_probs_sum = crop_probs.sum()
        if crop_probs_sum > 1e-8:
            crop_normalized_probs = crop_probs / crop_probs_sum
        else:
            crop_normalized_probs = crop_probs

        top_within_crop_local_idx = int(crop_normalized_probs.argmax())
        selected_disease_idx = valid_indices[top_within_crop_local_idx]
        selected_disease = class_names[selected_disease_idx]
        selected_confidence = round(float(probabilities[selected_disease_idx]), 4)

        # Mismatch check: If global top prediction strongly belongs to another crop (> 75% confidence)
        is_mismatch = (global_top_class not in valid_crop_classes) and (global_top_prob > 0.75)
        is_low_confidence = selected_confidence < 0.60

        if is_mismatch:
            prediction_status = "CROP_MISMATCH_SUSPECTED"
        elif is_low_confidence:
            prediction_status = "LOW_CONFIDENCE_FLAGGED"
        else:
            prediction_status = "COMPLETED"

        # Severity Assessment
        severity_result = evaluate_disease_severity(
            predicted_disease=selected_disease,
            confidence=selected_confidence,
            lesion_mask=None
        )

        # Grad-CAM Generation
        gradcam_b64: Optional[str] = None
        gradcam_available = False

        if include_gradcam:
            try:
                # Target last convolutional layer of EfficientNet-B0: features[-1]
                target_layer = model.features[-1]
                explainer = GradCAMExplainer(model, target_layer)
                # Note: Grad-CAM needs gradient flow, run on tensor with requires_grad
                grad_tensor = tensor.clone().detach().requires_grad_(True)
                overlay_img, _ = explainer.generate_and_overlay(
                    input_tensor=grad_tensor,
                    original_image=original_image,
                    target_class_idx=selected_disease_idx
                )
                gradcam_b64 = image_to_base64_png(overlay_img)
                gradcam_available = True
                explainer.close()
            except Exception as cam_err:
                # Non-fatal if Grad-CAM fails; continue with classification
                gradcam_available = False
                gradcam_b64 = None

        # Agricultural Guidance
        guidance_info = get_guidance_for_prediction(
            predicted_class=selected_disease,
            confidence=selected_confidence,
            crop_type=norm_crop
        )

        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return DiseasePredictionResponse(
            cropType=norm_crop,
            predictedDisease=selected_disease,
            diseaseNameDisplay=str(guidance_info["displayName"]),
            confidence=selected_confidence,
            classProbabilities=all_probs_dict,
            severity=severity_result.get("severity"),
            severityStatus=str(severity_result["severityStatus"]),
            severityMethod=severity_result.get("severityMethod"),
            severityScore=severity_result.get("severityScore"),
            gradCamAvailable=gradcam_available,
            gradCamArtifactKey=None,
            gradCamBase64=gradcam_b64,
            managementGuidance=list(guidance_info["guidance"]),
            guidanceCitation=str(guidance_info.get("citation")),
            guidanceReviewedDate=str(guidance_info.get("lastReviewedDate")),
            modelIdentifier="c2_efficientnet_b0",
            modelVersion=str(registry.metadata.get("version", "v1.0")),
            predictionStatus=prediction_status,
            executionLatencyMs=latency_ms,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {str(e)}")
