import os
from pathlib import Path
from typing import Any, Dict, Optional
import joblib

from app.core.config import settings
from app.core.logging import logger


class C1ModelRegistry:
    def __init__(self):
        self.crop_pipeline: Optional[Any] = None
        self.crop_metadata: Dict[str, Any] = {}
        self.harvest_pipeline: Optional[Any] = None
        self.harvest_metadata: Dict[str, Any] = {}
        self.is_ready: bool = False

    def load_models(self):
        # Look in backend/artifacts/c1 first, then fallback to ml-services
        c1_dir = settings.C1_ARTIFACTS_DIR
        if not c1_dir.exists():
            c1_dir = Path(__file__).resolve().parent.parent.parent.parent / "ml-services" / "c1_crop_recommendation" / "artifacts"

        crop_model_path = c1_dir / "c1_crop_rf_v1.0.joblib"
        harvest_model_path = c1_dir / "c1_harvest_rf_v1.0.joblib"

        if crop_model_path.exists():
            try:
                data = joblib.load(crop_model_path)
                self.crop_pipeline = data.get("pipeline")
                self.crop_metadata = data.get("metadata", {})
                logger.info(f"[C1] Loaded crop recommendation model from {crop_model_path}")
            except Exception as e:
                logger.error(f"[C1] Failed to load crop recommendation model: {e}")
                self.crop_pipeline = None
        else:
            logger.warning(f"[C1] Crop model artifact not found at {crop_model_path}")

        if harvest_model_path.exists():
            try:
                data = joblib.load(harvest_model_path)
                self.harvest_pipeline = data.get("pipeline")
                self.harvest_metadata = data.get("metadata", {})
                logger.info(f"[C1] Loaded harvest prediction model from {harvest_model_path}")
            except Exception as e:
                logger.error(f"[C1] Failed to load harvest prediction model: {e}")
                self.harvest_pipeline = None
        else:
            logger.warning(f"[C1] Harvest model artifact not found at {harvest_model_path}")

        self.is_ready = self.crop_pipeline is not None and self.harvest_pipeline is not None


c1_registry = C1ModelRegistry()
