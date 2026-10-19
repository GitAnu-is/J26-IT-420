from typing import Any, Callable, Dict, List, Optional
from bson import ObjectId
from fastapi import Header, HTTPException, status
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.database.mongodb import mongo_manager
from app.shared.constants import ERROR_CODES


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> Dict[str, Any]:
    """FastAPI dependency to extract and verify the current authenticated user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError(
            message="Authorization token is required",
            code=ERROR_CODES.UNAUTHORIZED,
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)

    sub = payload.get("sub")
    if not sub or not ObjectId.is_valid(sub):
        raise UnauthorizedError("Invalid user identity in token", code=ERROR_CODES.TOKEN_INVALID)

    user = await mongo_manager.users.find_one({"_id": ObjectId(sub)})
    if not user:
        raise UnauthorizedError("User account not found", code=ERROR_CODES.UNAUTHORIZED)

    if not user.get("isActive", True):
        raise UnauthorizedError(
            "Account has been deactivated. Please contact support.",
            code=ERROR_CODES.ACCOUNT_INACTIVE,
        )

    return user


async def get_optional_user(
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> Optional[Dict[str, Any]]:
    """Optional authentication dependency; returns user if valid Bearer token exists, else None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if not sub or not ObjectId.is_valid(sub):
            return None
        user = await mongo_manager.users.find_one({"_id": ObjectId(sub)})
        if user and user.get("isActive", True):
            return user
        return None
    except Exception:
        return None


def require_roles(*allowed_roles: str) -> Callable:
    """Dependency factory to enforce role-based access control."""
    async def role_checker(user: Dict[str, Any] = None) -> Dict[str, Any]:
        # If user is not already resolved, it will be injected by caller
        if user is None:
            raise UnauthorizedError("Authentication required")
        user_role = user.get("role")
        if user_role not in allowed_roles:
            raise ForbiddenError(
                f"Your role ({user_role}) does not have permission to access this resource"
            )
        return user

    return role_checker
