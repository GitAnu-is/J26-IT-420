"""
Component 4 Machine Learning Microservice
AgriGuard Research Project (J26-IT-420 - SLIIT)

FastAPI service for Transportation Risk Prediction and Smart Packaging Recommendation.
"""

import os
import time
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.model_loader import registry
    from app.schemas import (
        HealthResponse, ModelInfoResponse,
        RiskPredictionRequest, RiskPredictionResponse,
        PackagingRecommendationRequest, PackagingRecommendationResponse
    )
    from app.inference import run_risk_inference
    from app.recommendations import generate_packaging_recommendations
except ImportError:
    from model_loader import registry
    from schemas import (
        HealthResponse, ModelInfoResponse,
        RiskPredictionRequest, RiskPredictionResponse,
        PackagingRecommendationRequest, PackagingRecommendationResponse
    )
    from inference import run_risk_inference
    from recommendations import generate_packaging_recommendations

INTERNAL_KEY = os.getenv("C4_INTERNAL_KEY", "c4_internal_secret_key_change_in_production_12345")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[C4-ML] Initializing Transportation Risk ML artifacts...")
    registry.load_artifacts()
    print(f"[C4-ML] Risk model ready: {registry.is_ready}")
    yield
    print("[C4-ML] Shutting down C4 ML microservice...")

app = FastAPI(
    title="AgriGuard Component 4 ML Service",
    description="Transportation Damage Risk Prediction and Smart Packaging Recommendation Engine",
    version="1.0.0",
    lifespan=lifespan
)

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
        raise HTTPException(status_code=500, detail="C4 internal authentication key is unconfigured in production.")

    if INTERNAL_KEY and x_internal_service_key != INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized internal ML service invocation.")

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service="c4_transportation_risk_ml",
        version="1.0.0",
        device="cpu",
        modelLoaded=registry.is_ready,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )

@app.get("/model-info", response_model=ModelInfoResponse, dependencies=[Depends(verify_internal_key)])
def model_info():
    if not registry.is_ready:
        raise HTTPException(status_code=503, detail="C4 model artifacts are not currently loaded.")

    meta = registry.metadata
    return ModelInfoResponse(
        readinessStatus=meta.get("readinessStatus", "PROTOTYPE_SYNTHETIC"),
        validationStatus=meta.get("validationStatus", "UNVALIDATED_FIELD_BENCHMARK"),
        datasetProvenance=meta.get("datasetProvenance", "Agronomically modeled transportation transit dataset"),
        selectedModel=meta.get("selectedModel", {}),
        candidateModels=meta.get("candidateModels", {}),
        supportedCrops=meta.get("supportedCrops", ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]),
        supportedVehicles=[
            "OPEN_TRUCK", "COVERED_TRUCK", "REFRIGERATED_TRUCK",
            "THREE_WHEELER", "PICKUP", "TRACTOR_TRAILER"
        ],
        supportedPackaging=[
            "WOODEN_CRATES", "PLASTIC_CRATES", "CORRUGATED_BOXES",
            "GUNNY_BAGS", "JUTE_BAGS", "LOOSE_BULK", "POLYETHYLENE_LINED_BAGS"
        ],
        supportedRoadConditions=["PAVED_GOOD", "PAVED_POOR", "UNPAVED_ROUGH", "MIXED"],
        riskCategories=meta.get("riskCategories", {
            "LOW": "< 0.25",
            "MEDIUM": "0.25 - 0.65",
            "HIGH": "> 0.65"
        }),
        explainability="SHAP (TreeExplainer)"
    )

@app.post("/predict/risk", response_model=RiskPredictionResponse, dependencies=[Depends(verify_internal_key)])
def predict_transportation_risk(req: RiskPredictionRequest):
    try:
        result = run_risk_inference(
            crop_type=req.cropType,
            distance_km=req.distanceKm,
            duration_hours=req.durationHours,
            vehicle_type=req.vehicleType,
            road_condition=req.roadCondition,
            packaging_type=req.packagingType,
            temperature_celsius=req.temperatureCelsius,
            humidity_percentage=req.humidityPercentage,
            origin_district=req.originDistrict,
            destination_district=req.destinationDistrict
        )
        return RiskPredictionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/recommend/packaging", response_model=PackagingRecommendationResponse, dependencies=[Depends(verify_internal_key)])
def recommend_packaging(req: PackagingRecommendationRequest):
    try:
        rec = generate_packaging_recommendations(
            crop_type=req.cropType,
            distance_km=req.distanceKm,
            vehicle_type=req.vehicleType,
            expected_duration_hours=req.expectedDurationHours,
            current_packaging_type=req.currentPackagingType,
            temperature_celsius=req.temperatureCelsius,
            humidity_percentage=req.humidityPercentage
        )
        rec["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return PackagingRecommendationResponse(**rec)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("C4_SERVICE_HOST", "127.0.0.1")
    port = int(os.getenv("C4_SERVICE_PORT", "8003"))
    uvicorn.run(app, host=host, port=port)
