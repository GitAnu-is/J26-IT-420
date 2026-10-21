import json
import os
from pathlib import Path
from typing import Dict, List, Optional
import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, resnet50

from app.core.config import settings
from app.core.logging import logger

DISEASE_CLASSES: List[str] = [
    "BANANA___BUNCHY_TOP",
    "BANANA___HEALTHY",
    "BANANA___SIGATOKA",
    "BLACK_PEPPER___HEALTHY",
    "BLACK_PEPPER___POLLU_DISEASE",
    "BLACK_PEPPER___QUICK_WILT",
    "PINEAPPLE___HEALTHY",
    "PINEAPPLE___HEART_ROT",
]

DISEASE_DISPLAY_NAMES = {
    "BANANA___BUNCHY_TOP": "Banana Bunchy Top Virus (BBTV)",
    "BANANA___HEALTHY": "Healthy Foliage",
    "BANANA___SIGATOKA": "Sigatoka Leaf Spot",
    "BLACK_PEPPER___HEALTHY": "Healthy Foliage",
    "BLACK_PEPPER___POLLU_DISEASE": "Pollu Disease / Anthracnose",
    "BLACK_PEPPER___QUICK_WILT": "Quick Wilt / Foot Rot (Phytophthora capsici)",
    "PINEAPPLE___HEALTHY": "Healthy Foliage",
    "PINEAPPLE___HEART_ROT": "Heart Rot / Top Rot (Phytophthora nicotianae)",
}


def build_efficientnet_b0(num_classes: int = len(DISEASE_CLASSES)) -> nn.Module:
    model = efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model


def build_resnet50(num_classes: int = len(DISEASE_CLASSES)) -> nn.Module:
    model = resnet50(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model


class C2ModelRegistry:
    def __init__(self):
        self.device = torch.device("cpu")
        self.efficientnet_model: Optional[nn.Module] = None
        self.resnet_model: Optional[nn.Module] = None
        self.classes: List[str] = DISEASE_CLASSES
        self.is_ready: bool = False

    def load_models(self):
        c2_dir = settings.C2_ARTIFACTS_DIR
        if not c2_dir.exists():
            c2_dir = Path(__file__).resolve().parent.parent.parent.parent / "ml-services" / "c2_disease_detection" / "artifacts"

        eff_path = c2_dir / "c2_efficientnet_b0_v1.0.pt"
        resnet_path = c2_dir / "c2_resnet50_v1.0.pt"

        # 1. EfficientNet-B0
        self.efficientnet_model = build_efficientnet_b0(len(self.classes))
        if eff_path.exists():
            try:
                state_dict = torch.load(eff_path, map_location=self.device, weights_only=True)
                self.efficientnet_model.load_state_dict(state_dict)
                logger.info(f"[C2] Loaded EfficientNet-B0 from {eff_path}")
            except Exception as e:
                logger.error(f"[C2] Error loading EfficientNet-B0: {e}")
        else:
            logger.warning(f"[C2] EfficientNet-B0 weights not found at {eff_path}")

        self.efficientnet_model.to(self.device)
        self.efficientnet_model.eval()

        # 2. ResNet50
        self.resnet_model = build_resnet50(len(self.classes))
        if resnet_path.exists():
            try:
                state_dict = torch.load(resnet_path, map_location=self.device, weights_only=True)
                self.resnet_model.load_state_dict(state_dict)
                logger.info(f"[C2] Loaded ResNet50 from {resnet_path}")
            except Exception as e:
                logger.error(f"[C2] Error loading ResNet50: {e}")
        else:
            logger.warning(f"[C2] ResNet50 weights not found at {resnet_path}")

        self.resnet_model.to(self.device)
        self.resnet_model.eval()

        self.is_ready = self.efficientnet_model is not None


c2_registry = C2ModelRegistry()
