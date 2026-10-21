"""
Pydantic Schemas for Component 2: Plant Disease Detection & Severity Assessment
AgriGuard Research Project (J26-IT-420 - SLIIT)
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    service: str = Field(..., json_schema_extra={"example": "c2_disease_detection_ml"})
    version: str = Field(..., json_schema_extra={"example": "1.0.0"})
    device: str = Field(..., json_schema_extra={"example": "cpu"})
    modelsLoaded: Dict[str, bool] = Field(...)
    timestamp: str

class ModelEvaluationMetrics(BaseModel):
    accuracy: float
    macroF1: float
    weightedF1: float
    precision: float
    recall: float
    inferenceLatencyMs: float
    modelSizeMb: float

class ModelInfoResponse(BaseModel):
    primaryModel: Dict[str, object]
    comparisonModel: Dict[str, object]
    supportedCrops: List[str]
    supportedClasses: List[str]
    cropDiseaseMapping: Dict[str, List[str]]

class DiseasePredictionRequest(BaseModel):
    cropType: str = Field(..., description="Target crop: BANANA, PINEAPPLE, or BLACK_PEPPER")
    imageBase64: Optional[str] = Field(None, description="Base64 encoded JPEG/PNG image data")

class DiseasePredictionResponse(BaseModel):
    cropType: str
    predictedDisease: str
    diseaseNameDisplay: str
    confidence: float
    classProbabilities: Dict[str, float]
    severity: Optional[str] = None
    severityStatus: str  # "COMPLETED", "UNAVAILABLE", "NOT_APPLICABLE"
    severityMethod: Optional[str] = None
    severityScore: Optional[float] = None
    gradCamAvailable: bool = False
    gradCamArtifactKey: Optional[str] = None
    gradCamBase64: Optional[str] = None
    managementGuidance: List[str] = Field(default_factory=list)
    guidanceCitation: Optional[str] = None
    guidanceReviewedDate: Optional[str] = None
    modelIdentifier: str
    modelVersion: str
    predictionStatus: str  # "COMPLETED", "LOW_CONFIDENCE_FLAGGED", "CROP_MISMATCH_SUSPECTED"
    executionLatencyMs: float
    timestamp: str
