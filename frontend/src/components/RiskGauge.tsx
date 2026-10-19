import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { RiskLevel } from '../types/forms';

const CX = 110;
const CY = 112;
const R = 88;

const levelColor: Record<RiskLevel, string> = { low: '#2E8B57', medium: '#E8A317', high: '#C0392B' };
const levelKey = { low: 'riskLow', medium: 'riskMedium', high: 'riskHigh' } as const;

export function RiskGauge({ value, level }: {value: number;level: RiskLevel;}) {
  const { t, formatNumber } = useLanguage();
  const needleAngle = 180 - value * 180;
  const tip = point(needleAngle, R - 26);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 124" className="w-full max-w-[240px]" role="img" aria-label={`${t(levelKey[level])}, ${Math.round(value * 100)}%`}>
        <path d={arc(178, 122)} stroke="#2E8B57" strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d={arc(118, 62)} stroke="#E8A317" strokeWidth="16" fill="none" />
        <path d={arc(58, 2)} stroke="#C0392B" strokeWidth="16" fill="none" strokeLinecap="round" />
        <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke="#17251D" strokeWidth="4" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="8" fill="#17251D" />
        <circle cx={CX} cy={CY} r="3" fill="#FFFFFF" />
      </svg>
      <p className="mt-2 text-2xl font-bold leading-snug" style={{ color: levelColor[level] }}>
        {t(levelKey[level])}
      </p>
      <p className="text-sm text-muted">
        {t('damageChance')}: <span className="font-semibold text-ink">{formatNumber(value, { style: 'percent' })}</span>
      </p>
    </div>);

}

function point(angleDeg: number, r = R) {
  const a = angleDeg * Math.PI / 180;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
}

function arc(fromDeg: number, toDeg: number) {
  const s = point(fromDeg);
  const e = point(toDeg);
  return `M ${s.x} ${s.y} A ${R} ${R} 0 0 1 ${e.x} ${e.y}`;
}