import { SupportedCrop } from './farm';

export interface AgriculturalRecord {
  id: string;
  _id?: string;
  farmId: string;
  farmName?: string;
  cropType: SupportedCrop;
  plantingDate: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  soilPh?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  soilMoisture?: number;
  locationContext?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRecordInput {
  farmId: string;
  cropType: SupportedCrop;
  plantingDate: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  soilPh?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  soilMoisture?: number;
  locationContext?: string;
  notes?: string;
}

export type UpdateRecordInput = Partial<CreateRecordInput>;
