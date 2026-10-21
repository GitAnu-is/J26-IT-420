import React from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { SampleTag } from './SampleTag';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { features } from '../data/features';
import type { HistoryItem } from '../data/history';

const riskTone = {
  low: 'bg-[#E3F3E8] text-[#1F6B3E]',
  medium: 'bg-warn-tint text-warn-ink',
  high: 'bg-danger-tint text-danger-ink'
};
const riskKey = { low: 'riskLow', medium: 'riskMedium', high: 'riskHigh' } as const;

export function HistoryRow({ item }: {item: HistoryItem;}) {
  const { t, formatDate } = useLanguage();
  const { go } = useNavigation();
  const feature = features.find((f) => f.id === item.type)!;
  const Icon = feature.icon;

  const result = item.risk ?
  t(riskKey[item.risk.level]) :
  item.harvestDate ?
  t('harvestBy', { date: formatDate(item.harvestDate, { day: 'numeric', month: 'short' }) }) :
  item.resultKey ?
  t(item.resultKey) :
  '';

  return (
    <button type="button" onClick={() => go(item.screen)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-canvas">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: feature.tint, color: feature.color }}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold leading-snug text-ink">{t(item.cropKey)}</span>
          <span className="text-xs text-muted">· {t(feature.filterKey)}</span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold leading-tight ${item.risk ? riskTone[item.risk.level] : 'bg-canvas text-ink'}`}>{result}</span>
          <SampleTag />
        </span>
        <span className="mt-1 block text-xs text-muted">
          {formatDate(item.date)} · {t(item.statusKey)}
        </span>
      </span>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted" aria-hidden />
    </button>);

}