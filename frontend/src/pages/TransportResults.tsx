import React, { useEffect, useState } from 'react';
import {
  PackageIcon,
  WarehouseIcon,
  RouteIcon,
  CheckIcon,
  HistoryIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  ShieldCheckIcon
} from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { ResultGate } from '../components/ResultGate';
import { RiskGauge } from '../components/RiskGauge';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { TransportationRiskResult } from '../types/transportation';

export function TransportResults() {
  const { t } = useLanguage();
  const { current, go } = useNavigation();
  const [liveResult, setLiveResult] = useState<TransportationRiskResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('agriguard.lastTransportResult');
      if (raw) {
        setLiveResult(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const probability = liveResult?.damageProbability ?? 0.32;
  const level = liveResult?.riskLevel ?? (current.params?.level as any) ?? 'MEDIUM';
  const crop = (liveResult?.cropType || liveResult?.crop || 'BANANA').toUpperCase();

  // Extract SHAP contributors (backend: shapExplanation.topContributors or topRiskFactors)
  const shapContributors =
    liveResult?.shapExplanation?.topContributors ||
    liveResult?.topRiskFactors ||
    [];

  const shapDisclaimer =
    liveResult?.shapExplanation?.scientificDisclaimer ||
    t('shapNotice') ||
    'SHAP feature attributions reflect statistical model contributions rather than physical causality.';

  // Extract packaging and logistics recommendations
  const pkgRec = liveResult?.packagingRecommendation;
  const recommendedBox = pkgRec?.recommendedPackaging || liveResult?.recommendations?.packaging?.[0];
  const storageList = pkgRec?.storageGuidance || liveResult?.recommendations?.storage || [];
  const handlingList = pkgRec?.handlingGuidance || liveResult?.recommendations?.handling || [];
  const transportList = pkgRec?.transportationGuidance || [];
  const references = pkgRec?.supportingReferences || [];

  const modelName = liveResult?.modelIdentifier || liveResult?.modelMetadata?.modelIdentifier || 'Gradient Boosting';
  const modelVer = liveResult?.modelVersion || liveResult?.modelMetadata?.modelVersion || 'v1.0';

  return (
    <ScreenLayout
      title={t('fTransportTitle')}
      subtitle={`${t('officialName')}: ${t('fTransportOfficial')}`}
      showBack
      footer={
        <div className="space-y-2">
          <Button
            variant="primary"
            icon={<PackageIcon className="h-4 w-4" />}
            onClick={() => go('packaging', { crop })}
          >
            Explore Smart Packaging Advice
          </Button>
          <Button
            variant="secondary"
            className="min-h-11"
            icon={<HistoryIcon className="h-4 w-4" />}
            onClick={() => go('history', { filter: 'transport' })}
          >
            {t('previousChecks')}
          </Button>
        </div>
      }
    >
      <ResultGate>
        <div className="px-4 pb-12 space-y-4">
          {/* Research Provenance Banner */}
          <div className="rounded-2xl border border-warn/40 bg-warn-tint p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warn-ink" />
              <div className="text-xs">
                <span className="font-bold text-warn-ink">
                  Component 4 — RESEARCH VALIDATION (INTERNALLY_EVALUATED)
                </span>
                <p className="mt-0.5 text-ink/80">
                  Transportation damage risk prediction powered by trained tree ensemble classifier with TreeExplainer SHAP attribution.
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Model: {modelName} ({modelVer}) | Evaluation Latency: {liveResult?.executionLatencyMs ? `${liveResult.executionLatencyMs}ms` : 'Real-Time'}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Gauge Card */}
          <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand-dark">
                {crop.replace('_', ' ')}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  level === 'HIGH'
                    ? 'bg-danger-tint text-danger'
                    : level === 'MEDIUM'
                    ? 'bg-warn-tint text-warn-ink'
                    : 'bg-brand-tint text-brand-dark'
                }`}
              >
                {level} RISK
              </span>
            </div>

            <div className="my-3">
              <RiskGauge value={probability} level={level.toLowerCase() as any} />
            </div>

            <p className="text-center text-sm font-semibold text-ink">
              Predicted Damage Probability: {Math.round(probability * 100)}%
            </p>
          </section>

          {/* Real SHAP Feature Importance Explanations */}
          {shapContributors.length > 0 && (
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-3">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  SHAP Explainability: Feature Attributions
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  {shapDisclaimer}
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {shapContributors.map((factor, idx) => {
                  const increases = factor.impact === 'INCREASES_RISK';
                  const title =
                    factor.displayName ||
                    factor.feature
                      .replace(/^cat__/, '')
                      .replace(/_/g, ' ')
                      .replace(/([A-Z])/g, ' $1')
                      .trim();

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-line/60 bg-canvas p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink truncate capitalize">
                          {title}
                        </p>
                        {factor.attribution !== undefined && (
                          <p className="text-[11px] text-muted">
                            Attribution: {factor.attribution > 0 ? `+${factor.attribution}` : factor.attribution}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold shrink-0 ${
                          increases ? 'bg-danger-tint text-danger' : 'bg-brand-tint text-brand-dark'
                        }`}
                      >
                        {increases ? '↑ Increases Risk' : '↓ Lowers Risk'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recommended Packaging Card */}
          {recommendedBox && (
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-2">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
                <PackageIcon className="h-4 w-4 text-brand" />
                Recommended Packaging Container
              </div>
              <p className="text-xs font-bold text-ink bg-brand-tint/40 p-3 rounded-2xl border border-brand/20">
                {recommendedBox}
              </p>
            </section>
          )}

          {/* Storage Guidance */}
          {storageList.length > 0 && (
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-2">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
                <WarehouseIcon className="h-4 w-4 text-brand" />
                Transit Micro-climate & Storage Guidelines
              </div>
              <ul className="space-y-2 text-xs text-ink/85 pt-1">
                {storageList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckIcon className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Handling Guidance */}
          {handlingList.length > 0 && (
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-2">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
                <ShieldCheckIcon className="h-4 w-4 text-brand" />
                Produce Handling Precautions
              </div>
              <ul className="space-y-2 text-xs text-ink/85 pt-1">
                {handlingList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckIcon className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Transportation Guidance */}
          {transportList.length > 0 && (
            <section className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-2">
              <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
                <RouteIcon className="h-4 w-4 text-brand" />
                Vehicle & Road Transit Rules
              </div>
              <ul className="space-y-2 text-xs text-ink/85 pt-1">
                {transportList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckIcon className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Supporting Agronomic References */}
          {references.length > 0 && (
            <section className="rounded-2xl border border-line/60 bg-canvas p-4 text-[11px] text-muted space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <BookOpenIcon className="h-3.5 w-3.5 text-brand" />
                Agronomic Standards & Official References
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                {references.map((ref, idx) => (
                  <li key={idx}>{ref}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </ResultGate>
    </ScreenLayout>
  );
}