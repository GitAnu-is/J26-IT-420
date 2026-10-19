from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.database.mongodb import mongo_manager
from app.shared.responses import api_success
from app.shared.serializers import to_safe_user

router = APIRouter(prefix="/users", tags=["Users"])


class UpdateProfileRequest(BaseModel):
    fullName: Optional[str] = Field(None, min_length=2, max_length=100)
    phoneNumber: Optional[str] = Field(None, max_length=25)


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_user_me(user: dict = Depends(get_current_user)):
    return api_success(
        data={"user": to_safe_user(user)},
        message="User profile retrieved successfully",
        status_code=status.HTTP_200_OK,
    )


@router.patch("/me", status_code=status.HTTP_200_OK)
async def update_user_me(req: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    update_fields = {}
    if req.fullName is not None:
        update_fields["fullName"] = req.fullName.strip()
    if req.phoneNumber is not None:
        update_fields["phoneNumber"] = req.phoneNumber.strip()

    if update_fields:
        update_fields["updatedAt"] = datetime.now(timezone.utc)
        await mongo_manager.users.update_one({"_id": user["_id"]}, {"$set": update_fields})
        user = await mongo_manager.users.find_one({"_id": user["_id"]})

    return api_success(
        data={"user": to_safe_user(user)},
        message="Profile updated successfully",
        status_code=status.HTTP_200_OK,
    )
