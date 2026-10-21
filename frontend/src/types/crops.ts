import { SupportedCrop } from './farm';

export interface ModelMetadata {
  componentId?: string;
  modelIdentifier: string;
  modelVersion: string;
  datasetVersion?: string;
  datasetProvenance?: string;
  validationStatus: 'UNAVAILABLE' | 'PROTOTYPE_SYNTHETIC' | 'INTERNALLY_EVALUATED' | 'EXTERNALLY_VALIDATED';
  evaluatedOn?: string;
  evaluationSummary?: any;
  inferenceAvailable?: boolean;
  limitations?: string;
}

export interface RecommendCropInput {
  farmId?: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  moisture?: number;
  temperature?: number;
  temperatureCelsius?: number;
  humidity?: number;
  rainfall?: number;
  rainfallMm?: number;
  district?: string;
  agroEcologicalZone?: string;
  season?: 'YALA' | 'MAHA';
  latitude?: number;
  longitude?: number;
}

export interface RecommendCropResult {
  recommendedCrop: SupportedCrop;
  confidence: number;
  classProbabilities?: Record<string, number>;
  probabilities?: Record<string, number>;
  modelIdentifier?: string;
  modelVersion?: string;
  environmentalContext?: any;
  modelMetadata?: ModelMetadata;
  predictionId?: string;
  savedPredictionId?: string | null;
  predictionTimestamp?: string;
}

export interface PredictHarvestInput {
  farmId?: string;
  crop: SupportedCrop;
  plantingDate: string;
  variety?: string;
  district?: string;
  season?: 'YALA' | 'MAHA';
  soilMoisture?: number;
  ph?: number;
  temperature?: number;
  rainfall?: number;
}

export interface HarvestWindow {
  startDate?: string;
  endDate?: string;
  earliestDate?: string;
  latestDate?: string;
  windowDays?: number;
}

export interface PredictHarvestResult {
  crop?: SupportedCrop;
  cropType?: SupportedCrop;
  cropReferenceEvent?: string;
  biologicalEventDate?: string;
  predictedDurationDays: number;
  predictedHarvestDate?: string;
  expectedHarvestDate?: string;
  harvestWindow?: HarvestWindow;
  confidenceMarginDays?: number;
  modelIdentifier?: string;
  modelVersion?: string;
  modelMetadata?: ModelMetadata;
  predictionId?: string;
  savedPredictionId?: string | null;
  predictionTimestamp?: string;
}

export interface CropPredictionHistoryItem {
  id: string;
  _id?: string;
  predictionType: 'RECOMMENDATION' | 'HARVEST_PLANNING';
  crop?: string;
  recommendedCrop?: string;
  confidence?: number;
  predictedDurationDays?: number;
  expectedHarvestDate?: string;
  createdAt: string;
}
