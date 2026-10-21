from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_optional_user
from app.modules.c4_transportation_risk.schemas import (
    PredictTransportationRiskRequest,
    RecommendPackagingRequest,
)
from app.modules.c4_transportation_risk.service import c4_service
from app.shared.responses import api_success

router = APIRouter(prefix="/transportation", tags=["Transportation Risk & Smart Packaging"])


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def get_info():
    info = c4_service.get_component_info()
    return api_success(
        data=info,
        message="Component 4: AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System",
        status_code=status.HTTP_200_OK,
    )


@router.post("/predict-risk", status_code=status.HTTP_200_OK)
async def predict_risk(
    req: PredictTransportationRiskRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    result = await c4_service.predict_risk(req, user)
    return api_success(
        data=result,
        message="Transportation risk prediction completed successfully",
        status_code=status.HTTP_200_OK,
    )


@router.post("/recommend-packaging", status_code=status.HTTP_200_OK)
async def recommend_packaging(req: RecommendPackagingRequest):
    result = await c4_service.recommend_packaging(req)
    return api_success(
        data=result,
        message="Smart packaging recommendations generated successfully",
        status_code=status.HTTP_200_OK,
    )


@router.get("/history", status_code=status.HTTP_200_OK)
async def get_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    user: Optional[dict] = Depends(get_optional_user),
):
    result = await c4_service.get_history(user, page, limit)
    return api_success(
        data=result,
        message="Transportation assessment history retrieved",
        status_code=status.HTTP_200_OK,
    )


@router.get("/assessments/{id}", status_code=status.HTTP_200_OK)
async def get_assessment_by_id(id: str):
    assessment = await c4_service.get_assessment_by_id(id)
    return api_success(
        data={"assessment": assessment},
        message="Transportation assessment retrieved",
        status_code=status.HTTP_200_OK,
    )
