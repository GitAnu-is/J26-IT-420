import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.database.mongodb import mongo_manager
from app.modules.records.schemas import CreateRecordRequest, UpdateRecordRequest
from app.shared.constants import ROLES
from app.shared.serializers import serialize_doc


def parse_date_str(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        # Handles 'YYYY-MM-DD' or ISO format
        if "T" in date_str:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


class AgriculturalRecordService:
    async def create_record(self, user: Dict[str, Any], req: CreateRecordRequest) -> Dict[str, Any]:
        if not ObjectId.is_valid(req.farmId):
            raise NotFoundError(f"Referenced Farm with ID '{req.farmId}' not found")

        farm_id = ObjectId(req.farmId)
        farm = await mongo_manager.farms.find_one({"_id": farm_id, "isArchived": False})
        if not farm:
            raise NotFoundError(f"Referenced Farm with ID '{req.farmId}' not found")

        # Ownership enforcement: only farm owner or ADMIN can create records for this farm
        if user.get("role") != ROLES.ADMIN and str(farm["ownerId"]) != str(user["_id"]):
            raise ForbiddenError("You can only create agricultural records for farms you own")

        now = datetime.now(timezone.utc)
        planting_dt = parse_date_str(req.plantingDate) or now
        expected_harvest_dt = parse_date_str(req.expectedHarvestDate)
        actual_harvest_dt = parse_date_str(req.actualHarvestDate)

        record_doc = {
            "ownerId": user["_id"],
            "farmId": farm_id,
            "cropType": req.cropType.upper().strip(),
            "plantingDate": planting_dt,
            "expectedHarvestDate": expected_harvest_dt,
            "actualHarvestDate": actual_harvest_dt,
            "soilPh": float(req.soilPh if req.soilPh is not None else 6.5),
            "nitrogen": int(req.nitrogen if req.nitrogen is not None else 100),
            "phosphorus": int(req.phosphorus if req.phosphorus is not None else 50),
            "potassium": int(req.potassium if req.potassium is not None else 150),
            "soilMoisture": float(req.soilMoisture if req.soilMoisture is not None else 30.0),
            "locationContext": req.locationContext or "",
            "notes": req.notes or "",
            "isArchived": False,
            "archivedAt": None,
            "createdAt": now,
            "updatedAt": now,
            "__v": 0,
        }

        result = await mongo_manager.agricultural_records.insert_one(record_doc)
        record_doc["_id"] = result.inserted_id

        # Attach farm details for populate compatibility
        record_doc["farmId"] = {
            "id": str(farm["_id"]),
            "_id": str(farm["_id"]),
            "farmName": farm.get("farmName"),
            "district": farm.get("district"),
            "supportedCrops": farm.get("supportedCrops", []),
        }

        return serialize_doc(record_doc)

    async def list_records(
        self,
        user: Dict[str, Any],
        page: int = 1,
        limit: int = 10,
        farm_id: Optional[str] = None,
        crop_type: Optional[str] = None,
        owner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        page = max(1, page)
        limit = min(100, max(1, limit))
        skip = (page - 1) * limit

        query: Dict[str, Any] = {"isArchived": False}

        # Ownership check
        if user.get("role") != ROLES.ADMIN:
            query["ownerId"] = user["_id"]
        elif owner_id and ObjectId.is_valid(owner_id):
            query["ownerId"] = ObjectId(owner_id)

        if farm_id and ObjectId.is_valid(farm_id):
            query["farmId"] = ObjectId(farm_id)

        if crop_type:
            query["cropType"] = crop_type.upper().strip()

        cursor = (
            mongo_manager.agricultural_records.find(query)
            .sort([("plantingDate", -1), ("createdAt", -1)])
            .skip(skip)
            .limit(limit)
        )
        records = await cursor.to_list(length=limit)
        total_count = await mongo_manager.agricultural_records.count_documents(query)

        total_pages = math.ceil(total_count / limit) or 1

        # Populate farm details
        populated_records = []
        for r in records:
            farm_obj = await mongo_manager.farms.find_one({"_id": r["farmId"]})
            serialized_r = serialize_doc(r)
            if farm_obj:
                serialized_r["farmId"] = {
                    "id": str(farm_obj["_id"]),
                    "_id": str(farm_obj["_id"]),
                    "farmName": farm_obj.get("farmName"),
                    "district": farm_obj.get("district"),
                    "supportedCrops": farm_obj.get("supportedCrops", []),
                }
            populated_records.append(serialized_r)

        return {
            "records": populated_records,
            "pagination": {
                "page": page,
                "limit": limit,
                "totalRecords": total_count,
                "totalPages": total_pages,
                "hasNextPage": page < total_pages,
                "hasPrevPage": page > 1,
            },
        }

    async def get_record_by_id(self, user: Dict[str, Any], record_id_str: str) -> Dict[str, Any]:
        if not ObjectId.is_valid(record_id_str):
            raise NotFoundError(f"Agricultural record with ID '{record_id_str}' not found")

        record_id = ObjectId(record_id_str)
        record = await mongo_manager.agricultural_records.find_one({"_id": record_id, "isArchived": False})
        if not record:
            raise NotFoundError(f"Agricultural record with ID '{record_id_str}' not found")

        if user.get("role") != ROLES.ADMIN and str(record["ownerId"]) != str(user["_id"]):
            raise ForbiddenError("You do not have permission to view this agricultural record")

        farm_obj = await mongo_manager.farms.find_one({"_id": record["farmId"]})
        serialized_r = serialize_doc(record)
        if farm_obj:
            serialized_r["farmId"] = {
                "id": str(farm_obj["_id"]),
                "_id": str(farm_obj["_id"]),
                "farmName": farm_obj.get("farmName"),
                "district": farm_obj.get("district"),
                "supportedCrops": farm_obj.get("supportedCrops", []),
            }

        return serialized_r

    async def update_record(
        self, user: Dict[str, Any], record_id_str: str, req: UpdateRecordRequest
    ) -> Dict[str, Any]:
        if not ObjectId.is_valid(record_id_str):
            raise NotFoundError(f"Agricultural record with ID '{record_id_str}' not found")

        record_id = ObjectId(record_id_str)
        record = await mongo_manager.agricultural_records.find_one({"_id": record_id, "isArchived": False})
        if not record:
            raise NotFoundError(f"Agricultural record with ID '{record_id_str}' not found")

        if user.get("role") != ROLES.ADMIN and str(record["ownerId"]) != str(user["_id"]):
            raise ForbiddenError("You do not have permission to update this agricultural record")

        update_fields: Dict[str, Any] = {"updatedAt": datetime.now(timezone.utc)}

        if req.cropType is not None:
            update_fields["cropType"] = req.cropType.upper().strip()
        if req.plantingDate is not None:
            update_fields["plantingDate"] = parse_date_str(req.plantingDate)
        if req.expectedHarvestDate is not None:
            update_fields["expectedHarvestDate"] = parse_date_str(req.expectedHarvestDate)
        if req.actualHarvestDate is not None:
            update_fields["actualHarvestDate"] = parse_date_str(req.actualHarvestDate)
        if req.soilPh is not None:
            update_fields["soilPh"] = float(req.soilPh)
        if req.nitrogen is not None:
            update_fields["nitrogen"] = int(req.nitrogen)
        if req.phosphorus is not None:
            update_fields["phosphorus"] = int(req.phosphorus)
        if req.potassium is not None:
            update_fields["potassium"] = int(req.potassium)
        if req.soilMoisture is not None:
            update_fields["soilMoisture"] = float(req.soilMoisture)
        if req.locationContext is not None:
            update_fields["locationContext"] = req.locationContext
        if req.notes is not None:
            update_fields["notes"] = req.notes

        await mongo_manager.agricultural_records.update_one({"_id": record_id}, {"$set": update_fields})
        return await self.get_record_by_id(user, record_id_str)

    async def delete_record(self, user: Dict[str, Any], record_id_str: str) -> bool:
        if not ObjectId.is_valid(record_id_str):
            raise NotFoundError(f"Agricultural record with ID '{record_id_str}' not found")

        record_id = ObjectId(record_id_str)
        record = await mongo_manager.agricultural_records.find_one({"_id": record_id, "isArchived": False})
        if not record:
            raise NotFoundError(f"Agricultural record with ID '{record_id_str}' not found")

        if user.get("role") != ROLES.ADMIN and str(record["ownerId"]) != str(user["_id"]):
            raise ForbiddenError("You do not have permission to delete this agricultural record")

        now = datetime.now(timezone.utc)
        await mongo_manager.agricultural_records.update_one(
            {"_id": record_id},
            {"$set": {"isArchived": True, "archivedAt": now, "updatedAt": now}},
        )
        return True


record_service = AgriculturalRecordService()
