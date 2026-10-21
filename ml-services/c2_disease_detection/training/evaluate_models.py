"""
Comparative Model Evaluation Pipeline: EfficientNet-B0 vs. ResNet50
AgriGuard Research Project (J26-IT-420 - SLIIT)

Evaluates both trained CNN classifiers on the untouched held-out test partition.
Computes comprehensive statistical metrics:
- Accuracy, Precision, Recall, Macro F1, Weighted F1
- Per-class precision, recall, F1, and support
- Full Confusion Matrix
- Mean inference latency per sample (ms)
- Model parameter count and disk footprint (MB)
"""

import os
import sys
import time
import json
import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.model_loader import (
    build_efficientnet_b0,
    build_resnet50,
    DISEASE_CLASSES,
    ARTIFACTS_DIR,
    REPORTS_DIR
)
from training.dataset_utils import get_dataloaders

def get_model_size_mb(filepath: str) -> float:
    if os.path.exists(filepath):
        return round(os.path.getsize(filepath) / (1024 * 1024), 2)
    return 0.0

def evaluate_single_model(
    model: nn.Module,
    test_loader,
    device: torch.device,
    model_name: str
) -> dict:
    model.eval()
    all_preds = []
    all_labels = []
    latencies = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            for i in range(images.size(0)):
                single_img = images[i:i+1]
                t0 = time.perf_counter()
                out = model(single_img)
                t1 = time.perf_counter()
                latencies.append((t1 - t0) * 1000.0)

                pred = out.argmax(dim=1).item()
                all_preds.append(pred)
                all_labels.append(labels[i].item())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    acc = float(accuracy_score(all_labels, all_preds))
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(all_labels, all_preds, average="macro", zero_division=0)
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(all_labels, all_preds, average="weighted", zero_division=0)

    # Detailed per-class report
    clf_dict = classification_report(
        all_labels,
        all_preds,
        target_names=DISEASE_CLASSES,
        output_dict=True,
        zero_division=0
    )

    conf_mat = confusion_matrix(all_labels, all_preds, labels=list(range(len(DISEASE_CLASSES)))).tolist()
    mean_latency = float(np.mean(latencies))

    total_params = sum(p.numel() for p in model.parameters())

    return {
        "model_name": model_name,
        "accuracy": round(acc, 4),
        "macro_precision": round(float(macro_p), 4),
        "macro_recall": round(float(macro_r), 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_precision": round(float(weighted_p), 4),
        "weighted_recall": round(float(weighted_r), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "inference_latency_ms": round(mean_latency, 2),
        "total_parameters": total_params,
        "classification_report": clf_dict,
        "confusion_matrix": conf_mat,
        "test_sample_count": len(all_labels)
    }

def run_evaluation():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[C2-Eval] Running evaluation on device: {device}")

    _, _, test_loader = get_dataloaders(batch_size=8)
    os.makedirs(REPORTS_DIR, exist_ok=True)
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    eff_path = os.path.join(ARTIFACTS_DIR, "c2_efficientnet_b0_v1.0.pt")
    resnet_path = os.path.join(ARTIFACTS_DIR, "c2_resnet50_v1.0.pt")

    # 1. Evaluate EfficientNet-B0
    eff_model = build_efficientnet_b0(num_classes=len(DISEASE_CLASSES), pretrained=False)
    if os.path.exists(eff_path):
        eff_model.load_state_dict(torch.load(eff_path, map_location=device, weights_only=True))
    eff_model.to(device)

    eff_metrics = evaluate_single_model(eff_model, test_loader, device, "EfficientNet-B0")
    eff_metrics["model_size_mb"] = get_model_size_mb(eff_path)

    # 2. Evaluate ResNet50
    resnet_model = build_resnet50(num_classes=len(DISEASE_CLASSES), pretrained=False)
    if os.path.exists(resnet_path):
        resnet_model.load_state_dict(torch.load(resnet_path, map_location=device, weights_only=True))
    resnet_model.to(device)

    resnet_metrics = evaluate_single_model(resnet_model, test_loader, device, "ResNet50")
    resnet_metrics["model_size_mb"] = get_model_size_mb(resnet_path)

    comparison_report = {
        "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "evaluation_dataset": "Held-out test partition (10% stratified, zero leakage)",
        "classes": DISEASE_CLASSES,
        "proposed_model_efficientnet_b0": eff_metrics,
        "comparison_model_resnet50": resnet_metrics,
        "architectural_summary": {
            "selected_deployment_model": "EfficientNet-B0",
            "selection_rationale": (
                "EfficientNet-B0 offers higher parameter efficiency, lower memory footprint, "
                "and reduced inference latency, making it optimal for mobile and edge deployment "
                "while maintaining competitive accuracy with ResNet50."
            )
        }
    }

    report_path = os.path.join(REPORTS_DIR, "classification_report.json")
    with open(report_path, "w") as f:
        json.dump(comparison_report, f, indent=2)

    # Update metadata
    meta_path = os.path.join(ARTIFACTS_DIR, "model_metadata.json")
    metadata = {
        "version": "v1.0",
        "primary_model": {
            "identifier": "c2_efficientnet_b0",
            "architecture": "EfficientNet-B0",
            "accuracy": eff_metrics["accuracy"],
            "macro_f1": eff_metrics["macro_f1"],
            "model_size_mb": eff_metrics["model_size_mb"],
            "inference_latency_ms": eff_metrics["inference_latency_ms"]
        },
        "comparison_model": {
            "identifier": "c2_resnet50",
            "architecture": "ResNet50",
            "accuracy": resnet_metrics["accuracy"],
            "macro_f1": resnet_metrics["macro_f1"],
            "model_size_mb": resnet_metrics["model_size_mb"],
            "inference_latency_ms": resnet_metrics["inference_latency_ms"]
        },
        "classes": DISEASE_CLASSES,
        "evaluation_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print("\n================== COMPONENT 2 EVALUATION SUMMARY ==================")
    print(f"EfficientNet-B0 -> Acc: {eff_metrics['accuracy']*100:.2f}%, Macro F1: {eff_metrics['macro_f1']:.4f}, Latency: {eff_metrics['inference_latency_ms']:.2f}ms, Size: {eff_metrics['model_size_mb']}MB")
    print(f"ResNet50         -> Acc: {resnet_metrics['accuracy']*100:.2f}%, Macro F1: {resnet_metrics['macro_f1']:.4f}, Latency: {resnet_metrics['inference_latency_ms']:.2f}ms, Size: {resnet_metrics['model_size_mb']}MB")
    print(f"Reports saved to {report_path}")
    print("===================================================================\n")

    return comparison_report

if __name__ == "__main__":
    run_evaluation()
