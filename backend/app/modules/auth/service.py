from datetime import datetime, timezone
from typing import Any, Dict, Tuple
from bson import ObjectId

from app.core.exceptions import ConflictError, UnauthorizedError, ValidationError
from app.core.security import (
    create_access_token,
    create_refresh_session,
    hash_password,
    revoke_all_user_sessions,
    revoke_refresh_token,
    rotate_refresh_token,
    verify_password,
)
from app.database.mongodb import mongo_manager
from app.modules.auth.schemas import ChangePasswordRequest, LoginRequest, RegisterRequest
from app.shared.constants import ALL_ROLES, ERROR_CODES
from app.shared.serializers import to_safe_user


class AuthService:
    async def register(self, req: RegisterRequest) -> Dict[str, Any]:
        normalized_email = req.email.lower().strip()
        role = req.role.upper().strip()

        if role not in ALL_ROLES:
            raise ValidationError(
                message=f"Invalid user role '{req.role}'. Allowed roles: {', '.join(ALL_ROLES)}",
                code=ERROR_CODES.VALIDATION_ERROR,
            )

        existing = await mongo_manager.users.find_one({"email": normalized_email})
        if existing:
            raise ConflictError(
                message="An account with this email address already exists",
                code=ERROR_CODES.DUPLICATE_EMAIL,
            )

        password_hash = hash_password(req.password)
        now = datetime.now(timezone.utc)

        user_doc = {
            "fullName": req.fullName.strip(),
            "email": normalized_email,
            "passwordHash": password_hash,
            "phoneNumber": req.phoneNumber.strip() if req.phoneNumber else "",
            "role": role,
            "isActive": True,
            "lastLoginAt": now,
            "passwordChangedAt": None,
            "createdAt": now,
            "updatedAt": now,
            "__v": 0,
        }

        result = await mongo_manager.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id

        access_token = create_access_token(user_doc)
        refresh_token, _ = await create_refresh_session(user_doc)

        return {
            "user": to_safe_user(user_doc),
            "tokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "tokenType": "Bearer",
                "expiresIn": 900,
            },
            # Flat compatibility tokens for frontend client
            "accessToken": access_token,
            "refreshToken": refresh_token,
        }

    async def login(self, req: LoginRequest) -> Dict[str, Any]:
        normalized_email = req.email.lower().strip()

        user = await mongo_manager.users.find_one({"email": normalized_email})
        if not user:
            raise UnauthorizedError("Invalid email or password", code=ERROR_CODES.INVALID_CREDENTIALS)

        stored_hash = user.get("passwordHash", "")
        if not verify_password(req.password, stored_hash):
            raise UnauthorizedError("Invalid email or password", code=ERROR_CODES.INVALID_CREDENTIALS)

        if not user.get("isActive", True):
            raise UnauthorizedError(
                "Your account has been deactivated. Please contact support.",
                code=ERROR_CODES.ACCOUNT_INACTIVE,
            )

        now = datetime.now(timezone.utc)
        await mongo_manager.users.update_one({"_id": user["_id"]}, {"$set": {"lastLoginAt": now}})
        user["lastLoginAt"] = now

        access_token = create_access_token(user)
        refresh_token, _ = await create_refresh_session(user)

        return {
            "user": to_safe_user(user),
            "tokens": {
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "tokenType": "Bearer",
                "expiresIn": 900,
            },
            # Flat compatibility tokens for frontend client
            "accessToken": access_token,
            "refreshToken": refresh_token,
        }

    async def refresh(self, raw_refresh_token: str) -> Dict[str, Any]:
        access_token, new_refresh_token, user = await rotate_refresh_token(raw_refresh_token)
        return {
            "user": to_safe_user(user),
            "tokens": {
                "accessToken": access_token,
                "refreshToken": new_refresh_token,
                "tokenType": "Bearer",
                "expiresIn": 900,
            },
            "accessToken": access_token,
            "refreshToken": new_refresh_token,
        }

    async def logout(self, raw_refresh_token: str) -> bool:
        return await revoke_refresh_token(raw_refresh_token)

    async def logout_all(self, user_id: ObjectId) -> int:
        return await revoke_all_user_sessions(user_id)

    async def change_password(self, user_id: ObjectId, req: ChangePasswordRequest) -> bool:
        user = await mongo_manager.users.find_one({"_id": user_id})
        if not user:
            raise UnauthorizedError("User account not found")

        stored_hash = user.get("passwordHash", "")
        if not verify_password(req.currentPassword, stored_hash):
            raise UnauthorizedError("Current password is incorrect", code=ERROR_CODES.INVALID_CREDENTIALS)

        new_hash = hash_password(req.newPassword)
        now = datetime.now(timezone.utc)

        await mongo_manager.users.update_one(
            {"_id": user_id},
            {"$set": {"passwordHash": new_hash, "passwordChangedAt": now, "updatedAt": now}},
        )

        # Invalidate all existing sessions on password change
        await revoke_all_user_sessions(user_id)
        return True


auth_service = AuthService()
