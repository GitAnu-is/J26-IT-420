from fastapi import APIRouter, Depends, status
from app.core.dependencies import get_current_user
from app.modules.auth.schemas import ChangePasswordRequest, LoginRequest, RefreshRequest, RegisterRequest
from app.modules.auth.service import auth_service
from app.shared.responses import api_success
from app.shared.serializers import to_safe_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    result = await auth_service.register(req)
    return api_success(
        data=result,
        message="User account registered successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(req: LoginRequest):
    result = await auth_service.login(req)
    return api_success(
        data=result,
        message="Authentication successful",
        status_code=status.HTTP_200_OK,
    )


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token(req: RefreshRequest):
    result = await auth_service.refresh(req.refreshToken)
    return api_success(
        data=result,
        message="Token rotated successfully",
        status_code=status.HTTP_200_OK,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(req: RefreshRequest):
    await auth_service.logout(req.refreshToken)
    return api_success(
        data={},
        message="Refresh session successfully terminated",
        status_code=status.HTTP_200_OK,
    )


@router.post("/logout-all", status_code=status.HTTP_200_OK)
async def logout_all(user: dict = Depends(get_current_user)):
    count = await auth_service.logout_all(user["_id"])
    return api_success(
        data={"revokedCount": count},
        message=f"All active sessions revoked successfully ({count} session(s) terminated)",
        status_code=status.HTTP_200_OK,
    )


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(user: dict = Depends(get_current_user)):
    return api_success(
        data={"user": to_safe_user(user)},
        message="Authenticated profile retrieved successfully",
        status_code=status.HTTP_200_OK,
    )


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    await auth_service.change_password(user["_id"], req)
    return api_success(
        data={},
        message="Password changed successfully. All active sessions have been revoked.",
        status_code=status.HTTP_200_OK,
    )
