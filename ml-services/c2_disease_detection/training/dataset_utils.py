"""
PyTorch Dataset and DataLoader Utilities for Component 2
AgriGuard Research Project (J26-IT-420 - SLIIT)
"""

import os
from typing import List, Tuple
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as T

from app.preprocessing import INFERENCE_TRANSFORMS, TRAINING_TRANSFORMS
from app.model_loader import DISEASE_CLASSES

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PROC_DIR = os.path.join(BASE_DIR, "data", "processed")

class PlantDiseaseDataset(Dataset):
    def __init__(self, split: str = "train", transform=None):
        self.split = split
        self.transform = transform or (TRAINING_TRANSFORMS if split == "train" else INFERENCE_TRANSFORMS)
        self.classes: List[str] = DISEASE_CLASSES
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        self.samples: List[Tuple[str, int]] = []

        split_dir = os.path.join(DATA_PROC_DIR, split)
        if not os.path.exists(split_dir):
            raise FileNotFoundError(f"Dataset split directory '{split_dir}' not found. Run prepare_dataset.py first.")

        for cls_name in self.classes:
            cls_folder = os.path.join(split_dir, cls_name)
            if not os.path.exists(cls_folder):
                continue
            for fname in sorted(os.listdir(cls_folder)):
                if fname.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                    fpath = os.path.join(cls_folder, fname)
                    self.samples.append((fpath, self.class_to_idx[cls_name]))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        fpath, label = self.samples[idx]
        with Image.open(fpath) as img:
            rgb_img = img.convert("RGB")
            tensor = self.transform(rgb_img)
        return tensor, label

def get_dataloaders(batch_size: int = 16) -> Tuple[DataLoader, DataLoader, DataLoader]:
    train_ds = PlantDiseaseDataset(split="train")
    val_ds = PlantDiseaseDataset(split="val")
    test_ds = PlantDiseaseDataset(split="test")

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    return train_loader, val_loader, test_loader
