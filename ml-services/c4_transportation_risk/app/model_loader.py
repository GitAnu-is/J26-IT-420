"""
Model Registry & Artifact Loader for Component 4
AgriGuard Research Project (J26-IT-420 - SLIIT)

Loads trained risk models, preprocessors, and SHAP explainers safely.
"""

import os
import json
import joblib
from typing import Optional, Dict, Any, List

try:
    from app.explanations import ShapRiskExplainer
    from training.feature_engineering import get_feature_names
except ImportError:
    from explanations import ShapRiskExplainer
    from feature_engineering import get_feature_names

class C4ModelRegistry:
    def __init__(self, artifacts_dir: Optional[str] = None):
        if artifacts_dir is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            artifacts_dir = os.path.abspath(os.path.join(current_dir, "..", "artifacts"))

        self.artifacts_dir = artifacts_dir
        self.best_model = None
        self.preprocessor = None
        self.metadata = {}
        self.feature_names: List[str] = []
        self.shap_explainer: Optional[ShapRiskExplainer] = None
        self.is_ready = False

    def load_artifacts(self):
        """Loads best trained model, preprocessor, and metadata catalog."""
        model_path = os.path.join(self.artifacts_dir, "c4_best_model.joblib")
        preprocessor_path = os.path.join(self.artifacts_dir, "preprocessor.joblib")
        meta_path = os.path.join(self.artifacts_dir, "model_metadata.json")

        if os.path.exists(model_path) and os.path.exists(preprocessor_path):
            try:
                self.best_model = joblib.load(model_path)
                self.preprocessor = joblib.load(preprocessor_path)

                if os.path.exists(meta_path):
                    with open(meta_path, "r") as f:
                        self.metadata = json.load(f)

                self.feature_names = get_feature_names(self.preprocessor)
                self.shap_explainer = ShapRiskExplainer(self.best_model, self.feature_names)
                self.is_ready = True
                print(f"[C4 Registry] Loaded model '{self.metadata.get('selectedModel', {}).get('name', 'Best Model')}' with {len(self.feature_names)} features.")
            except Exception as e:
                print(f"[C4 Registry] Failed to load artifacts: {e}")
                self.is_ready = False
        else:
            print(f"[C4 Registry] Artifacts missing in {self.artifacts_dir}. Service running in uninitialized mode.")
            self.is_ready = False

registry = C4ModelRegistry()
