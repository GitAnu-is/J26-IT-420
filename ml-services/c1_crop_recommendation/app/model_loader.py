"""
Model Loader for Component 1 Inference Service
AgriGuard Research Project (J26-IT-420 - SLIIT)

Loads trained joblib model artifacts from the controlled artifacts repository.
"""

import os
import joblib
import logging

logger = logging.getLogger("c1_model_loader")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

CROP_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "c1_crop_rf_v1.0.joblib")
HARVEST_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "c1_harvest_rf_v1.0.joblib")

class ModelRegistry:
    def __init__(self):
        self.crop_pipeline = None
        self.crop_metadata = None
        self.harvest_pipeline = None
        self.harvest_metadata = None

    def load_models(self):
        # 1. Load Crop Recommendation Model
        if os.path.exists(CROP_MODEL_PATH):
            try:
                data = joblib.load(CROP_MODEL_PATH)
                self.crop_pipeline = data.get("pipeline")
                self.crop_metadata = data.get("metadata", {})
                logger.info(f"Loaded crop recommendation model from {CROP_MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load crop recommendation model: {e}")
                self.crop_pipeline = None
        else:
            logger.warning(f"Crop model artifact not found at {CROP_MODEL_PATH}")

        # 2. Load Harvest Prediction Model
        if os.path.exists(HARVEST_MODEL_PATH):
            try:
                data = joblib.load(HARVEST_MODEL_PATH)
                self.harvest_pipeline = data.get("pipeline")
                self.harvest_metadata = data.get("metadata", {})
                logger.info(f"Loaded harvest prediction model from {HARVEST_MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load harvest prediction model: {e}")
                self.harvest_pipeline = None
        else:
            logger.warning(f"Harvest model artifact not found at {HARVEST_MODEL_PATH}")

    @property
    def is_crop_ready(self) -> bool:
        return self.crop_pipeline is not None

    @property
    def is_harvest_ready(self) -> bool:
        return self.harvest_pipeline is not None

registry = ModelRegistry()
