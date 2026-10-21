"""
Automated Pytest Test Suite for Component 4 ML Microservice
AgriGuard Research Project (J26-IT-420 - SLIIT)

Covers dataset integrity, preprocessing, model loading, probability ranges,
calibrated risk categorization, SHAP explanations, packaging advisories,
and FastAPI microservice contracts.
"""

import os
import sys
import json
import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

# Add C4 microservice root to sys.path and remove conflicting paths and modules
c4_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path = [p for p in sys.path if "c2_disease_detection" not in p and "c1_crop_recommendation" not in p]
if c4_dir in sys.path:
    sys.path.remove(c4_dir)
sys.path.insert(0, c4_dir)

for mod in list(sys.modules.keys()):
    if mod == "app" or mod.startswith("app.") or mod == "training" or mod.startswith("training."):
        del sys.modules[mod]

from app.main import app, INTERNAL_KEY
from app.model_loader import registry
from app.inference import run_risk_inference
from app.recommendations import generate_packaging_recommendations
from training.feature_engineering import engineer_features, build_preprocessor

# Load artifacts at module load time for standalone unit tests
registry.load_artifacts()

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="module")
def sample_features():
    return {
        "crop_type": "BANANA",
        "distance_km": 65.0,
        "duration_hours": 2.5,
        "vehicle_type": "COVERED_TRUCK",
        "road_condition": "PAVED_GOOD",
        "packaging_type": "PLASTIC_CRATES",
        "temperature_celsius": 26.0,
        "humidity_percentage": 78.0
    }

# ------------------------------------------------------------------------------
# 1. Dataset & Feature Engineering Tests
# ------------------------------------------------------------------------------
def test_01_dataset_schema_and_manifest():
    manifest_path = os.path.join(registry.artifacts_dir, "..", "data", "processed", "dataset_manifest.json")
    assert os.path.exists(manifest_path), "Dataset manifest must exist"
    with open(manifest_path) as f:
        data = json.load(f)
    assert data["provenance"] == "PROTOTYPE_SYNTHETIC"
    assert "splits" in data
    assert data["total_records"] == 1200

def test_02_data_leakage_prevention():
    data_dir = os.path.join(registry.artifacts_dir, "..", "data", "processed")
    train_df = pd.read_csv(os.path.join(data_dir, "train.csv"))
    val_df = pd.read_csv(os.path.join(data_dir, "val.csv"))
    test_df = pd.read_csv(os.path.join(data_dir, "test.csv"))

    train_ids = set(train_df["trip_id"])
    val_ids = set(val_df["trip_id"])
    test_ids = set(test_df["trip_id"])

    assert len(train_ids.intersection(val_ids)) == 0, "Train and validation splits must not overlap"
    assert len(train_ids.intersection(test_ids)) == 0, "Train and test splits must not overlap"
    assert len(val_ids.intersection(test_ids)) == 0, "Validation and test splits must not overlap"

def test_03_feature_engineering_derived_columns(sample_features):
    df = pd.DataFrame([sample_features])
    feat_df = engineer_features(df)
    assert "travel_speed_kmh" in feat_df.columns
    assert "thermal_stress_index" in feat_df.columns
    assert feat_df["travel_speed_kmh"].iloc[0] == pytest.approx(26.0, 0.1)
    assert feat_df["thermal_stress_index"].iloc[0] == pytest.approx(20.28, 0.1)

def test_04_preprocessor_transformation_shape(sample_features):
    df = pd.DataFrame([sample_features])
    feat_df = engineer_features(df)
    transformed = registry.preprocessor.transform(feat_df)
    assert transformed.shape[0] == 1
    assert transformed.shape[1] == len(registry.feature_names)

# ------------------------------------------------------------------------------
# 2. Model Loading & Candidates
# ------------------------------------------------------------------------------
def test_05_model_registry_artifacts_loaded():
    assert registry.is_ready is True
    assert registry.best_model is not None
    assert registry.preprocessor is not None

