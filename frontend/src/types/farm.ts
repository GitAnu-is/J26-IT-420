import { AgriculturalRecord } from './record';

export type SupportedCrop = 'BANANA' | 'PINEAPPLE' | 'BLACK_PEPPER';

export type SoilType =
  | 'SANDY_LOAM'
  | 'CLAY_LOAM'
  | 'RED_YELLOW_PODZOLIC'
  | 'ALLUVIAL'
  | 'LATOSOLIC';

export type AreaUnit = 'ACRES' | 'HECTARES' | 'PERCHES' | 'SQUARE_METERS';

export interface FarmLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface Farm {
  id: string;
  _id?: string;
  ownerId: string;
  farmName: string;
  district: string;
  agroEcologicalZone?: string;
  location?: FarmLocation;
  soilType: SoilType;
  area?: number;
  areaUnit: AreaUnit;
  supportedCrops: SupportedCrop[];
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFarmInput {
  farmName: string;
  district: string;
  agroEcologicalZone?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  soilType: SoilType;
  area?: number;
  areaUnit: AreaUnit;
  supportedCrops: SupportedCrop[];
}

export type UpdateFarmInput = Partial<CreateFarmInput>;

export interface FarmOverview {
  farm: Farm;
  agriculturalRecords?: AgriculturalRecord[];
  agriculturalRecordsSummary?: {
    totalLoaded: number;
    records: AgriculturalRecord[];
  };
  latestAssessments?: {
    cropRecommendation?: any;
    diseaseDetection?: any;
    transportationRisk?: any;
  };
  recentActivity?: {
    cropPredictions?: any[];
    diseaseAssessments?: any[];
    transportAssessments?: any[];
  };
  componentReadiness?: {
    c1_crop_recommendation?: { configured?: boolean; endpoint?: string; status?: string; available?: boolean; error?: string };
    c2_disease_detection?: { configured?: boolean; endpoint?: string; status?: string; available?: boolean; error?: string };
    c4_transportation_risk?: { configured?: boolean; endpoint?: string; status?: string; available?: boolean; error?: string };
  };
}
