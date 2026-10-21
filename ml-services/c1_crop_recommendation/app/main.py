"""
Component 1 Machine Learning Microservice
AgriGuard Research Project (J26-IT-420 - SLIIT)

FastAPI service for Crop Recommendation & Harvest Planning ML inference.
"""

import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from model_loader import registry
from schemas import (
    CropInferenceRequest,
    CropInferenceResponse,
    HarvestInferenceRequest,
    HarvestInferenceResponse,
    HealthResponse,
    ModelInfoResponse
)
from inference import predict_crop, predict_harvest

INTERNAL_KEY = os.getenv("C1_INTERNAL_KEY", "")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models from disk
    print("[C1-ML] Loading models into memory...")
    registry.load_models()
    print(f"[C1-ML] Crop model ready: {registry.is_crop_ready}")
    print(f"[C1-ML] Harvest model ready: {registry.is_harvest_ready}")
    yield
    print("[C1-ML] Shutting down...")

app = FastAPI(
    title="AgriGuard Component 1 ML Service",
    description="Random Forest ML Inference Microservice for Crop Recommendation & Harvest Planning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS restricted to localhost/internal network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_internal_key(x_internal_service_key: str = Header(None)):
    """Validates internal key if configured"""
    if INTERNAL_KEY and x_internal_service_key != INTERNAL_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized internal ML service invocation"
        )

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service="c1_crop_recommendation_ml",
        version="1.0.0",
        modelsLoaded={
            "crop_recommendation": registry.is_crop_ready,
            "harvest_prediction": registry.is_harvest_ready
        },
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )

@app.get("/model-info", response_model=ModelInfoResponse, dependencies=[Depends(verify_internal_key)])
def model_info():
    return ModelInfoResponse(
        cropRecommendationModel=registry.crop_metadata or {"status": "not_loaded"},
        harvestPredictionModel=registry.harvest_metadata or {"status": "not_loaded"}
    )

@app.post("/predict/crop", response_model=CropInferenceResponse, dependencies=[Depends(verify_internal_key)])
def predict_crop_endpoint(request: CropInferenceRequest):
    return predict_crop(request)

@app.post("/predict/harvest", response_model=HarvestInferenceResponse, dependencies=[Depends(verify_internal_key)])
def predict_harvest_endpoint(request: HarvestInferenceRequest):
    return predict_harvest(request)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False)
