import { CloudRainIcon, CalendarClockIcon, ScanSearchIcon, TruckIcon, PackageIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKey } from './translations/en';
import type { ScreenId } from '../types/navigation';

export type AlertSeverity = 'urgent' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  severity: AlertSeverity;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  ago: {key: TranslationKey;n: number;};
  icon: LucideIcon;
  screen: ScreenId;
}

export const notifications: AppNotification[] = [
{ id: 'n4', severity: 'urgent', titleKey: 'n4Title', bodyKey: 'n4Body', ago: { key: 'hoursAgo', n: 1 }, icon: TruckIcon, screen: 'transport-results' },
{ id: 'n1', severity: 'warning', titleKey: 'n1Title', bodyKey: 'n1Body', ago: { key: 'hoursAgo', n: 3 }, icon: CloudRainIcon, screen: 'harvest-results' },
{ id: 'n3', severity: 'warning', titleKey: 'n3Title', bodyKey: 'n3Body', ago: { key: 'daysAgo', n: 1 }, icon: ScanSearchIcon, screen: 'disease-capture' },
{ id: 'n2', severity: 'info', titleKey: 'n2Title', bodyKey: 'n2Body', ago: { key: 'daysAgo', n: 2 }, icon: CalendarClockIcon, screen: 'harvest-results' },
{ id: 'n5', severity: 'info', titleKey: 'n5Title', bodyKey: 'n5Body', ago: { key: 'daysAgo', n: 4 }, icon: PackageIcon, screen: 'transport-results' }];