from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class FarmLocation(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class CreateFarmRequest(BaseModel):
    farmName: Optional[str] = None
    name: Optional[str] = None
    district: Optional[str] = "Colombo"
    agroEcologicalZone: Optional[str] = Field(default="", max_length=50)
    location: Optional[FarmLocation] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    soilType: str = Field(default="SANDY_LOAM")
    area: Optional[float] = Field(default=0.0, ge=0)
    sizeHectares: Optional[float] = None
    areaUnit: str = Field(default="ACRES")
    supportedCrops: List[str] = Field(default_factory=lambda: ["BANANA"])
    primaryCrops: Optional[List[str]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values):
        if isinstance(values, dict):
            fn = values.get("farmName") or values.get("name")
            if fn:
                values["farmName"] = fn
                values["name"] = fn
            
            # Location district fallback
            if "district" not in values or not values.get("district"):
                loc = values.get("location")
                if isinstance(loc, dict) and loc.get("district"):
                    values["district"] = loc.get("district")
            
            # Area fallback
            if "area" not in values and "sizeHectares" in values:
                values["area"] = values["sizeHectares"]
                values["areaUnit"] = "HECTARES"

            # Crops fallback
            if "supportedCrops" not in values and "primaryCrops" in values:
                values["supportedCrops"] = values["primaryCrops"]
        return values



class UpdateFarmRequest(BaseModel):
    farmName: Optional[str] = Field(None, min_length=2, max_length=150)
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    agroEcologicalZone: Optional[str] = None
    location: Optional[FarmLocation] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    soilType: Optional[str] = None
    area: Optional[float] = Field(None, ge=0)
    areaUnit: Optional[str] = None
    supportedCrops: Optional[List[str]] = None
