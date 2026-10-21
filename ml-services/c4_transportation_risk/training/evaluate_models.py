"""
Model Evaluation on Held-Out Test Set
AgriGuard Research Project (J26-IT-420 - SLIIT)

Evaluates all candidate models on the untouched test partition (test.csv).
Calculates per-class, per-crop, calibration, latency, and model size metrics.
Outputs reports/evaluation_report.json and artifacts/model_metadata.json.
"""

import os
import time
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, brier_score_loss, confusion_matrix
)

try:
    from training.feature_engineering import engineer_features
except ImportError:
    from feature_engineering import engineer_features

def evaluate_test_set(data_dir: str, artifacts_dir: str, reports_dir: str) -> Dict[str, Any]:
    os.makedirs(reports_dir, exist_ok=True)

    # 1. Load test partition and preprocessor
    test_path = os.path.join(data_dir, "test.csv")
    test_df = pd.read_csv(test_path)

    test_feat = engineer_features(test_df)
    y_test = test_feat["damage_outcome"].values

    preprocessor_path = os.path.join(artifacts_dir, "preprocessor.joblib")
    preprocessor = joblib.load(preprocessor_path)

    X_test = preprocessor.transform(test_feat)

    # 2. Candidate model files
    model_files = {
        "Baseline (Dummy)": "c4_baseline_dummy.joblib",
        "Random Forest": "c4_random_forest.joblib",
        "XGBoost": "c4_xgboost.joblib",
        "CatBoost": "c4_catboost.joblib",
        "Gradient Boosting": "c4_gradient_boosting.joblib"
    }

    test_results = {}
    crops = ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]

    print("\n" + "="*90)
    print(f"{'Model':<22} | {'Test Acc':<9} | {'Macro F1':<9} | {'Brier':<8} | {'ROC-AUC':<8} | {'Latency':<9} | {'Size'}")
    print("="*90)

    for name, filename in model_files.items():
        filepath = os.path.join(artifacts_dir, filename)
        if not os.path.exists(filepath):
            continue

        model = joblib.load(filepath)
        size_kb = round(os.path.getsize(filepath) / 1024.0, 2)

        # Benchmark inference latency over 50 repetitions
        start_t = time.perf_counter()
        for _ in range(50):
            _ = model.predict(X_test)
        elapsed_ms = ((time.perf_counter() - start_t) / 50.0 / len(X_test)) * 1000.0

        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1_macro = f1_score(y_test, y_pred, average="macro")
        f1_weighted = f1_score(y_test, y_pred, average="weighted")
        brier = brier_score_loss(y_test, y_prob)

        try:
            auc = roc_auc_score(y_test, y_prob)
        except Exception:
            auc = 0.50

        cm = confusion_matrix(y_test, y_pred).tolist()

        # Per-crop breakdown
        crop_metrics = {}
        for crop in crops:
            mask = (test_df["crop_type"] == crop).values
            if mask.sum() > 0:
                y_sub = y_test[mask]
                pred_sub = y_pred[mask]
                crop_acc = accuracy_score(y_sub, pred_sub)
                crop_f1 = f1_score(y_sub, pred_sub, average="macro", zero_division=0)
                crop_metrics[crop] = {
                    "count": int(mask.sum()),
                    "accuracy": round(float(crop_acc), 4),
                    "macro_f1": round(float(crop_f1), 4)
                }

        test_results[name] = {
            "test_accuracy": round(float(acc), 4),
            "macro_precision": round(float(prec), 4),
            "macro_recall": round(float(rec), 4),
            "macro_f1": round(float(f1_macro), 4),
            "weighted_f1": round(float(f1_weighted), 4),
            "brier_score": round(float(brier), 4),
            "roc_auc": round(float(auc), 4),
            "confusion_matrix": cm,
            "mean_latency_ms": round(float(elapsed_ms), 3),
            "artifact_size_kb": size_kb,
            "crop_breakdown": crop_metrics
        }

        print(f"{name:<22} | {acc:<9.4f} | {f1_macro:<9.4f} | {brier:<8.4f} | {auc:<8.4f} | {elapsed_ms:<6.3f} ms | {size_kb} KB")

    print("="*90)

    # Compile comprehensive evaluation report
    report = {
        "report_title": "Component 4 Transportation Risk AI Model Evaluation",
        "dataset_provenance": "PROTOTYPE_SYNTHETIC",
        "intended_use": "Engineering architecture comparison and baseline deployment",
        "research_limitations": "Dataset generated from Sri Lankan agronomic transport parameters; field validation with physical transit sensors remains required.",
        "test_sample_count": len(test_df),
        "tested_models": test_results,
        "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    report_path = os.path.join(reports_dir, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    # Compile model metadata catalog
    best_summary = json.load(open(os.path.join(artifacts_dir, "training_summary.json")))
    best_name = best_summary["selected_model"]

    metadata = {
        "version": "v1.0",
        "readinessStatus": "PROTOTYPE_SYNTHETIC",
        "validationStatus": "UNVALIDATED_FIELD_BENCHMARK",
        "datasetProvenance": "Agronomically modeled transportation transit dataset; not in-situ fleet sensor observations",
        "selectedModel": {
            "name": best_name,
            "algorithm": best_name,
            "testMetrics": test_results.get(best_name, {})
        },
        "candidateModels": test_results,
        "supportedCrops": crops,
        "riskCategories": {
            "LOW": "Damage probability < 0.25",
            "MEDIUM": "0.25 <= Damage probability <= 0.65",
            "HIGH": "Damage probability > 0.65"
        },
        "explainability": "SHAP (TreeExplainer)",
        "features": best_summary.get("feature_names", []),
        "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    meta_path = os.path.join(artifacts_dir, "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[C4 Eval] Evaluation report saved to {report_path}")
    print(f"[C4 Eval] Model metadata catalog saved to {meta_path}")

    return report

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(current_dir, "..", "data", "processed"))
    artifacts_dir = os.path.abspath(os.path.join(current_dir, "..", "artifacts"))
    reports_dir = os.path.abspath(os.path.join(current_dir, "..", "reports"))
    evaluate_test_set(data_dir, artifacts_dir, reports_dir)
