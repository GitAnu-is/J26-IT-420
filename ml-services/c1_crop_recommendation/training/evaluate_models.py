"""
Comprehensive Evaluation and Model Verification Script
AgriGuard Research Project (J26-IT-420 - SLIIT)
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

def main():
    crop_model_path = os.path.join(ARTIFACTS_DIR, "c1_crop_rf_v1.0.joblib")
    harvest_model_path = os.path.join(ARTIFACTS_DIR, "c1_harvest_rf_v1.0.joblib")

    print("=" * 70)
    print("AGRIGUARD COMPONENT 1 — MODEL EVALUATION SUMMARY")
    print("=" * 70)

    if os.path.exists(crop_model_path):
        crop_data = joblib.load(crop_model_path)
        meta = crop_data["metadata"]
        perf = meta["performance"]
        print("\n[TASK A: CROP RECOMMENDATION CLASSIFIER]")
        print(f"Model ID:         {meta['model_identifier']} ({meta['model_version']})")
        print(f"Classes:          {meta['classes']}")
        print(f"Accuracy:         {perf['accuracy'] * 100:.2f}%")
        print(f"Macro F1-Score:   {perf['macro_f1']:.4f}")
        print(f"Macro Precision:  {perf['macro_precision']:.4f}")
        print(f"Macro Recall:     {perf['macro_recall']:.4f}")
        print(f"5-Fold CV F1:     {perf['cv_macro_f1_mean']:.4f} (+/- {perf['cv_macro_f1_std']:.4f})")
        print(f"Majority F1:      {perf['baseline_majority_f1']:.4f}")
        print(f"Agronomic Rule F1:{perf['baseline_rule_f1']:.4f}")
        print(f"Inference Latency:{perf['latency_ms']:.2f} ms")
    else:
        print("[TASK A] Crop model artifact not found.")

    if os.path.exists(harvest_model_path):
        harvest_data = joblib.load(harvest_model_path)
        meta = harvest_data["metadata"]
        perf = meta["performance"]
        per_crop = meta.get("per_crop_performance", {})
        print("\n[TASK B: HARVEST TIME PREDICTION REGRESSOR]")
        print(f"Model ID:         {meta['model_identifier']} ({meta['model_version']})")
        print(f"Target:           {meta['target']} (days)")
        print(f"Mean Abs Error:   {perf['mae_days']:.2f} days")
        print(f"Root Mean Sq Err: {perf['rmse_days']:.2f} days")
        print(f"R2 Score:         {perf['r2_score']:.4f}")
        print(f"5-Fold CV MAE:    {perf['cv_mae_days']:.2f} days")
        print(f"Baseline MAE:     {perf['baseline_mae_days']:.2f} days")
        print(f"Inference Latency:{perf['latency_ms']:.2f} ms")
        print("Per-Crop Breakdown:")
        for crop, c_perf in per_crop.items():
            print(f"  - {crop:12s}: MAE={c_perf['mae_days']:.2f} days, RMSE={c_perf['rmse_days']:.2f} days, R2={c_perf['r2_score']:.4f}")
    else:
        print("[TASK B] Harvest model artifact not found.")

    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
