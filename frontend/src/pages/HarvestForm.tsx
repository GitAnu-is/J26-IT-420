import React, { useEffect, useState } from 'react';
import { CalendarClockIcon, AlertCircleIcon, RefreshCwIcon, InfoIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { FormSteps } from '../components/FormSteps';
import { Field } from '../components/Field';
import { ChoiceChips } from '../components/ChoiceChips';
import { TextInput } from '../components/TextInput';
import { SelectInput } from '../components/SelectInput';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { districtOptions } from '../data/options';
import { cropsApi } from '../api/cropsApi';
import { farmsApi } from '../api/farmsApi';
import { Farm, SupportedCrop } from '../types/farm';

const CROP_CHOICES: { value: SupportedCrop; label: string }[] = [
  { value: 'BANANA', label: 'Banana (Planting Date)' },
  { value: 'PINEAPPLE', label: 'Pineapple (Planting Date)' },
  { value: 'BLACK_PEPPER', label: 'Black Pepper (Spike/Flowering Date)' }
];

type Errors = Partial<Record<'crop' | 'date', string>>;

export function HarvestForm() {
  const { t } = useLanguage();
  const { current, go } = useNavigation();
  const presetCrop = (current.params?.crop as SupportedCrop) || 'BANANA';

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');

  const [v, setV] = useState({
    crop: presetCrop,
    date: new Date().toISOString().split('T')[0],
    district: 'Kurunegala',
    season: 'YALA',
    variety: ''
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (key: keyof typeof v) => (value: string) => setV((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    farmsApi
      .getFarms()
      .then((fList) => setFarms(fList))
      .catch((err) => {
        console.warn('Could not load farms:', err);
      });
  }, []);

  const getReferenceLabel = () => {
    if (v.crop === 'BLACK_PEPPER') {
      return 'Spike Emergence / Flowering Date';
    }
    return 'Planting Date';
  };

  const getReferenceHelp = () => {
    if (v.crop === 'BLACK_PEPPER') {
      return 'For Black Pepper, harvest maturity is predicted from the date flower spikes emerge, not nursery planting.';
    }
    return 'Date sucker or planting material was planted in the field.';
  };

  const validateCropStep = () => {
    const e: Errors = {
      crop: v.crop ? undefined : t('errChoose'),
      date: v.date ? undefined : t('errRequired')
    };
    setErrors(e);
    return !e.crop && !e.date;
  };

  const handleSubmit = async () => {
    setApiError(null);
    setSubmitting(true);
    try {
      const payload = {
        crop: v.crop as SupportedCrop,
        plantingDate: v.date,
        district: v.district,
        farmId: selectedFarmId || undefined,
        variety: v.variety || undefined,
        season: (v.season === 'MAHA' ? 'MAHA' : 'YALA') as 'YALA' | 'MAHA'
      };

      const result = await cropsApi.predictHarvest(payload);
      sessionStorage.setItem('agriguard.lastHarvestResult', JSON.stringify(result));
      go('harvest-results', {
        crop: result.cropType || result.crop || 'BANANA',
        date: result.predictedHarvestDate || result.expectedHarvestDate || ''
      });
    } catch (err: any) {
      setApiError(err?.message || 'Harvest duration prediction failed. Python service on port 8001 may be offline.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout title={t('fHarvestTitle')} subtitle={`${t('officialName')}: ${t('fHarvestOfficial')}`} scroll={false}>
      {apiError ? (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-2xl border border-danger/40 bg-danger-tint p-4 text-xs font-semibold text-danger-ink">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-danger" />
          <div className="flex-1">
            <p>{apiError}</p>
            <p className="mt-1 font-normal text-muted">
              Verify that the Component 1 FastAPI service is active at http://127.0.0.1:8001.
            </p>
          </div>
        </div>
      ) : null}

      <FormSteps
        submitLabelKey="findHarvest"
        onSubmit={handleSubmit}
        steps={[
          {
            titleKey: 'stepCrop',
            validate: validateCropStep,
            content: (
              <>
                {farms.length > 0 && (
                  <Field label="Select Farm (Optional)" optional>
                    <SelectInput
                      id="harvest-farm"
                      value={selectedFarmId}
                      onChange={(val) => {
                        setSelectedFarmId(val);
                        const f = farms.find((item) => (item.id || item._id) === val);
                        if (f && f.district) set('district')(f.district);
                      }}
                      options={farms.map((f) => ({
                        value: f.id || f._id || '',
                        label: `${f.farmName} (${f.district})`
                      }))}
                      placeholder="Select Farm (Optional)"
                    />
                  </Field>
                )}

                <Field label={t('produce')} error={errors.crop}>
                  <ChoiceChips
                    name="crop"
                    options={CROP_CHOICES}
                    value={v.crop}
                    onChange={(c) => set('crop')(c)}
                    layout="stack"
                    invalid={!!errors.crop}
                  />
                </Field>

                <div className="rounded-2xl border border-line bg-canvas p-3 text-xs text-ink/80 flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink">Biological Event Requirement:</span>
                    <p className="mt-0.5">{getReferenceHelp()}</p>
                  </div>
                </div>

                <Field label={getReferenceLabel()} htmlFor="harvest-date" help={getReferenceHelp()} error={errors.date}>
                  <TextInput
                    id="harvest-date"
                    type="date"
                    value={v.date}
                    onChange={(e) => set('date')(e.target.value)}
                    invalid={!!errors.date}
                    required
                  />
                </Field>

                <Field label={t('location')} htmlFor="harvest-district">
                  <SelectInput
                    id="harvest-district"
                    value={v.district}
                    onChange={set('district')}
                    options={districtOptions}
                  />
                </Field>

                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-brand font-semibold">
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                    Running Random Forest regression model...
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