"""
Training Pipeline for Proposed Model A: EfficientNet-B0
AgriGuard Research Project (J26-IT-420 - SLIIT)

Trains EfficientNet-B0 transfer learning classifier with custom head for:
Banana, Pineapple, and Black Pepper plant disease detection.
"""

import os
import sys
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim

# Add root directory to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.model_loader import build_efficientnet_b0, DISEASE_CLASSES, ARTIFACTS_DIR
from training.dataset_utils import get_dataloaders

def train_efficientnet(epochs: int = 5, batch_size: int = 16, lr: float = 1e-3):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Train-EffNet] Training on device: {device}")

    train_loader, val_loader, _ = get_dataloaders(batch_size=batch_size)
    num_classes = len(DISEASE_CLASSES)

    model = build_efficientnet_b0(num_classes=num_classes, pretrained=False)
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)

    best_val_loss = float("inf")
    best_val_acc = 0.0
    best_state_dict = None
    training_history = []

    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    save_path = os.path.join(ARTIFACTS_DIR, "c2_efficientnet_b0_v1.0.pt")

    for epoch in range(1, epochs + 1):
        start_t = time.perf_counter()

        # Training phase
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            preds = outputs.argmax(dim=1)
            correct_train += (preds == labels).sum().item()
            total_train += labels.size(0)

        epoch_train_loss = running_loss / total_train
        epoch_train_acc = correct_train / total_train

        # Validation phase
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                preds = outputs.argmax(dim=1)
                correct_val += (preds == labels).sum().item()
                total_val += labels.size(0)

        epoch_val_loss = val_loss / total_val
        epoch_val_acc = correct_val / total_val
        scheduler.step()

        elapsed = time.perf_counter() - start_t
        print(
            f"Epoch [{epoch}/{epochs}] - Train Loss: {epoch_train_loss:.4f}, Train Acc: {epoch_train_acc*100:.2f}% | "
            f"Val Loss: {epoch_val_loss:.4f}, Val Acc: {epoch_val_acc*100:.2f}% ({elapsed:.1f}s)"
        )

        training_history.append({
            "epoch": epoch,
            "train_loss": round(epoch_train_loss, 4),
            "train_acc": round(epoch_train_acc, 4),
            "val_loss": round(epoch_val_loss, 4),
            "val_acc": round(epoch_val_acc, 4)
        })

        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            best_val_acc = epoch_val_acc
            best_state_dict = model.state_dict().copy()

    # Save best validated checkpoint
    if best_state_dict is not None:
        torch.save(best_state_dict, save_path)
        print(f"[Train-EffNet] Saved best EfficientNet-B0 checkpoint to {save_path} (Val Acc: {best_val_acc*100:.2f}%)")

    # Save training metadata
    meta = {
        "model_identifier": "c2_efficientnet_b0",
        "architecture": "EfficientNet-B0",
        "version": "v1.0",
        "num_classes": num_classes,
        "classes": DISEASE_CLASSES,
        "best_val_loss": round(best_val_loss, 4),
        "best_val_accuracy": round(best_val_acc, 4),
        "training_epochs": epochs,
        "training_history": training_history,
        "training_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    with open(os.path.join(ARTIFACTS_DIR, "efficientnet_training_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    return model, meta

if __name__ == "__main__":
    train_efficientnet(epochs=5, batch_size=16, lr=1e-3)
