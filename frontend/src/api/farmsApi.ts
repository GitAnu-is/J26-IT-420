import { apiRequest } from './client';
import { CreateFarmInput, Farm, FarmOverview, UpdateFarmInput } from '../types/farm';

export const farmsApi = {
  getFarms: async (): Promise<Farm[]> => {
    const res = await apiRequest<any>('GET', '/farms');
    return Array.isArray(res) ? res : res?.farms || [];
  },

  getFarmById: async (id: string): Promise<Farm> => {
    const res = await apiRequest<any>('GET', `/farms/${id}`);
    return res?.farm || res;
  },

  getFarmOverview: (id: string): Promise<FarmOverview> =>
    apiRequest<FarmOverview>('GET', `/farms/${id}/overview`),

  createFarm: async (data: CreateFarmInput): Promise<Farm> => {
    const res = await apiRequest<any>('POST', '/farms', data);
    return res?.farm || res;
  },

  updateFarm: async (id: string, data: UpdateFarmInput): Promise<Farm> => {
    const res = await apiRequest<any>('PATCH', `/farms/${id}`, data);
    return res?.farm || res;
  },

  deleteFarm: (id: string): Promise<{ message: string }> =>
    apiRequest<{ message: string }>('DELETE', `/farms/${id}`)
};
