
import os
import hmac
import base64
from io import BytesIO
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager


# --------------------------------------------------
# Configuration
# --------------------------------------------------
ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "models" / "c2" / "resnet50_disease6_best.pth"

SERVICE_KEY = os.getenv("C2_PYTHON_SERVICE_KEY", "")
MAX_IMAGE_BYTES = 10 * 1024 * 1024

DEVICE = torch.device("cpu")

checkpoint = None
model = None
classes = []


# --------------------------------------------------
# Image preprocessing
# Must match the preprocessing used during training.
# --------------------------------------------------
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


@asynccontextmanager
async def lifespan(app: FastAPI):
    global checkpoint, model, classes

    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model checkpoint not found: {MODEL_PATH}")

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
        weights_only=True,
    )

    classes = checkpoint["classes"]

    model = models.resnet50(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(classes))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE)
    model.eval()

    print(f"C2 ResNet50 loaded: {len(classes)} classes")
    yield


app = FastAPI(
    title="AgriGuard C2 Disease Inference Service",
    version="1.0.0",
    lifespan=lifespan,
)


# --------------------------------------------------
# Authentication
# --------------------------------------------------
def verify_internal_key(provided_key: str | None):
    if not SERVICE_KEY:
        raise HTTPException(
            status_code=503,
            detail="C2 inference service key is not configured",
        )

    if not provided_key or not hmac.compare_digest(
        provided_key, SERVICE_KEY
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid internal service key",
        )


# --------------------------------------------------
# Prediction
# --------------------------------------------------
def predict_image(image: Image.Image, crop_type: str):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    crop = crop_type.strip().lower()

    crop_prefixes = {
        "banana": "Banana__",
        "black pepper": "Black pepper__",
        "black_pepper": "Black pepper__",
        "black-pepper": "Black pepper__",
        "pineapple": "Pineapple__",
    }

    if crop not in crop_prefixes:
        raise HTTPException(
            status_code=422,
            detail="cropType must be Banana, Black pepper, or Pineapple",
        )

    tensor = preprocess(image.convert("RGB")).unsqueeze(0).to(DEVICE)

    with torch.inference_mode():
        logits = model(tensor)
        probabilities = torch.softmax(logits, dim=1)[0]
        predicted_index = int(torch.argmax(probabilities).item())

    predicted_label = classes[predicted_index]
    expected_prefix = crop_prefixes[crop]

    # The classifier predicts across all six classes. Do not return
    # a disease belonging to a different crop as if it were valid.
    if not predicted_label.startswith(expected_prefix):
        return {
            "predictedDisease": "Uncertain - crop/disease mismatch",
            "confidence": float(probabilities[predicted_index].item()),
            "cropType": crop_type,
            "message": (
                "The model's highest prediction belongs to another crop. "
                "Retake a clear leaf image and verify the selected crop."
            ),
            "model": "ResNet50",
            "severityAssessment": {
                "status": "not_available",
                "message": "Severity estimation is not validated yet.",
            },
            "gradCam": None,
        }

    disease_name = predicted_label.split("__", 1)[1].replace("__", " ")

    return {
        "predictedDisease": disease_name,
        "confidence": float(probabilities[predicted_index].item()),
        "cropType": crop_type,
        "model": "ResNet50",
        "severityAssessment": {
            "status": "not_available",
            "message": "Severity estimation is not validated yet.",
        },
        "gradCam": None,
        "note": (
            "Prediction is a model estimate, not a confirmed diagnosis. "
            "Validate with an agricultural expert."
        ),
    }


async def read_image(upload: UploadFile) -> Image.Image:
    content = await upload.read(MAX_IMAGE_BYTES + 1)

    if not content:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the 10 MB upload limit",
        )

    try:
        image = Image.open(BytesIO(content))
        image.verify()
        image = Image.open(BytesIO(content))
        image.load()
        return image.convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image",
        )


# --------------------------------------------------
# API endpoints expected by the Node.js adapter
# --------------------------------------------------
class DiseaseJsonRequest(BaseModel):
    cropType: str
    imageBase64: str


@app.post("/predict/disease")
async def predict_disease(
    image: UploadFile = File(...),
    cropType: str = Form(...),
    includeGradCam: str = Form("true"),
    x_internal_service_key: str | None = Header(
        default=None,
        alias="X-Internal-Service-Key",
    ),
):
    verify_internal_key(x_internal_service_key)
    pil_image = await read_image(image)
    return predict_image(pil_image, cropType)


@app.post("/predict/disease-json")
async def predict_disease_json(
    body: DiseaseJsonRequest,
    x_internal_service_key: str | None = Header(
        default=None,
        alias="X-Internal-Service-Key",
    ),
):
    verify_internal_key(x_internal_service_key)

    encoded = body.imageBase64
    if encoded.startswith("data:") and "," in encoded:
        encoded = encoded.split(",", 1)[1]

    try:
        content = base64.b64decode(encoded, validate=True)
        if not content or len(content) > MAX_IMAGE_BYTES:
            raise ValueError("Invalid image size")
        image = Image.open(BytesIO(content))
        image.load()
        image = image.convert("RGB")
    except (ValueError, UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="imageBase64 must contain a valid image",
        )

    return predict_image(image, body.cropType)


@app.get("/model-info")
async def model_info(
    x_internal_service_key: str | None = Header(
        default=None,
        alias="X-Internal-Service-Key",
    ),
):
    verify_internal_key(x_internal_service_key)

    return {
        "status": "ready" if model is not None else "unavailable",
        "model": "ResNet50",
        "classes": classes,
        "classCount": len(classes),
        "device": str(DEVICE),
        "severityAssessment": "not_validated",
        "gradCam": "not_implemented",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "modelLoaded": model is not None,
    }
