from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user
from app.modules.records.schemas import CreateRecordRequest, UpdateRecordRequest
from app.modules.records.service import record_service
from app.shared.constants import ROLES
from app.shared.responses import api_success

router = APIRouter(prefix="/agricultural-records", tags=["Agricultural Records"])


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_record(req: CreateRecordRequest, user: dict = Depends(get_current_user)):
    if user.get("role") not in [ROLES.FARMER, ROLES.ADMIN]:
        from app.core.exceptions import ForbiddenError
        raise ForbiddenError("Only farmers or administrators can create agricultural field records")

    record = await record_service.create_record(user, req)
    return api_success(
        data={"record": record},
        message="Agricultural record created successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_records(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    farmId: Optional[str] = Query(default=None),
    cropType: Optional[str] = Query(default=None),
    ownerId: Optional[str] = Query(default=None),
    user: dict = Depends(get_current_user),
):
    result = await record_service.list_records(
        user=user,
        page=page,
        limit=limit,
        farm_id=farmId,
        crop_type=cropType,
        owner_id=ownerId,
    )
    return api_success(
        data=result,
        message="Agricultural records retrieved successfully",
        status_code=status.HTTP_200_OK,
    )


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def get_record_by_id(id: str, user: dict = Depends(get_current_user)):
    record = await record_service.get_record_by_id(user, id)
    return api_success(
        data={"record": record},
        message="Agricultural record retrieved successfully",
        status_code=status.HTTP_200_OK,
    )


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def update_record(id: str, req: UpdateRecordRequest, user: dict = Depends(get_current_user)):
    updated = await record_service.update_record(user, id, req)
    return api_success(
        data={"record": updated},
        message="Agricultural record updated successfully",
        status_code=status.HTTP_200_OK,
    )


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_record(id: str, user: dict = Depends(get_current_user)):
    await record_service.delete_record(user, id)
    return api_success(
        data={"success": True},
        message="Agricultural record deleted successfully",
        status_code=status.HTTP_200_OK,
    )
