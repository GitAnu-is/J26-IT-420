"""
SHAP Explainability Module for Transportation Risk
AgriGuard Research Project (J26-IT-420 - SLIIT)

Implements TreeExplainer feature attributions to identify and explain
the primary risk contributors and protective mitigating factors for a journey.
"""

import numpy as np
import shap
from typing import Dict, List, Optional, Any

HUMAN_READABLE_NAMES = {
    "distance_km": "Transit Distance",
    "duration_hours": "Travel Duration",
    "temperature_celsius": "Ambient Temperature",
    "humidity_percentage": "Relative Humidity",
    "travel_speed_kmh": "Transit Velocity",
    "thermal_stress_index": "Heat & Humidity Stress Index"
}

class ShapRiskExplainer:
    def __init__(self, model: Any, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        self._init_explainer()

    def _init_explainer(self):
        try:
            # TreeExplainer works directly for tree ensembles (GB, RF, XGBoost)
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            print(f"[C4 SHAP] TreeExplainer initialization notice: {e}")
            self.explainer = None

    def explain_instance(self, transformed_row: np.ndarray, top_k: int = 5) -> Optional[Dict[str, Any]]:
        """
        Computes SHAP feature attributions for a single transformed sample.
        Returns top positive (risk-increasing) and negative (risk-mitigating) drivers.
        """
        if self.explainer is None:
            return None

        try:
            shap_values = self.explainer.shap_values(transformed_row)

            # Handle binary classification shapes from different models
            if isinstance(shap_values, list) and len(shap_values) == 2:
                # Class 1 (damage outcome)
                sv = shap_values[1][0]
            elif isinstance(shap_values, np.ndarray):
                if shap_values.ndim == 2:
                    sv = shap_values[0]
                elif shap_values.ndim == 3 and shap_values.shape[-1] == 2:
                    sv = shap_values[0, :, 1]
                else:
                    sv = shap_values[0]
            else:
                return None

            # Map raw feature attributions back to human-readable factors
            contributions = []
            for idx, val in enumerate(sv):
                if idx >= len(self.feature_names):
                    continue
                feat_name = self.feature_names[idx]
                disp_name = HUMAN_READABLE_NAMES.get(feat_name, feat_name)

                # Clean up one-hot prefix (e.g. cat__vehicle_type_THREE_WHEELER -> Vehicle: THREE_WHEELER)
                if feat_name.startswith("cat__"):
                    clean = feat_name.replace("cat__", "")
                    parts = clean.split("_", 1)
                    if len(parts) == 2:
                        disp_name = f"{parts[0].capitalize()}: {parts[1]}"
                    else:
                        disp_name = clean

                contributions.append({
                    "feature": feat_name,
                    "displayName": disp_name,
                    "attribution": round(float(val), 4),
                    "impact": "INCREASES_RISK" if val > 0 else "DECREASES_RISK",
                    "magnitude": round(float(abs(val)), 4)
                })

            # Sort by absolute magnitude
            contributions.sort(key=lambda x: x["magnitude"], reverse=True)

            top_drivers = contributions[:top_k]

            # Top risk elevators (positive SHAP)
            elevators = [c for c in contributions if c["attribution"] > 0][:3]
            # Top risk mitigators (negative SHAP)
            mitigators = [c for c in contributions if c["attribution"] < 0][:3]

            return {
                "method": "SHAP (TreeExplainer)",
                "topContributors": top_drivers,
                "primaryRiskElevators": elevators,
                "primaryRiskMitigators": mitigators,
                "scientificDisclaimer": (
                    "SHAP values reflect model feature attribution for this prediction. "
                    "They describe predictive associations in the trained model, not guaranteed causal interventions."
                )
            }

        except Exception as err:
            print(f"[C4 SHAP] Error computing SHAP values: {err}")
            return None
