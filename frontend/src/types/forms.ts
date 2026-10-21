import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from '../data/translations/en';

export interface Option {
  value: string;
  labelKey?: TranslationKey;
  label?: string;
  descKey?: TranslationKey;
  icon?: LucideIcon;
}

export type FactorEffect = 'support' | 'against' | 'risk';

export interface Factor {
  labelKey: TranslationKey;
  value: number;
  effect: FactorEffect;
}

export type RiskLevel = 'low' | 'medium' | 'high';