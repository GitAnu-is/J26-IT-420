import { apiRequest } from './client';
import {
  CropPredictionHistoryItem,
  PredictHarvestInput,
  PredictHarvestResult,
  RecommendCropInput,
  RecommendCropResult
} from '../types/crops';

export const cropsApi = {
  getComponentInfo: () =>
    apiRequest<any>('GET', '/crops'),

  recommendCrop: (data: RecommendCropInput) =>
    apiRequest<RecommendCropResult>('POST', '/crops/recommend', data),

  predictHarvest: (data: PredictHarvestInput) =>
    apiRequest<PredictHarvestResult>('POST', '/crops/predict-harvest', data),

  getCropHistory: (page = 1, limit = 20) =>
    apiRequest<{ total: number; page: number; limit: number; items: CropPredictionHistoryItem[] }>(
      'GET',
      `/crops/history?page=${page}&limit=${limit}`
    )
};
