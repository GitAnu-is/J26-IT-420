import React, { useEffect, useState } from 'react';
import { CalendarIcon, ClockIcon, AlertTriangleIcon, CheckCircle2Icon, HistoryIcon, ArrowRightIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { ResultGate } from '../components/ResultGate';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { PredictHarvestResult } from '../types/crops';

export function HarvestResults() {
  const { t, formatDate, formatNumber } = useLanguage();
  const { current, go } = useNavigation();
  const [liveResult, setLiveResult] = useState<PredictHarvestResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('agriguard.lastHarvestResult');
      if (raw) {
        setLiveResult(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const crop = liveResult?.cropType || liveResult?.crop || (current.params?.crop as any) || 'BANANA';
  const expectedDate =
    liveResult?.predictedHarvestDate || liveResult?.expectedHarvestDate || current.params?.date || '2026-12-15';
  const durationDays = liveResult?.predictedDurationDays || 120;
  const windowDays = liveResult?.confidenceMarginDays || liveResult?.harvestWindow?.windowDays || 14;

  return (
    <ScreenLayout
      title={t('fHarvestTitle')}
      subtitle={`${t('officialName')}: ${t('fHarvestOfficial')}`}
      showBack
      action={
        <Button
          variant="secondary"
          icon={<HistoryIcon className="h-4 w-4" />}
          onClick={() => go('history', { filter: 'crop' })}
          className="min-h-10 w-auto shrink-0 whitespace-nowrap px-4 py-2 text-xs"
        >
          {t('historyTitle')}
        </Button>

      }
    >
      <ResultGate>
        <div className="px-4 pb-12">
          {/* Provenance and Validation Disclosure Banner */}
          <div className="mb-4 rounded-2xl border border-warn/40 bg-warn-tint p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warn-ink" />
              <div className="text-xs">
                <span className="font-bold text-warn-ink">
                  Harvest Prediction Model — {liveResult?.modelMetadata?.validationStatus || 'PROTOTYPE_SYNTHETIC'}
                </span>
                <p className="mt-0.5 text-ink/80">
                  {liveResult?.modelMetadata?.limitations ||
                    'Harvest window bounds reflect model RMSE standard error and must not be interpreted as statistically calibrated confidence intervals.'}
                </p>
                {liveResult?.modelMetadata?.modelVersion ? (
                  <p className="mt-1 text-[11px] text-muted">
                    Model: {liveResult.modelMetadata.modelIdentifier} v{liveResult.modelMetadata.modelVersion}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <article className="rounded-3xl border border-line bg-white p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand-dark">
                  {crop.replace('_', ' ')}
                </span>
                <h2 className="mt-2 text-2xl font-bold text-ink">
                  Target: {formatDate(expectedDate)}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Predicted harvest maturity from biological reference event
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-brand">{durationDays}</span>
                <p className="text-xs text-muted">Days from start</p>
              </div>
            </div>

            {liveResult?.cropReferenceEvent && (
              <div className="mt-4 rounded-2xl bg-canvas p-3.5 text-xs text-ink">
                <span className="font-semibold">Starting Reference Event:</span>{' '}
                <span className="font-medium text-brand-dark">
                  {liveResult.cropReferenceEvent.replace('_', ' ')}
                </span>{' '}
                ({formatDate(liveResult.biologicalEventDate || '')})
              </div>
            )}

            {/* Harvest Window Section */}
            {liveResult?.harvestWindow ? (
              <div className="mt-5 rounded-2xl border border-line/80 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  Optimal Harvest Window (±{Math.round(windowDays / 2)} Days)
                </h3>
                <div className="flex items-center justify-between text-sm font-semibold text-ink">
                  <div className="text-left">
                    <span className="block text-[11px] text-muted font-normal">Earliest Safe Harvest</span>
                    {formatDate(liveResult.harvestWindow.startDate || liveResult.harvestWindow.earliestDate || '')}
                  </div>
                  <div className="text-center px-2">
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">
                      {windowDays} Days Window
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] text-muted font-normal">Latest Safe Harvest</span>
                    {formatDate(liveResult.harvestWindow.endDate || liveResult.harvestWindow.latestDate || '')}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => go('transport-form', { crop })}
                icon={<ArrowRightIcon className="h-4 w-4" />}
              >
                Assess Transport Risk for Harvest
              </Button>
            </div>
          </article>
        </div>
      </ResultGate>
    </ScreenLayout>
  );
}