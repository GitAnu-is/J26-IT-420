"""
Preprocessing Pipeline Module for Component 1 Models
AgriGuard Research Project (J26-IT-420 - SLIIT)

Builds reproducible, leak-free scikit-learn ColumnTransformers and Pipelines.
"""

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# -----------------------------------------------------------------------------
# Crop Recommendation Feature Definitions
# -----------------------------------------------------------------------------
CROP_NUMERIC_FEATURES = [
    "nitrogen",
    "phosphorus",
    "potassium",
    "ph",
    "soil_moisture",
    "temperature",
    "humidity",
    "rainfall"
]

CROP_CATEGORICAL_FEATURES = [
    "district",
    "agro_zone",
    "season"
]

CROP_TARGET = "recommended_crop"

def build_crop_preprocessing_pipeline():
    """
    Builds ColumnTransformer for Crop Recommendation model.
    Scales numerical features, imputes missing values with median, and one-hot encodes categoricals.
    """
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, CROP_NUMERIC_FEATURES),
            ("cat", categorical_transformer, CROP_CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )

    return preprocessor

# -----------------------------------------------------------------------------
# Harvest Prediction Feature Definitions
# -----------------------------------------------------------------------------
HARVEST_NUMERIC_FEATURES = [
    "soil_ph",
    "soil_moisture",
    "temperature",
    "rainfall"
]

HARVEST_CATEGORICAL_FEATURES = [
    "crop_type",
    "variety",
    "district",
    "season"
]

HARVEST_TARGET = "harvest_duration_days"

def build_harvest_preprocessing_pipeline():
    """
    Builds ColumnTransformer for Harvest Duration Regressor.
    """
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, HARVEST_NUMERIC_FEATURES),
            ("cat", categorical_transformer, HARVEST_CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )

    return preprocessor
