import { SproutIcon, ScanSearchIcon, CalendarClockIcon, TruckIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from './translations/en';
import type { ScreenId } from '../types/navigation';

export type FeatureId = 'crop' | 'disease' | 'harvest' | 'transport';

export interface Feature {
  id: FeatureId;
  titleKey: TranslationKey;
  officialKey: TranslationKey;
  filterKey: TranslationKey;
  screen: ScreenId;
  icon: LucideIcon;
  color: string;
  tint: string;
}

export const features: Feature[] = [
{
  id: 'crop',
  titleKey: 'fCropTitle',
  officialKey: 'fCropOfficial',
  filterKey: 'filterCrop',
  screen: 'crop-form',
  icon: SproutIcon,
  color: '#176B45',
  tint: '#E6F2EA'
},
{
  id: 'disease',
  titleKey: 'fDiseaseTitle',
  officialKey: 'fDiseaseOfficial',
  filterKey: 'filterDisease',
  screen: 'disease-capture',
  icon: ScanSearchIcon,
  color: '#A8492B',
  tint: '#F8E9E3'
},
{
  id: 'harvest',
  titleKey: 'fHarvestTitle',
  officialKey: 'fHarvestOfficial',
  filterKey: 'filterHarvest',
  screen: 'harvest-form',
  icon: CalendarClockIcon,
  color: '#8A5E00',
  tint: '#FBF1D9'
},
{
  id: 'transport',
  titleKey: 'fTransportTitle',
  officialKey: 'fTransportOfficial',
  filterKey: 'filterTransport',
  screen: 'transport-form',
  icon: TruckIcon,
  color: '#2F6FA8',
  tint: '#E5EEF7'
}];