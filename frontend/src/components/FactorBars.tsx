import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Factor, FactorEffect } from '../types/forms';

const barColor: Record<FactorEffect, string> = {
  support: 'bg-brand',
  against: 'bg-warn',
  risk: 'bg-danger'
};

export function FactorBars({ factors, showLegend = true }: {factors: Factor[];showLegend?: boolean;}) {
  const { t } = useLanguage();
  const hasAgainst = factors.some((f) => f.effect === 'against');
  return (
    <div>
      <ul className="space-y-3.5">
        {factors.map((f) =>
        <li key={f.labelKey}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-medium leading-snug text-ink">{t(f.labelKey)}</span>
              {f.effect !== 'risk' &&
            <span className={`shrink-0 text-xs font-medium ${f.effect === 'support' ? 'text-brand' : 'text-warn-ink'}`}>
                  {t(f.effect === 'support' ? 'supports' : 'against')}
                </span>
            }
            </div>
            <div className="h-2.5 rounded-full bg-[#EDF1EA]" aria-hidden>
              <div className={`h-full rounded-full ${barColor[f.effect]}`} style={{ width: `${Math.round(f.value * 100)}%` }} />
            </div>
          </li>
        )}
      </ul>
      {showLegend && hasAgainst &&
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand" />
            {t('supports')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warn" />
            {t('against')}
          </span>
        </div>
      }
    </div>);

}