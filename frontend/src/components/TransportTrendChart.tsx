import React from 'react';
import { SampleTag } from './SampleTag';
import { useLanguage } from '../contexts/LanguageContext';
import type { HistoryItem } from '../data/history';

const colors = { low: '#2E8B57', medium: '#E8A317', high: '#C0392B' };
const W = 320;
const H = 150;
const PAD_L = 30;
const PAD_B = 22;
const PAD_T = 14;

export function TransportTrendChart({ items }: {items: HistoryItem[];}) {
  const { t, formatDate, formatNumber } = useLanguage();
  const points = items.filter((i) => i.risk).sort((a, b) => a.date.localeCompare(b.date));
  if (points.length === 0) return null;

  const plotW = W - PAD_L - 6;
  const plotH = H - PAD_B - PAD_T;
  const slot = plotW / points.length;
  const barW = Math.min(28, slot * 0.55);
  const y = (pct: number) => PAD_T + plotH * (1 - pct / 100);

  return (
    <section className="mb-5 rounded-3xl bg-white p-5 shadow-card">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold leading-snug text-ink">{t('trendTitle')}</h2>
        <SampleTag />
      </div>
      <p className="mb-3 text-xs text-muted">{t('trendNote')}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t('trendTitle')}>
        {[0, 50, 100].map((g) =>
        <g key={g}>
            <line x1={PAD_L} x2={W - 6} y1={y(g)} y2={y(g)} stroke="#E2E8DF" strokeDasharray={g === 0 ? undefined : '3 3'} />
            <text x={PAD_L - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill="#56655C">
              {formatNumber(g)}%
            </text>
          </g>
        )}
        {points.map((p, i) => {
          const cx = PAD_L + slot * i + slot / 2;
          const pct = p.risk!.percent;
          return (
            <g key={p.id}>
              <rect x={cx - barW / 2} y={y(pct)} width={barW} height={y(0) - y(pct)} rx="5" fill={colors[p.risk!.level]} />
              <text x={cx} y={y(pct) - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#17251D">
                {formatNumber(pct)}
              </text>
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="9" fill="#56655C">
                {formatDate(p.date, { day: 'numeric', month: 'short' })}
              </text>
            </g>);

        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {(['low', 'medium', 'high'] as const).map((l) =>
        <span key={l} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[l] }} />
            {t(l === 'low' ? 'riskLow' : l === 'medium' ? 'riskMedium' : 'riskHigh')}
          </span>
        )}
      </div>
    </section>);

}