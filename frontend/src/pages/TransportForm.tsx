import React, { useEffect, useState } from 'react';
import { TruckIcon, AlertCircleIcon, RefreshCwIcon, MapPinIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { FormSteps } from '../components/FormSteps';
import { Field } from '../components/Field';
import { ChoiceChips } from '../components/ChoiceChips';
import { TextInput } from '../components/TextInput';
import { SelectInput } from '../components/SelectInput';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { districtOptions } from '../data/options';
import { transportationApi } from '../api/transportationApi';
import { farmsApi } from '../api/farmsApi';
import { Farm, SupportedCrop } from '../types/farm';
import {
  PackagingType,
  PredictTransportationRiskInput,
  RoadCondition,
  VehicleType
} from '../types/transportation';

const CROP_OPTIONS: { value: SupportedCrop; label: string }[] = [
  { value: 'BANANA', label: 'Banana (කෙසෙල්)' },
  { value: 'PINEAPPLE', label: 'Pineapple (අන්නාසි)' },
  { value: 'BLACK_PEPPER', label: 'Black Pepper (ගම්මිරිස්)' }
];

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'OPEN_TRUCK', label: 'Open Truck' },
  { value: 'COVERED_TRUCK', label: 'Covered Truck' },
  { value: 'REFRIGERATED_TRUCK', label: 'Refrigerated Truck' },
  { value: 'PICKUP', label: 'Pickup Truck' },
  { value: 'THREE_WHEELER', label: 'Three-Wheeler' },
  { value: 'TRACTOR_TRAILER', label: 'Tractor Trailer' }
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

const ROAD_OPTIONS: { value: RoadCondition; label: string }[] = [
  { value: 'PAVED_GOOD', label: 'Paved (Good Condition)' },
  { value: 'PAVED_POOR', label: 'Paved (Potholes / Poor)' },
  { value: 'UNPAVED_ROUGH', label: 'Unpaved / Gravel Road' },
  { value: 'MIXED', label: 'Mixed Highway & Rural' }
];

