import React from 'react';
import {
  BellIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ScanSearchIcon,
  SproutIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  AlertTriangleIcon,
  PackageIcon,
  ActivityIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CloudSunIcon,
  ArrowRightIcon,
  FileTextIcon
} from 'lucide-react';
import { SectionHeading } from '../SectionHeading';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { initials } from '../../utils/user';
import type { User } from '../../types/auth';
import type { Farm } from '../../types/farm';
import type { AgriculturalRecord } from '../../types/record';
import type { HealthResponse } from '../../api/healthApi';

interface OfficerDashboardProps {
  user: User | null;
  farms: Farm[];
  records: AgriculturalRecord[];
  health: HealthResponse | null;
}

export function OfficerDashboard({ user, farms, records, health }: OfficerDashboardProps) {
  const { t, formatNumber, formatDate } = useLanguage();
  const { go } = useNavigation();
  const officerName = user?.fullName || user?.name || 'Officer';

  return (
    <div className="space-y-6">
      {/* Officer Header */}
      <header className="flex items-center gap-3 pt-2">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#18534F] text-base font-semibold text-white shadow-sm">
          {initials(officerName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold leading-snug text-ink lg:text-2xl">
              {t('officerGreeting', { name: officerName.split(' ')[0] })}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Agronomic Officer
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-muted">
            Department of Agriculture · Regional Extension Division (North Western & Central)
          </p>
        </div>
        <button
          type="button"
          onClick={() => go('notifications')}
          className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-card hover:bg-canvas transition"
          aria-label={t('notifTitle')}
        >
          <BellIcon className="h-5 w-5 text-ink" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />
        </button>
      </header>

      {/* Regional Agronomy & Surveillance Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#18534F] via-[#226D68] to-[#1F4B73] p-5 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <MapPinIcon className="h-3.5 w-3.5 text-emerald-200" />
              <span>Jurisdiction: Kurunegala & Matale Agro-Ecological Zones (IL1a/IL1b)</span>
            </div>
            <span className="rounded-full bg-emerald-400/20 border border-emerald-300/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-100">
              Active Regional Surveillance
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
              <p className="text-xs text-white/80">Agro-Climate Index</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black">{formatNumber(28)}°C</span>
                <span className="text-xs font-medium text-white/80">· RH {formatNumber(78)}%</span>
              </div>
              <p className="mt-1 text-[11px] text-white/70">Intermediate Zone rainfall: {formatNumber(140)}mm</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
              <p className="text-xs text-white/80">Disease Vulnerability</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-lg font-black text-amber-200">Elevated Spore Risk</span>
              </div>
              <p className="mt-1 text-[11px] text-white/70">High humidity favors fungal leaf pathogens</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
              <p className="text-xs text-white/80">AI Models Online</p>
              <div className="mt-1 flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-300" />
                <span className="text-lg font-black text-white">C1, C2, C4 Live</span>
              </div>
              <p className="mt-1 text-[11px] text-white/70">Unified FastAPI monolithic inference ready</p>
            </div>
          </div>

          {health && (
            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-white/15 pt-3 text-[11px] text-white/80">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Unified Backend Health: {health.status}
              </span>
              <span className="text-white/70">
                PyTorch CNN Grad-CAM · Random Forest Phenology · CatBoost SHAP
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Extension Officer Statistics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => go('farms')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-[#18534F]/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Regional Farms</span>
            <MapPinIcon className="h-4 w-4 text-[#18534F] opacity-75 group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-2xl font-black text-[#18534F]">{farms.length}</p>
          <span className="text-[11px] text-muted">Holdings under oversight</span>
        </button>

        <button
          type="button"
          onClick={() => go('records')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-[#18534F]/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Field Plantings</span>
            <ClipboardListIcon className="h-4 w-4 text-ink opacity-75 group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-2xl font-black text-ink">{records.length}</p>
          <span className="text-[11px] text-muted">Active farmer plantings</span>
        </button>

        <button
          type="button"
          onClick={() => go('disease-capture')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-[#18534F]/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Disease Alerts</span>
            <AlertTriangleIcon className="h-4 w-4 text-amber-600 opacity-75 group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-2xl font-black text-amber-700">2 Monitored</p>
          <span className="text-[11px] text-muted">Fungal blight watch</span>
        </button>

        <button
          type="button"
          onClick={() => go('harvest-form')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-[#18534F]/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Harvest Timing</span>
            <CalendarClockIcon className="h-4 w-4 text-emerald-600 opacity-75 group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-2xl font-black text-emerald-800">GDD Active</p>
          <span className="text-[11px] text-muted">Phenological guidance</span>
        </button>
      </div>

      {/* Extension Officer Core Advisory Tools */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading title="Officer Agronomic & Advisory Tools" />
          <span className="text-xs text-muted">Field Visit Console</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* C2 Rapid Leaf Pathology */}
          <button
            type="button"
            onClick={() => go('disease-capture')}
            className="flex flex-col justify-between rounded-3xl bg-white p-5 text-left shadow-card border border-line hover:border-emerald-600/40 transition group"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-700 group-hover:bg-rose-100 transition">
                <ScanSearchIcon className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                Component 2 AI
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-ink">Rapid Leaf Pathology Diagnosis</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                PyTorch CNN deep learning with Grad-CAM heatmap visualization to confirm foliar disease symptoms during farmer field audits.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-rose-700">
              <span>Launch Disease Diagnostic Triage</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* C1 Crop Suitability Advisory */}
          <button
            type="button"
            onClick={() => go('crop-form')}
            className="flex flex-col justify-between rounded-3xl bg-white p-5 text-left shadow-card border border-line hover:border-emerald-600/40 transition group"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition">
                <SproutIcon className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Component 1 AI
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-ink">Soil & Crop Suitability Advisory</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Random Forest ML model evaluating soil N-P-K, pH, and precipitation to recommend optimal cultivars with highest yield resilience.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <span>Run Crop Recommendation Model</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* C1 Harvest Window Planner */}
          <button
            type="button"
            onClick={() => go('harvest-form')}
            className="flex flex-col justify-between rounded-3xl bg-white p-5 text-left shadow-card border border-line hover:border-emerald-600/40 transition group"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition">
                <CalendarClockIcon className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                Component 1 Phenology
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-ink">Phenological Harvest Timing</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Growing Degree Days (GDD) and biological event window calculator to schedule harvest dates and prevent early/late harvest losses.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-700">
              <span>Evaluate Maturity Timing</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      </section>

      {/* Regional Surveillance Alerts (Agronomic Extension Context) */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-ink">Regional Disease Surveillance & Extension Advisories</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <AlertTriangleIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-amber-900">Solanaceae Early Blight Surveillance</p>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Relative humidity reached 78% in the Kurunegala division. Advise tomato and capsicum growers to ensure adequate field drainage and inspect lower leaf concentric ring lesions.
                </p>
                <button
                  type="button"
                  onClick={() => go('disease-capture')}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline"
                >
                  Verify Leaf Pathology <ArrowRightIcon className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
                <PackageIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-900">DOA Banana Packaging Directive</p>
                <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                  Prevent post-harvest compression injury during transport to Colombo. Remind farmers to use rigid ventilated plastic crates (max 4 crates high) instead of poly-sacks.
                </p>
                <button
                  type="button"
                  onClick={() => go('packaging')}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-900 hover:underline"
                >
                  View Packaging Standards <ArrowRightIcon className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Field Records Under Inspection */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">Farmer Field Plantings Under Oversight</h3>
            <p className="text-xs text-muted">Active plantings logged in division</p>
          </div>
          <button
            type="button"
            onClick={() => go('records')}
            className="text-xs font-semibold text-[#18534F] hover:underline"
          >
            {t('viewAll')} ({records.length})
          </button>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-center">
            <ClipboardListIcon className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm font-semibold text-ink">No Active Plantings Logged Yet</p>
            <p className="mt-1 text-xs text-muted">
              Farmers in your jurisdiction have not logged new planting records. You can log an inspection record or advise farmers.
            </p>
            <button
              type="button"
              onClick={() => go('record-form')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#18534F] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
            >
              Add Field Record
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {records.slice(0, 4).map((rec) => {
              const rId = rec.id || rec._id || '';
              return (
                <div
                  key={rId}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-sm hover:border-[#18534F]/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#18534F]">
                      <SproutIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">{rec.cropType.replace('_', ' ')}</p>
                      <p className="text-xs text-muted">
                        Planted: {formatDate(rec.plantingDate)}
                        {rec.soilMoisture !== undefined ? ` · Moisture: ${rec.soilMoisture}%` : ''}
                      </p>
                    </div>
                  </div>
                  {rec.expectedHarvestDate && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted block">Harvest Window</span>
                      <span className="text-xs font-bold text-[#18534F]">
                        {formatDate(rec.expectedHarvestDate)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
