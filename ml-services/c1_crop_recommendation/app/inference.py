"""
Inference Logic for Component 1 Models
AgriGuard Research Project (J26-IT-420 - SLIIT)
"""

import time
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from fastapi import HTTPException

from model_loader import registry
from schemas import (
    CropInferenceRequest,
    CropInferenceResponse,
    HarvestInferenceRequest,
    HarvestInferenceResponse,
    HarvestWindow
)

def predict_crop(request: CropInferenceRequest) -> CropInferenceResponse:
    if not registry.is_crop_ready:
        raise HTTPException(
            status_code=503,
            detail="Crop recommendation model is not loaded or unavailable."
        )

    # Prepare DataFrame matching training feature names
    input_dict = {
        "nitrogen": [request.nitrogen],
        "phosphorus": [request.phosphorus],
        "potassium": [request.potassium],
        "ph": [request.ph],
        "soil_moisture": [request.soil_moisture if request.soil_moisture is not None else np.nan],
        "temperature": [request.temperature if request.temperature is not None else np.nan],
        "humidity": [request.humidity if request.humidity is not None else np.nan],
        "rainfall": [request.rainfall if request.rainfall is not None else np.nan],
        "district": [request.district if request.district else "UNKNOWN"],
        "agro_zone": [request.agro_zone if request.agro_zone else "UNKNOWN"],
        "season": [request.season if request.season else "UNKNOWN"]
    }
    input_df = pd.DataFrame(input_dict)

    pipeline = registry.crop_pipeline
    metadata = registry.crop_metadata

    try:
        # Prediction & Probability
        pred_class = pipeline.predict(input_df)[0]
        probabilities = pipeline.predict_proba(input_df)[0]
        class_names = list(pipeline.classes_)

        class_prob_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(class_names, probabilities)
        }

        # Confidence of selected class
        top_confidence = round(float(np.max(probabilities)), 4)

        return CropInferenceResponse(
            recommendedCrop=pred_class,
            confidence=top_confidence,
            classProbabilities=class_prob_dict,
            modelIdentifier=metadata.get("model_identifier", "c1_crop_random_forest"),
            modelVersion=metadata.get("model_version", "v1.0"),
            predictionTimestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference execution failed: {str(e)}"
        )

def predict_harvest(request: HarvestInferenceRequest) -> HarvestInferenceResponse:
    if not registry.is_harvest_ready:
        raise HTTPException(
            status_code=503,
            detail="Harvest prediction model is not loaded or unavailable."
        )

    input_dict = {
        "crop_type": [request.cropType],
        "variety": [request.variety if request.variety else "UNKNOWN"],
        "district": [request.district if request.district else "UNKNOWN"],
        "season": [request.season if request.season else "UNKNOWN"],
        "soil_ph": [request.soilPh if request.soilPh is not None else np.nan],
        "soil_moisture": [request.soilMoisture if request.soilMoisture is not None else np.nan],
        "temperature": [request.temperature if request.temperature is not None else np.nan],
        "rainfall": [request.rainfall if request.rainfall is not None else np.nan]
    }
    input_df = pd.DataFrame(input_dict)

    pipeline = registry.harvest_pipeline
    metadata = registry.harvest_metadata

    try:
        # Predict duration in days
        raw_duration = pipeline.predict(input_df)[0]
        predicted_days = max(30, int(round(raw_duration)))

        # Calculate harvest date
        planting_dt = datetime.strptime(request.plantingDate, "%Y-%m-%d")
        harvest_dt = planting_dt + timedelta(days=predicted_days)
        harvest_date_str = harvest_dt.strftime("%Y-%m-%d")

        # Uncertainty bounds: RMSE from model evaluation is ~11.7 days; use ±12 days for 1-sigma window
        margin_days = 12
        window_start = (harvest_dt - timedelta(days=margin_days)).strftime("%Y-%m-%d")
        window_end = (harvest_dt + timedelta(days=margin_days)).strftime("%Y-%m-%d")

        return HarvestInferenceResponse(
            cropType=request.cropType,
            predictedDurationDays=predicted_days,
            predictedHarvestDate=harvest_date_str,
            harvestWindow=HarvestWindow(
                startDate=window_start,
                endDate=window_end
            ),
            confidenceMarginDays=margin_days,
            modelIdentifier=metadata.get("model_identifier", "c1_harvest_random_forest"),
            modelVersion=metadata.get("model_version", "v1.0"),
            predictionTimestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Harvest inference execution failed: {str(e)}"
        )