def test_06_candidate_models_exist():
    artifacts = ["c4_random_forest.joblib", "c4_xgboost.joblib", "c4_catboost.joblib", "c4_gradient_boosting.joblib"]
    for art in artifacts:
        path = os.path.join(registry.artifacts_dir, art)
        assert os.path.exists(path), f"Candidate model artifact '{art}' must exist"

def test_07_model_metadata_provenance():
    meta = registry.metadata
    assert meta.get("readinessStatus") == "PROTOTYPE_SYNTHETIC"
    assert meta.get("validationStatus") == "UNVALIDATED_FIELD_BENCHMARK"
    assert "selectedModel" in meta

# ------------------------------------------------------------------------------
# 3. Probability & Risk Categorization
# ------------------------------------------------------------------------------
def test_08_probability_output_range():
    res = run_risk_inference(
        crop_type="BANANA",
        distance_km=80.0,
        duration_hours=3.0,
        vehicle_type="COVERED_TRUCK",
        road_condition="PAVED_GOOD",
        packaging_type="PLASTIC_CRATES",
        temperature_celsius=25.0,
        humidity_percentage=75.0
    )
    assert res["riskStatus"] == "COMPLETED"
    prob = res["damageProbability"]
    assert isinstance(prob, float)
    assert 0.0 <= prob <= 1.0

def test_09_risk_categorization_low():
    # Low risk conditions: short trip, good road, refrigerated, plastic crates
    res = run_risk_inference(
        crop_type="BANANA",
        distance_km=20.0,
        duration_hours=0.8,
        vehicle_type="REFRIGERATED_TRUCK",
        road_condition="PAVED_GOOD",
        packaging_type="PLASTIC_CRATES",
        temperature_celsius=14.0,
        humidity_percentage=85.0
    )
    assert res["damageProbability"] < 0.25
    assert res["riskLevel"] == "LOW"

def test_10_risk_categorization_high():
    # High risk conditions: banana in loose bulk over unpaved rough road in three-wheeler under extreme heat
    res = run_risk_inference(
        crop_type="BANANA",
        distance_km=250.0,
        duration_hours=9.0,
        vehicle_type="THREE_WHEELER",
        road_condition="UNPAVED_ROUGH",
        packaging_type="LOOSE_BULK",
        temperature_celsius=36.0,
        humidity_percentage=85.0
    )
    assert res["damageProbability"] > 0.65
    assert res["riskLevel"] == "HIGH"

def test_11_unsupported_crop_rejection():
    with pytest.raises(ValueError, match="unsupported"):
        run_risk_inference(
            crop_type="WATERMELON",
            distance_km=50.0,
            duration_hours=2.0,
            vehicle_type="PICKUP",
            road_condition="PAVED_GOOD",
            packaging_type="PLASTIC_CRATES"
        )

# ------------------------------------------------------------------------------
# 4. SHAP Explainability
# ------------------------------------------------------------------------------
def test_12_shap_explanation_structure():
    res = run_risk_inference(
        crop_type="PINEAPPLE",
        distance_km=120.0,
        duration_hours=4.0,
        vehicle_type="OPEN_TRUCK",
        road_condition="MIXED",
        packaging_type="WOODEN_CRATES",
        temperature_celsius=30.0,
        humidity_percentage=80.0
    )
    shap_data = res["shapExplanation"]
    assert shap_data is not None
    assert "topContributors" in shap_data
    assert "primaryRiskElevators" in shap_data
    assert "primaryRiskMitigators" in shap_data
    assert len(shap_data["topContributors"]) > 0

def test_13_shap_attribution_properties():
    res = run_risk_inference(
        crop_type="BANANA",
        distance_km=150.0,
        duration_hours=5.0,
        vehicle_type="THREE_WHEELER",
        road_condition="UNPAVED_ROUGH",
        packaging_type="GUNNY_BAGS"
    )
    top_c = res["shapExplanation"]["topContributors"][0]
    assert "feature" in top_c
    assert "displayName" in top_c
    assert "attribution" in top_c
    assert "impact" in top_c
    assert top_c["impact"] in ["INCREASES_RISK", "DECREASES_RISK"]

