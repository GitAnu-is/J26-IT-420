import { apiRequest } from './client';
import { AgriculturalRecord, CreateRecordInput, UpdateRecordInput } from '../types/record';

export const recordsApi = {
  getRecords: async (farmId?: string): Promise<AgriculturalRecord[]> => {
    const url = farmId ? `/agricultural-records?farmId=${farmId}` : '/agricultural-records';
    const res = await apiRequest<any>('GET', url);
    return Array.isArray(res) ? res : res?.records || [];
  },

  getRecordById: async (id: string): Promise<AgriculturalRecord> => {
    const res = await apiRequest<any>('GET', `/agricultural-records/${id}`);
    return res?.record || res;
  },

  createRecord: async (data: CreateRecordInput): Promise<AgriculturalRecord> => {
    const res = await apiRequest<any>('POST', '/agricultural-records', data);
    return res?.record || res;
  },

  updateRecord: async (id: string, data: UpdateRecordInput): Promise<AgriculturalRecord> => {
    const res = await apiRequest<any>('PATCH', `/agricultural-records/${id}`, data);
    return res?.record || res;
  },

  deleteRecord: (id: string): Promise<{ message: string }> =>
    apiRequest<{ message: string }>('DELETE', `/agricultural-records/${id}`)
};
