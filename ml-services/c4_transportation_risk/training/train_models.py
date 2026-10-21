"""
Model Training & Architecture Comparison Pipeline
AgriGuard Research Project (J26-IT-420 - SLIIT)

Trains and benchmarks the four candidate algorithms:
1. Random Forest (RandomForestClassifier)
2. XGBoost (XGBClassifier)
3. CatBoost (CatBoostClassifier)
4. Gradient Boosting (GradientBoostingClassifier)
Along with a Baseline Majority Classifier (DummyClassifier).
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from catboost import CatBoostClassifier

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, brier_score_loss
)

try:
    from training.feature_engineering import (
        engineer_features, build_preprocessor, get_feature_names
    )
except ImportError:
    from feature_engineering import (
        engineer_features, build_preprocessor, get_feature_names
    )

RANDOM_SEED = 42

def train_and_compare_models(data_dir: str, artifacts_dir: str) -> Dict[str, Any]:
    """Trains all 4 models and baseline, saving artifacts and performance summary."""
    os.makedirs(artifacts_dir, exist_ok=True)

    # 1. Load partitions
    train_path = os.path.join(data_dir, "train.csv")
    val_path = os.path.join(data_dir, "val.csv")

    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)

    # 2. Engineer features
    train_feat = engineer_features(train_df)
    val_feat = engineer_features(val_df)

    y_train = train_feat["damage_outcome"].values
    y_val = val_feat["damage_outcome"].values

    # 3. Fit preprocessing pipeline strictly on training data
    preprocessor = build_preprocessor()
    X_train = preprocessor.fit_transform(train_feat)
    X_val = preprocessor.transform(val_feat)

    # Save fitted preprocessor
    preprocessor_path = os.path.join(artifacts_dir, "preprocessor.joblib")
    joblib.dump(preprocessor, preprocessor_path)

    feature_names = get_feature_names(preprocessor)
    print(f"[C4 Train] Extracted {X_train.shape[1]} transformed features. Names: {len(feature_names)}")

    # 4. Instantiate Candidate Models
    models = {
        "Baseline (Dummy)": DummyClassifier(strategy="prior"),
        "Random Forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_split=4,
            class_weight="balanced",
            random_state=RANDOM_SEED
        ),
        "XGBoost": XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            eval_metric="logloss",
            random_state=RANDOM_SEED
        ),
        "CatBoost": CatBoostClassifier(
            iterations=200,
            depth=5,
            learning_rate=0.08,
            random_seed=RANDOM_SEED,
            verbose=False
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            random_state=RANDOM_SEED
        )
    }

    results = {}
    best_f1 = -1.0
    best_model_name = None
    best_model_obj = None

    print("\n" + "="*80)
    print(f"{'Model':<22} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<8} | {'Macro F1':<10} | {'Brier':<8} | {'ROC-AUC':<8}")
    print("="*80)

    for name, model in models.items():
        # Train model
        model.fit(X_train, y_train)

        # Predictions on validation set
        y_pred = model.predict(X_val)
        y_prob = model.predict_proba(X_val)[:, 1]

        acc = accuracy_score(y_val, y_pred)
        prec = precision_score(y_val, y_pred, zero_division=0)
        rec = recall_score(y_val, y_pred, zero_division=0)
        f1 = f1_score(y_val, y_pred, average="macro")
        brier = brier_score_loss(y_val, y_prob)

        try:
            auc = roc_auc_score(y_val, y_prob)
        except Exception:
            auc = 0.50

        results[name] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "macro_f1": round(float(f1), 4),
            "brier_score": round(float(brier), 4),
            "roc_auc": round(float(auc), 4)
        }

        print(f"{name:<22} | {acc:<10.4f} | {prec:<10.4f} | {rec:<8.4f} | {f1:<10.4f} | {brier:<8.4f} | {auc:<8.4f}")

        # Save model checkpoint
        slug = name.lower().replace(" ", "_").replace("(", "").replace(")", "")
        model_path = os.path.join(artifacts_dir, f"c4_{slug}.joblib")
        joblib.dump(model, model_path)

        # Track best model (excluding baseline)
        if name != "Baseline (Dummy)" and f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model_obj = model

    print("="*80)
    print(f"[C4 Selection] Selected Best Model: '{best_model_name}' (Validation Macro F1: {best_f1:.4f})")

    # Save best model to designated production artifact
    best_path = os.path.join(artifacts_dir, "c4_best_model.joblib")
    joblib.dump(best_model_obj, best_path)

    summary = {
        "version": "v1.0",
        "selected_model": best_model_name,
        "selected_model_f1": round(float(best_f1), 4),
        "validation_metrics": results,
        "feature_count": len(feature_names),
        "feature_names": feature_names,
        "random_seed": RANDOM_SEED
    }

    summary_path = os.path.join(artifacts_dir, "training_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    return summary

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.abspath(os.path.join(current_dir, "..", "data", "processed"))
    artifacts_dir = os.path.abspath(os.path.join(current_dir, "..", "artifacts"))
    train_and_compare_models(data_dir, artifacts_dir)
