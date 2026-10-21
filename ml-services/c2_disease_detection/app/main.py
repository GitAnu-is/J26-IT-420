"""
Component 2 Machine Learning Microservice
AgriGuard Research Project (J26-IT-420 - SLIIT)

FastAPI service for Plant Disease Detection & Severity Assessment (EfficientNet-B0 & ResNet50).
"""

import os
import io
import time
import base64
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.model_loader import registry, CROP_DISEASE_MAPPING
    from app.schemas import (
        HealthResponse,
        ModelInfoResponse,
        DiseasePredictionRequest,
        DiseasePredictionResponse
    )
    from app.preprocessing import load_and_preprocess_image, validate_image_bytes
    from app.inference import run_disease_inference
except ImportError:
    from model_loader import registry, CROP_DISEASE_MAPPING
    from schemas import (
        HealthResponse,
        ModelInfoResponse,
        DiseasePredictionRequest,
        DiseasePredictionResponse
    )
    from preprocessing import load_and_preprocess_image, validate_image_bytes
    from inference import run_disease_inference

INTERNAL_KEY = os.getenv("C2_INTERNAL_KEY", "c2_internal_secret_key_change_in_production_12345")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[C2-ML] Initializing deep learning models...")
    registry.load_models()
    print(f"[C2-ML] EfficientNet-B0 loaded: {registry.is_ready} on device: {registry.device}")
    yield
    print("[C2-ML] Shutting down C2 ML microservice...")

app = FastAPI(
    title="AgriGuard Component 2 ML Service",
    description="Deep Learning Inference Microservice for Plant Disease Detection and Severity Assessment",
    version="1.0.0",
    lifespan=lifespan
)

# Restrict CORS to internal network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_internal_key(x_internal_service_key: Optional[str] = Header(None)):
    """Validates internal service API key."""
    if ENVIRONMENT == "production" and not INTERNAL_KEY:
        raise HTTPException(status_code=500, detail="C2 internal authentication key is unconfigured in production.")

    if INTERNAL_KEY and x_internal_service_key != INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized internal ML service invocation.")

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service="c2_disease_detection_ml",
        version="1.0.0",
        device=str(registry.device),
        modelsLoaded={
            "efficientnet_b0": registry.efficientnet_model is not None,
            "resnet50": registry.resnet_model is not None
        },
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )

@app.get("/model-info", response_model=ModelInfoResponse, dependencies=[Depends(verify_internal_key)])
def model_info():
    primary_meta = {
        "modelIdentifier": "c2_efficientnet_b0",
        "architecture": "EfficientNet-B0 (Transfer Learning)",
        "version": registry.metadata.get("version", "v1.0"),
        "status": "ready" if registry.is_ready else "not_loaded",
        "readinessStatus": "PROTOTYPE_SYNTHETIC",
        "validationStatus": "UNVALIDATED_FIELD_BENCHMARK",
        "datasetProvenance": "Controlled pathological visual fixtures generated for architecture comparison; not in-situ field sensor observations",
        "inputResolution": [224, 224, 3],
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "explainability": "Grad-CAM on layer features[-1]"
    }
    comparison_meta = {
        "modelIdentifier": "c2_resnet50",
        "architecture": "ResNet50 (Transfer Learning)",
        "version": registry.metadata.get("version", "v1.0"),
        "status": "ready" if registry.resnet_model is not None else "not_loaded",
        "readinessStatus": "PROTOTYPE_SYNTHETIC",
        "validationStatus": "UNVALIDATED_FIELD_BENCHMARK",
        "datasetProvenance": "Controlled pathological visual fixtures generated for architecture comparison; not in-situ field sensor observations",
        "inputResolution": [224, 224, 3],
        "explainability": "Grad-CAM on layer4[-1]"
    }
    return ModelInfoResponse(
        primaryModel=primary_meta,
        comparisonModel=comparison_meta,
        supportedCrops=list(CROP_DISEASE_MAPPING.keys()),
        supportedClasses=registry.classes,
        cropDiseaseMapping=CROP_DISEASE_MAPPING
    )

@app.post(
    "/predict/disease",
    response_model=DiseasePredictionResponse,
    dependencies=[Depends(verify_internal_key)]
)
async def predict_disease_multipart(
    cropType: str = Form(..., description="Crop type: BANANA, PINEAPPLE, BLACK_PEPPER"),
    image: Optional[UploadFile] = File(None, description="Image file (JPEG/PNG/WebP, max 8MB)"),
    imageBase64: Optional[str] = Form(None, description="Base64 encoded image string"),
    includeGradCam: bool = Form(True, description="Whether to compute Grad-CAM overlay")
):
    """
    Inference endpoint supporting multipart image uploads or form-encoded Base64.
    """
    image_bytes: Optional[bytes] = None

    if image is not None:
        image_bytes = await image.read()
    elif imageBase64 is not None and len(imageBase64.strip()) > 0:
        # Strip data URL prefix if present
        raw_b64 = imageBase64
        if "base64," in raw_b64:
            raw_b64 = raw_b64.split("base64,")[1]
        try:
            image_bytes = base64.b64decode(raw_b64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="An image must be provided either as a multipart file ('image') or base64 string ('imageBase64')."
        )

    # Size check (8MB)
    if len(image_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds maximum allowed limit (8 MB).")

    try:
        tensor, original_pil = load_and_preprocess_image(image_bytes)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(err)}")

    return run_disease_inference(
        input_tensor=tensor,
        original_image=original_pil,
        crop_type=cropType,
        include_gradcam=includeGradCam
    )

@app.post(
    "/predict/disease-json",
    response_model=DiseasePredictionResponse,
    dependencies=[Depends(verify_internal_key)]
)
def predict_disease_json(request: DiseasePredictionRequest):
    """
    Alternative JSON inference endpoint for clients submitting JSON payloads.
    """
    if not request.imageBase64:
        raise HTTPException(status_code=400, detail="imageBase64 is required in JSON payload.")

    raw_b64 = request.imageBase64
    if "base64," in raw_b64:
        raw_b64 = raw_b64.split("base64,")[1]

    try:
        image_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

    try:
        tensor, original_pil = load_and_preprocess_image(image_bytes)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

    return run_disease_inference(
        input_tensor=tensor,
        original_image=original_pil,
        crop_type=request.cropType,
        include_gradcam=True
    )

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("C2_SERVICE_HOST", "127.0.0.1")
    port = int(os.getenv("C2_SERVICE_PORT", 8002))
    uvicorn.run("main:app", host=host, port=port, reload=False)