# ------------------------------------------------------------------------------
# 5. Smart Packaging Recommendations
# ------------------------------------------------------------------------------
def test_14_banana_short_distance_packaging():
    rec = generate_packaging_recommendations("BANANA", distance_km=50.0)
    assert rec["ruleId"] == "C4_PKG_BANANA_SHORT_TRANSIT"
    assert "plastic crates" in rec["recommendedPackaging"].lower()
    assert rec["reviewStatus"] == "AGRONOMIC_STANDARD_GUIDELINE"

def test_15_banana_long_distance_packaging():
    rec = generate_packaging_recommendations("BANANA", distance_km=150.0)
    assert rec["ruleId"] == "C4_PKG_BANANA_LONG_TRANSIT"
    assert "corrugated" in rec["recommendedPackaging"].lower()

def test_16_pineapple_packaging_advisory():
    rec = generate_packaging_recommendations("PINEAPPLE", distance_km=60.0)
    assert "PINEAPPLE" in rec["ruleId"]
    assert len(rec["storageGuidance"]) > 0
    assert len(rec["handlingGuidance"]) > 0

def test_17_black_pepper_moisture_packaging():
    rec = generate_packaging_recommendations("BLACK_PEPPER", distance_km=90.0)
    assert rec["ruleId"] == "C4_PKG_BLACK_PEPPER_DRY_TRANSIT"
    assert any("12" in g for g in rec["storageGuidance"])
    assert "polyethylene" in rec["recommendedPackaging"].lower()

def test_18_contextual_warning_for_unsuitable_packaging():
    rec = generate_packaging_recommendations("BANANA", distance_km=50.0, current_packaging_type="GUNNY_BAGS")
    assert len(rec["contextualWarnings"]) > 0
    assert "HIGH RISK PACKAGING" in rec["contextualWarnings"][0]

def test_19_contextual_warning_for_thermal_stress():
    rec = generate_packaging_recommendations("BANANA", distance_km=50.0, temperature_celsius=35.0)
    assert any("THERMAL STRESS" in w for w in rec["contextualWarnings"])

# ------------------------------------------------------------------------------
# 6. FastAPI Service Endpoints & Security
# ------------------------------------------------------------------------------
def test_20_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "c4_transportation_risk_ml"
    assert data["modelLoaded"] is True

def test_21_internal_key_authentication_enforced(client):
    # Without header -> 401
    res = client.get("/model-info")
    assert res.status_code == 401
    # With invalid key -> 401
    res_inv = client.get("/model-info", headers={"X-Internal-Service-Key": "wrong_key"})
    assert res_inv.status_code == 401

def test_22_model_info_authorized(client):
    res = client.get("/model-info", headers={"X-Internal-Service-Key": INTERNAL_KEY})
    assert res.status_code == 200
    data = res.json()
    assert data["readinessStatus"] == "PROTOTYPE_SYNTHETIC"
    assert "selectedModel" in data
    assert "supportedCrops" in data