export function TransportForm() {
  const { t } = useLanguage();
  const { current, go } = useNavigation();
  const presetCrop = (current.params?.crop as SupportedCrop) || 'BANANA';

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');

  const [v, setV] = useState({
    crop: presetCrop,
    distanceKm: '110',
    durationHours: '3.5',
    vehicleType: 'COVERED_TRUCK' as VehicleType,
    packagingType: 'PLASTIC_CRATES' as PackagingType,
    roadCondition: 'PAVED_GOOD' as RoadCondition,
    temperatureCelsius: '29',
    humidityPercentage: '75',
    originDistrict: 'Kurunegala',
    destinationDistrict: 'Colombo'
  });

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (key: keyof typeof v) => (value: any) => setV((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    farmsApi
      .getFarms()
      .then((fList) => setFarms(fList))
      .catch((err) => {
        console.warn('Could not load farms:', err);
      });
  }, []);

  const validateProduce = () => {
    return !!v.crop && Number(v.distanceKm) > 0 && Number(v.durationHours) > 0;
  };

  const validatePackaging = () => {
    return !!v.packagingType && !!v.vehicleType && !!v.roadCondition;
  };

  const handleSubmit = async () => {
    setApiError(null);
    setSubmitting(true);
    try {
      const payload: PredictTransportationRiskInput = {
        crop: v.crop,
        farmId: selectedFarmId || undefined,
        distanceKm: parseFloat(v.distanceKm) || 100,
        durationHours: parseFloat(v.durationHours) || 3,
        vehicleType: v.vehicleType,
        packagingType: v.packagingType,
        roadCondition: v.roadCondition,
        temperatureCelsius: parseFloat(v.temperatureCelsius) || undefined,
        humidityPercentage: parseFloat(v.humidityPercentage) || undefined,
        originDistrict: v.originDistrict,
        destinationDistrict: v.destinationDistrict
      };

      const result = await transportationApi.predictRisk(payload);
      sessionStorage.setItem('agriguard.lastTransportResult', JSON.stringify(result));
      go('transport-results', {
        crop: result.cropType || result.crop || 'BANANA',
        level: result.riskLevel || 'MEDIUM'
      });
    } catch (err: any) {
      setApiError(
        err?.message ||
          'Transportation risk prediction failed. Verify the Component 4 ML service is active at http://127.0.0.1:8003.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title={t('fTransportTitle')}
      subtitle={`${t('officialName')}: ${t('fTransportOfficial')}`}
      showBack
      scroll={false}
    >
      {apiError ? (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-2xl border border-danger/40 bg-danger-tint p-4 text-xs font-semibold text-danger-ink">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-danger" />
          <div className="flex-1">
            <p>{apiError}</p>
            <p className="mt-1 font-normal text-muted">
              Check that Python service on port 8003 is running or explore smart packaging recommendations.
            </p>
          </div>
        </div>
      ) : null}

      <FormSteps
        submitLabelKey="checkRisk"
        onSubmit={handleSubmit}
        steps={[
          {
            titleKey: 'stepProduce',
            validate: validateProduce,
            content: (
              <>
                {farms.length > 0 && (
                  <Field label="Origin Farm (Optional)" optional>
                    <SelectInput
                      id="tr-farm"
                      value={selectedFarmId}
                      onChange={(val) => {
                        setSelectedFarmId(val);
                        const f = farms.find((item) => (item.id || item._id) === val);
                        if (f && f.district) set('originDistrict')(f.district);
                      }}
                      options={farms.map((f) => ({
                        value: f.id || f._id || '',
                        label: `${f.farmName} (${f.district})`
                      }))}
                      placeholder="Select Farm (Optional)"
                    />
                  </Field>
                )}

                <Field label={t('produce')}>
                  <ChoiceChips
                    name="crop"
                    options={CROP_OPTIONS}
                    value={v.crop}
                    onChange={set('crop')}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Origin District" htmlFor="tr-origin">
                    <SelectInput
                      id="tr-origin"
                      value={v.originDistrict}
                      onChange={set('originDistrict')}
                      options={districtOptions}
                    />
                  </Field>
                  <Field label="Destination District" htmlFor="tr-dest">
                    <SelectInput
                      id="tr-dest"
                      value={v.destinationDistrict}
                      onChange={set('destinationDistrict')}
                      options={districtOptions}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={`${t('distance')} (km)`} htmlFor="tr-dist">
                    <TextInput
                      id="tr-dist"
                      type="number"
                      min="1"
                      placeholder="100"
                      value={v.distanceKm}
                      onChange={(e) => set('distanceKm')(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Duration (hours)" htmlFor="tr-dur">
                    <TextInput
                      id="tr-dur"
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder="3"
                      value={v.durationHours}
                      onChange={(e) => set('durationHours')(e.target.value)}
                      required
                    />
                  </Field>
                </div>
              </>
            )
          },
          {
            titleKey: 'stepPacking',
            validate: validatePackaging,
            content: (
              <>
                <Field label={t('packaging')}>
                  <ChoiceChips
                    name="packagingType"
                    options={PACKAGING_OPTIONS}
                    value={v.packagingType}
                    onChange={set('packagingType')}
                    layout="grid"
                  />
                </Field>

                <Field label="Transport Vehicle">
                  <ChoiceChips
                    name="vehicleType"
                    options={VEHICLE_OPTIONS}
                    value={v.vehicleType}
                    onChange={set('vehicleType')}
                    layout="grid"
                  />
                </Field>

                <Field label="Road Condition">
                  <ChoiceChips
                    name="roadCondition"
                    options={ROAD_OPTIONS}
                    value={v.roadCondition}
                    onChange={set('roadCondition')}
                    layout="stack"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Transit Temp (°C)" htmlFor="tr-temp" optional>
                    <TextInput
                      id="tr-temp"
                      type="number"
                      suffix="°C"
                      placeholder="28"
                      value={v.temperatureCelsius}
                      onChange={(e) => set('temperatureCelsius')(e.target.value)}
                    />
                  </Field>
                  <Field label="Transit Humidity (%)" htmlFor="tr-hum" optional>
                    <TextInput
                      id="tr-hum"
                      type="number"
                      suffix="%"
                      placeholder="75"
                      value={v.humidityPercentage}
                      onChange={(e) => set('humidityPercentage')(e.target.value)}
                    />
                  </Field>
                </div>

                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-brand font-semibold">
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                    Calculating damage risk & SHAP explanations...
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