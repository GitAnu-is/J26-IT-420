import React, { useEffect, useState } from 'react';
import { CloudDownloadIcon, CheckCircle2Icon, AlertCircleIcon, RefreshCwIcon, MapPinIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { FormSteps } from '../components/FormSteps';
import { Field } from '../components/Field';
import { SelectInput } from '../components/SelectInput';
import { ChoiceChips } from '../components/ChoiceChips';
import { TextInput } from '../components/TextInput';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { districtOptions, seasonOptions, soilOptions } from '../data/options';
import { isValidPh } from '../utils/validation';
import { cropsApi } from '../api/cropsApi';
import { farmsApi } from '../api/farmsApi';
import { Farm } from '../types/farm';

type Errors = Partial<Record<'region' | 'season' | 'soil' | 'ph' | 'n' | 'p' | 'k', string>>;

export function CropForm() {
  const { t } = useLanguage();
  const { current, go } = useNavigation();
  const presetFarmId = current.params?.farmId;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState(presetFarmId || '');

  const [v, setV] = useState({
    region: 'Kurunegala',
    season: 'YALA',
    soil: 'Sandy Clay Loam',
    ph: '6.5',
    n: '85',
    p: '42',
    k: '55',
    temp: '28',
    humidity: '78',
    rainfall: '140'
  });
  const [errors, setErrors] = useState<Errors>({});
  const [filled, setFilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (key: keyof typeof v) => (value: string) => setV((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    farmsApi
      .getFarms()
      .then((fList) => {
        setFarms(fList);
        if (presetFarmId) {
          const matched = fList.find((f) => (f.id || f._id) === presetFarmId);
          if (matched) {
            setV((s) => ({
              ...s,
              region: matched.district || s.region,
              soil: matched.soilType || s.soil
            }));
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load user farms:', err);
      });
  }, [presetFarmId]);

  const validateLand = () => {
    const e: Errors = { region: v.region ? undefined : t('errChoose'), season: v.season ? undefined : t('errChoose') };
    setErrors(e);
    return !e.region && !e.season;
  };

  const validateSoil = () => {
    const e: Errors = {
      soil: v.soil ? undefined : t('errChoose'),
      ph: isValidPh(v.ph) ? undefined : t('errPh'),
      n: v.n && Number(v.n) >= 0 ? undefined : t('errRequired'),
      p: v.p && Number(v.p) >= 0 ? undefined : t('errRequired'),
      k: v.k && Number(v.k) >= 0 ? undefined : t('errRequired')
    };
    setErrors(e);
    return !e.soil && !e.ph && !e.n && !e.p && !e.k;
  };

  const autoFill = () => {
    setV((s) => ({ ...s, temp: '28', humidity: '80', rainfall: '160' }));
    setFilled(true);
  };

  const handleSubmit = async () => {
    setApiError(null);
    setSubmitting(true);
    try {
      const payload = {
        farmId: selectedFarmId || undefined,
        district: v.region,
        nitrogen: parseFloat(v.n) || 80,
        phosphorus: parseFloat(v.p) || 40,
        potassium: parseFloat(v.k) || 50,
        ph: parseFloat(v.ph) || 6.5,
        moisture: parseFloat(v.humidity) || 75,
        temperature: parseFloat(v.temp) || 28,
        humidity: parseFloat(v.humidity) || 80,
        rainfall: parseFloat(v.rainfall) || 150,
        season: (v.season === 'MAHA' ? 'MAHA' : 'YALA') as 'YALA' | 'MAHA'
      };

      const result = await cropsApi.recommendCrop(payload);
      sessionStorage.setItem('agriguard.lastCropResult', JSON.stringify(result));
      go('crop-results', {
        crop: result.recommendedCrop,
        confidence: String(result.confidence || 0)
      });
    } catch (err: any) {
      setApiError(err?.message || 'Crop recommendation inference failed. The service may be offline.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout title={t('fCropTitle')} subtitle={`${t('officialName')}: ${t('fCropOfficial')}`} scroll={false}>
      {apiError ? (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-2xl border border-danger/40 bg-danger-tint p-4 text-xs font-semibold text-danger-ink">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-danger" />
          <div className="flex-1">
            <p>{apiError}</p>
            <p className="mt-1 font-normal text-muted">
              You can still view the results page or verify that the Python Component 1 service is running on port 8001.
            </p>
          </div>
        </div>
      ) : null}

      <FormSteps
        submitLabelKey="showCrops"
        onSubmit={handleSubmit}
        steps={[
          {
            titleKey: 'stepLand',
            validate: validateLand,
            content: (
              <>
                {farms.length > 0 && (
                  <Field label="Use Farm Location (Optional)" optional>
                    <SelectInput
                      id="crop-farm"
                      value={selectedFarmId}
                      onChange={(val) => {
                        setSelectedFarmId(val);
                        const f = farms.find((item) => (item.id || item._id) === val);
                        if (f) {
                          setV((s) => ({
                            ...s,
                            region: f.district || s.region,
                            soil: f.soilType || s.soil
                          }));
                        }
                      }}
                      options={farms.map((f) => ({
                        value: f.id || f._id || '',
                        label: `${f.farmName} (${f.district})`
                      }))}
                      placeholder="Select Farm (Optional)"
                    />
                  </Field>
                )}

                <Field label={t('region')} htmlFor="crop-region" error={errors.region}>
                  <SelectInput
                    id="crop-region"
                    value={v.region}
                    onChange={set('region')}
                    options={districtOptions}
                    placeholder={t('chooseRegion')}
                    invalid={!!errors.region}
                  />
                </Field>
                <Field label={t('season')} error={errors.season}>
                  <ChoiceChips
                    name={t('season')}
                    options={seasonOptions}
                    value={v.season}
                    onChange={set('season')}
                    layout="stack"
                    invalid={!!errors.season}
                  />
                </Field>
              </>
            )
          },
          {
            titleKey: 'stepSoil',
            validate: validateSoil,
            content: (
              <>
                <Field label={t('soilType')} error={errors.soil}>
                  <ChoiceChips
                    name={t('soilType')}
                    options={soilOptions}
                    value={v.soil}
                    onChange={set('soil')}
                    layout="grid"
                    invalid={!!errors.soil}
                  />
                </Field>
                <Field label={t('soilPh')} htmlFor="crop-ph" help={t('soilPhHelp')} error={errors.ph}>
                  <TextInput
                    id="crop-ph"
                    inputMode="decimal"
                    placeholder="6.5"
                    value={v.ph}
                    onChange={(e) => set('ph')(e.target.value)}
                    invalid={!!errors.ph}
                  />
                </Field>
                <Field label={t('npk')} help={t('npkHelp')}>
                  <div className="space-y-2.5">
                    {(['n', 'p', 'k'] as const).map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <label htmlFor={`crop-${key}`} className="w-1/2 text-sm font-medium leading-snug text-ink">
                          {t(key === 'n' ? 'nitrogen' : key === 'p' ? 'phosphorus' : 'potassium')}
                        </label>
                        <TextInput
                          id={`crop-${key}`}
                          inputMode="numeric"
                          placeholder="—"
                          suffix="mg/kg"
                          value={v[key]}
                          onChange={(e) => set(key)(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </Field>
              </>
            )
          },
          {
            titleKey: 'stepWeather',
            content: (
              <>
                <div className="mb-5 rounded-2xl bg-white p-4 shadow-card">
                  {filled ? (
                    <p className="flex items-center gap-2 text-[15px] font-medium text-brand-dark">
                      <CheckCircle2Icon className="h-5 w-5 text-brand" aria-hidden />
                      {t('autoFilled')}
                    </p>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        icon={<CloudDownloadIcon className="h-5 w-5" aria-hidden />}
                        onClick={autoFill}
                      >
                        {t('autoFill')}
                      </Button>
                      <p className="mt-2 text-center text-xs text-muted">{t('autoFillNote')}</p>
                    </>
                  )}
                </div>
                <Field label={t('temperature')} htmlFor="crop-temp" optional>
                  <TextInput
                    id="crop-temp"
                    inputMode="decimal"
                    suffix="°C"
                    value={v.temp}
                    onChange={(e) => set('temp')(e.target.value)}
                  />
                </Field>
                <Field label={t('humidity')} htmlFor="crop-hum" optional>
                  <TextInput
                    id="crop-hum"
                    inputMode="numeric"
                    suffix="%"
                    value={v.humidity}
                    onChange={(e) => set('humidity')(e.target.value)}
                  />
                </Field>
                <Field label={t('rainfall')} htmlFor="crop-rain" optional>
                  <TextInput
                    id="crop-rain"
                    inputMode="numeric"
                    suffix="mm"
                    value={v.rainfall}
                    onChange={(e) => set('rainfall')(e.target.value)}
                  />
                </Field>

                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-brand font-semibold">
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                    Running Random Forest inference...
                  </div>
                )}
              </>
            )
          }
        ]}
      />
    </ScreenLayout>
  );
}