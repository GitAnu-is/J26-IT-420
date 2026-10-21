from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_optional_user
from app.modules.c1_crop_recommendation.schemas import PredictHarvestRequest, RecommendCropRequest
from app.modules.c1_crop_recommendation.service import c1_service
from app.shared.responses import api_success

router = APIRouter(prefix="/crops", tags=["Crop Recommendation & Harvest Planning"])


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def get_info():
    info = c1_service.get_component_info()
    return api_success(
        data=info,
        message="Component 1: AI-Based Crop Recommendation and Harvest Planning System",
        status_code=status.HTTP_200_OK,
    )


@router.post("/recommend", status_code=status.HTTP_200_OK)
async def recommend_crop(req: RecommendCropRequest, user: Optional[dict] = Depends(get_optional_user)):
    result = await c1_service.recommend_crop(req, user)
    return api_success(
        data=result,
        message="Crop recommendation generated successfully",
        status_code=status.HTTP_200_OK,
    )


@router.post("/predict-harvest", status_code=status.HTTP_200_OK)
async def predict_harvest(req: PredictHarvestRequest, user: Optional[dict] = Depends(get_optional_user)):
    result = await c1_service.predict_harvest(req, user)
    return api_success(
        data=result,
        message="Harvest duration prediction generated successfully",
        status_code=status.HTTP_200_OK,
    )


@router.get("/history", status_code=status.HTTP_200_OK)
async def get_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    user: Optional[dict] = Depends(get_optional_user),
):
    result = await c1_service.get_history(user, page, limit)
    return api_success(
        data=result,
        message="Crop prediction history retrieved",
        status_code=status.HTTP_200_OK,
    )
