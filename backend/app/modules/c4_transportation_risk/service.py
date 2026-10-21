import math
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
import numpy as np
import pandas as pd

from app.core.exceptions import NotFoundError, ServiceUnavailableError, ValidationError
from app.database.mongodb import mongo_manager
from app.modules.c4_transportation_risk.feature_engineering import engineer_features
from app.modules.c4_transportation_risk.model_loader import c4_registry
from app.modules.c4_transportation_risk.packaging_rules import generate_packaging_recommendations
from app.modules.c4_transportation_risk.schemas import (
    PredictTransportationRiskRequest,
    RecommendPackagingRequest,
)
from app.shared.constants import SUPPORTED_CROPS
from app.shared.serializers import serialize_doc


class C4TransportationService:
    def get_component_info(self) -> Dict[str, Any]:
        return {
            "componentId": "C4",
            "name": "AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System",
            "status": "ready" if c4_registry.is_ready else "degraded",
            "supportedCrops": SUPPORTED_CROPS,
            "models": {
                "algorithm": c4_registry.metadata.get("selectedModel", {}).get("name", "Gradient Boosting"),
                "version": "v1.0",
                "explainability": "SHAP (TreeExplainer)",
            },
        }

    async def predict_risk(
        self, req: PredictTransportationRiskRequest, user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not c4_registry.is_ready or c4_registry.best_model is None or c4_registry.preprocessor is None:
            raise ServiceUnavailableError("Transportation risk prediction model is not loaded or unavailable.")

        crop_type = (req.cropType or req.crop or "BANANA").upper().strip()
        if crop_type not in SUPPORTED_CROPS:
            raise ValidationError(f"Crop '{crop_type}' is not supported. Supported: {', '.join(SUPPORTED_CROPS)}")

        farm_id_obj = ObjectId(req.farmId) if (req.farmId and ObjectId.is_valid(req.farmId)) else None

        # 1. Feature Engineering
        raw_df = pd.DataFrame([{
            "crop_type": crop_type,
            "distance_km": float(req.distanceKm),
            "duration_hours": float(req.durationHours),
            "vehicle_type": req.vehicleType.upper().strip(),
            "road_condition": req.roadCondition.upper().strip(),
            "temperature_celsius": float(req.temperatureCelsius if req.temperatureCelsius is not None else 28.0),
            "humidity_percentage": float(req.humidityPercentage if req.humidityPercentage is not None else 75.0),
            "packaging_type": req.packagingType.upper().strip(),
        }])

        df_feat = engineer_features(raw_df)
        transformed_row = c4_registry.preprocessor.transform(df_feat)

        # 2. Prediction
        model = c4_registry.best_model
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(transformed_row)[0]
            damage_probability = float(probs[1]) if len(probs) > 1 else float(probs[0])
        else:
            raw_pred = model.predict(transformed_row)[0]
            damage_probability = float(np.clip(raw_pred, 0.0, 1.0))

        # Risk stratification
        if damage_probability <= 0.15:
            risk_level = "LOW"
        elif damage_probability <= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        # 3. SHAP Feature Attribution
        shap_explanation = None
        if c4_registry.shap_explainer:
            shap_explanation = c4_registry.shap_explainer.explain_instance(transformed_row)

        # 4. Packaging Guidance
        pkg_rec = generate_packaging_recommendations(
            crop_type=crop_type,
            distance_km=float(req.distanceKm),
            vehicle_type=req.vehicleType,
            expected_duration_hours=float(req.durationHours),
            current_packaging_type=req.packagingType,
            temperature_celsius=req.temperatureCelsius,
            humidity_percentage=req.humidityPercentage,
        )

        ts_now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        result = {
            "crop": crop_type,
            "cropType": crop_type,
            "damageProbability": round(damage_probability, 4),
            "riskLevel": risk_level,
            "riskStatus": "COMPLETED",
            "modelIdentifier": c4_registry.metadata.get("selectedModel", {}).get("name", "Gradient Boosting"),
            "modelVersion": "v1.0",
            "shapExplanation": shap_explanation,
            "packagingRecommendation": pkg_rec,
            "smartPackaging": pkg_rec,
            "recommendations": pkg_rec,
            "storageGuidance": pkg_rec.get("storageGuidance", []),
            "handlingGuidance": pkg_rec.get("handlingGuidance", []),
            "transportationGuidance": pkg_rec.get("transportationGuidance", []),
            "supportingReferences": pkg_rec.get("supportingReferences", []),
            "predictionTimestamp": ts_now,
            "modelMetadata": {
                "modelName": c4_registry.metadata.get("selectedModel", {}).get("name", "Gradient Boosting"),
                "modelVersion": "v1.0",
                "datasetVersion": "1.0.0",
                "validationStatus": "CALIBRATED_RESEARCH_MODEL",
            },
        }

        # 5. Persistence if authenticated user
        saved_id = None
        if user and user.get("_id"):
            try:
                now_dt = datetime.now(timezone.utc)
                doc = {
                    "userId": user["_id"],
                    "farmId": farm_id_obj,
                    "cropType": crop_type,
                    "logisticsInputSnapshot": req.model_dump(),
                    "predictionResult": {
                        "damageProbability": round(damage_probability, 4),
                        "riskLevel": risk_level,
                        "riskStatus": "COMPLETED",
                        "recommendedPackaging": pkg_rec.get("recommendedPackaging"),
                        "storageGuidance": pkg_rec.get("storageGuidance", []),
                        "handlingGuidance": pkg_rec.get("handlingGuidance", []),
                        "transportationGuidance": pkg_rec.get("transportationGuidance", []),
                        "guidance": (
                            pkg_rec.get("storageGuidance", [])
                            + pkg_rec.get("handlingGuidance", [])
                            + pkg_rec.get("transportationGuidance", [])
                        ),
                        "ruleId": pkg_rec.get("ruleId"),
                        "supportingReferences": pkg_rec.get("supportingReferences", []),
                    },
                    "shapExplanationMetadata": shap_explanation,
                    "modelMetadata": {
                        "modelName": c4_registry.metadata.get("selectedModel", {}).get("name", "Gradient Boosting"),
                        "modelVersion": "1.0.0",
                        "datasetVersion": "1.0.0",
                    },
                    "timestamp": now_dt,
                    "createdAt": now_dt,
                    "updatedAt": now_dt,
                    "__v": 0,
                }
                res = await mongo_manager.transportation_assessments.insert_one(doc)
                saved_id = str(res.inserted_id)
            except Exception:
                pass

        result["assessmentId"] = saved_id
        return result

    async def recommend_packaging(self, req: RecommendPackagingRequest) -> Dict[str, Any]:
        crop_type = (req.cropType or req.crop or "BANANA").upper().strip()
        pkg_rec = generate_packaging_recommendations(
            crop_type=crop_type,
            distance_km=float(req.distanceKm),
            vehicle_type=req.vehicleType,
            expected_duration_hours=req.durationHours,
            current_packaging_type=req.packagingType,
            temperature_celsius=req.temperatureCelsius,
            humidity_percentage=req.humidityPercentage,
        )
        return {
            "crop": crop_type,
            "cropType": crop_type,
            "recommendedPackaging": pkg_rec.get("recommendedPackaging"),
            "reviewStatus": pkg_rec.get("reviewStatus"),
            "ruleId": pkg_rec.get("ruleId"),
            "ruleVersion": pkg_rec.get("ruleVersion"),
            "packagingRecommendation": pkg_rec,
            "smartPackaging": pkg_rec,
            "storageGuidance": pkg_rec.get("storageGuidance", []),
            "handlingGuidance": pkg_rec.get("handlingGuidance", []),
            "transportationGuidance": pkg_rec.get("transportationGuidance", []),
            "supportingReferences": pkg_rec.get("supportingReferences", []),
        }

    async def get_history(self, user: Optional[Dict[str, Any]], page: int = 1, limit: int = 10) -> Dict[str, Any]:
        if not user or not user.get("_id"):
            return {
                "history": [],
                "pagination": {"page": page, "limit": limit, "totalRecords": 0, "totalPages": 1},
            }

        skip = (max(1, page) - 1) * limit
        query = {"userId": user["_id"]}

        cursor = mongo_manager.transportation_assessments.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        total_count = await mongo_manager.transportation_assessments.count_documents(query)

        formatted = []
        for d in docs:
            formatted.append({
                "id": str(d["_id"]),
                "_id": str(d["_id"]),
                "cropType": d.get("cropType"),
                "crop": d.get("cropType"),
                "damageProbability": d.get("predictionResult", {}).get("damageProbability"),
                "riskLevel": d.get("predictionResult", {}).get("riskLevel"),
                "recommendedPackaging": d.get("predictionResult", {}).get("recommendedPackaging"),
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

    async def get_assessment_by_id(self, assessment_id_str: str) -> Dict[str, Any]:
        if not ObjectId.is_valid(assessment_id_str):
            raise NotFoundError(f"Transportation assessment with ID '{assessment_id_str}' not found")

        doc = await mongo_manager.transportation_assessments.find_one({"_id": ObjectId(assessment_id_str)})
        if not doc:
            raise NotFoundError(f"Transportation assessment with ID '{assessment_id_str}' not found")

        return serialize_doc(doc)


c4_service = C4TransportationService()
