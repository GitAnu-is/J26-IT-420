from typing import Any, Dict, List, Optional
import numpy as np
import shap

HUMAN_READABLE_NAMES = {
    "distance_km": "Transit Distance",
    "duration_hours": "Travel Duration",
    "temperature_celsius": "Ambient Temperature",
    "humidity_percentage": "Relative Humidity",
    "travel_speed_kmh": "Transit Velocity",
    "thermal_stress_index": "Heat & Humidity Stress Index",
}


class ShapRiskExplainer:
    def __init__(self, model: Any, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        self._init_explainer()

    def _init_explainer(self):
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception:
            self.explainer = None

    def explain_instance(self, transformed_row: np.ndarray, top_k: int = 5) -> Optional[Dict[str, Any]]:
        if self.explainer is None:
            return None

        try:
            shap_values = self.explainer.shap_values(transformed_row)

            if isinstance(shap_values, list) and len(shap_values) == 2:
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

            contributions = []
            for idx, val in enumerate(sv):
                if idx >= len(self.feature_names):
                    continue
                feat_name = self.feature_names[idx]
                disp_name = HUMAN_READABLE_NAMES.get(feat_name, feat_name)

                if feat_name.startswith("cat__"):
                    clean = feat_name.replace("cat__", "")
                    parts = clean.split("_", 1)
                    disp_name = f"{parts[0].capitalize()}: {parts[1]}" if len(parts) == 2 else clean

                val_float = float(val)
                contributions.append({
                    "feature": feat_name,
                    "displayName": disp_name,
                    "attribution": round(val_float, 4),
                    "attributionValue": round(val_float, 4),
                    "impact": "INCREASES_RISK" if val_float > 0 else "DECREASES_RISK",
                    "displayImpact": "High Risk Contributor" if val_float > 0.05 else ("Moderate Risk" if val_float > 0 else "Mitigating Factor"),
                    "magnitude": round(float(abs(val_float)), 4),
                })

            contributions.sort(key=lambda x: x["magnitude"], reverse=True)
            top_drivers = contributions[:top_k]
            elevators = [c for c in contributions if c["attribution"] > 0][:3]
            mitigators = [c for c in contributions if c["attribution"] < 0][:3]

            return {
                "method": "SHAP (TreeExplainer)",
                "topContributors": top_drivers,
                "primaryRiskElevators": elevators,
                "primaryRiskMitigators": mitigators,
                "scientificDisclaimer": (
                    "SHAP values reflect model feature attribution for this prediction. "
                    "They describe predictive associations in the trained model, not guaranteed causal interventions."
                ),
            }
        except Exception:
            return None
