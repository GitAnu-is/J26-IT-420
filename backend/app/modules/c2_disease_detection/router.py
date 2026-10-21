from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import FileResponse

from app.core.dependencies import get_optional_user
from app.core.exceptions import ValidationError
from app.modules.c2_disease_detection.service import c2_service
from app.shared.responses import api_success

router = APIRouter(prefix="/diseases", tags=["Plant Disease Detection & Grad-CAM"])


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def get_info():
    info = c2_service.get_component_info()
    return api_success(
        data=info,
        message="Component 2: AI-Based Plant Disease Detection and Severity Assessment System",
        status_code=status.HTTP_200_OK,
    )


@router.post("/analyze", status_code=status.HTTP_200_OK)
@router.post("/detect", status_code=status.HTTP_200_OK)
async def analyze_disease(
    image: UploadFile = File(...),
    cropType: Optional[str] = Form(None),
    farmId: Optional[str] = Form(None),
    user: Optional[dict] = Depends(get_optional_user),
):
    if not image:
        raise ValidationError("Plant leaf image file is required.")

    image_bytes = await image.read()
    result = await c2_service.analyze_disease(
        image_bytes=image_bytes,
        crop_type=cropType,
        farm_id_str=farmId,
        user=user,
    )
    return api_success(
        data=result,
        message="Disease analysis completed successfully",
        status_code=status.HTTP_200_OK,
    )


@router.get("/history", status_code=status.HTTP_200_OK)
async def get_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    user: Optional[dict] = Depends(get_optional_user),
):
    result = await c2_service.get_history(user, page, limit)
    return api_success(
        data=result,
        message="Disease assessment history retrieved",
        status_code=status.HTTP_200_OK,
    )


@router.get("/assessments/{id}", status_code=status.HTTP_200_OK)
async def get_assessment_by_id(id: str, user: Optional[dict] = Depends(get_optional_user)):
    user_id = user["_id"] if user else None
    assessment = await c2_service.get_assessment_by_id(user_id, id)
    return api_success(
        data={"assessment": assessment},
        message="Disease assessment retrieved",
        status_code=status.HTTP_200_OK,
    )


@router.get("/assessments/{id}/gradcam")
async def get_assessment_gradcam(id: str, user: Optional[dict] = Depends(get_optional_user)):
    user_id = user["_id"] if user else None
    assessment = await c2_service.get_assessment_by_id(user_id, id)
    artifact_ref = assessment.get("gradCamArtifactReference")
    if not artifact_ref:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("No Grad-CAM explanation artifact associated with this assessment")
    path = c2_service.get_gradcam_path(artifact_ref)
    return FileResponse(path, media_type="image/png")


@router.get("/assessments/{id}/image")
async def get_assessment_image(id: str, user: Optional[dict] = Depends(get_optional_user)):
    user_id = user["_id"] if user else None
    assessment = await c2_service.get_assessment_by_id(user_id, id)
    img_ref = assessment.get("imageReference")
    if not img_ref:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("No image artifact reference associated with this assessment")
    path = c2_service.get_original_path(img_ref)
    media_type = "image/png" if img_ref.endswith(".png") else "image/jpeg"
    return FileResponse(path, media_type=media_type)


@router.get("/gradcam/{filename}")
async def get_gradcam_by_filename(filename: str):
    path = c2_service.get_gradcam_path(filename)
    return FileResponse(path, media_type="image/png")
