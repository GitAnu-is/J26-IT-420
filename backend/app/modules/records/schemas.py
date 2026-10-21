from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CreateRecordRequest(BaseModel):
    farmId: str = Field(..., min_length=24, max_length=24)
    cropType: str = Field(..., min_length=2, max_length=50)
    plantingDate: str = Field(...)
    expectedHarvestDate: Optional[str] = None
    actualHarvestDate: Optional[str] = None
    soilPh: Optional[float] = Field(default=6.5, ge=0.0, le=14.0)
    nitrogen: Optional[int] = Field(default=100, ge=0, le=500)
    phosphorus: Optional[int] = Field(default=50, ge=0, le=500)
    potassium: Optional[int] = Field(default=150, ge=0, le=500)
    soilMoisture: Optional[float] = Field(default=30.0, ge=0.0, le=100.0)
    locationContext: Optional[str] = Field(default="")
    notes: Optional[str] = Field(default="")


class UpdateRecordRequest(BaseModel):
    cropType: Optional[str] = None
    plantingDate: Optional[str] = None
    expectedHarvestDate: Optional[str] = None
    actualHarvestDate: Optional[str] = None
    soilPh: Optional[float] = Field(None, ge=0.0, le=14.0)
    nitrogen: Optional[int] = Field(None, ge=0, le=500)
    phosphorus: Optional[int] = Field(None, ge=0, le=500)
    potassium: Optional[int] = Field(None, ge=0, le=500)
    soilMoisture: Optional[float] = Field(None, ge=0.0, le=100.0)
    locationContext: Optional[str] = None
    notes: Optional[str] = None
