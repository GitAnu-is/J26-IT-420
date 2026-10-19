import type { FeatureId } from './features';
import type { RiskLevel } from '../types/forms';
import type { TranslationKey } from './translations/en';
import type { ScreenId } from '../types/navigation';

export interface HistoryItem {
  id: string;
  type: FeatureId;
  cropKey: TranslationKey;
  date: string;
  statusKey: TranslationKey;
  resultKey?: TranslationKey;
  harvestDate?: string;
  risk?: {level: RiskLevel;percent: number;};
  screen: ScreenId;
}

export const historyItems: HistoryItem[] = [
{ id: 'h1', type: 'transport', cropKey: 'cropBanana', date: '2026-10-13', statusKey: 'statusFollow', risk: { level: 'high', percent: 68 }, screen: 'transport-results' },
{ id: 'h2', type: 'disease', cropKey: 'cropBanana', date: '2026-10-07', statusKey: 'statusFollow', resultKey: 'diseaseSigatoka', screen: 'disease-results' },
{ id: 'h3', type: 'harvest', cropKey: 'cropBanana', date: '2026-10-05', statusKey: 'statusDone', harvestDate: '2026-10-24', screen: 'harvest-results' },
{ id: 'h4', type: 'crop', cropKey: 'cropBanana', date: '2026-09-30', statusKey: 'statusDone', resultKey: 'cropBanana', screen: 'crop-results' },
{ id: 'h5', type: 'transport', cropKey: 'cropPepper', date: '2026-09-28', statusKey: 'statusDone', risk: { level: 'low', percent: 18 }, screen: 'transport-results' },
{ id: 'h6', type: 'transport', cropKey: 'cropPineapple', date: '2026-09-20', statusKey: 'statusDone', risk: { level: 'medium', percent: 44 }, screen: 'transport-results' },
{ id: 'h7', type: 'disease', cropKey: 'cropPepper', date: '2026-09-18', statusKey: 'statusDone', resultKey: 'healthy', screen: 'disease-results' },
{ id: 'h8', type: 'transport', cropKey: 'cropBanana', date: '2026-09-12', statusKey: 'statusDone', risk: { level: 'medium', percent: 47 }, screen: 'transport-results' },
{ id: 'h9', type: 'transport', cropKey: 'cropPineapple', date: '2026-09-02', statusKey: 'statusDone', risk: { level: 'high', percent: 71 }, screen: 'transport-results' }];