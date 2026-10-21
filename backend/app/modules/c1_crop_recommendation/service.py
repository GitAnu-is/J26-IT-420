import math
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
import numpy as np
import pandas as pd

from app.core.exceptions import NotFoundError, ServiceUnavailableError, ValidationError
from app.database.mongodb import mongo_manager
from app.modules.c1_crop_recommendation.model_loader import c1_registry
from app.modules.c1_crop_recommendation.schemas import PredictHarvestRequest, RecommendCropRequest
from app.shared.constants import RESEARCH_PROVENANCE, SUPPORTED_CROPS
from app.shared.serializers import serialize_doc


class C1CropService:
    def get_component_info(self) -> Dict[str, Any]:
        return {
            "componentId": "C1",
            "name": "AI-Based Crop Recommendation and Harvest Planning System",
            "status": "ready" if c1_registry.is_ready else "degraded",
            "supportedCrops": SUPPORTED_CROPS,
            "models": {
                "recommendation": {
                    "architecture": "Random Forest Classifier",
                    "version": "v1.0",
                    "provenance": "Controlled Regional Agro-climatic Calibration",
                },
                "harvest": {
                    "architecture": "Random Forest Regressor",
                    "version": "v1.0",
                    "provenance": "Phenological Growth Accumulation Calibration",
                },
            },
        }

    async def recommend_crop(self, req: RecommendCropRequest, user: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not c1_registry.crop_pipeline:
            raise ServiceUnavailableError("Crop recommendation model is not loaded or unavailable.")

        # Check farm context if farmId provided
        validated_farm = None
        farm_id_obj = None
        if req.farmId and ObjectId.is_valid(req.farmId):
            farm_id_obj = ObjectId(req.farmId)
            validated_farm = await mongo_manager.farms.find_one({"_id": farm_id_obj, "isArchived": False})

        district = req.district or (validated_farm.get("district") if validated_farm else "UNKNOWN")
        agro_zone = req.agroEcologicalZone or (validated_farm.get("agroEcologicalZone") if validated_farm else "UNKNOWN")

        # Prepare DataFrame matching training feature names
        input_dict = {
            "nitrogen": [req.nitrogen],
            "phosphorus": [req.phosphorus],
            "potassium": [req.potassium],
            "ph": [req.ph],
            "soil_moisture": [req.soilMoisture if req.soilMoisture is not None else 30.0],
            "temperature": [req.temperature if req.temperature is not None else 28.0],
            "humidity": [req.humidity if req.humidity is not None else 75.0],
            "rainfall": [req.rainfall if req.rainfall is not None else 180.0],
            "district": [district if district else "UNKNOWN"],
            "agro_zone": [agro_zone if agro_zone else "UNKNOWN"],
            "season": [req.season if req.season else "MAHA"],
        }
        input_df = pd.DataFrame(input_dict)

        pipeline = c1_registry.crop_pipeline
        metadata = c1_registry.crop_metadata

        # Execute prediction
        pred_class = pipeline.predict(input_df)[0]
        probabilities = pipeline.predict_proba(input_df)[0]
        class_names = list(pipeline.classes_)

        class_prob_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(class_names, probabilities)
        }
        top_confidence = round(float(np.max(probabilities)), 4)
        ts_now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        result = {
            "recommendedCrop": pred_class,
            "confidence": top_confidence,
            "classProbabilities": class_prob_dict,
            "probabilities": class_prob_dict,
            "modelIdentifier": metadata.get("model_identifier", "c1_crop_random_forest"),
            "modelVersion": metadata.get("model_version", "v1.0"),
            "predictionTimestamp": ts_now,
            "modelMetadata": {
                "modelName": metadata.get("model_identifier", "Random Forest Classifier"),
                "modelVersion": metadata.get("model_version", "v1.0"),
                "datasetVersion": "v1.0",
                "validationStatus": "CALIBRATED_RESEARCH_MODEL",
            },
        }

        # Persist if user is authenticated
        saved_prediction_id = None
        if user and user.get("_id"):
            try:
                now_dt = datetime.now(timezone.utc)
                doc = {
                    "userId": user["_id"],
                    "farmId": farm_id_obj,
                    "predictionType": "CROP_RECOMMENDATION",
                    "cropType": pred_class,
                    "inputSnapshot": req.model_dump(),
                    "predictionResult": result,
                    "modelMetadata": {
                        "modelName": metadata.get("model_identifier", "c1_crop_random_forest"),
                        "modelVersion": metadata.get("model_version", "v1.0"),
                    },
                    "timestamp": now_dt,
                    "createdAt": now_dt,
                    "updatedAt": now_dt,
                    "__v": 0,
                }
                res = await mongo_manager.crop_predictions.insert_one(doc)
                saved_prediction_id = str(res.inserted_id)
            except Exception:
                pass

        result["predictionId"] = saved_prediction_id
        result["savedPredictionId"] = saved_prediction_id
        return result

    async def predict_harvest(self, req: PredictHarvestRequest, user: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not c1_registry.harvest_pipeline:
            raise ServiceUnavailableError("Harvest prediction model is not loaded or unavailable.")

        crop_type = (req.cropType or req.crop).upper().strip()
        if crop_type not in SUPPORTED_CROPS:
            raise ValidationError(f"Crop '{crop_type}' is not supported. Supported: {', '.join(SUPPORTED_CROPS)}")

        farm_id_obj = None
        if req.farmId and ObjectId.is_valid(req.farmId):
            farm_id_obj = ObjectId(req.farmId)

        input_dict = {
            "crop_type": [crop_type],
            "variety": [req.variety if req.variety else "UNKNOWN"],
            "district": [req.district if req.district else "UNKNOWN"],
            "season": [req.season if req.season else "MAHA"],
            "soil_ph": [req.soilPh if req.soilPh is not None else 6.5],
            "soil_moisture": [req.soilMoisture if req.soilMoisture is not None else 30.0],
            "temperature": [req.temperature if req.temperature is not None else 28.0],
            "rainfall": [req.rainfall if req.rainfall is not None else 180.0],
        }
        input_df = pd.DataFrame(input_dict)

        pipeline = c1_registry.harvest_pipeline
        metadata = c1_registry.harvest_metadata

        raw_duration = pipeline.predict(input_df)[0]
        predicted_days = max(30, int(round(raw_duration)))

        # Reference event calculation
        ref_events = {
            "BANANA": "FLOWER_EMERGENCE_SHOOTING",
            "PINEAPPLE": "FORCED_FLORAL_INDUCTION",
            "BLACK_PEPPER": "SPIKE_EMERGENCE_MONSOON",
        }
        crop_ref_event = ref_events.get(crop_type, "PLANTING_DATE")

        try:
            planting_dt = datetime.strptime(req.plantingDate, "%Y-%m-%d")
        except Exception:
            planting_dt = datetime.now()

        harvest_dt = planting_dt + timedelta(days=predicted_days)
        harvest_date_str = harvest_dt.strftime("%Y-%m-%d")

        # Uncertainty bounds
        margin_days = 12
        window_start = (harvest_dt - timedelta(days=margin_days)).strftime("%Y-%m-%d")
        window_end = (harvest_dt + timedelta(days=margin_days)).strftime("%Y-%m-%d")
        ts_now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        result = {
            "crop": crop_type,
            "cropType": crop_type,
            "cropReferenceEvent": crop_ref_event,
            "biologicalEventDate": req.plantingDate,
            "predictedDurationDays": predicted_days,
            "predictedHarvestDate": harvest_date_str,
            "expectedHarvestDate": harvest_date_str,
            "harvestWindow": {
                "startDate": window_start,
                "endDate": window_end,
                "earliestDate": window_start,
                "latestDate": window_end,
                "windowDays": margin_days * 2,
            },
            "confidenceMarginDays": margin_days,
            "modelIdentifier": metadata.get("model_identifier", "c1_harvest_random_forest"),
            "modelVersion": metadata.get("model_version", "v1.0"),
            "predictionTimestamp": ts_now,
            "modelMetadata": {
                "modelIdentifier": metadata.get("model_identifier", "c1_harvest_random_forest"),
                "modelVersion": metadata.get("model_version", "v1.0"),
                "validationStatus": "CALIBRATED_RESEARCH_MODEL",
                "limitations": "Harvest window bounds reflect model RMSE standard error and must not be interpreted as statistically calibrated confidence intervals.",
            },
        }

        # Persist if user authenticated
        saved_prediction_id = None
        if user and user.get("_id"):
            try:
                now_dt = datetime.now(timezone.utc)
                doc = {
                    "userId": user["_id"],
                    "farmId": farm_id_obj,
                    "predictionType": "HARVEST_PLANNING",
                    "cropType": crop_type,
                    "inputSnapshot": req.model_dump(),
                    "predictionResult": result,
                    "modelMetadata": {
                        "modelName": metadata.get("model_identifier", "c1_harvest_random_forest"),
                        "modelVersion": metadata.get("model_version", "v1.0"),
                    },
                    "timestamp": now_dt,
                    "createdAt": now_dt,
                    "updatedAt": now_dt,
                    "__v": 0,
                }
                res = await mongo_manager.crop_predictions.insert_one(doc)
                saved_prediction_id = str(res.inserted_id)
            except Exception:
                pass

        result["predictionId"] = saved_prediction_id
        result["savedPredictionId"] = saved_prediction_id
        return result

    async def get_history(self, user: Optional[Dict[str, Any]], page: int = 1, limit: int = 10) -> Dict[str, Any]:
        if not user or not user.get("_id"):
            return {
                "history": [],
                "pagination": {"page": page, "limit": limit, "totalRecords": 0, "totalPages": 1},
            }

        skip = (max(1, page) - 1) * limit
        query = {"userId": user["_id"]}

        cursor = mongo_manager.crop_predictions.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        total_count = await mongo_manager.crop_predictions.count_documents(query)

        formatted = []
        for d in docs:
            formatted.append({
                "id": str(d["_id"]),
                "_id": str(d["_id"]),
                "predictionType": d.get("predictionType"),
                "cropType": d.get("cropType"),
                "crop": d.get("cropType"),
                "recommendedCrop": d.get("predictionResult", {}).get("recommendedCrop"),
                "confidence": d.get("predictionResult", {}).get("confidence"),
                "predictedDurationDays": d.get("predictionResult", {}).get("predictedDurationDays"),
                "expectedHarvestDate": d.get("predictionResult", {}).get("expectedHarvestDate"),
                "predictedHarvestDate": d.get("predictionResult", {}).get("predictedHarvestDate"),
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


c1_service = C1CropService()