def test_23_predict_risk_fastapi(client):
    payload = {
        "cropType": "PINEAPPLE",
        "distanceKm": 85.0,
        "durationHours": 3.0,
        "vehicleType": "COVERED_TRUCK",
        "roadCondition": "PAVED_GOOD",
        "packagingType": "PLASTIC_CRATES",
        "temperatureCelsius": 28.0,
        "humidityPercentage": 75.0
    }
    res = client.post(
        "/predict/risk",
        headers={"X-Internal-Service-Key": INTERNAL_KEY},
        json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["cropType"] == "PINEAPPLE"
    assert data["riskStatus"] == "COMPLETED"
    assert data["riskLevel"] in ["LOW", "MEDIUM", "HIGH"]
    assert data["damageProbability"] is not None
    assert data["shapExplanation"] is not None
    assert data["packagingRecommendation"] is not None

def test_24_recommend_packaging_fastapi_independent(client):
    payload = {
        "cropType": "BLACK_PEPPER",
        "distanceKm": 110.0,
        "vehicleType": "COVERED_TRUCK",
        "currentPackagingType": "LOOSE_BULK"
    }
    res = client.post(
        "/recommend/packaging",
        headers={"X-Internal-Service-Key": INTERNAL_KEY},
        json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["cropType"] == "BLACK_PEPPER"
    assert "polyethylene" in data["recommendedPackaging"].lower()
    assert len(data["contextualWarnings"]) > 0

def test_25_predict_risk_validation_error(client):
    # Invalid distance (negative)
    payload = {
        "cropType": "BANANA",
        "distanceKm": -10.0,
        "durationHours": 2.0,
        "vehicleType": "PICKUP",
        "roadCondition": "PAVED_GOOD",
        "packagingType": "PLASTIC_CRATES"
    }
    res = client.post("/predict/risk", headers={"X-Internal-Service-Key": INTERNAL_KEY}, json=payload)
    assert res.status_code == 422  # Pydantic validation error

def test_26_predict_risk_inference_latency(client):
    payload = {
        "cropType": "BANANA",
        "distanceKm": 40.0,
        "durationHours": 1.5,
        "vehicleType": "PICKUP",
        "roadCondition": "PAVED_GOOD",
        "packagingType": "PLASTIC_CRATES"
    }
    res = client.post("/predict/risk", headers={"X-Internal-Service-Key": INTERNAL_KEY}, json=payload)
    assert res.status_code == 200
    assert res.json()["executionLatencyMs"] < 100.0  # Fast CPU inference

def test_27_all_four_candidate_models_predict():
    import joblib
    models = ["c4_random_forest.joblib", "c4_xgboost.joblib", "c4_catboost.joblib", "c4_gradient_boosting.joblib"]
    dummy_input = np.zeros((1, len(registry.feature_names)))
    for m in models:
        path = os.path.join(registry.artifacts_dir, m)
        model = joblib.load(path)
        probs = model.predict_proba(dummy_input)[0]
        assert len(probs) == 2
        assert 0.0 <= probs[1] <= 1.0

def test_28_model_metadata_version_tracking():
    meta = registry.metadata
    assert meta.get("version") == "v1.0"
    assert "riskCategories" in meta
    assert "LOW" in meta["riskCategories"]
    assert "HIGH" in meta["riskCategories"]

def test_29_edge_environmental_conditions():
    # Cold & zero humidity edge
    res_cold = run_risk_inference(
        crop_type="BLACK_PEPPER",
        distance_km=30.0,
        duration_hours=1.0,
        vehicle_type="COVERED_TRUCK",
        road_condition="PAVED_GOOD",
        packaging_type="POLYETHYLENE_LINED_BAGS",
        temperature_celsius=5.0,
        humidity_percentage=10.0
    )
    assert res_cold["riskStatus"] == "COMPLETED"
    assert 0.0 <= res_cold["damageProbability"] <= 1.0

    # Max heat & max humidity edge
    res_hot = run_risk_inference(
        crop_type="BANANA",
        distance_km=200.0,
        duration_hours=7.0,
        vehicle_type="OPEN_TRUCK",
        road_condition="UNPAVED_ROUGH",
        packaging_type="LOOSE_BULK",
        temperature_celsius=45.0,
        humidity_percentage=98.0
    )
    assert res_hot["riskStatus"] == "COMPLETED"
    assert res_hot["riskLevel"] == "HIGH"

def test_30_fastapi_missing_auth_header_rejection(client):
    res = client.post("/predict/risk", json={})
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]

def test_31_fastapi_recommend_packaging_missing_auth(client):
    res = client.post("/recommend/packaging", json={})
    assert res.status_code == 401

def test_32_brier_score_calibration():
    # Verify Brier score on test set from reports
    rep_path = os.path.join(registry.artifacts_dir, "..", "reports", "evaluation_report.json")
    assert os.path.exists(rep_path)
    with open(rep_path) as f:
        rep = json.load(f)
    assert "tested_models" in rep
    assert rep["tested_models"]["Gradient Boosting"]["brier_score"] < 0.15

