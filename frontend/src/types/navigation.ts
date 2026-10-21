export type ScreenId =
  | 'splash'
  | 'language'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'home'
  | 'farms'
  | 'farm-form'
  | 'farm-detail'
  | 'records'
  | 'record-form'
  | 'crop-form'
  | 'crop-results'
  | 'disease-capture'
  | 'disease-results'
  | 'harvest-form'
  | 'harvest-results'
  | 'transport-form'
  | 'transport-results'
  | 'packaging'
  | 'history'
  | 'notifications'
  | 'more'
  | 'settings'
  | 'dev-notes';

export type TabId = 'home' | 'farms' | 'records' | 'crop' | 'disease' | 'harvest' | 'transport' | 'packaging' | 'history' | 'more';

export type ScreenParams = Record<string, string>;

export interface ScreenEntry {
  id: ScreenId;
  params?: ScreenParams;
}

export type ResultMode = 'sample' | 'loading' | 'error' | 'offline' | 'empty';