// SAMPLE values only — replaced by FastAPI model responses once the backend is connected.
import { images } from './images';
import type { Factor, RiskLevel } from '../types/forms';
import type { TranslationKey } from './translations/en';

export const cropRecommendations: {
  cropKey: TranslationKey;
  descKey: TranslationKey;
  score: number;
  image: string;
  conditions: {labelKey: TranslationKey;value: string;}[];
}[] = [
{
  cropKey: 'cropBanana',
  descKey: 'descBanana',
  score: 91,
  image: images.bananas,
  conditions: [
  { labelKey: 'facTemp', value: '26–30 °C' },
  { labelKey: 'facPh', value: '5.5–7.0' },
  { labelKey: 'facRainfall', value: '1,500–2,500 mm' }]

},
{
  cropKey: 'cropPineapple',
  descKey: 'descPineapple',
  score: 84,
  image: images.pineapples,
  conditions: [
  { labelKey: 'facTemp', value: '22–32 °C' },
  { labelKey: 'facPh', value: '4.5–6.5' }]

},
{
  cropKey: 'cropPepper',
  descKey: 'descPepper',
  score: 72,
  image: images.pepper,
  conditions: [
  { labelKey: 'facTemp', value: '20–30 °C' },
  { labelKey: 'facPh', value: '5.5–6.5' }]

}];


export const cropFactors: Factor[] = [
{ labelKey: 'facTemp', value: 0.82, effect: 'support' },
{ labelKey: 'facRainfall', value: 0.64, effect: 'support' },
{ labelKey: 'facPh', value: 0.51, effect: 'support' },
{ labelKey: 'facSoil', value: 0.38, effect: 'support' },
{ labelKey: 'facHumidity', value: 0.24, effect: 'against' }];


export const harvestFactors: Factor[] = [
{ labelKey: 'facGrowth', value: 0.78, effect: 'support' },
{ labelKey: 'facDays', value: 0.66, effect: 'support' },
{ labelKey: 'facTemp', value: 0.41, effect: 'support' },
{ labelKey: 'facRainForecast', value: 0.35, effect: 'against' }];


export const transportFactors: Factor[] = [
{ labelKey: 'facPacking', value: 0.86, effect: 'risk' },
{ labelKey: 'facHeat', value: 0.7, effect: 'risk' },
{ labelKey: 'facDuration', value: 0.55, effect: 'risk' },
{ labelKey: 'facRoad', value: 0.42, effect: 'risk' }];


export const harvestWindow = {
  today: '2026-10-14',
  start: '2026-10-24',
  end: '2026-10-28',
  rainDates: ['2026-10-27', '2026-10-28'],
  daysUntil: 10,
  readiness: 0.78
};

export type ForecastIcon = 'sun' | 'cloud' | 'rain' | 'storm';

export const harvestForecast: {date: string;icon: ForecastIcon;temp: number;rain: number;}[] = [
{ date: '2026-10-24', icon: 'sun', temp: 24, rain: 0 },
{ date: '2026-10-25', icon: 'cloud', temp: 23, rain: 2 },
{ date: '2026-10-26', icon: 'cloud', temp: 22, rain: 5 },
{ date: '2026-10-27', icon: 'storm', temp: 19, rain: 46 },
{ date: '2026-10-28', icon: 'rain', temp: 20, rain: 14 }];


export const transportSample: {
  level: RiskLevel;
  probability: number;
  cropKey: TranslationKey;
  quantity: number;
  originKey: TranslationKey;
  destKey: TranslationKey;
  distance: number;
  duration: number;
} = {
  level: 'high',
  probability: 0.68,
  cropKey: 'cropBanana',
  quantity: 800,
  originKey: 'placeDambulla',
  destKey: 'placeColombo',
  distance: 148,
  duration: 4.5
};