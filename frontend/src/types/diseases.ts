import { SupportedCrop } from './farm';
import { ModelMetadata } from './crops';

export interface ManagementGuidance {
  cultural?: string[];
  chemical?: string[];
  biological?: string[];
  notes?: string;
}

export interface DiseaseAnalysisResult {
  crop?: SupportedCrop;
  cropType?: SupportedCrop;
  diseaseName?: string;
  predictedDisease?: string;
  diseaseNameDisplay?: string;
  scientificName?: string;
  confidence: number;
  severity?: string;
  severityStatus: 'UNAVAILABLE' | 'AVAILABLE' | 'NOT_APPLICABLE' | string;
  severityLevel?: 'MILD' | 'MODERATE' | 'SEVERE' | string;
  severityScore?: number;
  managementGuidance?: ManagementGuidance | string[];
  guidanceCitation?: string;
  gradcamAvailable?: boolean;
  gradCamArtifactReference?: string | null;
  gradcamArtifactPath?: string;
  gradcamUrl?: string;
  originalImageUrl?: string;
  assessmentId?: string | null;
  savedAssessmentId?: string | null;
  modelMetadata?: ModelMetadata;
  modelIdentifier?: string;
  modelVersion?: string;
  executionLatencyMs?: number;
}

export interface DiseaseAssessmentHistoryItem {
  id: string;
  _id?: string;
  crop?: SupportedCrop;
  cropType?: SupportedCrop;
  diseaseName?: string;
  predictedDisease?: string;
  diseaseNameDisplay?: string;
  confidence: number;
  severityStatus?: string;
  severity?: string;
  severityLevel?: string;
  hasGradcam?: boolean;
  createdAt?: string;
  timestamp?: string;
}
