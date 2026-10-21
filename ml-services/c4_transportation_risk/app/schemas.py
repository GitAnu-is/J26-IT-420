"""
Pydantic Request & Response Schemas for Component 4
AgriGuard Research Project (J26-IT-420 - SLIIT)
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    service: str = Field(..., json_schema_extra={"example": "c4_transportation_risk_ml"})
    version: str = Field(..., json_schema_extra={"example": "1.0.0"})
    device: str = Field(..., json_schema_extra={"example": "cpu"})
    modelLoaded: bool = Field(...)
    timestamp: str

class ModelInfoResponse(BaseModel):
    readinessStatus: str
    validationStatus: str
    datasetProvenance: str
    selectedModel: Dict[str, Any]
    candidateModels: Dict[str, Any]
    supportedCrops: List[str]
    supportedVehicles: List[str]
    supportedPackaging: List[str]
    supportedRoadConditions: List[str]
    riskCategories: Dict[str, str]
    explainability: str

class RiskPredictionRequest(BaseModel):
    cropType: str = Field(..., description="Target crop: BANANA, PINEAPPLE, or BLACK_PEPPER")
    distanceKm: float = Field(..., gt=0, description="Transit distance in kilometers")
    durationHours: float = Field(..., gt=0, description="Transit duration in hours")
    vehicleType: str = Field(..., description="Vehicle type (e.g. OPEN_TRUCK, REFRIGERATED_TRUCK)")
    roadCondition: str = Field(..., description="Road condition (e.g. PAVED_GOOD, UNPAVED_ROUGH)")
    packagingType: str = Field(..., description="Packaging type (e.g. PLASTIC_CRATES, LOOSE_BULK)")
    temperatureCelsius: Optional[float] = Field(None, ge=0, le=50, description="Ambient temperature in Celsius")
    humidityPercentage: Optional[float] = Field(None, ge=0, le=100, description="Relative humidity percentage")
    originDistrict: Optional[str] = Field(None, description="Trip origin district in Sri Lanka")
    destinationDistrict: Optional[str] = Field(None, description="Trip destination district in Sri Lanka")

class RiskPredictionResponse(BaseModel):
    cropType: str
    damageProbability: Optional[float] = None
    riskLevel: Optional[str] = None  # "LOW", "MEDIUM", "HIGH"
    riskStatus: str  # "COMPLETED", "UNAVAILABLE"
    modelIdentifier: Optional[str] = None
    modelVersion: Optional[str] = None
    datasetVersion: Optional[str] = None
    shapExplanation: Optional[Dict[str, Any]] = None
    packagingRecommendation: Optional[Dict[str, Any]] = None
    executionLatencyMs: float
    timestamp: str

class PackagingRecommendationRequest(BaseModel):
    cropType: str = Field(..., description="Target crop: BANANA, PINEAPPLE, or BLACK_PEPPER")
    distanceKm: float = Field(..., gt=0, description="Transit distance in kilometers")
    vehicleType: Optional[str] = Field(None, description="Vehicle type")
    expectedDurationHours: Optional[float] = Field(None, gt=0, description="Estimated duration in hours")
    currentPackagingType: Optional[str] = Field(None, description="Current packaging in use")
    temperatureCelsius: Optional[float] = Field(None, ge=0, le=50)
    humidityPercentage: Optional[float] = Field(None, ge=0, le=100)

class PackagingRecommendationResponse(BaseModel):
    cropType: str
    ruleId: str
    recommendedPackaging: str
    storageGuidance: List[str]
    handlingGuidance: List[str]
    transportationGuidance: List[str]
    contextualWarnings: List[str] = Field(default_factory=list)
    supportingReferences: List[str] = Field(default_factory=list)
    ruleVersion: str
    reviewStatus: str
    timestamp: str
