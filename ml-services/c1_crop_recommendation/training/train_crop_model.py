"""
Random Forest Crop Recommendation Model Training
AgriGuard Research Project (J26-IT-420 - SLIIT)

Trains and evaluates Random Forest Classifier for recommending BANANA, PINEAPPLE, or BLACK_PEPPER.
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)
from sklearn.pipeline import Pipeline

from preprocessing import (
    build_crop_preprocessing_pipeline,
    CROP_NUMERIC_FEATURES,
    CROP_CATEGORICAL_FEATURES,
    CROP_TARGET
)

RANDOM_SEED = 42

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "c1_crop_recommendation.csv")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

def agronomic_rule_baseline(X_df):
    """
    Independent agronomic rule-based heuristic baseline:
    - If pH < 5.6 and potassium < 250 -> PINEAPPLE (acidic, lateritic preference)
    - Else if potassium >= 250 and nitrogen >= 140 -> BANANA (high nutrient demand)
    - Else -> BLACK_PEPPER (intermediate conditions)
    """
    preds = []
    for _, row in X_df.iterrows():
        ph = row.get("ph", 6.0)
        k = row.get("potassium", 200.0)
        n = row.get("nitrogen", 120.0)

        if ph < 5.6 and k < 260.0:
            preds.append("PINEAPPLE")
        elif k >= 240.0 and n >= 130.0:
            preds.append("BANANA")
        else:
            preds.append("BLACK_PEPPER")
    return np.array(preds)

def train_and_evaluate():
    print(f"Loading crop dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)

    print(f"Dataset shape: {df.shape}")
    print(f"Class distribution:\n{df[CROP_TARGET].value_counts()}")

    X = df[CROP_NUMERIC_FEATURES + CROP_CATEGORICAL_FEATURES]
    y = df[CROP_TARGET]

    # 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_SEED, stratify=y
    )

    print(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples")

    # 1. Majority Class Baseline
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(X_train, y_train)
    dummy_preds = dummy.predict(X_test)
    dummy_acc = accuracy_score(y_test, dummy_preds)
    dummy_macro_f1 = f1_score(y_test, dummy_preds, average="macro")

    # 2. Agronomic Rule-Based Baseline
    rule_preds = agronomic_rule_baseline(X_test)
    rule_acc = accuracy_score(y_test, rule_preds)
    rule_macro_f1 = f1_score(y_test, rule_preds, average="macro")

    print("\n--- Baseline Comparisons ---")
    print(f"Majority Class Baseline: Accuracy={dummy_acc:.4f}, Macro F1={dummy_macro_f1:.4f}")
    print(f"Agronomic Rule Baseline: Accuracy={rule_acc:.4f}, Macro F1={rule_macro_f1:.4f}")

    # 3. Random Forest Model Pipeline
    preprocessor = build_crop_preprocessing_pipeline()
    rf_clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=RANDOM_SEED,
        n_jobs=-1
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", rf_clf)
    ])

    print("\nTraining Random Forest Classifier...")
    # 5-fold cross validation on training set
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="f1_macro")
    print(f"5-Fold CV Macro F1: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Fit final pipeline on entire training set
    pipeline.fit(X_train, y_train)

    # 4. Evaluation on Held-Out Test Set
    t0 = time.time()
    y_pred = pipeline.predict(X_test)
    inference_time = (time.time() - t0) * 1000.0 / len(X_test)

    y_proba = pipeline.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    macro_p = precision_score(y_test, y_pred, average="macro")
    macro_r = recall_score(y_test, y_pred, average="macro")
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    cm = confusion_matrix(y_test, y_pred, labels=["BANANA", "PINEAPPLE", "BLACK_PEPPER"]).tolist()

    report_dict = classification_report(y_test, y_pred, output_dict=True)

    print("\n--- Test Set Evaluation ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Macro P:   {macro_p:.4f}")
    print(f"Macro R:   {macro_r:.4f}")
    print(f"Macro F1:  {macro_f1:.4f}")
    print(f"Latency:   {inference_time:.2f} ms per sample")
    print(f"\nConfusion Matrix (Banana, Pineapple, Black Pepper):\n{np.array(cm)}")

    # 5. Save Artifact and Report
    artifact_metadata = {
        "model_identifier": "c1_crop_random_forest",
        "model_version": "v1.0",
        "model_type": "RandomForestClassifier",
        "training_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "classes": list(pipeline.classes_),
        "feature_schema": {
            "numeric": CROP_NUMERIC_FEATURES,
            "categorical": CROP_CATEGORICAL_FEATURES
        },
        "performance": {
            "accuracy": round(float(acc), 4),
            "macro_precision": round(float(macro_p), 4),
            "macro_recall": round(float(macro_r), 4),
            "macro_f1": round(float(macro_f1), 4),
            "cv_macro_f1_mean": round(float(cv_scores.mean()), 4),
            "cv_macro_f1_std": round(float(cv_scores.std()), 4),
            "latency_ms": round(float(inference_time), 2),
            "baseline_majority_f1": round(float(dummy_macro_f1), 4),
            "baseline_rule_f1": round(float(rule_macro_f1), 4)
        }
    }

    artifact_path = os.path.join(ARTIFACTS_DIR, "c1_crop_rf_v1.0.joblib")
    joblib.dump({
        "pipeline": pipeline,
        "metadata": artifact_metadata
    }, artifact_path)
    print(f"\nModel artifact saved to {artifact_path}")

    report_data = {
        "metadata": artifact_metadata,
        "classification_report": report_dict,
        "confusion_matrix": cm,
        "classes": ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]
    }

    report_path = os.path.join(REPORTS_DIR, "crop_recommendation_report.json")
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=2)
    print(f"Report saved to {report_path}")

    return artifact_metadata

if __name__ == "__main__":
    train_and_evaluate()
