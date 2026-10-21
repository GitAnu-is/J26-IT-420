"""
Automated Pytest Suite for Component 1 Machine Learning Service
AgriGuard Research Project (J26-IT-420 - SLIIT)
"""

import os
import sys
import pytest
from datetime import datetime
from fastapi.testclient import TestClient

# Add app and training directories to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
TRAIN_DIR = os.path.join(BASE_DIR, "training")
sys.path.insert(0, APP_DIR)
sys.path.insert(0, TRAIN_DIR)

from main import app
from model_loader import registry
from preprocessing import (
    build_crop_preprocessing_pipeline,
    build_harvest_preprocessing_pipeline,
    CROP_NUMERIC_FEATURES,
    CROP_CATEGORICAL_FEATURES,
    HARVEST_NUMERIC_FEATURES,
    HARVEST_CATEGORICAL_FEATURES
)

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def load_models_for_tests():
    registry.load_models()
    assert registry.is_crop_ready, "Crop model artifact must be loaded"
    assert registry.is_harvest_ready, "Harvest model artifact must be loaded"

class TestModelPipelinesAndPreprocessing:
    def test_crop_pipeline_construction(self):
        pipeline = build_crop_preprocessing_pipeline()
        assert pipeline is not None
        transformers = {t[0]: t[1] for t in pipeline.transformers}
        assert "num" in transformers
        assert "cat" in transformers

    def test_harvest_pipeline_construction(self):
        pipeline = build_harvest_preprocessing_pipeline()
        assert pipeline is not None
        transformers = {t[0]: t[1] for t in pipeline.transformers}
        assert "num" in transformers
        assert "cat" in transformers

class TestInferenceEndpoints:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "c1_crop_recommendation_ml"
        assert data["modelsLoaded"]["crop_recommendation"] is True
        assert data["modelsLoaded"]["harvest_prediction"] is True

    def test_model_info(self):
        response = client.get("/model-info")
        assert response.status_code == 200
        data = response.json()
        assert "cropRecommendationModel" in data
        assert "harvestPredictionModel" in data
        assert data["cropRecommendationModel"]["model_identifier"] == "c1_crop_random_forest"
        assert data["harvestPredictionModel"]["model_identifier"] == "c1_harvest_random_forest"

    def test_crop_inference_banana(self):
        # Soil test characteristic of banana: high K, high N, neutral pH
        payload = {
            "nitrogen": 190.0,
            "phosphorus": 55.0,
            "potassium": 340.0,
            "ph": 6.3,
            "soil_moisture": 75.0,
            "temperature": 28.0,
            "humidity": 80.0,
            "rainfall": 220.0,
            "district": "Gampaha",
            "agro_zone": "WL2a",
            "season": "MAHA"
        }
        response = client.post("/predict/crop", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["recommendedCrop"] in ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]
        assert data["recommendedCrop"] == "BANANA"
        assert data["confidence"] > 0.5
        assert "BANANA" in data["classProbabilities"]
        assert "PINEAPPLE" in data["classProbabilities"]
        assert "BLACK_PEPPER" in data["classProbabilities"]
        # Probabilities sum close to 1.0
        prob_sum = sum(data["classProbabilities"].values())
        assert abs(prob_sum - 1.0) < 0.01

    def test_crop_inference_pineapple(self):
        # Soil test characteristic of pineapple: acidic pH 4.8, lower moisture, moderate K
        payload = {
            "nitrogen": 100.0,
            "phosphorus": 35.0,
            "potassium": 180.0,
            "ph": 4.8,
            "soil_moisture": 52.0,
            "temperature": 29.0,
            "humidity": 65.0,
            "rainfall": 140.0,
            "district": "Gampaha",
            "agro_zone": "WL2a",
            "season": "YALA"
        }
        response = client.post("/predict/crop", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["recommendedCrop"] == "PINEAPPLE"
        assert data["confidence"] > 0.5

    def test_crop_inference_black_pepper(self):
        # Mid country wet zone: high rainfall, moderate N, P, K
        payload = {
            "nitrogen": 140.0,
            "phosphorus": 45.0,
            "potassium": 160.0,
            "ph": 6.0,
            "soil_moisture": 70.0,
            "temperature": 24.0,
            "humidity": 85.0,
            "rainfall": 280.0,
            "district": "Matale",
            "agro_zone": "WM1b",
            "season": "MAHA"
        }
        response = client.post("/predict/crop", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["recommendedCrop"] == "BLACK_PEPPER"

    def test_crop_inference_missing_optional_fields(self):
        # Optional fields missing should still work thanks to imputer
        payload = {
            "nitrogen": 160.0,
            "phosphorus": 40.0,
            "potassium": 280.0,
            "ph": 6.2
        }
        response = client.post("/predict/crop", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["recommendedCrop"] in ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]

    def test_crop_inference_invalid_ph(self):
        # pH < 3.0 should be rejected by Pydantic
        payload = {
            "nitrogen": 100.0,
            "phosphorus": 40.0,
            "potassium": 200.0,
            "ph": 2.1
        }
        response = client.post("/predict/crop", json=payload)
        assert response.status_code == 422

    def test_harvest_inference_banana(self):
        payload = {
            "cropType": "BANANA",
            "plantingDate": "2026-05-01",
            "variety": "Ambul",
            "district": "Gampaha",
            "season": "YALA",
            "soilPh": 6.2,
            "soilMoisture": 70.0
        }
        response = client.post("/predict/harvest", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["cropType"] == "BANANA"
        assert 260 <= data["predictedDurationDays"] <= 380
        assert "predictedHarvestDate" in data
        assert "harvestWindow" in data
        assert data["harvestWindow"]["startDate"] < data["harvestWindow"]["endDate"]
        assert data["confidenceMarginDays"] == 12

    def test_harvest_inference_pineapple(self):
        payload = {
            "cropType": "PINEAPPLE",
            "plantingDate": "2026-01-15",
            "variety": "Mauritius",
            "district": "Gampaha",
            "season": "MAHA"
        }
        response = client.post("/predict/harvest", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["cropType"] == "PINEAPPLE"
        assert 400 <= data["predictedDurationDays"] <= 560

    def test_harvest_inference_unsupported_crop(self):
        payload = {
            "cropType": "WATERMELON",
            "plantingDate": "2026-05-01"
        }
        response = client.post("/predict/harvest", json=payload)
        assert response.status_code == 422

    def test_harvest_inference_invalid_date(self):
        payload = {
            "cropType": "BANANA",
            "plantingDate": "not-a-date"
        }
        response = client.post("/predict/harvest", json=payload)
        assert response.status_code == 422
