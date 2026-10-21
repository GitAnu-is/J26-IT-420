import React, { useState } from 'react';
import {
  PackageIcon,
  WarehouseIcon,
  ShieldCheckIcon,
  ThermometerIcon,
  DropletsIcon,
  WindIcon,
  CheckIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  BookOpenIcon
} from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Field } from '../components/Field';
import { ChoiceChips } from '../components/ChoiceChips';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { transportationApi } from '../api/transportationApi';
import { SupportedCrop } from '../types/farm';
import {
  PackagingType,
  RecommendPackagingInput,
  SmartPackagingResult,
  VehicleType
} from '../types/transportation';

const CROP_OPTIONS: { value: SupportedCrop; label: string }[] = [
  { value: 'BANANA', label: 'Banana (කෙසෙල් / வாழை)' },
  { value: 'PINEAPPLE', label: 'Pineapple (අන්නාසි / அன்னாசி)' },
  { value: 'BLACK_PEPPER', label: 'Black Pepper (ගම්මිරිස් / கருமிளகு)' }
];

const PACKAGING_OPTIONS: { value: PackagingType; label: string }[] = [
  { value: 'PLASTIC_CRATES', label: 'Plastic Crates' },
  { value: 'WOODEN_CRATES', label: 'Wooden Crates' },
  { value: 'CORRUGATED_BOXES', label: 'Corrugated Boxes' },
  { value: 'GUNNY_BAGS', label: 'Gunny Bags' },
  { value: 'JUTE_BAGS', label: 'Jute Bags' },
  { value: 'POLYETHYLENE_LINED_BAGS', label: 'Poly-Lined Bags' },
  { value: 'LOOSE_BULK', label: 'Loose / Bulk' }
];

