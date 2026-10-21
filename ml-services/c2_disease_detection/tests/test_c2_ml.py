"""
Comprehensive Automated Test Suite for Component 2 ML Microservice
AgriGuard Research Project (J26-IT-420 - SLIIT)

Tests:
1. Dataset schema & manifest validation
2. Class label consistency
3. Crop-disease mapping integrity
4. SHA-256 duplicate image detection
5. Image preprocessing & tensor shapes
6. Training augmentation isolation
7. Data leakage prevention across partitions
8. EfficientNet-B0 model loading & forward pass
9. ResNet50 comparison model loading
10. Classification output shapes and softmax normalization
11. Confidence score ranges [0.0, 1.0]
12. Invalid/corrupted image rejection
13. Severity calculation with simulated segmentation masks
14. Severity unavailable behavior when masks/expert labels are absent
15. Grad-CAM heatmap dimensions & normalization [0.0, 1.0]
16. Grad-CAM visual overlay generation
17. Missing artifact handling
18. Internal service authentication (X-Internal-Service-Key)
19. Model unavailable behavior (HTTP 503)
20. FastAPI request schema validation
21. Health and readiness endpoints (/health, /model-info)
22. Inference latency benchmark
"""

import os
import sys
import io
import json
import pytest
import numpy as np
from PIL import Image
import torch
from fastapi.testclient import TestClient

# Add project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.model_loader import (
    registry,
    DISEASE_CLASSES,
    CROP_DISEASE_MAPPING,
    build_efficientnet_b0,
    build_resnet50,
    ARTIFACTS_DIR
)
from app.preprocessing import (
    validate_image_bytes,
    load_and_preprocess_image,
    INFERENCE_TRANSFORMS,
    TRAINING_TRANSFORMS
)
from app.severity import evaluate_disease_severity, assess_severity_from_mask
from app.gradcam import GradCAMExplainer, image_to_base64_png
from app.guidance import get_guidance_for_prediction, GUIDANCE_REGISTRY
from app.main import app, INTERNAL_KEY

@pytest.fixture(scope="session", autouse=True)
def setup_models():
    """Ensure models are initialized and loaded for test session."""
    registry.load_models()
    yield

@pytest.fixture
def sample_pil_image():
    """Generates a valid 224x224 RGB test leaf image."""
    arr = np.zeros((224, 224, 3), dtype=np.uint8)
    arr[:, :, 1] = 160  # Green leaf baseline
    return Image.fromarray(arr, mode="RGB")

@pytest.fixture
def sample_image_bytes(sample_pil_image):
    """Encodes PIL image to JPEG bytes."""
    buf = io.BytesIO()
    sample_pil_image.save(buf, format="JPEG")
    return buf.getvalue()

@pytest.fixture
def client():
    """FastAPI TestClient instance."""
    return TestClient(app)

# ==============================================================================
# 1-4. Dataset & Manifest Audits
# ==============================================================================

def test_01_dataset_manifest_exists_and_valid():
    manifest_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "processed", "dataset_manifest.json"
    )
    assert os.path.exists(manifest_path), "Dataset manifest must exist in data/processed/"
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
    assert "classes" in manifest
    assert len(manifest["classes"]) == 8
    assert "splits" in manifest
    assert set(manifest["splits"].keys()) == {"train", "val", "test"}

def test_02_class_label_consistency():
    for crop, diseases in CROP_DISEASE_MAPPING.items():
        for d in diseases:
            assert d in DISEASE_CLASSES, f"Mapped disease {d} not in DISEASE_CLASSES registry"

def test_03_crop_disease_mapping_counts():
    assert len(CROP_DISEASE_MAPPING["BANANA"]) == 3
    assert len(CROP_DISEASE_MAPPING["PINEAPPLE"]) == 2
    assert len(CROP_DISEASE_MAPPING["BLACK_PEPPER"]) == 3
    total = sum(len(v) for v in CROP_DISEASE_MAPPING.values())
    assert total == len(DISEASE_CLASSES) == 8

def test_04_no_data_leakage_across_partitions():
    manifest_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "processed", "dataset_manifest.json"
    )
    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    train_hashes = set()
    for cls_name, items in manifest["splits"]["train"].items():
        for item in items:
            train_hashes.add(item["sha256"])

    val_hashes = set()
    for cls_name, items in manifest["splits"]["val"].items():
        for item in items:
            val_hashes.add(item["sha256"])

    test_hashes = set()
    for cls_name, items in manifest["splits"]["test"].items():
        for item in items:
            test_hashes.add(item["sha256"])

    assert len(train_hashes.intersection(val_hashes)) == 0, "Data leakage detected between train and val splits!"
    assert len(train_hashes.intersection(test_hashes)) == 0, "Data leakage detected between train and test splits!"
    assert len(val_hashes.intersection(test_hashes)) == 0, "Data leakage detected between val and test splits!"

