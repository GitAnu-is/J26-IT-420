"""
Random Forest Harvest Prediction Model Training
AgriGuard Research Project (J26-IT-420 - SLIIT)

Trains and evaluates Random Forest Regressor to predict harvest duration in days.
Target: harvest_duration_days
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score
)
from sklearn.pipeline import Pipeline

from preprocessing import (
    build_harvest_preprocessing_pipeline,
    HARVEST_NUMERIC_FEATURES,
    HARVEST_CATEGORICAL_FEATURES,
    HARVEST_TARGET
)

RANDOM_SEED = 42

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "c1_harvest_prediction.csv")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

class CropMedianBaseline:
    """Historical crop-specific median harvest duration baseline"""
    def __init__(self):
        self.medians = {}
        self.global_median = 300.0

    def fit(self, X_df, y_series):
        self.global_median = float(y_series.median())
        df = pd.DataFrame({"crop": X_df["crop_type"], "y": y_series})
        self.medians = df.groupby("crop")["y"].median().to_dict()

    def predict(self, X_df):
        return np.array([self.medians.get(crop, self.global_median) for crop in X_df["crop_type"]])

def train_and_evaluate():
    print(f"Loading harvest dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)

    print(f"Dataset shape: {df.shape}")
    print(f"Crop distribution:\n{df['crop_type'].value_counts()}")

    X = df[HARVEST_NUMERIC_FEATURES + HARVEST_CATEGORICAL_FEATURES]
    y = df[HARVEST_TARGET]

    # 80/20 Stratified by crop_type
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_SEED, stratify=df["crop_type"]
    )

    print(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples")

    # 1. Baseline Model: Historical Crop Median
    baseline = CropMedianBaseline()
    baseline.fit(X_train, y_train)
    baseline_preds = baseline.predict(X_test)

    baseline_mae = mean_absolute_error(y_test, baseline_preds)
    baseline_rmse = root_mean_squared_error(y_test, baseline_preds)
    baseline_r2 = r2_score(y_test, baseline_preds)

    print("\n--- Baseline Model Comparison ---")
    print(f"Crop-Median Baseline: MAE={baseline_mae:.2f} days, RMSE={baseline_rmse:.2f} days, R2={baseline_r2:.4f}")

    # 2. Random Forest Regressor Pipeline
    preprocessor = build_harvest_preprocessing_pipeline()
    rf_reg = RandomForestRegressor(
        n_estimators=150,
        max_depth=10,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=RANDOM_SEED,
        n_jobs=-1
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", rf_reg)
    ])

    print("\nTraining Random Forest Regressor...")
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="neg_mean_absolute_error")
    cv_mae = -cv_scores.mean()
    print(f"5-Fold CV MAE: {cv_mae:.2f} (+/- {cv_scores.std():.2f}) days")

    pipeline.fit(X_train, y_train)

    # 3. Test Set Evaluation
    t0 = time.time()
    y_pred = pipeline.predict(X_test)
    inference_time = (time.time() - t0) * 1000.0 / len(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\n--- Held-Out Test Set Performance ---")
    print(f"MAE:       {mae:.2f} days")
    print(f"RMSE:      {rmse:.2f} days")
    print(f"R2 Score:  {r2:.4f}")
    print(f"Latency:   {inference_time:.2f} ms per sample")

    # Per-Crop Breakdown
    per_crop_metrics = {}
    test_eval_df = X_test.copy()
    test_eval_df["y_true"] = y_test
    test_eval_df["y_pred"] = y_pred

    print("\n--- Per-Crop Performance Breakdown ---")
    for crop in ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]:
        crop_sub = test_eval_df[test_eval_df["crop_type"] == crop]
        c_mae = mean_absolute_error(crop_sub["y_true"], crop_sub["y_pred"])
        c_rmse = root_mean_squared_error(crop_sub["y_true"], crop_sub["y_pred"])
        c_r2 = r2_score(crop_sub["y_true"], crop_sub["y_pred"])
        per_crop_metrics[crop] = {
            "mae_days": round(float(c_mae), 2),
            "rmse_days": round(float(c_rmse), 2),
            "r2_score": round(float(c_r2), 4),
            "count": len(crop_sub)
        }
        print(f"{crop:12s}: MAE={c_mae:.2f} days, RMSE={c_rmse:.2f} days, R2={c_r2:.4f} (N={len(crop_sub)})")

    # 4. Save Artifact and Report
    artifact_metadata = {
        "model_identifier": "c1_harvest_random_forest",
        "model_version": "v1.0",
        "model_type": "RandomForestRegressor",
        "target": "harvest_duration_days",
        "training_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "feature_schema": {
            "numeric": HARVEST_NUMERIC_FEATURES,
            "categorical": HARVEST_CATEGORICAL_FEATURES
        },
        "performance": {
            "mae_days": round(float(mae), 2),
            "rmse_days": round(float(rmse), 2),
            "r2_score": round(float(r2), 4),
            "cv_mae_days": round(float(cv_mae), 2),
            "baseline_mae_days": round(float(baseline_mae), 2),
            "baseline_rmse_days": round(float(baseline_rmse), 2),
            "latency_ms": round(float(inference_time), 2)
        },
        "per_crop_performance": per_crop_metrics
    }

    artifact_path = os.path.join(ARTIFACTS_DIR, "c1_harvest_rf_v1.0.joblib")
    joblib.dump({
        "pipeline": pipeline,
        "metadata": artifact_metadata
    }, artifact_path)
    print(f"\nModel artifact saved to {artifact_path}")

    report_path = os.path.join(REPORTS_DIR, "harvest_prediction_report.json")
    with open(report_path, "w") as f:
        json.dump(artifact_metadata, f, indent=2)
    print(f"Report saved to {report_path}")

    return artifact_metadata

if __name__ == "__main__":
    train_and_evaluate()
