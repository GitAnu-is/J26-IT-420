import React, { useEffect, useState } from 'react';
import { BookOpenIcon, CheckIcon, ChevronRightIcon, CalendarClockIcon, AlertTriangleIcon, InfoIcon, ShieldCheckIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { ResultGate } from '../components/ResultGate';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { cropFactors, cropRecommendations } from '../data/sampleResults';
import { images } from '../data/images';
import { RecommendCropResult } from '../types/crops';

const CROP_IMAGE_MAP: Record<string, string> = {
  BANANA: images.banana,
  PINEAPPLE: images.pineapple,
  BLACK_PEPPER: images.pepper
};

export function CropResults() {
  const { t, formatNumber } = useLanguage();
  const { current, go } = useNavigation();
  const [guideOpen, setGuideOpen] = useState(false);
  const [liveResult, setLiveResult] = useState<RecommendCropResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('agriguard.lastCropResult');
      if (raw) {
        setLiveResult(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const recommendedCrop = liveResult?.recommendedCrop || (current.params?.crop as any) || 'BANANA';
  const confidencePercent = liveResult?.confidence
    ? Math.round(liveResult.confidence * 100)
    : current.params?.confidence
    ? Math.round(parseFloat(current.params.confidence) * 100)
    : 88;

  const cropImage = CROP_IMAGE_MAP[recommendedCrop] || images.banana;
  const isPrototype = liveResult?.modelMetadata?.validationStatus === 'PROTOTYPE_SYNTHETIC';

  return (
    <ScreenLayout
      title={t('cropResultsTitle')}
      subtitle={`${t('officialName')}: ${t('fCropOfficial')}`}
      showBack
      action={
        <Button
          variant="primary"
          icon={<CalendarClockIcon className="h-4 w-4" />}
          onClick={() => go('harvest-form', { crop: recommendedCrop })}
          className="min-h-10 w-auto shrink-0 whitespace-nowrap px-4 py-2 text-xs"
        >
          Plan Harvest
        </Button>

      }
    >
      <ResultGate>
        <div className="px-4 pb-12">
          {/* Research Provenance & Validation Banner */}
          <div className="mb-4 rounded-2xl border border-warn/40 bg-warn-tint p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warn-ink" />
              <div className="text-xs">
                <span className="font-bold text-warn-ink">
                  {liveResult ? 'Live Model Output' : 'Demonstration Data'} —{' '}
                  {liveResult?.modelMetadata?.validationStatus || 'PROTOTYPE_SYNTHETIC'}
                </span>
                <p className="mt-0.5 text-ink/80">
                  {liveResult?.modelMetadata?.limitations || t('prototypeNotice')}
                </p>
                {liveResult?.modelMetadata?.modelVersion ? (
                  <p className="mt-1 text-[11px] text-muted">
                    Model: {liveResult.modelMetadata.modelIdentifier} v{liveResult.modelMetadata.modelVersion}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <article className="overflow-hidden rounded-3xl bg-white shadow-card border border-line">
            <div className="relative">
              <img src={cropImage} alt={recommendedCrop} className="h-48 w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm">
                Recommended Crop
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold leading-snug text-ink">
                    {recommendedCrop.replace('_', ' ')}
                  </h2>
                  <p className="text-xs text-muted">Predicted best fit for input soil and agro-ecological conditions</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold leading-none text-brand">{confidencePercent}%</p>
                  <p className="mt-1 text-xs text-muted">Model Match</p>
                </div>
              </div>

              {(liveResult?.classProbabilities || liveResult?.probabilities) && (
                <div className="mt-5 rounded-2xl bg-canvas p-4">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-2.5">
                    Class Probabilities (Random Forest)
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(liveResult.classProbabilities || liveResult.probabilities || {}).map(([cName, prob]) => {
                      const pPct = Math.round((prob as number) * 100);
                      const isTop = cName === recommendedCrop;
                      return (
                        <div key={cName}>
                          <div className="flex justify-between text-xs font-medium mb-1">
                            <span className={isTop ? 'font-bold text-brand-dark' : 'text-muted'}>
                              {cName.replace('_', ' ')}
                            </span>
                            <span className={isTop ? 'font-bold text-brand-dark' : 'text-muted'}>
                              {pPct}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-line overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isTop ? 'bg-brand' : 'bg-muted/40'}`}
                              style={{ width: `${pPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Button
                  variant="primary"
                  icon={<CalendarClockIcon className="h-4 w-4" />}
                  onClick={() => go('harvest-form', { crop: recommendedCrop })}
                >
                  Plan Harvest for {recommendedCrop.replace('_', ' ')}
                </Button>
                <Button
                  variant="secondary"
                  icon={<BookOpenIcon className="h-4 w-4" />}
                  onClick={() => setGuideOpen((o) => !o)}
                >
                  {guideOpen ? t('hideGuide') : t('viewGuide')}
                </Button>
              </div>

              {guideOpen && (
                <ul className="mt-5 space-y-2.5 border-t border-line pt-4 text-xs">
                  <li className="flex items-start gap-2 text-ink">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    Ensure soil drainage aligns with the seasonal monsoon cycle.
                  </li>
                  <li className="flex items-start gap-2 text-ink">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    Apply organic mulch to maintain steady soil moisture above 70%.
                  </li>
                  <li className="flex items-start gap-2 text-ink">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    Verify fertilizer application follows the Department of Agriculture (DOA) crop guidelines.
                  </li>
                </ul>
              )}
            </div>
          </article>
        </div>
      </ResultGate>
    </ScreenLayout>
  );
}