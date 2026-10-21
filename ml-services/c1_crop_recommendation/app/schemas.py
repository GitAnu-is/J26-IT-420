"""
Pydantic Request and Response Schemas for Component 1 Inference Service
AgriGuard Research Project (J26-IT-420 - SLIIT)
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date

class CropInferenceRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=350, description="Soil Nitrogen in mg/kg")
    phosphorus: float = Field(..., ge=0, le=350, description="Available Phosphorus in mg/kg")
    potassium: float = Field(..., ge=0, le=600, description="Exchangeable Potassium in mg/kg")
    ph: float = Field(..., ge=3.0, le=10.0, description="Soil pH")
    soil_moisture: Optional[float] = Field(None, ge=0, le=100, description="Volumetric soil moisture percentage")
    temperature: Optional[float] = Field(None, ge=10.0, le=50.0, description="Mean temperature in Celsius")
    humidity: Optional[float] = Field(None, ge=0, le=100, description="Relative air humidity percentage")
    rainfall: Optional[float] = Field(None, ge=0, le=1500, description="Seasonal/monthly precipitation in mm")
    district: Optional[str] = Field(None, description="Sri Lankan District")
    agro_zone: Optional[str] = Field(None, description="Agro-Ecological Zone (e.g. WL2a, IL1a)")
    season: Optional[str] = Field(None, description="Monsoon Season (YALA or MAHA)")

    @field_validator("season")
    @classmethod
    def validate_season(cls, v):
        if v is not None:
            v_upper = v.upper()
            if v_upper not in ["YALA", "MAHA"]:
                raise ValueError("Season must be YALA or MAHA")
            return v_upper
        return v

class CropInferenceResponse(BaseModel):
    recommendedCrop: str = Field(..., description="Recommended crop (BANANA, PINEAPPLE, BLACK_PEPPER)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of top recommendation")
    classProbabilities: Dict[str, float] = Field(..., description="Estimated probability distribution")
    modelIdentifier: str
    modelVersion: str
    predictionTimestamp: str

class HarvestInferenceRequest(BaseModel):
    cropType: str = Field(..., description="Target crop (BANANA, PINEAPPLE, BLACK_PEPPER)")
    plantingDate: str = Field(..., description="Planting date in YYYY-MM-DD format")
    variety: Optional[str] = Field(None, description="Specific cultivar variety")
    district: Optional[str] = Field(None, description="District of cultivation")
    season: Optional[str] = Field(None, description="Monsoon Season (YALA or MAHA)")
    soilPh: Optional[float] = Field(None, ge=3.0, le=10.0, description="Soil pH")
    soilMoisture: Optional[float] = Field(None, ge=0.0, le=100.0, description="Soil moisture %")
    temperature: Optional[float] = Field(None, ge=10.0, le=50.0, description="Temperature in Celsius")
    rainfall: Optional[float] = Field(None, ge=0.0, le=1500.0, description="Rainfall in mm")

    @field_validator("cropType")
    @classmethod
    def validate_crop_type(cls, v):
        v_norm = v.upper().replace(" ", "_")
        if v_norm not in ["BANANA", "PINEAPPLE", "BLACK_PEPPER"]:
            raise ValueError("cropType must be BANANA, PINEAPPLE, or BLACK_PEPPER")
        return v_norm

    @field_validator("plantingDate")
    @classmethod
    def validate_date(cls, v):
        try:
            # Handle YYYY-MM-DD or ISO string
            if "T" in v:
                v = v.split("T")[0]
            datetime.strptime(v, "%Y-%m-%d")
            return v
        except Exception:
            raise ValueError("plantingDate must be valid date in YYYY-MM-DD format")

class HarvestWindow(BaseModel):
    startDate: str
    endDate: str

class HarvestInferenceResponse(BaseModel):
    cropType: str
    predictedDurationDays: int
    predictedHarvestDate: str
    harvestWindow: HarvestWindow
    confidenceMarginDays: int
    modelIdentifier: str
    modelVersion: str
    predictionTimestamp: str

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    modelsLoaded: Dict[str, bool]
    timestamp: str

class ModelInfoResponse(BaseModel):
    cropRecommendationModel: Dict[str, Any]
    harvestPredictionModel: Dict[str, Any]
