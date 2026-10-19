import type { ScreenId } from '../types/navigation';

// Single source of truth for URL paths in the web app.
export const screenPaths: Record<ScreenId, string> = {
  splash: '/welcome',
  language: '/language',
  onboarding: '/onboarding',
  login: '/login',
  register: '/register',
  home: '/home',
  farms: '/farms',
  'farm-form': '/farms/form',
  'farm-detail': '/farms/detail',
  records: '/records',
  'record-form': '/records/form',
  'crop-form': '/crop',
  'crop-results': '/crop/results',
  'disease-capture': '/disease',
  'disease-results': '/disease/results',
  'harvest-form': '/harvest',
  'harvest-results': '/harvest/results',
  'transport-form': '/transport',
  'transport-results': '/transport/results',
  packaging: '/packaging',
  history: '/history',
  notifications: '/notifications',
  more: '/more',
  settings: '/settings',
  'dev-notes': '/developer'
};

export const parentScreen: Partial<Record<ScreenId, ScreenId>> = {
  register: 'login',
  'farm-form': 'farms',
  'farm-detail': 'farms',
  'record-form': 'records',
  'crop-results': 'crop-form',
  'disease-results': 'disease-capture',
  'harvest-results': 'harvest-form',
  'transport-form': 'home',
  'transport-results': 'transport-form',
  packaging: 'home',
  history: 'home',
  notifications: 'home',
  settings: 'more',
  'dev-notes': 'more'
};