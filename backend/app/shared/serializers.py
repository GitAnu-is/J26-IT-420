from datetime import datetime, date
from bson import ObjectId
from typing import Any, Dict, List, Union


def serialize_doc(doc: Any) -> Any:
    """
    Recursively serialize MongoDB BSON types (ObjectId, datetime) to JSON-friendly Python primitives.
    Maps `_id` to both `_id` string and `id` string (mimicking Mongoose virtuals).
    """
    if doc is None:
        return None

    if isinstance(doc, ObjectId):
        return str(doc)

    if isinstance(doc, (datetime, date)):
        return doc.isoformat()

    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]

    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            result[key] = serialize_doc(value)

        # Mongoose compatibility: ensure both id and _id exist
        if "_id" in result and "id" not in result:
            result["id"] = result["_id"]

        return result

    return doc


def to_safe_user(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Formats user document removing passwordHash and internal properties."""
    serialized = serialize_doc(user_doc)
    serialized.pop("passwordHash", None)
    serialized.pop("__v", None)
    return {
        "id": serialized.get("id"),
        "_id": serialized.get("_id"),
        "fullName": serialized.get("fullName", ""),
        "email": serialized.get("email", ""),
        "phoneNumber": serialized.get("phoneNumber", ""),
        "role": serialized.get("role", "FARMER"),
        "isActive": serialized.get("isActive", True),
        "lastLoginAt": serialized.get("lastLoginAt"),
        "createdAt": serialized.get("createdAt"),
        "updatedAt": serialized.get("updatedAt"),
    }
