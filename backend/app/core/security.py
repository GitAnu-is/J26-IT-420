import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import bcrypt
import jwt
from bson import ObjectId

from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.database.mongodb import mongo_manager
from app.shared.constants import ERROR_CODES


def hash_password(password: str) -> str:
    """Hash password using bcrypt with configured salt rounds."""
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_SALT_ROUNDS)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(user: Dict[str, Any]) -> str:
    """Generate short-lived JWT access token compatible with Express auth."""
    now = datetime.now(timezone.utc)
    user_id = str(user.get("_id") or user.get("id"))
    payload = {
        "sub": user_id,
        "email": user.get("email"),
        "role": user.get("role", "FARMER"),
        "type": "access",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_ACCESS_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT access token."""
    try:
        decoded = jwt.decode(
            token,
            settings.JWT_ACCESS_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
        if decoded.get("type") != "access":
            raise UnauthorizedError(
                message="Token is not an access token",
                code=ERROR_CODES.TOKEN_INVALID,
            )
        return decoded
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError(
            message="Access token has expired",
            code=ERROR_CODES.TOKEN_EXPIRED,
        )
    except jwt.InvalidTokenError:
        raise UnauthorizedError(
            message="Invalid access token",
            code=ERROR_CODES.TOKEN_INVALID,
        )


def hash_token_secret(secret: str) -> str:
    """Compute SHA-256 digest of refresh token secret."""
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


async def create_refresh_session(
    user: Dict[str, Any], family_id: Optional[str] = None
) -> Tuple[str, datetime]:
    """Create persistent refresh session with replay-safe family ID."""
    token_secret = secrets.token_hex(32)
    token_hash = hash_token_secret(token_secret)
    session_family_id = family_id or str(uuid.uuid4())

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    user_id = user["_id"] if isinstance(user.get("_id"), ObjectId) else ObjectId(str(user["_id"]))

    doc = {
        "userId": user_id,
        "tokenHash": token_hash,
        "familyId": session_family_id,
        "expiresAt": expires_at,
        "isRevoked": False,
        "revokedAt": None,
        "replacedByTokenHash": None,
        "createdAt": now,
        "updatedAt": now,
        "__v": 0,
    }

    result = await mongo_manager.refresh_sessions.insert_one(doc)
    session_id = str(result.inserted_id)
    raw_refresh_token = f"{session_id}.{token_secret}"
    return raw_refresh_token, expires_at


async def rotate_refresh_token(raw_refresh_token: str) -> Tuple[str, str, Dict[str, Any]]:
    """
    Validate and rotate refresh token with strict reuse detection.
    Returns: (new_access_token, new_refresh_token, user_doc)
    """
    if not raw_refresh_token or "." not in raw_refresh_token:
        raise UnauthorizedError("Malformed refresh token", code=ERROR_CODES.TOKEN_INVALID)

    parts = raw_refresh_token.split(".", 1)
    session_id_str, secret = parts[0], parts[1]

    if not ObjectId.is_valid(session_id_str):
        raise UnauthorizedError("Invalid session identifier", code=ERROR_CODES.TOKEN_INVALID)

    session_id = ObjectId(session_id_str)
    provided_hash = hash_token_secret(secret)

    session = await mongo_manager.refresh_sessions.find_one({"_id": session_id})
    if not session:
        raise UnauthorizedError("Session not found or expired", code=ERROR_CODES.TOKEN_INVALID)

    # Replay/Reuse Detection: If token is revoked or hash mismatch, revoke entire family!
    if session.get("isRevoked") or session.get("tokenHash") != provided_hash:
        await mongo_manager.refresh_sessions.update_many(
            {"familyId": session["familyId"]},
            {"$set": {"isRevoked": True, "revokedAt": datetime.now(timezone.utc)}},
        )
        raise UnauthorizedError(
            "Refresh token replay detected. All sessions in this family have been terminated.",
            code=ERROR_CODES.TOKEN_INVALID,
        )

    # Check expiration
    now = datetime.now(timezone.utc)
    session_expires = session["expiresAt"]
    if session_expires.tzinfo is None:
        session_expires = session_expires.replace(tzinfo=timezone.utc)

    if session_expires < now:
        await mongo_manager.refresh_sessions.update_one(
            {"_id": session_id},
            {"$set": {"isRevoked": True, "revokedAt": now}},
        )
        raise UnauthorizedError("Refresh token has expired", code=ERROR_CODES.TOKEN_EXPIRED)

    # Query associated user
    user = await mongo_manager.users.find_one({"_id": session["userId"]})
    if not user or not user.get("isActive", True):
        raise UnauthorizedError("Associated user account is deactivated", code=ERROR_CODES.ACCOUNT_INACTIVE)

    # Invalidate current session and create successor
    new_token_secret = secrets.token_hex(32)
    new_token_hash = hash_token_secret(new_token_secret)
    new_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    await mongo_manager.refresh_sessions.update_one(
        {"_id": session_id},
        {
            "$set": {
                "isRevoked": True,
                "revokedAt": now,
                "replacedByTokenHash": new_token_hash,
                "updatedAt": now,
            }
        },
    )

    new_session_doc = {
        "userId": user["_id"],
        "tokenHash": new_token_hash,
        "familyId": session["familyId"],
        "expiresAt": new_expires,
        "isRevoked": False,
        "revokedAt": None,
        "replacedByTokenHash": None,
        "createdAt": now,
        "updatedAt": now,
        "__v": 0,
    }
    new_session_res = await mongo_manager.refresh_sessions.insert_one(new_session_doc)
    new_session_id = str(new_session_res.inserted_id)

    new_refresh_token = f"{new_session_id}.{new_token_secret}"
    new_access_token = create_access_token(user)

    return new_access_token, new_refresh_token, user


async def revoke_refresh_token(raw_refresh_token: str) -> bool:
    """Revoke a single refresh session."""
    if not raw_refresh_token or "." not in raw_refresh_token:
        return False
    parts = raw_refresh_token.split(".", 1)
    session_id_str = parts[0]
    if not ObjectId.is_valid(session_id_str):
        return False
    session_id = ObjectId(session_id_str)
    result = await mongo_manager.refresh_sessions.update_one(
        {"_id": session_id},
        {"$set": {"isRevoked": True, "revokedAt": datetime.now(timezone.utc)}},
    )
    return result.modified_count > 0


async def revoke_all_user_sessions(user_id: ObjectId) -> int:
    """Revoke all active sessions for a user."""
    result = await mongo_manager.refresh_sessions.update_many(
        {"userId": user_id, "isRevoked": False},
        {"$set": {"isRevoked": True, "revokedAt": datetime.now(timezone.utc)}},
    )
    return result.modified_count
