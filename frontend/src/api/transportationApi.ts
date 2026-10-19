import { apiRequest } from './client';
import {
  PredictTransportationRiskInput,
  RecommendPackagingInput,
  SmartPackagingResult,
  TransportationHistoryItem,
  TransportationRiskResult
} from '../types/transportation';

export const transportationApi = {
  getComponentInfo: () =>
    apiRequest<any>('GET', '/transportation'),

  predictRisk: (data: PredictTransportationRiskInput) =>
    apiRequest<TransportationRiskResult>('POST', '/transportation/predict-risk', data),

  recommendPackaging: (data: RecommendPackagingInput) =>
    apiRequest<SmartPackagingResult>('POST', '/transportation/recommend-packaging', data),

  getTransportationHistory: (page = 1, limit = 20) =>
    apiRequest<{ total: number; page: number; limit: number; items: TransportationHistoryItem[] }>(
      'GET',
      `/transportation/history?page=${page}&limit=${limit}`
    ),

  getAssessmentById: (id: string) =>
    apiRequest<TransportationRiskResult>('GET', `/transportation/assessments/${id}`)
};
