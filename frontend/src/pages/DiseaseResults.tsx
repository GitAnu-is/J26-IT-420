import React, { useEffect, useState } from 'react';
import {
  ShieldAlertIcon,
  CheckIcon,
  AlertTriangleIcon,
  FileTextIcon,
  ActivityIcon,
  BookOpenIcon,
  SparklesIcon
} from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { ResultGate } from '../components/ResultGate';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { diseasesApi } from '../api/diseasesApi';
import { DiseaseAnalysisResult, ManagementGuidance } from '../types/diseases';
import { images } from '../data/images';

export function DiseaseResults() {
  const { t } = useLanguage();
  const { current, replace } = useNavigation();
  const [view, setView] = useState<'photo' | 'heatmap'>('photo');
  const [liveResult, setLiveResult] = useState<DiseaseAnalysisResult | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<string>(images.bananaLeaf);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('agriguard.lastDiseaseResult');
      const photo = sessionStorage.getItem('agriguard.lastDiseasePhoto');
      if (raw) setLiveResult(JSON.parse(raw));
      if (photo) setOriginalPhoto(photo);
    } catch {
      // ignore
    }
  }, []);

  const assessmentId = liveResult?.assessmentId || liveResult?.savedAssessmentId || current.params?.id;
  const diseaseName =
    liveResult?.diseaseNameDisplay ||
    liveResult?.diseaseName ||
    (liveResult?.predictedDisease ? liveResult.predictedDisease.replace(/.*___/, '').replace(/_/g, ' ') : t('diseaseSigatoka'));

  const scientificName = liveResult?.scientificName || '';
  const confidence = liveResult?.confidence !== undefined ? liveResult.confidence : 0.87;
  const crop = (liveResult?.cropType || liveResult?.crop || 'BANANA').toUpperCase();
  const severityStatus = liveResult?.severityStatus || 'UNAVAILABLE';
  const severityValue = liveResult?.severity || liveResult?.severityLevel || null;

  const gradcamAvailable =
    liveResult?.gradcamAvailable || !!liveResult?.gradCamArtifactReference || !!liveResult?.gradcamUrl;

  const gradcamUrl = assessmentId ? diseasesApi.getGradCamUrl(assessmentId) : liveResult?.gradcamUrl || null;
  const guidance = liveResult?.managementGuidance;
  const guidanceCitation = liveResult?.guidanceCitation;


  const modelName = liveResult?.modelIdentifier || liveResult?.modelMetadata?.modelIdentifier || 'ResNet50';
  const modelVer = liveResult?.modelVersion || liveResult?.modelMetadata?.modelVersion || 'v1.0';

  return (
    <ScreenLayout
      title={t('fDiseaseTitle')}
      subtitle={`${t('officialName')}: ${t('fDiseaseOfficial')}`}
      showBack
      footer={
        <Button onClick={() => replace('disease-capture')}>
          {t('checkAnother')}
        </Button>
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
                  Component 2 — RESEARCH MODEL ({modelName})
                </span>
                <p className="mt-0.5 text-ink/80">
                  {liveResult?.modelMetadata?.limitations ||
                    'Deep learning convolutional model evaluated for foliar symptoms. Field diagnostics should be verified with your regional agricultural officer.'}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Model: {modelName} ({modelVer}) | Inference Latency: {liveResult?.executionLatencyMs ? `${Math.round(liveResult.executionLatencyMs)}ms` : 'Real-Time'}
                </p>
              </div>
            </div>
          </div>

          {/* Image & Grad-CAM Viewer */}
          <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            {gradcamAvailable && gradcamUrl ? (
              <div role="tablist" aria-label="Visualizations" className="grid grid-cols-2 gap-1 bg-canvas p-1">
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'photo'}
                  onClick={() => setView('photo')}
                  className={`min-h-10 rounded-xl text-xs font-semibold transition-all ${
                    view === 'photo' ? 'bg-white text-ink shadow-sm' : 'text-muted'
                  }`}
                >
                  {t('photoTab')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'heatmap'}
                  onClick={() => setView('heatmap')}
                  className={`min-h-10 rounded-xl text-xs font-semibold transition-all ${
                    view === 'heatmap' ? 'bg-white text-ink shadow-sm' : 'text-muted'
                  }`}
                >
                  {t('gradcamHeatmap')}
                </button>
              </div>
            ) : null}

            <div className="relative aspect-[4/3] w-full bg-black/10">
              {view === 'heatmap' && gradcamAvailable && gradcamUrl ? (
                <img
                  src={gradcamUrl}
                  alt="Grad-CAM Activation Heatmap"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={originalPhoto}
                  alt={t('photoTab')}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            {view === 'heatmap' && (
              <div className="p-3 text-xs text-muted border-t border-line/60 flex items-center justify-between">
                <span>Attention Activation: High (Red) → Low (Blue)</span>
                <span className="font-semibold text-brand-dark">PyTorch Grad-CAM</span>
              </div>
            )}
          </div>

          {/* Diagnostic Diagnosis Card */}
          <article className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-bold text-brand-dark">
                  {crop.replace('_', ' ')}
                </span>
                <h2 className="mt-1 text-2xl font-bold text-ink capitalize">{diseaseName}</h2>
                {scientificName ? (
                  <p className="text-xs italic text-muted">{scientificName}</p>
                ) : null}
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-brand">
                  {Math.round(confidence * 100)}%
                </span>
                <p className="text-xs text-muted">Confidence</p>
              </div>
            </div>

            <div className="h-2 rounded-full bg-line overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>

            {/* Severity Status Truthful Handling */}
            <div className="rounded-2xl border border-line bg-canvas p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <ActivityIcon className="h-4 w-4 text-muted" />
                  Severity Assessment Status
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    severityStatus === 'UNAVAILABLE'
                      ? 'bg-warn-tint text-warn-ink'
                      : severityStatus === 'NOT_APPLICABLE' || severityValue === 'HEALTHY'
                      ? 'bg-brand-tint text-brand-dark'
                      : 'bg-danger-tint text-danger'
                  }`}
                >
                  {severityStatus}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {severityStatus === 'UNAVAILABLE'
                  ? t('sevUnavailable')
                  : severityStatus === 'NOT_APPLICABLE' || severityValue === 'HEALTHY'
                  ? 'Healthy specimen baseline (no pathological lesions or necrosis detected).'
                  : `Assessed Severity Level: ${severityValue}`}
              </p>
            </div>

            {/* Evidence-Backed Disease Management Guidance */}
            {guidance && (
              <div className="space-y-3 border-t border-line/60 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <FileTextIcon className="h-4 w-4 text-brand" />
                  DOA Management Guidance
                </h3>

                {Array.isArray(guidance) ? (
                  <ul className="space-y-1.5 text-xs text-ink/80 pt-1">
                    {guidance.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckIcon className="mt-0.5 h-3.5 w-3.5 text-brand shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    {(guidance as ManagementGuidance).cultural && (guidance as ManagementGuidance).cultural!.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-ink">Cultural Practices</h4>
                        <ul className="mt-1 space-y-1 text-xs text-ink/80">
                          {(guidance as ManagementGuidance).cultural!.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckIcon className="mt-0.5 h-3.5 w-3.5 text-brand shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(guidance as ManagementGuidance).chemical && (guidance as ManagementGuidance).chemical!.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-xs font-semibold text-ink">Approved Interventions</h4>
                        <ul className="mt-1 space-y-1 text-xs text-ink/80">
                          {(guidance as ManagementGuidance).chemical!.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckIcon className="mt-0.5 h-3.5 w-3.5 text-brand shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(guidance as ManagementGuidance).biological && (guidance as ManagementGuidance).biological!.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-xs font-semibold text-ink">Biological Controls</h4>
                        <ul className="mt-1 space-y-1 text-xs text-ink/80">
                          {(guidance as ManagementGuidance).biological!.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckIcon className="mt-0.5 h-3.5 w-3.5 text-brand shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {guidanceCitation && (
                  <div className="rounded-xl bg-canvas p-3 text-[11px] text-muted border border-line/60 flex items-start gap-2 mt-3">
                    <BookOpenIcon className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                    <span>{guidanceCitation}</span>
                  </div>
                )}
              </div>
            )}
          </article>
        </div>
      </ResultGate>
    </ScreenLayout>
  );
}