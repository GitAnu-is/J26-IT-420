import React, { useRef, useState, useEffect } from 'react';
import { CameraIcon, ImageIcon, RotateCcwIcon, SunIcon, FocusIcon, DropletOffIcon, CheckCircle2Icon, AlertCircleIcon, RefreshCwIcon, SproutIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Field } from '../components/Field';
import { ChoiceChips } from '../components/ChoiceChips';
import { SelectInput } from '../components/SelectInput';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { diseasesApi } from '../api/diseasesApi';
import { farmsApi } from '../api/farmsApi';
import { Farm, SupportedCrop } from '../types/farm';
import { images } from '../data/images';

const CROP_OPTIONS = [
  { value: 'BANANA', label: 'Banana (කෙසෙල්)' },
  { value: 'PINEAPPLE', label: 'Pineapple (අන්නාසි)' },
  { value: 'BLACK_PEPPER', label: 'Black Pepper (ගම්මිරිස්)' }
];

export function DiseaseCapture() {
  const { t } = useLanguage();
  const { go } = useNavigation();
  const [crop, setCrop] = useState<SupportedCrop>('BANANA');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    farmsApi
      .getFarms()
      .then((fList) => setFarms(fList))
      .catch((err) => {
        console.warn('Could not load farms:', err);
      });
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setApiError('File size exceeds maximum limit of 8 MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setApiError(null);
    }
    e.target.value = '';
  };

  const useSampleLeaf = async () => {
    try {
      setPhotoPreview(images.bananaLeaf);
      // Fetch sample leaf as real Blob/File for real backend submission
      const res = await fetch(images.bananaLeaf);
      const blob = await res.blob();
      const file = new File([blob], 'banana_leaf_sample.jpg', { type: 'image/jpeg' });
      setPhotoFile(file);
      setApiError(null);
    } catch {
      setPhotoPreview(images.bananaLeaf);
    }
  };

  const submit = async () => {
    setTried(true);
    setApiError(null);
    if (!crop || (!photoFile && !photoPreview)) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('crop', crop);
      if (selectedFarmId) formData.append('farmId', selectedFarmId);

      if (photoFile) {
        formData.append('image', photoFile);
      } else {
        // Fallback for sample photo URL
        const res = await fetch(photoPreview!);
        const blob = await res.blob();
        formData.append('image', blob, 'leaf_analysis.jpg');
      }

      const result = await diseasesApi.analyzeDisease(formData);
      sessionStorage.setItem('agriguard.lastDiseaseResult', JSON.stringify(result));
      sessionStorage.setItem('agriguard.lastDiseasePhoto', photoPreview || '');
      go('disease-results', {
        id: result.assessmentId || result.savedAssessmentId || '',
        crop: result.cropType || result.crop || 'BANANA'
      });
    } catch (err: any) {
      setApiError(
        err?.message ||
          'Disease analysis inference failed. Verify the Component 2 deep learning service is running on port 8002.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title={t('fDiseaseTitle')}
      subtitle={`${t('officialName')}: ${t('fDiseaseOfficial')}`}
      footer={
        <div className="space-y-2">
          {tried && (!crop || (!photoFile && !photoPreview)) && (
            <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-danger">
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              {t('needPhoto')}
            </p>
          )}
          {apiError && (
            <div className="rounded-2xl border border-danger/40 bg-danger-tint p-3 text-xs font-medium text-danger-ink">
              {apiError}
            </div>
          )}
          <Button onClick={submit} disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCwIcon className="h-4 w-4 animate-spin" />
                Analyzing Leaf Image (EfficientNet-B0)...
              </span>
            ) : (
              t('checkPlant')
            )}
          </Button>
        </div>
      }
    >
      <div className="px-4 pb-8 space-y-4">
        <input
          ref={cameraRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={onFile}
          tabIndex={-1}
          aria-hidden
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={onFile}
          tabIndex={-1}
          aria-hidden
        />

        {farms.length > 0 && (
          <Field label="Farm Location (Optional)" optional>
            <SelectInput
              id="disease-farm"
              value={selectedFarmId}
              onChange={setSelectedFarmId}
              options={farms.map((f) => ({
                value: f.id || f._id || '',
                label: `${f.farmName} (${f.district})`
              }))}
              placeholder="Select Farm (Optional)"
            />
          </Field>
        )}

        <Field label={t('selectCrop')}>
          <ChoiceChips
            name="selectCrop"
            options={CROP_OPTIONS}
            value={crop}
            onChange={(val) => setCrop(val as SupportedCrop)}
            invalid={tried && !crop}
          />
        </Field>

        <Field label={t('addPhoto')}>
          {photoPreview ? (
            <div className="relative overflow-hidden rounded-3xl border border-line bg-black/5">
              <img src={photoPreview} alt={t('photoTab')} className="aspect-square w-full object-cover" />
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-semibold text-brand-dark shadow-sm">
                <CheckCircle2Icon className="h-4 w-4 text-brand" />
                Leaf photo attached
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
                className="absolute bottom-3 right-3 flex min-h-10 items-center gap-2 rounded-2xl bg-ink/80 backdrop-blur px-3.5 text-xs font-semibold text-white transition hover:bg-ink"
              >
                <RotateCcwIcon className="h-3.5 w-3.5" />
                {t('retake')}
              </button>
            </div>
          ) : (
            <div
              className={`rounded-3xl border-2 border-dashed bg-white p-6 text-center ${
                tried ? 'border-danger/60' : 'border-brand/30'
              }`}
            >
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-tint text-brand">
                <CameraIcon className="h-8 w-8" />
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Button icon={<CameraIcon className="h-4 w-4" />} onClick={() => cameraRef.current?.click()}>
                  {t('takePhoto')}
                </Button>
                <Button variant="secondary" icon={<ImageIcon className="h-4 w-4" />} onClick={() => galleryRef.current?.click()}>
                  {t('fromGallery')}
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted">Supports JPEG, PNG, and WebP (up to 8 MB)</p>
              <button
                type="button"
                onClick={useSampleLeaf}
                className="mx-auto mt-3 block rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:underline"
              >
                {t('useSample')} (Banana Leaf Fixture)
              </button>
            </div>
          )}
        </Field>

        <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
          <h2 className="mb-2.5 text-xs font-bold text-ink uppercase tracking-wider">{t('photoTips')}</h2>
          <ul className="space-y-2 text-xs text-ink/85">
            <li className="flex items-center gap-2">
              <SunIcon className="h-4 w-4 text-brand shrink-0" />
              Capture under bright, natural daylight without harsh flash reflections.
            </li>
            <li className="flex items-center gap-2">
              <FocusIcon className="h-4 w-4 text-brand shrink-0" />
              Focus directly on visible foliar lesions, spots, or discoloration.
            </li>
            <li className="flex items-center gap-2">
              <DropletOffIcon className="h-4 w-4 text-brand shrink-0" />
              Avoid leaves with heavy mud splatters or standing water drops.
            </li>
          </ul>
        </section>
      </div>
    </ScreenLayout>
  );
}