export function SmartPackaging() {
  const { t } = useLanguage();
  const { current } = useNavigation();
  const presetCrop = (current.params?.crop as SupportedCrop) || 'BANANA';

  const [crop, setCrop] = useState<SupportedCrop>(presetCrop);
  const [distanceKm, setDistanceKm] = useState('120');
  const [durationHours, setDurationHours] = useState('4');
  const [currentPackaging, setCurrentPackaging] = useState<PackagingType>('PLASTIC_CRATES');
  const [temperature, setTemperature] = useState('28');
  const [humidity, setHumidity] = useState('75');

  const [result, setResult] = useState<SmartPackagingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchRecommendations = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!crop || !distanceKm) return;

    setLoading(true);
    setError(null);
    try {
      const payload: RecommendPackagingInput = {
        crop,
        distanceKm: parseFloat(distanceKm) || 100,
        expectedDurationHours: parseFloat(durationHours) || undefined,
        currentPackagingType: currentPackaging || undefined,
        temperatureCelsius: parseFloat(temperature) || undefined,
        humidityPercentage: parseFloat(humidity) || undefined
      };

      const res = await transportationApi.recommendPackaging(payload);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve packaging recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      wide
      title={t('packagingTitle')}
      subtitle="Source-backed post-harvest packaging, storage, and handling standards"
    >
      <div className="grid gap-6 px-4 pb-12 lg:grid-cols-12">
        {/* Input Form Column */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleFetchRecommendations}
            className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-4"
          >
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Transit Conditions
            </h2>

            {error && (
              <div className="rounded-2xl border border-danger/40 bg-danger-tint p-3 text-xs font-medium text-danger-ink">
                {error}
              </div>
            )}

            <Field label={t('cropType')}>
              <ChoiceChips
                name="crop"
                options={CROP_OPTIONS}
                value={crop}
                onChange={(val) => setCrop(val as SupportedCrop)}
                layout="stack"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Distance (km)">
                <TextInput
                  type="number"
                  min="1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  required
                />
              </Field>
              <Field label="Duration (hours)" optional>
                <TextInput
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Current Packaging Type" optional>
              <ChoiceChips
                name="packaging"
                options={PACKAGING_OPTIONS}
                value={currentPackaging}
                onChange={(val) => setCurrentPackaging(val as PackagingType)}
                layout="grid"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Transit Temp (°C)" optional>
                <TextInput
                  type="number"
                  suffix="°C"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </Field>
              <Field label="Humidity (%)" optional>
                <TextInput
                  type="number"
                  suffix="%"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                />
              </Field>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  Generating Rules...
                </span>
              ) : (
                'Get Packaging Advice'
              )}
            </Button>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          {!result && !loading && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white p-8 text-center text-muted">
              <PackageIcon className="h-12 w-12 text-brand/40 mb-3" />
              <h3 className="text-base font-bold text-ink">Smart Packaging Engine</h3>
              <p className="mt-1 text-xs max-w-sm">
                Enter your crop transit conditions on the left to receive validated Department of Agriculture (DOA) post-harvest packaging, storage, and handling standards.
              </p>
              <Button
                variant="secondary"
                onClick={() => handleFetchRecommendations()}
                className="mt-4 w-auto text-xs"
              >
                Load Default Standards
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Expert Knowledge Source Banner */}
              <div className="rounded-2xl border border-brand/30 bg-brand-tint/60 p-4 flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-brand-dark">
                    {result.expertSource || 'DOA / FAO Post-Harvest Standards'}
                  </span>
                  <p className="mt-0.5 text-ink/80">
                    Rule Version {result.ruleVersion} — Formulated to prevent mechanical compression, heat buildup, and post-harvest microbial damage.
                  </p>
                </div>
              </div>

              {/* Recommended Packaging Card */}
              <div className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-3">
                <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-bold text-brand-dark">
                  Optimal Container
                </span>
                <h3 className="text-xl font-bold text-ink">
                  {result.recommendedPackaging}
                </h3>
                {result.packagingMaterial && (
                  <p className="text-xs text-muted">
                    Material Specification: <span className="font-semibold text-ink">{result.packagingMaterial}</span>
                  </p>
                )}
              </div>

              {/* Storage Micro-climate Conditions */}
              {((result.storageGuidance && result.storageGuidance.length > 0) || result.storageConditions) && (
                <div className="rounded-3xl border border-line bg-white p-5 shadow-card space-y-3">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Transit Micro-climate & Storage Guidelines
                  </h4>
                  {result.storageConditions && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl bg-canvas p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <ThermometerIcon className="h-3.5 w-3.5 text-brand" />
                          Temperature
                        </div>
                        <p className="mt-1 font-bold text-sm text-ink">
                          {result.storageConditions.temperatureRange || '13°C – 15°C'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-canvas p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <DropletsIcon className="h-3.5 w-3.5 text-brand" />
                          Relative Humidity
                        </div>
                        <p className="mt-1 font-bold text-sm text-ink">
                          {result.storageConditions.humidityRange || '85% – 90%'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-canvas p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <WindIcon className="h-3.5 w-3.5 text-brand" />
                          Ventilation
                        </div>
                        <p className="mt-1 font-bold text-xs text-ink truncate">
                          {result.storageConditions.ventilation || 'Adequate airflow'}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.storageGuidance && result.storageGuidance.length > 0 && (
                    <ul className="space-y-1.5 text-xs text-ink/85 pt-1">
                      {result.storageGuidance.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckIcon className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Handling Advice */}
              {((result.handlingGuidance && result.handlingGuidance.length > 0) ||
                (result.handlingAdvice && result.handlingAdvice.length > 0)) && (
                <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2.5">
                    Handling Advice
                  </h4>
                  <ul className="space-y-1.5 text-xs text-ink/85">
                    {(result.handlingGuidance || result.handlingAdvice || []).map((advice, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckIcon className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                        <span>{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Transport Precautions */}
              {((result.transportationGuidance && result.transportationGuidance.length > 0) ||
                (result.transportPrecautions && result.transportPrecautions.length > 0)) && (
                <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2.5">
                    Transport Precautions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-ink/85">
                    {(result.transportationGuidance || result.transportPrecautions || []).map((prec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckIcon className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                        <span>{prec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Supporting References */}
              {result.supportingReferences && result.supportingReferences.length > 0 && (
                <div className="rounded-2xl border border-line/60 bg-canvas p-4 text-[11px] text-muted space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <BookOpenIcon className="h-3.5 w-3.5 text-brand" />
                    Agronomic Standards & Official References
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {result.supportingReferences.map((ref, idx) => (
                      <li key={idx}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ScreenLayout>
  );
}
