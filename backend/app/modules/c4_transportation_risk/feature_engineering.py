import numpy as np
import pandas as pd
from typing import List
from sklearn.compose import ColumnTransformer

CATEGORICAL_FEATURES = ["crop_type", "vehicle_type", "road_condition", "packaging_type"]
NUMERICAL_FEATURES = [
    "distance_km",
    "duration_hours",
    "temperature_celsius",
    "humidity_percentage",
    "travel_speed_kmh",
    "thermal_stress_index",
]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes derived domain-specific agronomic transit features."""
    df_feat = df.copy()

    # Fill default environmental conditions if missing
    if "temperature_celsius" not in df_feat.columns or df_feat["temperature_celsius"].isnull().any():
        df_feat["temperature_celsius"] = df_feat.get("temperature_celsius", 28.0).fillna(28.0)
    if "humidity_percentage" not in df_feat.columns or df_feat["humidity_percentage"].isnull().any():
        df_feat["humidity_percentage"] = df_feat.get("humidity_percentage", 75.0).fillna(75.0)

    # Derived speed and thermal features
    duration_safe = np.maximum(0.1, df_feat["duration_hours"].values)
    df_feat["travel_speed_kmh"] = np.clip(df_feat["distance_km"].values / duration_safe, 5.0, 100.0)
    df_feat["thermal_stress_index"] = df_feat["temperature_celsius"].values * (
        df_feat["humidity_percentage"].values / 100.0
    )

    return df_feat


def get_feature_names(preprocessor: ColumnTransformer) -> List[str]:
    """Retrieves post-transformation feature names for SHAP attribution mapping."""
    num_names = NUMERICAL_FEATURES
    try:
        cat_names = list(preprocessor.named_transformers_["cat"].get_feature_names_out(CATEGORICAL_FEATURES))
        return num_names + cat_names
    except Exception:
        return num_names
