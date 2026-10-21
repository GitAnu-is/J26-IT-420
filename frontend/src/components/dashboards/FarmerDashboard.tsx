import React from 'react';
import {
  BellIcon,
  CloudSunIcon,
  MapPinIcon,
  SproutIcon,
  ScanSearchIcon,
  CalendarClockIcon,
  TruckIcon
} from 'lucide-react';
import { SectionHeading } from '../SectionHeading';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { initials } from '../../utils/user';
import type { User } from '../../types/auth';
import type { Farm } from '../../types/farm';
import type { AgriculturalRecord } from '../../types/record';
import type { HealthResponse } from '../../api/healthApi';

interface FarmerDashboardProps {
  user: User | null;
  farms: Farm[];
  records: AgriculturalRecord[];
  health: HealthResponse | null;
}

export function FarmerDashboard({ user, farms, records, health }: FarmerDashboardProps) {
  const { t, formatNumber, formatDate } = useLanguage();
  const { go } = useNavigation();
  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Farmer';
  const primaryFarm = farms[0];

  return (
    <div className="space-y-5">
      {/* User Header */}
      <header className="flex items-center gap-3 pt-2">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-base font-semibold text-white">
          {initials(user?.fullName || user?.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-snug text-ink lg:text-2xl">
            {t('greeting', { name: firstName })}
          </h1>
          <button
            type="button"
            onClick={() => go('farms')}
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted hover:text-brand"
          >
            <MapPinIcon className="h-3.5 w-3.5 text-brand" />
            {primaryFarm ? `${primaryFarm.farmName} (${primaryFarm.district})` : 'Register your first farm'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => go('notifications')}
          className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-card hover:bg-canvas transition"
          aria-label={t('notifTitle')}
        >
          <BellIcon className="h-5 w-5 text-ink" />
        </button>
      </header>

      {/* Agricultural Platform Status & Weather Banner */}
      <section className="rounded-3xl bg-brand p-5 text-white shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white/85">Weather Context · {primaryFarm?.district || 'Kurunegala'}</p>
            <div className="mt-1 flex items-center gap-3">
              <CloudSunIcon className="h-10 w-10 text-white" />
              <span className="text-4xl font-black">{formatNumber(28)}°C</span>
            </div>
            <p className="mt-1 text-xs font-medium text-white/90">Tropical Agricultural Climate</p>
          </div>
          <dl className="space-y-2 text-right text-xs">
            <div>
              <dt className="text-white/80">Relative Humidity</dt>
              <dd className="font-bold text-base text-white">{formatNumber(78)}%</dd>
            </div>
            <div>
              <dt className="text-white/80">Monsoon Rainfall</dt>
              <dd className="font-bold text-base text-white">{formatNumber(140)} mm</dd>
            </div>
          </dl>
        </div>

        {health && (
          <div className="mt-4 flex flex-wrap items-center justify-between border-t border-white/20 pt-3 text-[11px] text-white/90">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Backend Status: {health.status}
            </span>
            <span className="text-white/75">
              C1: {health.services?.c1_crop_recommendation?.ready ? 'Ready' : 'Offline'} ·{' '}
              C2: {health.services?.c2_disease_detection?.ready ? 'Ready' : 'Offline'} ·{' '}
              C4: {health.services?.c4_transportation_risk?.ready ? 'Ready' : 'Offline'}
            </span>
          </div>
        )}
      </section>

      {/* Farm & Records Quick Counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => go('farms')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-brand/40 transition"
        >
          <span className="text-xs text-muted font-medium">My Farms</span>
          <p className="mt-1 text-2xl font-black text-brand">{farms.length}</p>
          <span className="text-[11px] text-muted">Registered lands</span>
        </button>

        <button
          type="button"
          onClick={() => go('records')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-brand/40 transition"
        >
          <span className="text-xs text-muted font-medium">Field Records</span>
          <p className="mt-1 text-2xl font-black text-ink">{records.length}</p>
          <span className="text-[11px] text-muted">Crop plantings</span>
        </button>

        <button
          type="button"
          onClick={() => go('disease-capture')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-brand/40 transition"
        >
          <span className="text-xs text-muted font-medium">Plant Health</span>
          <p className="mt-1 text-2xl font-black text-brand-dark">Active</p>
          <span className="text-[11px] text-muted">Disease diagnostics</span>
        </button>

        <button
          type="button"
          onClick={() => go('packaging')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-brand/40 transition"
        >
          <span className="text-xs text-muted font-medium">Packaging</span>
          <p className="mt-1 text-2xl font-black text-ink">DOA/FAO</p>
          <span className="text-[11px] text-muted">Standards engine</span>
        </button>
      </div>

      {/* Research Components Grid */}
      <section className="space-y-3">
        <SectionHeading title={t('whatToDo')} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => go('crop-form')}
            className="flex min-h-[140px] flex-col justify-between rounded-3xl bg-white p-4 text-left shadow-card border border-line/60 hover:border-brand/40 transition"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <SproutIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-sm text-ink">{t('navCrop')}</p>
              <p className="text-[11px] text-muted">Random Forest Model</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => go('harvest-form')}
            className="flex min-h-[140px] flex-col justify-between rounded-3xl bg-white p-4 text-left shadow-card border border-line/60 hover:border-brand/40 transition"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <CalendarClockIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-sm text-ink">{t('navHarvest')}</p>
              <p className="text-[11px] text-muted">Biological Event Window</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => go('disease-capture')}
            className="flex min-h-[140px] flex-col justify-between rounded-3xl bg-white p-4 text-left shadow-card border border-line/60 hover:border-brand/40 transition"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-700">
              <ScanSearchIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-sm text-ink">{t('navDisease')}</p>
              <p className="text-[11px] text-muted">Grad-CAM Deep Learning</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => go('transport-form')}
            className="flex min-h-[140px] flex-col justify-between rounded-3xl bg-white p-4 text-left shadow-card border border-line/60 hover:border-brand/40 transition"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-50 text-sky-700">
              <TruckIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-sm text-ink">{t('filterTransport')}</p>
              <p className="text-[11px] text-muted">SHAP Damage Prediction</p>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Field Plantings Preview */}
      {records.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Recent Field Plantings</h3>
            <button
              type="button"
              onClick={() => go('records')}
              className="text-xs font-semibold text-brand hover:underline"
            >
              {t('viewAll')}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {records.slice(0, 2).map((rec) => {
              const rId = rec.id || rec._id || '';
              return (
                <div
                  key={rId}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-tint text-brand">
                      <SproutIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">{rec.cropType.replace('_', ' ')}</p>
                      <p className="text-[11px] text-muted">Planted: {formatDate(rec.plantingDate)}</p>
                    </div>
                  </div>
                  {rec.expectedHarvestDate && (
                    <span className="text-[11px] font-medium text-brand-dark">
                      Harvest: {formatDate(rec.expectedHarvestDate)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
