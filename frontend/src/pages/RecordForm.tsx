import React, { useEffect, useState } from 'react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Field } from '../components/Field';
import { TextInput } from '../components/TextInput';
import { SelectInput } from '../components/SelectInput';
import { ChoiceChips } from '../components/ChoiceChips';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { recordsApi } from '../api/recordsApi';
import { farmsApi } from '../api/farmsApi';
import { Farm, SupportedCrop } from '../types/farm';
import { CreateRecordInput } from '../types/record';

const CROP_CHIPS = [
  { value: 'BANANA', label: 'Banana' },
  { value: 'PINEAPPLE', label: 'Pineapple' },
  { value: 'BLACK_PEPPER', label: 'Black Pepper' }
];

export function RecordForm() {
  const { t } = useLanguage();
  const { current, go } = useNavigation();
  const recordId = current.params?.id;
  const presetFarmId = current.params?.farmId;
  const isEditing = !!recordId;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [formData, setFormData] = useState<CreateRecordInput>({
    farmId: presetFarmId || '',
    cropType: 'BANANA',
    plantingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    soilPh: undefined,
    nitrogen: undefined,
    phosphorus: undefined,
    potassium: undefined,
    soilMoisture: undefined,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    farmsApi
      .getFarms()
      .then((fList) => {
        setFarms(fList);
        if (!presetFarmId && fList.length > 0 && !formData.farmId) {
          setFormData((s) => ({ ...s, farmId: fList[0].id || fList[0]._id || '' }));
        }
      })
      .catch((err) => {
        console.warn('Could not load farms:', err);
      });

    if (recordId) {
      setLoading(true);
      recordsApi
        .getRecordById(recordId)
        .then((rec) => {
          setFormData({
            farmId: rec.farmId,
            cropType: rec.cropType,
            plantingDate: rec.plantingDate ? rec.plantingDate.split('T')[0] : '',
            expectedHarvestDate: rec.expectedHarvestDate ? rec.expectedHarvestDate.split('T')[0] : '',
            soilPh: rec.soilPh,
            nitrogen: rec.nitrogen,
            phosphorus: rec.phosphorus,
            potassium: rec.potassium,
            soilMoisture: rec.soilMoisture,
            notes: rec.notes || ''
          });
        })
        .catch((err) => setError(err?.message || 'Failed to load record'))
        .finally(() => setLoading(false));
    }
  }, [recordId, presetFarmId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmId) {
      setError('Please select a registered farm');
      return;
    }
    if (!formData.plantingDate) {
      setError('Planting date is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload: CreateRecordInput = {
        ...formData,
        expectedHarvestDate: formData.expectedHarvestDate || undefined
      };

      if (isEditing) {
        await recordsApi.updateRecord(recordId, payload);
      } else {
        await recordsApi.createRecord(payload);
      }
      go('records');
    } catch (err: any) {
      setError(err?.message || 'Failed to save field record');
    } finally {
      setSubmitting(false);
    }
  };

  const farmOptions = farms.map((f) => ({
    value: f.id || f._id || '',
    label: `${f.farmName} (${f.district})`
  }));

  return (
    <ScreenLayout
      showBack
      title={isEditing ? t('editRecord') : t('addRecord')}
      subtitle="Save crop planting event and soil chemistry context"
    >
      <div className="mx-auto max-w-xl px-4 pb-10">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Loading record...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-2xl border border-danger/40 bg-danger-tint p-4 text-xs font-semibold text-danger-ink">
                {error}
              </div>
            ) : null}

            <Field label="Associated Farm" htmlFor="rec-farm">
              {farms.length === 0 ? (
                <div className="rounded-xl border border-line bg-canvas p-3 text-xs text-muted">
                  No farms registered. Please create a farm first.
                </div>
              ) : (
                <SelectInput
                  id="rec-farm"
                  value={formData.farmId}
                  onChange={(val) => setFormData((s) => ({ ...s, farmId: val }))}
                  options={farmOptions}
                  placeholder="Select Farm"
                />
              )}
            </Field>

            <Field label={t('cropType')}>
              <ChoiceChips
                name="cropType"
                options={CROP_CHIPS}
                value={formData.cropType}
                onChange={(val) => setFormData((s) => ({ ...s, cropType: val as SupportedCrop }))}
                layout="grid"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('plantingDate')} htmlFor="rec-plant-date">
                <TextInput
                  id="rec-plant-date"
                  type="date"
                  value={formData.plantingDate}
                  onChange={(e) => setFormData((s) => ({ ...s, plantingDate: e.target.value }))}
                  required
                />
              </Field>

              <Field label={t('expectedHarvest')} htmlFor="rec-harvest-date" optional>
                <TextInput
                  id="rec-harvest-date"
                  type="date"
                  value={formData.expectedHarvestDate || ''}
                  onChange={(e) => setFormData((s) => ({ ...s, expectedHarvestDate: e.target.value }))}
                />
              </Field>
            </div>

            <div className="rounded-3xl border border-line/70 bg-white p-4 space-y-3">
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                Soil Chemistry (Optional for AI Context)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('soilPh')} htmlFor="rec-ph" optional>
                  <TextInput
                    id="rec-ph"
                    type="number"
                    step="0.1"
                    min="3.0"
                    max="10.0"
                    placeholder="6.5"
                    value={formData.soilPh !== undefined ? String(formData.soilPh) : ''}
                    onChange={(e) => setFormData((s) => ({ ...s, soilPh: parseFloat(e.target.value) || undefined }))}
                  />
                </Field>

                <Field label={t('soilMoisture')} htmlFor="rec-moisture" optional>
                  <TextInput
                    id="rec-moisture"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="75%"
                    value={formData.soilMoisture !== undefined ? String(formData.soilMoisture) : ''}
                    onChange={(e) => setFormData((s) => ({ ...s, soilMoisture: parseFloat(e.target.value) || undefined }))}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Field label="Nitrogen" htmlFor="rec-n" optional>
                  <TextInput
                    id="rec-n"
                    type="number"
                    placeholder="N"
                    suffix="mg/kg"
                    value={formData.nitrogen !== undefined ? String(formData.nitrogen) : ''}
                    onChange={(e) => setFormData((s) => ({ ...s, nitrogen: parseFloat(e.target.value) || undefined }))}
                  />
                </Field>

                <Field label="Phosphorus" htmlFor="rec-p" optional>
                  <TextInput
                    id="rec-p"
                    type="number"
                    placeholder="P"
                    suffix="mg/kg"
                    value={formData.phosphorus !== undefined ? String(formData.phosphorus) : ''}
                    onChange={(e) => setFormData((s) => ({ ...s, phosphorus: parseFloat(e.target.value) || undefined }))}
                  />
                </Field>

                <Field label="Potassium" htmlFor="rec-k" optional>
                  <TextInput
                    id="rec-k"
                    type="number"
                    placeholder="K"
                    suffix="mg/kg"
                    value={formData.potassium !== undefined ? String(formData.potassium) : ''}
                    onChange={(e) => setFormData((s) => ({ ...s, potassium: parseFloat(e.target.value) || undefined }))}
                  />
                </Field>
              </div>
            </div>

            <Field label={t('notes')} htmlFor="rec-notes" optional>
              <TextInput
                id="rec-notes"
                placeholder="Weather notes, fertilizer applied, pest observations..."
                value={formData.notes || ''}
                onChange={(e) => setFormData((s) => ({ ...s, notes: e.target.value }))}
              />
            </Field>

            <div className="pt-2">
              <Button type="submit" disabled={submitting || farms.length === 0}>
                {submitting ? 'Saving Record...' : isEditing ? t('editRecord') : t('addRecord')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ScreenLayout>
  );
}
