"""
Transportation Risk Inference Engine
AgriGuard Research Project (J26-IT-420 - SLIIT)

Executes risk inference, calibrated categorization, SHAP feature attributions,
and context-sensitive packaging recommendations.
"""

import time
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

try:
    from app.model_loader import registry
    from app.recommendations import generate_packaging_recommendations
    from training.feature_engineering import engineer_features
except ImportError:
    from model_loader import registry
    from recommendations import generate_packaging_recommendations
    from feature_engineering import engineer_features

SUPPORTED_CROPS = ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]

def run_risk_inference(
    crop_type: str,
    distance_km: float,
    duration_hours: float,
    vehicle_type: str,
    road_condition: str,
    packaging_type: str,
    temperature_celsius: Optional[float] = None,
    humidity_percentage: Optional[float] = None,
    origin_district: Optional[str] = None,
    destination_district: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes end-to-end transportation risk prediction and packaging recommendations.
    """
    start_time = time.perf_counter()
    norm_crop = crop_type.upper().strip()

    if norm_crop not in SUPPORTED_CROPS:
        raise ValueError(f"Crop '{crop_type}' is unsupported. Supported crops: {', '.join(SUPPORTED_CROPS)}")

    # 1. Generate smart packaging recommendations (runs independently of ML model status)
    packaging_rec = generate_packaging_recommendations(
        crop_type=norm_crop,
        distance_km=distance_km,
        vehicle_type=vehicle_type,
        expected_duration_hours=duration_hours,
        current_packaging_type=packaging_type,
        temperature_celsius=temperature_celsius,
        humidity_percentage=humidity_percentage
    )

    # 2. Check ML model readiness
    if not registry.is_ready or registry.best_model is None or registry.preprocessor is None:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "cropType": norm_crop,
            "damageProbability": None,
            "riskLevel": None,
            "riskStatus": "UNAVAILABLE",
            "modelIdentifier": None,
            "modelVersion": None,
            "datasetVersion": None,
            "shapExplanation": None,
            "packagingRecommendation": packaging_rec,
            "executionLatencyMs": round(elapsed_ms, 2),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    # 3. Construct input DataFrame and engineer features
    temp_val = temperature_celsius if temperature_celsius is not None else 28.0
    rh_val = humidity_percentage if humidity_percentage is not None else 75.0

    raw_dict = {
        "crop_type": [norm_crop],
        "distance_km": [float(distance_km)],
        "duration_hours": [float(duration_hours)],
        "vehicle_type": [vehicle_type.upper()],
        "road_condition": [road_condition.upper()],
        "packaging_type": [packaging_type.upper()],
        "temperature_celsius": [float(temp_val)],
        "humidity_percentage": [float(rh_val)]
    }

    df_raw = pd.DataFrame(raw_dict)
    df_feat = engineer_features(df_raw)

    # 4. Transform using training preprocessor
    X_trans = registry.preprocessor.transform(df_feat)

    # 5. Predict probability
    probs = registry.best_model.predict_proba(X_trans)[0]
    # Class 1 is damage outcome
    prob_damage = float(probs[1]) if len(probs) > 1 else float(probs[0])
    prob_damage = round(float(np.clip(prob_damage, 0.0, 1.0)), 4)

    # 6. Apply calibrated risk thresholds
    if prob_damage < 0.25:
        risk_level = "LOW"
    elif prob_damage <= 0.65:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    # 7. Generate SHAP explainability attributions
    shap_data = None
    if registry.shap_explainer is not None:
        shap_data = registry.shap_explainer.explain_instance(X_trans[0:1])

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    model_name = registry.metadata.get("selectedModel", {}).get("name", "Gradient Boosting")
    model_ver = registry.metadata.get("version", "v1.0")

    return {
        "cropType": norm_crop,
        "damageProbability": prob_damage,
        "riskLevel": risk_level,
        "riskStatus": "COMPLETED",
        "modelIdentifier": model_name,
        "modelVersion": model_ver,
        "datasetVersion": "v1.0",
        "shapExplanation": shap_data,
        "packagingRecommendation": packaging_rec,
        "executionLatencyMs": round(elapsed_ms, 2),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