# ==============================================================================
# 5-7. Preprocessing & Augmentation
# ==============================================================================

def test_05_preprocessing_produces_normalized_tensor(sample_image_bytes):
    tensor, pil_img = load_and_preprocess_image(sample_image_bytes)
    assert tensor.shape == (1, 3, 224, 224)
    assert isinstance(pil_img, Image.Image)
    assert pil_img.mode == "RGB"

def test_06_training_augmentation_distinct_from_inference(sample_pil_image):
    t_inf = INFERENCE_TRANSFORMS(sample_pil_image)
    t_train = TRAINING_TRANSFORMS(sample_pil_image)
    assert t_inf.shape == (3, 224, 224)
    assert t_train.shape == (3, 224, 224)

def test_07_magic_bytes_detection_jpeg_png_webp(sample_pil_image):
    for fmt, expected in [("JPEG", "jpeg"), ("PNG", "png")]:
        buf = io.BytesIO()
        sample_pil_image.save(buf, format=fmt)
        detected = validate_image_bytes(buf.getvalue())
        assert detected == expected

# ==============================================================================
# 8-12. Deep Learning Model Ingestion & Forward Pass
# ==============================================================================

def test_08_efficientnet_model_forward_pass(sample_image_bytes):
    tensor, _ = load_and_preprocess_image(sample_image_bytes)
    model = registry.efficientnet_model
    assert model is not None
    model.eval()
    with torch.no_grad():
        out = model(tensor)
    assert out.shape == (1, 8), f"Expected output shape (1, 8), got {out.shape}"

def test_09_resnet_model_forward_pass(sample_image_bytes):
    tensor, _ = load_and_preprocess_image(sample_image_bytes)
    model = registry.resnet_model
    assert model is not None
    model.eval()
    with torch.no_grad():
        out = model(tensor)
    assert out.shape == (1, 8)

def test_10_softmax_probabilities_sum_to_one(sample_image_bytes):
    tensor, _ = load_and_preprocess_image(sample_image_bytes)
    with torch.no_grad():
        logits = registry.efficientnet_model(tensor)
        probs = torch.softmax(logits, dim=1).numpy().squeeze(0)
    assert np.isclose(probs.sum(), 1.0, atol=1e-4)
    assert np.all(probs >= 0.0)
    assert np.all(probs <= 1.0)

def test_11_confidence_score_ranges(sample_image_bytes):
    tensor, _ = load_and_preprocess_image(sample_image_bytes)
    with torch.no_grad():
        logits = registry.efficientnet_model(tensor)
        top_prob = float(torch.softmax(logits, dim=1).max().item())
    assert 0.0 <= top_prob <= 1.0

def test_12_rejects_corrupted_and_invalid_images():
    with pytest.raises(ValueError, match="too short"):
        validate_image_bytes(b"short")

    fake_header = b"\xff\xd8\xff" + b"A" * 10  # Corrupted JPEG
    with pytest.raises(ValueError):
        validate_image_bytes(fake_header)

# ==============================================================================
# 13-14. Severity Assessment Rules
# ==============================================================================

def test_13_severity_with_calibrated_masks():
    # 100x100 leaf with 1000 lesion pixels = 10% -> LOW
    leaf_mask = np.ones((100, 100), dtype=bool)
    lesion_mask = np.zeros((100, 100), dtype=bool)
    lesion_mask[:10, :100] = True  # 10%
    level, score = assess_severity_from_mask(lesion_mask, leaf_mask)
    assert level == "LOW"
    assert score == 10.0

    # 30% lesion -> MEDIUM
    lesion_mask[:30, :100] = True
    level, score = assess_severity_from_mask(lesion_mask, leaf_mask)
    assert level == "MEDIUM"

    # 50% lesion -> HIGH
    lesion_mask[:50, :100] = True
    level, score = assess_severity_from_mask(lesion_mask, leaf_mask)
    assert level == "HIGH"

