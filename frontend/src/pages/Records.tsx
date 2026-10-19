import React, { useEffect, useState } from 'react';
import { ClipboardListIcon, PlusIcon, SproutIcon, RefreshCwIcon, AlertCircleIcon, CalendarIcon, LayersIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';
import { StateView } from '../components/StateView';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { recordsApi } from '../api/recordsApi';
import { farmsApi } from '../api/farmsApi';
import { AgriculturalRecord } from '../types/record';
import { Farm } from '../types/farm';

export function Records() {
  const { t, formatDate } = useLanguage();
  const { go } = useNavigation();
  const [records, setRecords] = useState<AgriculturalRecord[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [recs, farmList] = await Promise.all([
        recordsApi.getRecords(selectedFarm || undefined),
        farmsApi.getFarms().catch(() => [])
      ]);
      setRecords(Array.isArray(recs) ? recs : []);
      setFarms(Array.isArray(farmList) ? farmList : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load agricultural records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFarm]);

  const getFarmName = (farmId: string) => {
    const f = farms.find((farm) => (farm.id || farm._id) === farmId);
    return f ? f.farmName : 'Registered Farm';
  };

  return (
    <ScreenLayout
      wide
      title={t('navRecords')}
      subtitle="Track your planting cycles, soil parameters, and harvest timelines"
      action={
        <Button
          variant="primary"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => go('record-form')}
          className="min-h-10 w-auto shrink-0 whitespace-nowrap px-4 py-2 text-sm"
        >
          {t('addRecord')}
        </Button>

      }
    >
      <div className="space-y-4 px-4 pb-12">
        {farms.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedFarm('')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                !selectedFarm
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-ink border border-line hover:bg-canvas'
              }`}
            >
              All Farms
            </button>
            {farms.map((f) => {
              const fId = f.id || f._id || '';
              return (
                <button
                  key={fId}
                  type="button"
                  onClick={() => setSelectedFarm(fId)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedFarm === fId
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-white text-ink border border-line hover:bg-canvas'
                  }`}
                >
                  {f.farmName}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-brand" />
            <p className="mt-3 text-sm">Loading field records...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-danger/30 bg-danger-tint p-6 text-center">
            <AlertCircleIcon className="mx-auto h-8 w-8 text-danger" />
            <p className="mt-2 text-sm font-semibold text-danger-ink">{error}</p>
            <Button variant="secondary" onClick={loadData} className="mx-auto mt-4 w-auto text-xs">
              {t('retry')}
            </Button>
          </div>
        ) : records.length === 0 ? (
          <StateView
            icon={ClipboardListIcon}
            title={t('noRecordsTitle')}
            body={t('noRecordsBody')}
            actionLabel={t('addRecord')}
            onAction={() => go('record-form')}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((rec) => {
              const rId = rec.id || rec._id || '';
              return (
                <article
                  key={rId}
                  className="rounded-3xl border border-line bg-white p-5 shadow-card flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand-dark">
                        <SproutIcon className="h-3.5 w-3.5 text-brand" />
                        {rec.cropType.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-medium text-muted">
                        {getFarmName(rec.farmId)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <p className="flex items-center gap-2 text-xs text-ink">
                        <CalendarIcon className="h-3.5 w-3.5 text-muted" />
                        Planted: <strong className="font-semibold">{formatDate(rec.plantingDate)}</strong>
                      </p>
                      {rec.expectedHarvestDate ? (
                        <p className="flex items-center gap-2 text-xs text-ink">
                          <CalendarIcon className="h-3.5 w-3.5 text-brand" />
                          Expected Harvest: <strong className="font-semibold text-brand-dark">{formatDate(rec.expectedHarvestDate)}</strong>
                        </p>
                      ) : null}
                    </div>

                    {(rec.soilPh || rec.nitrogen || rec.soilMoisture) ? (
                      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line/60 pt-3">
                        {rec.soilPh ? (
                          <span className="rounded-lg bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink">
                            pH {rec.soilPh}
                          </span>
                        ) : null}
                        {rec.soilMoisture ? (
                          <span className="rounded-lg bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink">
                            Moisture {rec.soilMoisture}%
                          </span>
                        ) : null}
                        {rec.nitrogen ? (
                          <span className="rounded-lg bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink">
                            N: {rec.nitrogen}
                          </span>
                        ) : null}
                        {rec.phosphorus ? (
                          <span className="rounded-lg bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink">
                            P: {rec.phosphorus}
                          </span>
                        ) : null}
                        {rec.potassium ? (
                          <span className="rounded-lg bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink">
                            K: {rec.potassium}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {rec.notes ? (
                      <p className="mt-3 text-xs text-muted line-clamp-2 italic">
                        "{rec.notes}"
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-end border-t border-line/60 pt-3">
                    <button
                      type="button"
                      onClick={() => go('record-form', { id: rId })}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      {t('editRecord')}
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
