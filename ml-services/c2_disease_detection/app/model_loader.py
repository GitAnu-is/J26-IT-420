"""
Model Loader and Registry for Component 2 Deep Learning Classifiers
AgriGuard Research Project (J26-IT-420 - SLIIT)

Loads, manages, and executes:
1. Proposed Architecture: EfficientNet-B0 (Transfer Learning)
2. Comparison Architecture: ResNet50 (Transfer Learning)
"""

import os
import json
from typing import Dict, List, Optional, Tuple
import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from torchvision.models import resnet50, ResNet50_Weights

# Fixed disease classes (alphabetically sorted for reproducibility)
DISEASE_CLASSES: List[str] = [
    "BANANA___BUNCHY_TOP",
    "BANANA___HEALTHY",
    "BANANA___SIGATOKA",
    "BLACK_PEPPER___HEALTHY",
    "BLACK_PEPPER___POLLU_DISEASE",
    "BLACK_PEPPER___QUICK_WILT",
    "PINEAPPLE___HEALTHY",
    "PINEAPPLE___HEART_ROT"
]

CROP_DISEASE_MAPPING: Dict[str, List[str]] = {
    "BANANA": ["BANANA___HEALTHY", "BANANA___SIGATOKA", "BANANA___BUNCHY_TOP"],
    "PINEAPPLE": ["PINEAPPLE___HEALTHY", "PINEAPPLE___HEART_ROT"],
    "BLACK_PEPPER": ["BLACK_PEPPER___HEALTHY", "BLACK_PEPPER___QUICK_WILT", "BLACK_PEPPER___POLLU_DISEASE"]
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

def build_efficientnet_b0(num_classes: int = len(DISEASE_CLASSES), pretrained: bool = False) -> nn.Module:
    """Builds EfficientNet-B0 classifier with custom disease classification head."""
    weights = EfficientNet_B0_Weights.DEFAULT if pretrained else None
    try:
        model = efficientnet_b0(weights=weights)
    except Exception:
        # Fallback if download offline
        model = efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model

def build_resnet50(num_classes: int = len(DISEASE_CLASSES), pretrained: bool = False) -> nn.Module:
    """Builds ResNet50 classifier with custom disease classification head."""
    weights = ResNet50_Weights.DEFAULT if pretrained else None
    try:
        model = resnet50(weights=weights)
    except Exception:
        model = resnet50(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model

class ModelRegistry:
    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() and os.getenv("C2_INFERENCE_DEVICE", "cpu") == "cuda" else "cpu"
        )
        self.efficientnet_model: Optional[nn.Module] = None
        self.resnet_model: Optional[nn.Module] = None
        self.classes: List[str] = DISEASE_CLASSES
        self.metadata: Dict[str, object] = {}
        self.is_loaded: bool = False

    def load_models(self):
        """Loads trained weights or initialized models into memory."""
        eff_path = os.path.join(ARTIFACTS_DIR, "c2_efficientnet_b0_v1.0.pt")
        resnet_path = os.path.join(ARTIFACTS_DIR, "c2_resnet50_v1.0.pt")
        meta_path = os.path.join(ARTIFACTS_DIR, "model_metadata.json")

        # 1. Load or build EfficientNet-B0
        self.efficientnet_model = build_efficientnet_b0(num_classes=len(self.classes), pretrained=False)
        if os.path.exists(eff_path):
            state_dict = torch.load(eff_path, map_location=self.device, weights_only=True)
            self.efficientnet_model.load_state_dict(state_dict)
            print(f"[C2-Registry] Loaded EfficientNet-B0 from {eff_path}")
        else:
            print("[C2-Registry] EfficientNet-B0 checkpoint not found on disk; initialized base architecture.")

        self.efficientnet_model.to(self.device)
        self.efficientnet_model.eval()

        # 2. Load or build ResNet50
        self.resnet_model = build_resnet50(num_classes=len(self.classes), pretrained=False)
        if os.path.exists(resnet_path):
            state_dict = torch.load(resnet_path, map_location=self.device, weights_only=True)
            self.resnet_model.load_state_dict(state_dict)
            print(f"[C2-Registry] Loaded ResNet50 from {resnet_path}")
        else:
            print("[C2-Registry] ResNet50 checkpoint not found on disk; initialized base architecture.")

        self.resnet_model.to(self.device)
        self.resnet_model.eval()

        # 3. Load metadata
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {
                "version": "v1.0",
                "proposed_model": "EfficientNet-B0",
                "comparison_model": "ResNet50",
                "device": str(self.device),
                "classes": self.classes,
                "supported_crops": list(CROP_DISEASE_MAPPING.keys())
            }

        self.is_loaded = True

    @property
    def is_ready(self) -> bool:
        return self.is_loaded and self.efficientnet_model is not None

registry = ModelRegistry()