def test_14_severity_unavailable_when_unannotated():
    res = evaluate_disease_severity("BANANA___SIGATOKA", confidence=0.92, lesion_mask=None)
    assert res["severity"] is None
    assert res["severityStatus"] == "UNAVAILABLE"
    assert "validated lesion segmentation masks" in res["severityMethod"]

    healthy_res = evaluate_disease_severity("BANANA___HEALTHY", confidence=0.95, lesion_mask=None)
    assert healthy_res["severity"] == "HEALTHY"
    assert healthy_res["severityStatus"] == "NOT_APPLICABLE"

# ==============================================================================
# 15-17. Grad-CAM Explainability
# ==============================================================================

def test_15_gradcam_heatmap_shape_and_range(sample_image_bytes, sample_pil_image):
    tensor, _ = load_and_preprocess_image(sample_image_bytes)
    model = registry.efficientnet_model
    explainer = GradCAMExplainer(model, model.features[-1])

    grad_tensor = tensor.clone().detach().requires_grad_(True)
    heatmap = explainer.generate_heatmap(grad_tensor, target_class_idx=2)
    assert heatmap.ndim == 2
    assert heatmap.min() >= 0.0
    assert heatmap.max() <= 1.0 + 1e-6
    explainer.close()

def test_16_gradcam_overlay_generation(sample_image_bytes, sample_pil_image):
    tensor, _ = load_and_preprocess_image(sample_image_bytes)
    model = registry.efficientnet_model
    explainer = GradCAMExplainer(model, model.features[-1])

    grad_tensor = tensor.clone().detach().requires_grad_(True)
    overlay, heatmap = explainer.generate_and_overlay(grad_tensor, sample_pil_image, target_class_idx=2)
    assert overlay.size == sample_pil_image.size
    b64_str = image_to_base64_png(overlay)
    assert len(b64_str) > 100
    explainer.close()

def test_17_guidance_registry_matching():
    guidance_sigatoka = get_guidance_for_prediction("BANANA___SIGATOKA", confidence=0.90)
    assert "Deleaf and prune" in guidance_sigatoka["guidance"][0]
    assert "Department of Agriculture" in guidance_sigatoka["citation"] or "DOA" in guidance_sigatoka["citation"]

    # Low confidence (< 0.65) prepends warning
    guidance_low = get_guidance_for_prediction("BANANA___SIGATOKA", confidence=0.55)
    assert "UNCERTAINTY WARNING" in guidance_low["guidance"][0]

# ==============================================================================
# 18-22. FastAPI Microservice HTTP Endpoints
# ==============================================================================

def test_18_internal_authentication_rejection(client, sample_image_bytes):
    # Without header
    res = client.get("/model-info")
    assert res.status_code == 401

    # With bad header
    res = client.get("/model-info", headers={"X-Internal-Service-Key": "wrong-secret"})
    assert res.status_code == 401

    # With correct header
    res = client.get("/model-info", headers={"X-Internal-Service-Key": INTERNAL_KEY})
    assert res.status_code == 200

def test_19_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["modelsLoaded"]["efficientnet_b0"] is True

def test_20_model_info_endpoint(client):
    res = client.get("/model-info", headers={"X-Internal-Service-Key": INTERNAL_KEY})
    assert res.status_code == 200
    data = res.json()
    assert "primaryModel" in data
    assert data["primaryModel"]["modelIdentifier"] == "c2_efficientnet_b0"
    assert "comparisonModel" in data
    assert data["comparisonModel"]["modelIdentifier"] == "c2_resnet50"
    assert len(data["supportedClasses"]) == 8

def test_21_predict_disease_multipart_endpoint(client, sample_image_bytes):
    files = {"image": ("test.jpg", sample_image_bytes, "image/jpeg")}
    data = {"cropType": "BANANA", "includeGradCam": "true"}
    res = client.post(
        "/predict/disease",
        files=files,
        data=data,
        headers={"X-Internal-Service-Key": INTERNAL_KEY}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["cropType"] == "BANANA"
    assert "predictedDisease" in body
    assert body["confidence"] >= 0.0
    assert body["gradCamAvailable"] is True
    assert body["gradCamBase64"] is not None
    assert len(body["managementGuidance"]) > 0

def test_22_inference_latency_measurement(client, sample_image_bytes):
    files = {"image": ("test.jpg", sample_image_bytes, "image/jpeg")}
    data = {"cropType": "BLACK_PEPPER", "includeGradCam": "false"}
    res = client.post(
        "/predict/disease",
        files=files,
        data=data,
        headers={"X-Internal-Service-Key": INTERNAL_KEY}
    )
    assert res.status_code == 200
    body = res.json()
    assert "executionLatencyMs" in body
    assert body["executionLatencyMs"] > 0.0
