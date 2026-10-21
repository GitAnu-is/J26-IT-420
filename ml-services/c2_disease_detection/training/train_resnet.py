"""
Training Pipeline for Comparison Model B: ResNet50
AgriGuard Research Project (J26-IT-420 - SLIIT)

Trains ResNet50 comparison classifier under the identical split and class registry.
"""

import os
import sys
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.model_loader import build_resnet50, DISEASE_CLASSES, ARTIFACTS_DIR
from training.dataset_utils import get_dataloaders

def train_resnet(epochs: int = 3, batch_size: int = 16, lr: float = 1e-3):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Train-ResNet] Training on device: {device}")

    train_loader, val_loader, _ = get_dataloaders(batch_size=batch_size)
    num_classes = len(DISEASE_CLASSES)

    model = build_resnet50(num_classes=num_classes, pretrained=False)
    # Freeze convolutional feature extraction backbone for efficient CPU transfer learning
    for param in model.parameters():
        param.requires_grad = False
    for param in model.fc.parameters():
        param.requires_grad = True

    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)

    best_val_loss = float("inf")
    best_val_acc = 0.0
    best_state_dict = None
    training_history = []

    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    save_path = os.path.join(ARTIFACTS_DIR, "c2_resnet50_v1.0.pt")

    for epoch in range(1, epochs + 1):
        start_t = time.perf_counter()

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

    if best_state_dict is not None:
        torch.save(best_state_dict, save_path)
        print(f"[Train-ResNet] Saved best ResNet50 checkpoint to {save_path} (Val Acc: {best_val_acc*100:.2f}%)")

    meta = {
        "model_identifier": "c2_resnet50",
        "architecture": "ResNet50",
        "version": "v1.0",
        "num_classes": num_classes,
        "classes": DISEASE_CLASSES,
        "best_val_loss": round(best_val_loss, 4),
        "best_val_accuracy": round(best_val_acc, 4),
        "training_epochs": epochs,
        "training_history": training_history,
        "training_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    with open(os.path.join(ARTIFACTS_DIR, "resnet_training_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    return model, meta

if __name__ == "__main__":
    train_resnet(epochs=5, batch_size=16, lr=1e-3)
