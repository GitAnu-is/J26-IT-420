import React, { useEffect, useState } from 'react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Field } from '../components/Field';
import { TextInput } from '../components/TextInput';
import { SelectInput } from '../components/SelectInput';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { farmsApi } from '../api/farmsApi';
import { districtOptions, soilOptions } from '../data/options';
import { AreaUnit, CreateFarmInput, SoilType, SupportedCrop } from '../types/farm';
import { CheckIcon } from 'lucide-react';

const CROP_OPTIONS: { id: SupportedCrop; label: string }[] = [
  { id: 'BANANA', label: 'Banana (කෙසෙල් / வாழை)' },
  { id: 'PINEAPPLE', label: 'Pineapple (අන්නාසි / அன்னாசி)' },
  { id: 'BLACK_PEPPER', label: 'Black Pepper (ගම්මිරිස් / கருமிளகு)' }
];

const AREA_UNITS: { value: AreaUnit; label: string }[] = [
  { value: 'ACRES', label: 'Acres' },
  { value: 'HECTARES', label: 'Hectares' },
  { value: 'PERCHES', label: 'Perches' },
  { value: 'SQUARE_METERS', label: 'Square Meters' }
];

export function FarmForm() {
  const { t } = useLanguage();
  const { current, go, back } = useNavigation();
  const farmId = current.params?.id;
  const isEditing = !!farmId;

  const [formData, setFormData] = useState<CreateFarmInput>({
    farmName: '',
    district: '',
    agroEcologicalZone: '',
    soilType: 'SANDY_LOAM',
    area: 0,
    areaUnit: 'ACRES',
    supportedCrops: ['BANANA']
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (farmId) {
      setLoading(true);
      farmsApi
        .getFarmById(farmId)
        .then((f) => {
          setFormData({
            farmName: f.farmName,
            district: f.district,
            agroEcologicalZone: f.agroEcologicalZone || '',
            soilType: f.soilType || '',
            area: f.area || 0,
            areaUnit: f.areaUnit || 'ACRES',
            supportedCrops: f.supportedCrops || []
          });
        })
        .catch((err) => setError(err?.message || 'Failed to load farm'))
        .finally(() => setLoading(false));
    }
  }, [farmId]);

  const toggleCrop = (crop: SupportedCrop) => {
    setFormData((prev) => {
      const exists = prev.supportedCrops?.includes(crop);
      const next = exists
        ? (prev.supportedCrops || []).filter((c) => c !== crop)
        : [...(prev.supportedCrops || []), crop];
      return { ...prev, supportedCrops: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmName.trim()) {
      setError('Farm name is required (at least 2 characters)');
      return;
    }
    if (!formData.district.trim()) {
      setError('District is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      if (isEditing) {
        await farmsApi.updateFarm(farmId, formData);
      } else {
        await farmsApi.createFarm(formData);
      }
      go('farms');
    } catch (err: any) {
      setError(err?.message || 'Failed to save farm details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      showBack
      title={isEditing ? t('editFarm') : t('addFarm')}
      subtitle="Register farm land details to associate field records and AI advice"
    >
      <div className="mx-auto max-w-xl px-4 pb-10">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Loading farm details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-2xl border border-danger/40 bg-danger-tint p-4 text-xs font-semibold text-danger-ink">
                {error}
              </div>
            ) : null}

            <Field label={t('farmName')} htmlFor="farm-name">
              <TextInput
                id="farm-name"
                placeholder="e.g. Mahaweli Plot 4"
                value={formData.farmName}
                onChange={(e) => setFormData((s) => ({ ...s, farmName: e.target.value }))}
                required
              />
            </Field>

            <Field label={t('district')} htmlFor="farm-district">
              <SelectInput
                id="farm-district"
                value={formData.district}
                onChange={(val) => setFormData((s) => ({ ...s, district: val }))}
                options={districtOptions}
                placeholder="Select District"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('area')} htmlFor="farm-area">
                <TextInput
                  id="farm-area"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={formData.area ? String(formData.area) : ''}
                  onChange={(e) => setFormData((s) => ({ ...s, area: parseFloat(e.target.value) || 0 }))}
                />
              </Field>

              <Field label={t('areaUnit')} htmlFor="farm-unit">
                <SelectInput
                  id="farm-unit"
                  value={formData.areaUnit || 'ACRES'}
                  onChange={(val) => setFormData((s) => ({ ...s, areaUnit: val as AreaUnit }))}
                  options={AREA_UNITS}
                />
              </Field>
            </div>

            <Field label={t('soilType')} htmlFor="farm-soil" optional>
              <SelectInput
                id="farm-soil"
                value={formData.soilType || ''}
                onChange={(val) => setFormData((s) => ({ ...s, soilType: val as SoilType }))}
                options={soilOptions}
                placeholder="Select Soil Type (Optional)"
              />
            </Field>

            <Field label={t('zone')} htmlFor="farm-zone" optional>
              <TextInput
                id="farm-zone"
                placeholder="e.g. Low Country Wet Zone (WL2a)"
                value={formData.agroEcologicalZone || ''}
                onChange={(e) => setFormData((s) => ({ ...s, agroEcologicalZone: e.target.value }))}
              />
            </Field>

            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                {t('supportedCrops')}
              </label>
              <div className="space-y-2">
                {CROP_OPTIONS.map((c) => {
                  const selected = formData.supportedCrops?.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCrop(c.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left text-sm font-medium transition-all ${
                        selected
                          ? 'border-brand bg-brand-tint text-brand-dark'
                          : 'border-line bg-white text-ink hover:border-brand/40'
                      }`}
                    >
                      <span>{c.label}</span>
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-md border ${
                          selected ? 'border-brand bg-brand text-white' : 'border-line bg-canvas'
                        }`}
                      >
                        {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? t('editFarm') : t('addFarm')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ScreenLayout>
  );
}
