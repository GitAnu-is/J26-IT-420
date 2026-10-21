from typing import Optional
from pydantic import BaseModel, Field


class PredictTransportationRiskRequest(BaseModel):
    crop: Optional[str] = None
    cropType: Optional[str] = None
    distanceKm: float = Field(..., ge=1, le=2000)
    durationHours: float = Field(..., ge=0.1, le=120)
    vehicleType: str = Field(default="COVERED_TRUCK")
    roadCondition: str = Field(default="CARPETED_HIGHWAY")
    temperatureCelsius: Optional[float] = Field(default=28.0, ge=-10.0, le=60.0)
    humidityPercentage: Optional[float] = Field(default=75.0, ge=0.0, le=100.0)
    packagingType: str = Field(default="PLASTIC_CRATES")
    storageCondition: Optional[str] = Field(default="AMBIENT")
    weatherCondition: Optional[str] = Field(default="CLEAR")
    originDistrict: Optional[str] = None
    destinationDistrict: Optional[str] = None
    farmId: Optional[str] = None


class RecommendPackagingRequest(BaseModel):
    crop: Optional[str] = None
    cropType: Optional[str] = None
    distanceKm: float = Field(..., ge=1, le=2000)
    durationHours: Optional[float] = Field(default=3.0, ge=0.1, le=120)
    vehicleType: Optional[str] = None
    packagingType: Optional[str] = None
    temperatureCelsius: Optional[float] = None
    humidityPercentage: Optional[float] = None
