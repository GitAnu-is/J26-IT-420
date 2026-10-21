from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user, require_roles
from app.modules.farms.schemas import CreateFarmRequest, UpdateFarmRequest
from app.modules.farms.service import farm_service
from app.shared.constants import ROLES
from app.shared.responses import api_success

router = APIRouter(prefix="/farms", tags=["Farms"])


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_farm(
    req: CreateFarmRequest,
    user: dict = Depends(get_current_user),
):
    # Only FARMER or ADMIN can create farms
    if user.get("role") not in [ROLES.FARMER, ROLES.ADMIN]:
        from app.core.exceptions import ForbiddenError
        raise ForbiddenError("Only farmers or administrators can register new farms")

    farm = await farm_service.create_farm(user["_id"], req)
    return api_success(
        data={"farm": farm},
        message="Farm created successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_farms(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    district: Optional[str] = Query(default=None),
    ownerId: Optional[str] = Query(default=None),
    user: dict = Depends(get_current_user),
):
    result = await farm_service.list_farms(
        user=user,
        page=page,
        limit=limit,
        district=district,
        owner_id=ownerId,
    )
    return api_success(
        data=result,
        message="Farms retrieved successfully",
        status_code=status.HTTP_200_OK,
    )


@router.get("/overview", status_code=status.HTTP_200_OK)
@router.get("/{id}/overview", status_code=status.HTTP_200_OK)
async def get_farm_overview(id: Optional[str] = None, user: dict = Depends(get_current_user)):
    overview = await farm_service.get_farm_overview(user, id)
    return api_success(
        data=overview,
        message="Farm overview retrieved successfully",
        status_code=status.HTTP_200_OK,
    )



@router.get("/{id}", status_code=status.HTTP_200_OK)
async def get_farm_by_id(id: str, user: dict = Depends(get_current_user)):
    farm = await farm_service.get_farm_by_id(user, id)
    return api_success(
        data={"farm": farm},
        message="Farm retrieved successfully",
        status_code=status.HTTP_200_OK,
    )


@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def update_farm(id: str, req: UpdateFarmRequest, user: dict = Depends(get_current_user)):
    updated = await farm_service.update_farm(user, id, req)
    return api_success(
        data={"farm": updated},
        message="Farm updated successfully",
        status_code=status.HTTP_200_OK,
    )


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_farm(id: str, user: dict = Depends(get_current_user)):
    await farm_service.delete_farm(user, id)
    return api_success(
        data={"success": True},
        message="Farm deleted successfully",
        status_code=status.HTTP_200_OK,
    )
