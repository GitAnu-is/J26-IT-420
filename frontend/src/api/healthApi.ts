import { apiRequest } from './client';

export interface HealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    express: { status: string; uptime: number };
    mongodb: { status: string; connected: boolean; readyState: number };
    c1_crop_recommendation: { status: string; url: string; ready: boolean; error?: string };
    c2_disease_detection: { status: string; url: string; ready: boolean; error?: string };
    c4_transportation_risk: { status: string; url: string; ready: boolean; error?: string };
  };
}

export interface ProvenanceResponse {
  researchGroup: string;
  components: {
    C1: any;
    C2: any;
    C4: any;
  };
}

export const healthApi = {
  getHealth: () =>
    apiRequest<HealthResponse>('GET', '/health'),

  getProvenance: () =>
    apiRequest<ProvenanceResponse>('GET', '/provenance')
};
