import React, { useEffect, useState } from 'react';
import { PlusIcon, MapPinIcon, SproutIcon, ArrowRightIcon, RefreshCwIcon, AlertCircleIcon, LayersIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';
import { StateView } from '../components/StateView';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { farmsApi } from '../api/farmsApi';
import { Farm } from '../types/farm';

export function Farms() {
  const { t } = useLanguage();
  const { go } = useNavigation();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFarms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await farmsApi.getFarms();
      setFarms(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load farms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  return (
    <ScreenLayout
      wide
      title={t('navFarms')}
      subtitle="Manage your registered agricultural lands and crop settings"
      action={
        <Button
          variant="primary"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => go('farm-form')}
          className="min-h-10 w-auto shrink-0 whitespace-nowrap px-4 py-2 text-sm"
        >
          {t('addFarm')}
        </Button>

      }
    >
      <div className="px-4 pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-brand" />
            <p className="mt-3 text-sm">Loading your farms...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-danger/30 bg-danger-tint p-6 text-center">
            <AlertCircleIcon className="mx-auto h-8 w-8 text-danger" />
            <p className="mt-2 text-sm font-semibold text-danger-ink">{error}</p>
            <Button variant="secondary" onClick={loadFarms} className="mx-auto mt-4 w-auto text-xs">
              {t('retry')}
            </Button>
          </div>
        ) : farms.length === 0 ? (
          <StateView
            icon={MapPinIcon}
            title={t('noFarmsTitle')}
            body={t('noFarmsBody')}
            actionLabel={t('addFarm')}
            onAction={() => go('farm-form')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => {
              const farmId = farm.id || farm._id || '';
              return (
                <article
                  key={farmId}
                  className="group relative flex flex-col justify-between rounded-3xl border border-line bg-white p-5 shadow-card transition-all hover:border-brand/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-bold text-ink">{farm.farmName}</h2>
                        <p className="flex items-center gap-1.5 text-xs text-muted">
                          <MapPinIcon className="h-3.5 w-3.5 text-brand" />
                          {farm.district} {farm.agroEcologicalZone ? `· ${farm.agroEcologicalZone}` : ''}
                        </p>
                      </div>
                      {farm.area ? (
                        <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand-dark">
                          {farm.area} {farm.areaUnit || 'ACRES'}
                        </span>
                      ) : null}
                    </div>

                    {farm.soilType ? (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/80">
                        <LayersIcon className="h-3.5 w-3.5 text-muted" />
                        Soil: <span className="font-medium">{farm.soilType}</span>
                      </p>
                    ) : null}

                    {farm.supportedCrops && farm.supportedCrops.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {farm.supportedCrops.map((crop) => (
                          <span
                            key={crop}
                            className="inline-flex items-center gap-1 rounded-lg bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink"
                          >
                            <SproutIcon className="h-3 w-3 text-brand" />
                            {crop.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3">
                    <button
                      type="button"
                      onClick={() => go('farm-detail', { id: farmId })}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      {t('farmOverview')}
                      <ArrowRightIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go('farm-form', { id: farmId })}
                      className="text-xs font-medium text-muted hover:text-ink"
                    >
                      {t('editFarm')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ScreenLayout>
  );
}
