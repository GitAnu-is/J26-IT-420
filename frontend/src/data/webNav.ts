import {
  HouseIcon,
  SproutIcon,
  ScanSearchIcon,
  CalendarClockIcon,
  TruckIcon,
  PackageIcon,
  HistoryIcon,
  BellIcon,
  SettingsIcon,
  CodeXmlIcon,
  MapPinIcon,
  ClipboardListIcon
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from './translations/en';
import type { ScreenId } from '../types/navigation';
import { getNormalizedRole } from '../utils/user';

export interface WebNavItem {
  screen: ScreenId;
  icon: LucideIcon;
  labelKey: TranslationKey;
  match: ScreenId[];
}

export function getWebNavGroups(role?: string): { items: WebNavItem[] }[] {
  const norm = getNormalizedRole(role);

  if (norm === 'AGRICULTURAL_OFFICER') {
    return [
      {
        items: [
          { screen: 'home', icon: HouseIcon, labelKey: 'officerConsole', match: ['home'] },
          { screen: 'farms', icon: MapPinIcon, labelKey: 'regionalFarms', match: ['farms', 'farm-form', 'farm-detail'] },
          { screen: 'records', icon: ClipboardListIcon, labelKey: 'activePlantings', match: ['records', 'record-form'] },
          { screen: 'disease-capture', icon: ScanSearchIcon, labelKey: 'diseaseSurveillance', match: ['disease-capture', 'disease-results'] },
          { screen: 'crop-form', icon: SproutIcon, labelKey: 'cropSuitability', match: ['crop-form', 'crop-results'] },
          { screen: 'harvest-form', icon: CalendarClockIcon, labelKey: 'harvestTiming', match: ['harvest-form', 'harvest-results'] },
          { screen: 'packaging', icon: PackageIcon, labelKey: 'navPackaging', match: ['packaging'] }
        ]
      },
      {
        items: [
          { screen: 'history', icon: HistoryIcon, labelKey: 'historyTitle', match: ['history'] },
          { screen: 'notifications', icon: BellIcon, labelKey: 'notifTitle', match: ['notifications'] },
          { screen: 'settings', icon: SettingsIcon, labelKey: 'settingsTitle', match: ['settings', 'more'] },
          { screen: 'dev-notes', icon: CodeXmlIcon, labelKey: 'devNotes', match: ['dev-notes'] }
        ]
      }
    ];
  }

  if (norm === 'TRANSPORT_OPERATOR') {
    return [
      {
        items: [
          { screen: 'home', icon: HouseIcon, labelKey: 'logisticsCenter', match: ['home'] },
          { screen: 'transport-form', icon: TruckIcon, labelKey: 'transitRisk', match: ['transport-form', 'transport-results'] },
          { screen: 'packaging', icon: PackageIcon, labelKey: 'packagingEngine', match: ['packaging'] },
          { screen: 'history', icon: HistoryIcon, labelKey: 'transitHistory', match: ['history'] }
        ]
      },
      {
        items: [
          { screen: 'notifications', icon: BellIcon, labelKey: 'notifTitle', match: ['notifications'] },
          { screen: 'settings', icon: SettingsIcon, labelKey: 'settingsTitle', match: ['settings', 'more'] },
          { screen: 'dev-notes', icon: CodeXmlIcon, labelKey: 'devNotes', match: ['dev-notes'] }
        ]
      }
    ];
  }

  // Default: FARMER
  return [
    {
      items: [
        { screen: 'home', icon: HouseIcon, labelKey: 'navHome', match: ['home'] },
        { screen: 'farms', icon: MapPinIcon, labelKey: 'navFarms', match: ['farms', 'farm-form', 'farm-detail'] },
        { screen: 'records', icon: ClipboardListIcon, labelKey: 'navRecords', match: ['records', 'record-form'] },
        { screen: 'crop-form', icon: SproutIcon, labelKey: 'navCrop', match: ['crop-form', 'crop-results'] },
        { screen: 'harvest-form', icon: CalendarClockIcon, labelKey: 'navHarvest', match: ['harvest-form', 'harvest-results'] },
        { screen: 'disease-capture', icon: ScanSearchIcon, labelKey: 'navDisease', match: ['disease-capture', 'disease-results'] },
        { screen: 'transport-form', icon: TruckIcon, labelKey: 'filterTransport', match: ['transport-form', 'transport-results'] },
        { screen: 'packaging', icon: PackageIcon, labelKey: 'navPackaging', match: ['packaging'] }
      ]
    },
    {
      items: [
        { screen: 'history', icon: HistoryIcon, labelKey: 'historyTitle', match: ['history'] },
        { screen: 'notifications', icon: BellIcon, labelKey: 'notifTitle', match: ['notifications'] },
        { screen: 'settings', icon: SettingsIcon, labelKey: 'settingsTitle', match: ['settings', 'more'] },
        { screen: 'dev-notes', icon: CodeXmlIcon, labelKey: 'devNotes', match: ['dev-notes'] }
      ]
    }
  ];
}

export const webNavGroups = getWebNavGroups('FARMER');