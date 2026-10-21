import { SupportedCrop } from './farm';
import { ModelMetadata } from './crops';

export type VehicleType =
  | 'OPEN_TRUCK'
  | 'COVERED_TRUCK'
  | 'REFRIGERATED_TRUCK'
  | 'THREE_WHEELER'
  | 'PICKUP'
  | 'TRACTOR_TRAILER';

export type PackagingType =
  | 'WOODEN_CRATES'
  | 'PLASTIC_CRATES'
  | 'CORRUGATED_BOXES'
  | 'GUNNY_BAGS'
  | 'JUTE_BAGS'
  | 'LOOSE_BULK'
  | 'POLYETHYLENE_LINED_BAGS';

export type RoadCondition = 'PAVED_GOOD' | 'PAVED_POOR' | 'UNPAVED_ROUGH' | 'MIXED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PredictTransportationRiskInput {
  crop: SupportedCrop;
  farmId?: string;
  distanceKm: number;
  durationHours: number;
  vehicleType: VehicleType;
  packagingType: PackagingType;
  roadCondition: RoadCondition;
  temperatureCelsius?: number;
  humidityPercentage?: number;
  originDistrict?: string;
  destinationDistrict?: string;
}

export interface ShapContributor {
  feature: string;
  displayName: string;
  attribution: number;
  impact: 'INCREASES_RISK' | 'DECREASES_RISK';
  magnitude: number;
}

export interface ShapExplanation {
  method: string;
  topContributors: ShapContributor[];
  primaryRiskElevators: ShapContributor[];
  primaryRiskMitigators: ShapContributor[];
  scientificDisclaimer: string;
}

export interface PackagingRecommendation {
  cropType: SupportedCrop;
  ruleId?: string;
  recommendedPackaging: string;
  storageGuidance: string[];
  handlingGuidance: string[];
  transportationGuidance: string[];
  contextualWarnings?: string[];
  supportingReferences?: string[];
  ruleVersion?: string;
  reviewStatus?: string;
}

export interface RiskFactorImpact {
  feature: string;
  displayName?: string;
  value?: any;
  impact: 'INCREASES_RISK' | 'DECREASES_RISK' | 'NEUTRAL';
  attribution?: number;
  shapImportance?: number;
}

export interface PackagingRecommendationRules {
  packaging?: string[];
  storage?: string[];
  handling?: string[];
}

export interface TransportationRiskResult {
  cropType?: SupportedCrop;
  crop?: SupportedCrop;
  damageProbability: number;
  riskLevel: RiskLevel;
  riskStatus?: string;
  modelIdentifier?: string;
  modelVersion?: string;
  datasetVersion?: string;
  shapExplanation?: ShapExplanation;
  packagingRecommendation?: PackagingRecommendation;
  topRiskFactors?: RiskFactorImpact[];
  shapValues?: Record<string, number>;
  recommendations?: PackagingRecommendationRules;
  modelMetadata?: ModelMetadata & { calibrated?: boolean };
  assessmentId?: string | null;
  executionLatencyMs?: number;
  timestamp?: string;
}

export interface RecommendPackagingInput {
  crop: SupportedCrop;
  distanceKm: number;
  vehicleType?: VehicleType;
  expectedDurationHours?: number;
  currentPackagingType?: PackagingType;
  temperatureCelsius?: number;
  humidityPercentage?: number;
}

export interface SmartPackagingResult {
  cropType?: SupportedCrop;
  crop?: SupportedCrop;
  ruleId?: string;
  recommendedPackaging: string;
  storageGuidance?: string[];
  handlingGuidance?: string[];
  transportationGuidance?: string[];
  supportingReferences?: string[];
  contextualWarnings?: string[];
  ruleVersion?: string;
  reviewStatus?: string;
  packagingMaterial?: string;
  handlingAdvice?: string[];
  transportPrecautions?: string[];
  storageConditions?: {
    temperatureRange?: string;
    humidityRange?: string;
    ventilation?: string;
  };
  expertSource?: string;
  timestamp?: string;
}

export interface TransportationHistoryItem {
  id: string;
  _id?: string;
  cropType: SupportedCrop;
  timestamp: string;
  createdAt?: string;
  logisticsInputSnapshot?: {
    distanceKm: number;
    durationHours: number;
    vehicleType: VehicleType;
    packagingType: PackagingType;
    roadCondition: RoadCondition;
    temperatureCelsius?: number;
    humidityPercentage?: number;
  };
  predictionResult: {
    damageProbability: number;
    riskLevel: RiskLevel;
    recommendedPackaging?: string;
    storageGuidance?: string[];
    handlingGuidance?: string[];
    transportationGuidance?: string[];
  };
  modelMetadata?: {
    modelName: string;
    modelVersion: string;
  };
}
