import React from 'react';
import {
  BellIcon,
  TruckIcon,
  PackageIcon,
  HistoryIcon,
  ThermometerIcon,
  GaugeIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ActivityIcon,
  LayersIcon,
  WindIcon
} from 'lucide-react';
import { SectionHeading } from '../SectionHeading';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { initials } from '../../utils/user';
import type { User } from '../../types/auth';
import type { HealthResponse } from '../../api/healthApi';

interface TransportDashboardProps {
  user: User | null;
  health: HealthResponse | null;
}

export function TransportDashboard({ user, health }: TransportDashboardProps) {
  const { t, formatNumber } = useLanguage();
  const { go } = useNavigation();
  const operatorName = user?.fullName || user?.name || 'Operator';

  return (
    <div className="space-y-6">
      {/* Operator Header */}
      <header className="flex items-center gap-3 pt-2">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1F4B73] text-base font-semibold text-white shadow-sm">
          {initials(operatorName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold leading-snug text-ink lg:text-2xl">
              {t('operatorGreeting', { name: operatorName.split(' ')[0] })}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
              <TruckIcon className="h-3.5 w-3.5" />
              Logistics Dispatch
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-muted">
            Produce Logistics Dispatch · Dambulla / Peliyagoda Dedicated Freight Corridor
          </p>
        </div>
        <button
          type="button"
          onClick={() => go('notifications')}
          className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-card hover:bg-canvas transition"
          aria-label={t('notifTitle')}
        >
          <BellIcon className="h-5 w-5 text-ink" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-sky-600 ring-2 ring-white" />
        </button>
      </header>

      {/* Logistics & Cold-Chain Command Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F4B73] via-[#1B3B5F] to-[#122A44] p-5 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <MapPinIcon className="h-3.5 w-3.5 text-sky-300" />
              <span>Corridor: Dambulla Dedicated Economic Centre ⇄ Peliyagoda (Colombo)</span>
            </div>
            <span className="rounded-full bg-sky-400/20 border border-sky-300/40 px-2.5 py-0.5 text-[11px] font-semibold text-sky-200">
              C4 CatBoost & XGBoost Active
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
              <p className="text-xs text-white/80">Transit Environment</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black">{formatNumber(30.5)}°C</span>
                <span className="text-xs font-medium text-white/80">· RH {formatNumber(82)}%</span>
              </div>
              <p className="mt-1 text-[11px] text-white/70">Distance: 148 km · Est. Duration: 3.8 hrs</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
              <p className="text-xs text-white/80">Cargo Damage Risk</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-lg font-black text-emerald-200">7.4% Avg Loss Rate</span>
              </div>
              <p className="mt-1 text-[11px] text-white/70">Controlled vibration & crate cushioning</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
              <p className="text-xs text-white/80">Packaging Standard</p>
              <div className="mt-1 flex items-center gap-1.5">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-300" />
                <span className="text-lg font-black text-white">DOA Plastic Crates</span>
              </div>
              <p className="mt-1 text-[11px] text-white/70">Poly-sacks prohibited to avoid bruising</p>
            </div>
          </div>

          {health && (
            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-white/15 pt-3 text-[11px] text-white/80">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                Logistics Model Status: {health.services?.c4_transportation_risk?.ready ? 'Ready' : 'Online'}
              </span>
              <span className="text-white/70">
                SHAP Explainability · Banana, Pineapple & Black Pepper Rules
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Logistics Operator Metrics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => go('transport-form')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-[#1F4B73]/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Risk Evaluator</span>
            <GaugeIcon className="h-4 w-4 text-[#1F4B73] opacity-75 group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-2xl font-black text-[#1F4B73]">C4 Live</p>
          <span className="text-[11px] text-muted">Pre-dispatch calculation</span>
        </button>

        <button
          type="button"
          onClick={() => go('packaging')}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-[#1F4B73]/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Smart Packaging</span>
            <PackageIcon className="h-4 w-4 text-ink opacity-75 group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-2xl font-black text-ink">DOA / FAO</p>
          <span className="text-[11px] text-muted">Crate & stacking rules</span>
        </button>

        <button
          type="button"
          onClick={() => go('history', { filter: 'transport' })}
          className="rounded-3xl border border-line bg-white p-4 text-left shadow-card hover:border-[#1F4B73]/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Transit History</span>
            <HistoryIcon className="h-4 w-4 text-sky-600 opacity-75 group-hover:opacity-100" />
          </div>
          <p className="mt-1 text-2xl font-black text-sky-700">Audit Logs</p>
          <span className="text-[11px] text-muted">Evaluated trips</span>
        </button>

        <div className="rounded-3xl border border-line bg-white p-4 text-left shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Fleet Cold-Chain</span>
            <ThermometerIcon className="h-4 w-4 text-emerald-600 opacity-75" />
          </div>
          <p className="mt-1 text-2xl font-black text-emerald-700">13° - 14°C</p>
          <span className="text-[11px] text-muted">Banana optimal range</span>
        </div>
      </div>

      {/* Core Logistics Actions */}
      <section className="space-y-3">
        <SectionHeading title="Logistics Tools & Risk Models" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* C4 Route Risk Calculator */}
          <button
            type="button"
            onClick={() => go('transport-form')}
            className="flex flex-col justify-between rounded-3xl bg-white p-5 text-left shadow-card border border-line hover:border-sky-600/40 transition group"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-700 group-hover:bg-sky-100 transition">
                <TruckIcon className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                Component 4 AI
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-ink">Route Damage Risk Predictor</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                CatBoost & XGBoost ML models computing damage probabilities based on vehicle type, road condition, transit duration, temperature, and vibration with SHAP factors.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-sky-700">
              <span>Evaluate Dispatch Risk</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* C4 Smart Packaging Standards Engine */}
          <button
            type="button"
            onClick={() => go('packaging')}
            className="flex flex-col justify-between rounded-3xl bg-white p-5 text-left shadow-card border border-line hover:border-sky-600/40 transition group"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition">
                <PackageIcon className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                DOA / FAO Expert Rules
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-ink">Smart Packaging Engine</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Official container, ventilation, stacking height, and cushioning specifications for Banana, Pineapple, and Black Pepper to eliminate mechanical transit damage.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-700">
              <span>View Packaging Protocols</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* Route History & Log */}
          <button
            type="button"
            onClick={() => go('history', { filter: 'transport' })}
            className="flex flex-col justify-between rounded-3xl bg-white p-5 text-left shadow-card border border-line hover:border-sky-600/40 transition group"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100 transition">
                <HistoryIcon className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                Audit Trail
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-ink">Cargo Transit History</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Historical record of previously evaluated routes, recorded transit times, road vibration conditions, and actual cargo quality outcomes.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-700">
              <span>Review Past Dispatches</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      </section>

      {/* Perishable Cold-Chain & Cushioning Matrix */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-ink">Post-Harvest Transport Standards for Supported Perishables</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Banana */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Banana
              </span>
              <span className="text-xs font-semibold text-ink">13°C – 14°C</span>
            </div>
            <p className="mt-2 text-xs font-bold text-ink">Rigid Plastic Crates (Max 4-high)</p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Never use gunny sacks. Line crates with dried banana leaves or foam netting to prevent finger abrasion. Maintain ventilation to avoid ethylene accumulation.
            </p>
          </div>

          {/* Pineapple */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Pineapple
              </span>
              <span className="text-xs font-semibold text-ink">7°C – 10°C</span>
            </div>
            <p className="mt-2 text-xs font-bold text-ink">Upright Telescopic Cartons</p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Pack fruit vertically crown-upwards in cellular dividers. Maintain 85–90% relative humidity. Avoid double-stacking without rigid interlock trays.
            </p>
          </div>

          {/* Black Pepper */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-full">
                Black Pepper
              </span>
              <span className="text-xs font-semibold text-ink">Ambient Dry (&lt;28°C)</span>
            </div>
            <p className="mt-2 text-xs font-bold text-ink">Moisture Barrier Poly-Lined Bags</p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Ensure moisture content &lt; 12% prior to loading. Stack on raised wooden pallets (min 15 cm above truck bed) to prevent floor condensation and mold growth.
            </p>
          </div>
        </div>
      </section>

      {/* Transit Loss Mitigation Protocols Checklist */}
      <section className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
        <h4 className="text-xs font-bold text-[#1F4B73] uppercase tracking-wide">
          Department of Agriculture Dispatch Protocols
        </h4>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 text-xs text-[#1F4B73]">
          <div className="flex items-start gap-2">
            <span className="h-5 w-5 shrink-0 rounded-full bg-sky-100 grid place-items-center font-bold text-sky-700">1</span>
            <span>Pre-cool produce prior to vehicle loading to remove ambient field heat.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="h-5 w-5 shrink-0 rounded-full bg-sky-100 grid place-items-center font-bold text-sky-700">2</span>
            <span>Eliminate gunny bags; use stackable ventilated plastic crates for all fresh produce.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="h-5 w-5 shrink-0 rounded-full bg-sky-100 grid place-items-center font-bold text-sky-700">3</span>
            <span>Segregate high ethylene producers (ripening bananas) from sensitive leafy crops.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="h-5 w-5 shrink-0 rounded-full bg-sky-100 grid place-items-center font-bold text-sky-700">4</span>
            <span>Secure cargo with tension straps to reduce vibration shocks on rural feeder roads.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
