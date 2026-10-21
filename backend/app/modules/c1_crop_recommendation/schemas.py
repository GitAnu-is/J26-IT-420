from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, model_validator


class RecommendCropRequest(BaseModel):
    nitrogen: Optional[float] = Field(None, ge=0, le=500)
    phosphorus: Optional[float] = Field(None, ge=0, le=500)
    potassium: Optional[float] = Field(None, ge=0, le=500)
    ph: float = Field(..., ge=0, le=14)
    soilMoisture: Optional[float] = Field(None, ge=0, le=100)
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    district: Optional[str] = None
    agroEcologicalZone: Optional[str] = None
    season: Optional[str] = None
    farmId: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values):
        if isinstance(values, dict):
            if "nitrogen" not in values and "soilN" in values:
                values["nitrogen"] = values["soilN"]
            if "phosphorus" not in values and "soilP" in values:
                values["phosphorus"] = values["soilP"]
            if "potassium" not in values and "soilK" in values:
                values["potassium"] = values["soilK"]
        return values



class PredictHarvestRequest(BaseModel):
    crop: str = Field(...)
    cropType: Optional[str] = None
    plantingDate: str = Field(...)
    variety: Optional[str] = None
    district: Optional[str] = None
    season: Optional[str] = "MAHA"
    soilPh: Optional[float] = None
    soilMoisture: Optional[float] = None
    temperature: Optional[float] = None
    rainfall: Optional[float] = None
    farmId: Optional[str] = None
