import math
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.database.mongodb import mongo_manager
from app.modules.farms.schemas import CreateFarmRequest, UpdateFarmRequest
from app.shared.constants import ROLES
from app.shared.serializers import serialize_doc


class FarmService:
    async def create_farm(self, owner_id: ObjectId, req: CreateFarmRequest) -> Dict[str, Any]:
        lat = req.latitude if req.latitude is not None else (req.location.latitude if req.location else None)
        lon = req.longitude if req.longitude is not None else (req.location.longitude if req.location else None)
        addr = req.address if req.address else (req.location.address if req.location else "")

        now = datetime.now(timezone.utc)
        farm_doc = {
            "ownerId": owner_id,
            "farmName": req.farmName.strip(),
            "district": req.district.strip(),
            "agroEcologicalZone": req.agroEcologicalZone.strip() if req.agroEcologicalZone else "",
            "locationCoordinates": {
                "latitude": lat,
                "longitude": lon,
            },
            "location": {
                "latitude": lat,
                "longitude": lon,
                "address": addr,
            },
            "soilType": req.soilType,
            "area": float(req.area or 0.0),
            "areaUnit": req.areaUnit,
            "supportedCrops": req.supportedCrops,
            "isArchived": False,
            "archivedAt": None,
            "createdAt": now,
            "updatedAt": now,
            "__v": 0,
        }

        result = await mongo_manager.farms.insert_one(farm_doc)
        farm_doc["_id"] = result.inserted_id
        return serialize_doc(farm_doc)

    async def list_farms(
        self,
        user: Dict[str, Any],
        page: int = 1,
        limit: int = 10,
        district: Optional[str] = None,
        owner_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        page = max(1, page)
        limit = min(100, max(1, limit))
        skip = (page - 1) * limit

        query: Dict[str, Any] = {"isArchived": False}

        # Strict ownership enforcement: Non-admins can only see their own farms
        if user.get("role") != ROLES.ADMIN:
            query["ownerId"] = user["_id"]
        elif owner_id and ObjectId.is_valid(owner_id):
            query["ownerId"] = ObjectId(owner_id)

        if district:
            query["district"] = {"$regex": re.escape(district), "$options": "i"}

        cursor = mongo_manager.farms.find(query).sort("createdAt", -1).skip(skip).limit(limit)
        farms = await cursor.to_list(length=limit)
        total_count = await mongo_manager.farms.count_documents(query)

        total_pages = math.ceil(total_count / limit) or 1

        serialized_farms = [serialize_doc(f) for f in farms]

        return {
            "farms": serialized_farms,
            "pagination": {
                "page": page,
                "limit": limit,
                "totalRecords": total_count,
                "totalPages": total_pages,
                "hasNextPage": page < total_pages,
                "hasPrevPage": page > 1,
            },
        }

    async def get_farm_by_id(self, user: Dict[str, Any], farm_id_str: str) -> Dict[str, Any]:
        if not ObjectId.is_valid(farm_id_str):
            raise NotFoundError(f"Farm with ID '{farm_id_str}' not found")

        farm_id = ObjectId(farm_id_str)
        farm = await mongo_manager.farms.find_one({"_id": farm_id, "isArchived": False})
        if not farm:
            raise NotFoundError(f"Farm with ID '{farm_id_str}' not found")

        # Ownership check
        if user.get("role") != ROLES.ADMIN and str(farm["ownerId"]) != str(user["_id"]):
            raise ForbiddenError("You do not have permission to view this farm record")

        return serialize_doc(farm)

    async def update_farm(
        self, user: Dict[str, Any], farm_id_str: str, req: UpdateFarmRequest
    ) -> Dict[str, Any]:
        if not ObjectId.is_valid(farm_id_str):
            raise NotFoundError(f"Farm with ID '{farm_id_str}' not found")

        farm_id = ObjectId(farm_id_str)
        farm = await mongo_manager.farms.find_one({"_id": farm_id, "isArchived": False})
        if not farm:
            raise NotFoundError(f"Farm with ID '{farm_id_str}' not found")

        if user.get("role") != ROLES.ADMIN and str(farm["ownerId"]) != str(user["_id"]):
            raise ForbiddenError("You do not have permission to update this farm record")

        update_fields: Dict[str, Any] = {"updatedAt": datetime.now(timezone.utc)}

        if req.farmName is not None:
            update_fields["farmName"] = req.farmName.strip()
        if req.district is not None:
            update_fields["district"] = req.district.strip()
        if req.agroEcologicalZone is not None:
            update_fields["agroEcologicalZone"] = req.agroEcologicalZone.strip()
        if req.soilType is not None:
            update_fields["soilType"] = req.soilType
        if req.area is not None:
            update_fields["area"] = float(req.area)
        if req.areaUnit is not None:
            update_fields["areaUnit"] = req.areaUnit
        if req.supportedCrops is not None:
            update_fields["supportedCrops"] = req.supportedCrops

        lat = req.latitude if req.latitude is not None else (req.location.latitude if req.location else None)
        lon = req.longitude if req.longitude is not None else (req.location.longitude if req.location else None)
        addr = req.address if req.address else (req.location.address if req.location else None)

        if lat is not None or lon is not None:
            update_fields["locationCoordinates"] = {
                "latitude": lat if lat is not None else farm.get("locationCoordinates", {}).get("latitude"),
                "longitude": lon if lon is not None else farm.get("locationCoordinates", {}).get("longitude"),
            }
            update_fields["location"] = {
                "latitude": lat if lat is not None else farm.get("location", {}).get("latitude"),
                "longitude": lon if lon is not None else farm.get("location", {}).get("longitude"),
                "address": addr if addr is not None else farm.get("location", {}).get("address", ""),
            }

        await mongo_manager.farms.update_one({"_id": farm_id}, {"$set": update_fields})
        updated = await mongo_manager.farms.find_one({"_id": farm_id})
        return serialize_doc(updated)

    async def delete_farm(self, user: Dict[str, Any], farm_id_str: str) -> bool:
        if not ObjectId.is_valid(farm_id_str):
            raise NotFoundError(f"Farm with ID '{farm_id_str}' not found")

        farm_id = ObjectId(farm_id_str)
        farm = await mongo_manager.farms.find_one({"_id": farm_id, "isArchived": False})
        if not farm:
            raise NotFoundError(f"Farm with ID '{farm_id_str}' not found")

        if user.get("role") != ROLES.ADMIN and str(farm["ownerId"]) != str(user["_id"]):
            raise ForbiddenError("You do not have permission to delete this farm record")

        now = datetime.now(timezone.utc)
        await mongo_manager.farms.update_one(
            {"_id": farm_id},
            {"$set": {"isArchived": True, "archivedAt": now, "updatedAt": now}},
        )
        return True

    async def get_farm_overview(self, user: Dict[str, Any], farm_id_str: Optional[str] = None) -> Dict[str, Any]:
        if not farm_id_str:
            first_farm = await mongo_manager.farms.find_one({"ownerId": user["_id"], "isArchived": False})
            if not first_farm:
                return {
                    "totalFarms": 0,
                    "farm": None,
                    "agriculturalRecordsSummary": {"totalLoaded": 0, "records": []},
                    "latestAssessments": {
                        "cropRecommendation": {"status": "NO_RECORDS", "message": "No crop recommendations recorded"},
                        "diseaseDetection": {"status": "NO_RECORDS", "message": "No disease assessments recorded"},
                        "transportationRisk": {"status": "NO_RECORDS", "message": "No transportation risk assessments recorded"},
                    },
                }
            farm = serialize_doc(first_farm)
            farm_id = first_farm["_id"]
        else:
            farm = await self.get_farm_by_id(user, farm_id_str)
            farm_id = ObjectId(farm_id_str)

        # 1. Fetch agricultural records for this farm

        rec_cursor = (
            mongo_manager.agricultural_records.find({"farmId": farm_id, "isArchived": False})
            .sort([("plantingDate", -1), ("createdAt", -1)])
            .limit(10)
        )
        records = await rec_cursor.to_list(length=10)
        serialized_records = [serialize_doc(r) for r in records]

        # 2. Fetch latest C1, C2, and C4 assessments for this farm
        latest_c1 = await mongo_manager.crop_predictions.find_one(
            {"farmId": farm_id}, sort=[("timestamp", -1), ("createdAt", -1)]
        )
        latest_c2 = await mongo_manager.disease_assessments.find_one(
            {"farmId": farm_id}, sort=[("timestamp", -1), ("createdAt", -1)]
        )
        latest_c4 = await mongo_manager.transportation_assessments.find_one(
            {"farmId": farm_id}, sort=[("timestamp", -1), ("createdAt", -1)]
        )

        return {
            "farm": farm,
            "agriculturalRecordsSummary": {
                "totalLoaded": len(serialized_records),
                "records": serialized_records,
            },
            "latestAssessments": {
                "cropRecommendation": (
                    {
                        "status": "AVAILABLE",
                        "id": str(latest_c1["_id"]),
                        "cropType": latest_c1.get("cropType"),
                        "predictionType": latest_c1.get("predictionType"),
                        "result": latest_c1.get("predictionResult"),
                        "timestamp": serialize_doc(latest_c1.get("timestamp")),
                    }
                    if latest_c1
                    else {"status": "NO_RECORDS", "message": "No crop recommendations recorded for this farm"}
                ),
                "diseaseDetection": (
                    {
                        "status": "AVAILABLE",
                        "id": str(latest_c2["_id"]),
                        "cropType": latest_c2.get("cropType"),
                        "diseaseName": latest_c2.get("predictionResult", {}).get("diseaseName"),
                        "confidence": latest_c2.get("predictionResult", {}).get("confidence"),
                        "severity": latest_c2.get("predictionResult", {}).get("severity"),
                        "severityStatus": latest_c2.get("predictionResult", {}).get("severityStatus"),
                        "hasGradCam": bool(latest_c2.get("gradCamArtifactReference")),
                        "timestamp": serialize_doc(latest_c2.get("timestamp")),
                    }
                    if latest_c2
                    else {"status": "NO_RECORDS", "message": "No disease assessments recorded for this farm"}
                ),
                "transportationRisk": (
                    {
                        "status": "AVAILABLE",
                        "id": str(latest_c4["_id"]),
                        "cropType": latest_c4.get("cropType"),
                        "damageProbability": latest_c4.get("predictionResult", {}).get("damageProbability"),
                        "riskLevel": latest_c4.get("predictionResult", {}).get("riskLevel"),
                        "recommendedPackaging": latest_c4.get("predictionResult", {}).get("recommendedPackaging"),
                        "timestamp": serialize_doc(latest_c4.get("timestamp")),
                    }
                    if latest_c4
                    else {
                        "status": "NO_RECORDS",
                        "message": "No transportation risk assessments recorded for this farm",
                    }
                ),
            },
            "componentReadiness": {
                "c1_crop_recommendation": {
                    "configured": True,
                    "endpoint": "/api/v1/crops/recommend",
                },
                "c2_disease_detection": {
                    "configured": True,
                    "endpoint": "/api/v1/diseases/analyze",
                },
                "c4_transportation_risk": {
                    "configured": True,
                    "endpoint": "/api/v1/transportation/predict-risk",
                },
            },
        }


farm_service = FarmService()
