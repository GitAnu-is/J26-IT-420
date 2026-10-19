import React from 'react';
import { CloudRainIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { addDays, toIso } from '../utils/date';

interface HarvestCalendarProps {
  today: string;
  start: string;
  end: string;
  rainDates: string[];
  days?: number;
}

export function HarvestCalendar({ today, start, end, rainDates, days = 21 }: HarvestCalendarProps) {
  const { t, formatDate, formatNumber } = useLanguage();
  const cells = Array.from({ length: days }, (_, i) => toIso(addDays(today, i)));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center" aria-hidden>
        {cells.slice(0, 7).map((d) =>
        <span key={d} className="pb-1 text-[11px] font-medium leading-tight text-muted">
            {formatDate(d, { weekday: 'short' })}
          </span>
        )}
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const inWindow = d >= start && d <= end;
          const isToday = d === today;
          const rain = rainDates.includes(d);
          const dayNum = Number(d.slice(8));
          return (
            <li
              key={d}
              aria-label={`${formatDate(d)}${inWindow ? `, ${t('harvestDays')}` : ''}${rain ? `, ${t('rainDay')}` : ''}`}
              className={`relative flex h-11 flex-col items-center justify-center rounded-xl text-sm font-semibold ${
              inWindow ? 'bg-brand text-white' : isToday ? 'bg-white text-ink ring-2 ring-brand' : 'bg-white text-ink'}`
              }>
              
              {formatNumber(dayNum)}
              {rain && <CloudRainIcon className={`h-3.5 w-3.5 ${inWindow ? 'text-white' : 'text-info'}`} aria-hidden />}
            </li>);

        })}
      </ol>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-brand" />
          {t('harvestDays')}
        </span>
        <span className="flex items-center gap-1.5">
          <CloudRainIcon className="h-3.5 w-3.5 text-info" aria-hidden />
          {t('rainDay')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-brand" />
          {t('today')}
        </span>
      </div>
    </div>);

}