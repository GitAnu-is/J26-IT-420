import { apiRequest, apiUpload, API_BASE_URL, tokenStorage } from './client';
import {
  DiseaseAnalysisResult,
  DiseaseAssessmentHistoryItem
} from '../types/diseases';

export const diseasesApi = {
  getComponentInfo: () =>
    apiRequest<any>('GET', '/diseases'),

  analyzeDisease: (formData: FormData) =>
    apiUpload<DiseaseAnalysisResult>('/diseases/analyze', formData),

  getDiseaseHistory: (page = 1, limit = 20) =>
    apiRequest<{ total: number; page: number; limit: number; items: DiseaseAssessmentHistoryItem[] }>(
      'GET',
      `/diseases/history?page=${page}&limit=${limit}`
    ),

  getAssessmentById: (id: string) =>
    apiRequest<DiseaseAnalysisResult>('GET', `/diseases/assessments/${id}`),

  getGradCamUrl: (id: string) =>
    `${API_BASE_URL}/diseases/assessments/${id}/gradcam`,

  getOriginalImageUrl: (id: string) =>
    `${API_BASE_URL}/diseases/assessments/${id}/image`
};
