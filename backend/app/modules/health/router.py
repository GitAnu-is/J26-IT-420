import os
import sys
import time
from datetime import datetime, timezone
from fastapi import APIRouter, status

from app.core.config import settings
from app.database.mongodb import mongo_manager
from app.modules.c1_crop_recommendation.model_loader import c1_registry
from app.modules.c2_disease_detection.model_loader import c2_registry
from app.modules.c4_transportation_risk.model_loader import c4_registry
from app.shared.constants import RESEARCH_PROVENANCE, SUPPORTED_CROPS
from app.shared.responses import api_success

router = APIRouter(tags=["Health & Discovery"])
START_TIME = time.time()


def get_health_payload():
    c1_ready = c1_registry.is_ready
    c2_ready = c2_registry.is_ready
    c4_ready = c4_registry.is_ready
    db_connected = mongo_manager.connected

    overall_status = "OPTIMAL" if (c1_ready and c2_ready and c4_ready and db_connected) else "DEGRADED"

    return {
        "status": "healthy" if db_connected else "unhealthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime": int(time.time() - START_TIME),
        "database": {
            "status": "connected" if db_connected else "disconnected",
            "connected": db_connected,
        },
        "system": {
            "runtime": f"Python {sys.version.split()[0]}",
            "platform": sys.platform,
        },
        "inferenceServicesSummary": {
            "overallInferenceStatus": overall_status,
            "c1Ready": c1_ready,
            "c2Ready": c2_ready,
            "c4Ready": c4_ready,
        },
        "activeComponents": {
            "c1_crop_recommendation": {
                "status": "ready" if c1_ready else "offline",
                "readiness": "READY" if c1_ready else "NOT_READY",
                "serviceConfigured": True,
                "description": "AI-Based Crop Recommendation and Harvest Planning",
            },
            "c2_disease_detection": {
                "status": "ready" if c2_ready else "offline",
                "readiness": "READY" if c2_ready else "NOT_READY",
                "serviceConfigured": True,
                "description": "AI-Based Plant Disease Detection and Severity Assessment",
            },
            "c4_transportation_risk": {
                "status": "ready" if c4_ready else "offline",
                "readiness": "READY" if c4_ready else "NOT_READY",
                "serviceConfigured": True,
                "description": "AI-Based Transportation Risk Prediction and Smart Packaging",
            },
        },
    }


@router.get("/health", status_code=status.HTTP_200_OK)
async def get_health():
    payload = get_health_payload()
    return api_success(
        data=payload,
        message="AgriGuard backend service is operating normally",
        status_code=status.HTTP_200_OK,
    )


@router.get("/health/live", status_code=status.HTTP_200_OK)
async def get_liveness():
    return api_success(
        data={"status": "live", "timestamp": datetime.now(timezone.utc).isoformat()},
        message="Liveness check passed",
    )


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def get_readiness():
    payload = get_health_payload()
    is_ready = payload["database"]["connected"]
    return api_success(
        data=payload,
        message="Readiness check passed" if is_ready else "Backend not ready",
        status_code=status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@router.get("/provenance", status_code=status.HTTP_200_OK)
async def get_provenance():
    return api_success(
        data=RESEARCH_PROVENANCE,
        message="Research provenance metadata",
        status_code=status.HTTP_200_OK,
    )


@router.get("/", status_code=status.HTTP_200_OK)
async def get_api_info():
    return api_success(
        message="Welcome to the AgriGuard REST API - Smart Agriculture Decision Support Platform",
        data={
            "platform": "AgriGuard",
            "researchGroup": "J26-IT-420",
            "university": "Sri Lanka Institute of Information Technology (SLIIT)",
            "version": "1.0.0",
            "phase": "Phase 9 - Unified Modular Monolith Backend",
            "supportedCrops": SUPPORTED_CROPS,
            "documentation": "/docs",
            "researchComponents": [
                {
                    "id": "C1",
                    "code": "c1_crop_recommendation",
                    "title": "AI-Based Crop Recommendation and Harvest Planning System",
                    "baseRoute": "/api/v1/crops",
                    "models": ["Random Forest Classifier", "Random Forest Regressor"],
                },
                {
                    "id": "C2",
                    "code": "c2_disease_detection",
                    "title": "AI-Based Plant Disease Detection and Severity Assessment System",
                    "baseRoute": "/api/v1/diseases",
                    "models": ["EfficientNet-B0", "ResNet50", "Grad-CAM"],
                },
                {
                    "id": "C4",
                    "code": "c4_transportation_risk",
                    "title": "AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System",
                    "baseRoute": "/api/v1/transportation",
                    "models": ["Tree Ensemble (Gradient Boosting / Random Forest)", "SHAP"],
                },
            ],
            "endpoints": {
                "health": "/api/v1/health",
                "provenance": "/api/v1/provenance",
                "crops": "/api/v1/crops",
                "diseases": "/api/v1/diseases",
                "transportation": "/api/v1/transportation",
                "auth": "/api/v1/auth",
                "users": "/api/v1/users",
                "farms": "/api/v1/farms",
                "farmOverview": "/api/v1/farms/:id/overview",
                "agriculturalRecords": "/api/v1/agricultural-records",
            },
        },
    )
