import hashlib
import io
import math
import os
import secrets
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from bson import ObjectId
from PIL import Image
import torch
import torch.nn.functional as F

from app.core.config import settings
from app.core.exceptions import NotFoundError, ServiceUnavailableError, ValidationError
from app.core.logging import logger
from app.database.mongodb import mongo_manager
from app.modules.c2_disease_detection.gradcam import GradCAMExplainer
from app.modules.c2_disease_detection.guidance import get_guidance_for_prediction
from app.modules.c2_disease_detection.model_loader import (
    DISEASE_DISPLAY_NAMES,
    c2_registry,
)
from app.modules.c2_disease_detection.preprocessing import (
    prepare_tensor,
    validate_and_load_image,
)
from app.shared.constants import SUPPORTED_CROPS
from app.shared.serializers import serialize_doc


class C2DiseaseService:
    def __init__(self):
        # Ensure directories exist
        settings.C2_ORIGINAL_DIR.mkdir(parents=True, exist_ok=True)
        settings.C2_GRADCAM_DIR.mkdir(parents=True, exist_ok=True)

    def get_component_info(self) -> Dict[str, Any]:
        return {
            "componentId": "C2",
            "name": "AI-Based Plant Disease Detection and Severity Assessment System",
            "status": "ready" if c2_registry.is_ready else "degraded",
            "supportedCrops": SUPPORTED_CROPS,
            "models": {
                "proposed": "EfficientNet-B0 (Transfer Learning)",
                "comparison": "ResNet50 (Transfer Learning)",
                "explainability": "Grad-CAM Visual Heatmap Generation",
            },
            "supportedDiseases": {
                "BANANA": ["Healthy Foliage", "Sigatoka Leaf Spot", "Banana Bunchy Top Virus (BBTV)"],
                "PINEAPPLE": ["Healthy Foliage", "Heart Rot / Top Rot (Phytophthora nicotianae)"],
                "BLACK_PEPPER": [
                    "Healthy Foliage",
                    "Quick Wilt / Foot Rot (Phytophthora capsici)",
                    "Pollu Disease / Anthracnose",
                ],
            },
            "severityStatus": "UNAVAILABLE",
            "severityNotice": "Automated percentage severity estimation is uncalibrated and truthfully marked unavailable.",
        }

    async def analyze_disease(
        self,
        image_bytes: bytes,
        crop_type: Optional[str] = None,
        farm_id_str: Optional[str] = None,
        user: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not c2_registry.efficientnet_model:
            raise ServiceUnavailableError("Deep learning disease detection model is not loaded or unavailable.")

        # 1. Validate image format and minimum 32x32 dimensions
        pil_image = validate_and_load_image(image_bytes)
        input_tensor = prepare_tensor(pil_image)

        # 2. Forward pass through EfficientNet-B0
        model = c2_registry.efficientnet_model
        model.eval()

        with torch.set_grad_enabled(True):
            output = model(input_tensor)
            probabilities = F.softmax(output, dim=1).squeeze(0).detach().cpu().numpy()

        predicted_idx = int(np_argmax := probabilities.argmax())
        confidence = round(float(probabilities[predicted_idx]), 4)
        predicted_class = c2_registry.classes[predicted_idx]

        # Extract crop from predicted class (e.g. 'BANANA___SIGATOKA' -> 'BANANA')
        detected_crop = predicted_class.split("___")[0]
        final_crop = (crop_type.upper().strip() if crop_type else detected_crop)

        display_name = DISEASE_DISPLAY_NAMES.get(predicted_class, predicted_class.replace("___", " - "))
        all_probabilities = {
            c2_registry.classes[i]: round(float(probabilities[i]), 4)
            for i in range(len(c2_registry.classes))
        }

        # 3. Generate Grad-CAM attention heatmap
        try:
            target_layer = model.features[-1]
            explainer = GradCAMExplainer(model, target_layer)
            heatmap = explainer.generate_heatmap(input_tensor, target_class_idx=predicted_idx)
            gradcam_image = explainer.overlay_on_image(pil_image, heatmap, alpha=0.5)
        except Exception as e:
            logger.warning(f"Grad-CAM generation failed: {e}")
            gradcam_image = None

        # 4. Storage & Persistence
        ts = int(time.time() * 1000)
        random_hex = secrets.token_hex(12)
        orig_filename = f"plant_{ts}_{random_hex}.jpg"
        gradcam_filename = f"gradcam_plant_{ts}_{random_hex}.png"

        orig_path = settings.C2_ORIGINAL_DIR / orig_filename
        gradcam_path = settings.C2_GRADCAM_DIR / gradcam_filename

        # Save images to disk
        pil_image.save(orig_path, format="JPEG", quality=90)
        if gradcam_image:
            gradcam_image.save(gradcam_path, format="PNG")

        image_sha256 = hashlib.sha256(image_bytes).hexdigest()
        guidance_data = get_guidance_for_prediction(predicted_class, confidence, final_crop)

        prediction_result = {
            "diseaseName": predicted_class,
            "diseaseNameDisplay": display_name,
            "confidence": confidence,
            "probabilities": all_probabilities,
            "severity": "UNAVAILABLE",
            "severityStatus": "UNAVAILABLE",
            "severityPercentage": None,
            "severityScore": None,
            "severityLevel": None,
            "managementGuidance": guidance_data.get("guidance", []),
            "guidanceCitation": guidance_data.get("citation"),
            "guidanceVersion": guidance_data.get("version"),
            "guidanceLastReviewed": guidance_data.get("lastReviewedDate"),
            "modelProvenance": {
                "architecture": "EfficientNet-B0 (Transfer Learning)",
                "comparisonArchitecture": "ResNet50 (Transfer Learning)",
                "weightsVersion": "v1.0",
                "explainability": "Grad-CAM (Final Convolutional Layer)",
            },
        }

        farm_id_obj = ObjectId(farm_id_str) if (farm_id_str and ObjectId.is_valid(farm_id_str)) else None
        saved_assessment_id = None

        if user and user.get("_id"):
            try:
                now_dt = datetime.now(timezone.utc)
                doc = {
                    "userId": user["_id"],
                    "farmId": farm_id_obj,
                    "cropType": final_crop,
                    "imageReference": orig_filename,
                    "imageSha256": image_sha256,
                    "predictionResult": prediction_result,
                    "gradCamArtifactReference": gradcam_filename if gradcam_image else None,
                    "modelMetadata": {
                        "modelName": "c2_efficientnet_b0",
                        "modelVersion": "v1.0",
                        "datasetVersion": "v1.0",
                    },
                    "timestamp": now_dt,
                    "createdAt": now_dt,
                    "updatedAt": now_dt,
                    "__v": 0,
                }
                res = await mongo_manager.disease_assessments.insert_one(doc)
                saved_assessment_id = str(res.inserted_id)
            except Exception as e:
                logger.error(f"Failed to persist disease assessment: {e}")

        return {
            "cropType": final_crop,
            "diseaseName": predicted_class,
            "diseaseNameDisplay": display_name,
            "predictedDisease": display_name,
            "disease": predicted_class,
            "confidence": confidence,
            "probabilities": all_probabilities,
            "severity": "UNAVAILABLE",
            "severityStatus": "UNAVAILABLE",
            "managementGuidance": guidance_data.get("guidance", []),
            "guidanceCitation": guidance_data.get("citation"),
            "guidanceVersion": guidance_data.get("version"),
            "guidanceLastReviewed": guidance_data.get("lastReviewedDate"),
            "imageReference": orig_filename,
            "gradCamArtifactReference": gradcam_filename if gradcam_image else None,
            "gradcamArtifactReference": gradcam_filename if gradcam_image else None,
            "gradcamAvailable": bool(gradcam_image),
            "gradcamUrl": (
                f"/api/v1/diseases/assessments/{saved_assessment_id}/gradcam"
                if saved_assessment_id
                else (f"/api/v1/diseases/gradcam/{gradcam_filename}" if gradcam_image else None)
            ),
            "assessmentId": saved_assessment_id,
            "isGuest": user is None,
            "predictionTimestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "predictionResult": prediction_result,
        }

    async def get_assessment_by_id(self, user_id: Optional[ObjectId], assessment_id_str: str) -> Dict[str, Any]:
        if not ObjectId.is_valid(assessment_id_str):
            raise NotFoundError(f"Disease assessment with ID '{assessment_id_str}' not found")

        doc = await mongo_manager.disease_assessments.find_one({"_id": ObjectId(assessment_id_str)})
        if not doc:
            raise NotFoundError(f"Disease assessment with ID '{assessment_id_str}' not found")

        return serialize_doc(doc)

    async def get_history(self, user: Optional[Dict[str, Any]], page: int = 1, limit: int = 10) -> Dict[str, Any]:
        if not user or not user.get("_id"):
            return {
                "history": [],
                "pagination": {"page": page, "limit": limit, "totalRecords": 0, "totalPages": 1},
            }

        skip = (max(1, page) - 1) * limit
        query = {"userId": user["_id"]}

        cursor = mongo_manager.disease_assessments.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        total_count = await mongo_manager.disease_assessments.count_documents(query)

        formatted = []
        for d in docs:
            formatted.append({
                "id": str(d["_id"]),
                "_id": str(d["_id"]),
                "cropType": d.get("cropType"),
                "crop": d.get("cropType"),
                "diseaseName": d.get("predictionResult", {}).get("diseaseName"),
                "diseaseNameDisplay": d.get("predictionResult", {}).get("diseaseNameDisplay"),
                "confidence": d.get("predictionResult", {}).get("confidence"),
                "severity": d.get("predictionResult", {}).get("severity"),
                "severityStatus": d.get("predictionResult", {}).get("severityStatus"),
                "hasGradCam": bool(d.get("gradCamArtifactReference")),
                "imageReference": d.get("imageReference"),
                "gradCamArtifactReference": d.get("gradCamArtifactReference"),
                "createdAt": serialize_doc(d.get("createdAt")),
                "timestamp": serialize_doc(d.get("timestamp")),
            })

        total_pages = math.ceil(total_count / limit) or 1

        return {
            "history": formatted,
            "pagination": {
                "page": page,
                "limit": limit,
                "totalRecords": total_count,
                "totalPages": total_pages,
                "hasNextPage": page < total_pages,
                "hasPrevPage": page > 1,
            },
        }

    def get_gradcam_path(self, filename: str) -> Path:
        safe_name = os.path.basename(filename)
        path = settings.C2_GRADCAM_DIR / safe_name
        if not path.exists():
            raise NotFoundError(f"Grad-CAM artifact '{filename}' not found")
        return path

    def get_original_path(self, filename: str) -> Path:
        safe_name = os.path.basename(filename)
        path = settings.C2_ORIGINAL_DIR / safe_name
        if not path.exists():
            raise NotFoundError(f"Original image artifact '{filename}' not found")
        return path


c2_service = C2DiseaseService()
