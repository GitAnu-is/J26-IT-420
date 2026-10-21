import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib

from app.core.config import settings
from app.core.logging import logger
from app.modules.c4_transportation_risk.feature_engineering import get_feature_names
from app.modules.c4_transportation_risk.shap_explainer import ShapRiskExplainer


class C4ModelRegistry:
    def __init__(self):
        self.best_model: Optional[Any] = None
        self.preprocessor: Optional[Any] = None
        self.metadata: Dict[str, Any] = {}
        self.feature_names: List[str] = []
        self.shap_explainer: Optional[ShapRiskExplainer] = None
        self.is_ready: bool = False

    def load_artifacts(self):
        c4_dir = settings.C4_ARTIFACTS_DIR
        if not c4_dir.exists():
            c4_dir = Path(__file__).resolve().parent.parent.parent.parent / "ml-services" / "c4_transportation_risk" / "artifacts"

        model_path = c4_dir / "c4_best_model.joblib"
        preprocessor_path = c4_dir / "preprocessor.joblib"
        meta_path = c4_dir / "model_metadata.json"

        if model_path.exists() and preprocessor_path.exists():
            try:
                self.best_model = joblib.load(model_path)
                self.preprocessor = joblib.load(preprocessor_path)

                if meta_path.exists():
                    with open(meta_path, "r") as f:
                        self.metadata = json.load(f)

                self.feature_names = get_feature_names(self.preprocessor)
                self.shap_explainer = ShapRiskExplainer(self.best_model, self.feature_names)
                self.is_ready = True
                logger.info(f"[C4] Loaded model '{self.metadata.get('selectedModel', {}).get('name', 'Best Model')}' with {len(self.feature_names)} features.")
            except Exception as e:
                logger.error(f"[C4] Failed to load artifacts: {e}")
                self.is_ready = False
        else:
            logger.warning(f"[C4] Artifacts missing in {c4_dir}. Service running in uninitialized mode.")
            self.is_ready = False


c4_registry = C4ModelRegistry()
