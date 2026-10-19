import React, { useEffect, useState } from 'react';
import {
  MapPinIcon,
  SproutIcon,
  ClipboardListIcon,
  ScanSearchIcon,
  TruckIcon,
  PlusIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon
} from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { farmsApi } from '../api/farmsApi';
import { FarmOverview } from '../types/farm';

export function FarmDetail() {
  const { t, formatDate } = useLanguage();
  const { current, go } = useNavigation();
  const farmId = current.params?.id;

  const [overview, setOverview] = useState<FarmOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    if (!farmId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await farmsApi.getFarmOverview(farmId);
      setOverview(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load farm overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [farmId]);

  if (!farmId) {
    return (
      <ScreenLayout showBack title={t('farmDetails')}>
        <div className="p-6 text-center text-sm text-muted">No Farm ID provided.</div>
      </ScreenLayout>
    );
  }

  const farm = overview?.farm;
  const records = overview?.agriculturalRecordsSummary?.records || overview?.agriculturalRecords || [];
  const readiness = overview?.componentReadiness;

  return (
    <ScreenLayout
      showBack
      wide
      title={farm?.farmName || t('farmDetails')}
      subtitle={`${farm?.district || ''} ${farm?.agroEcologicalZone ? `· ${farm.agroEcologicalZone}` : ''}`}
      action={
        <Button
          variant="secondary"
          onClick={() => go('farm-form', { id: farmId })}
          className="min-h-10 w-auto shrink-0 whitespace-nowrap px-4 py-2 text-xs"
        >
          {t('editFarm')}
        </Button>

      }
    >
      <div className="space-y-6 px-4 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-brand" />
            <p className="mt-3 text-sm">Loading farm overview...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-danger/30 bg-danger-tint p-6 text-center">
            <AlertCircleIcon className="mx-auto h-8 w-8 text-danger" />
            <p className="mt-2 text-sm font-semibold text-danger-ink">{error}</p>
            <Button variant="secondary" onClick={fetchOverview} className="mx-auto mt-4 w-auto text-xs">
              {t('retry')}
            </Button>
          </div>
        ) : !farm ? (
          <div className="p-6 text-center text-sm text-muted">Farm record not found.</div>
        ) : (
          <>
            {/* Quick Farm Metrics */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
                <span className="text-xs font-medium text-muted">Total Area</span>
                <p className="mt-1 text-2xl font-bold text-ink">
                  {farm.area || 0} <span className="text-sm font-normal text-muted">{farm.areaUnit || 'ACRES'}</span>
                </p>
              </div>
              <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
                <span className="text-xs font-medium text-muted">Soil Profile</span>
                <p className="mt-1 text-lg font-bold text-ink truncate">
                  {farm.soilType || 'Not specified'}
                </p>
              </div>
              <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
                <span className="text-xs font-medium text-muted">Field Records</span>
                <p className="mt-1 text-2xl font-bold text-brand">
                  {records.length}
                </p>
              </div>
            </div>

            {/* AI Research Services Readiness Status */}
            {readiness && (
              <section className="rounded-3xl border border-line bg-white p-5 shadow-card">
                <h3 className="text-sm font-bold text-ink mb-3">AI Research Microservices Status</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-canvas p-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        readiness.c1_crop_recommendation?.available ? 'bg-brand' : 'bg-warn'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink">C1 Crop Advice</p>
                      <p className="text-[11px] text-muted capitalize">
                        {readiness.c1_crop_recommendation?.status?.toLowerCase() || 'offline'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-2xl bg-canvas p-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        readiness.c2_disease_detection?.available ? 'bg-brand' : 'bg-warn'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink">C2 Disease AI</p>
                      <p className="text-[11px] text-muted capitalize">
                        {readiness.c2_disease_detection?.status?.toLowerCase() || 'offline'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-2xl bg-canvas p-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        readiness.c4_transportation_risk?.available ? 'bg-brand' : 'bg-warn'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink">C4 Transport Risk</p>
                      <p className="text-[11px] text-muted capitalize">
                        {readiness.c4_transportation_risk?.status?.toLowerCase() || 'offline'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="primary"
                icon={<PlusIcon className="h-4 w-4" />}
                onClick={() => go('record-form', { farmId })}
                className="w-auto text-xs"
              >
                {t('addRecord')}
              </Button>
              <Button
                variant="secondary"
                icon={<SproutIcon className="h-4 w-4" />}
                onClick={() => go('crop-form', { farmId })}
                className="w-auto text-xs"
              >
                Run Crop Advice
              </Button>
            </div>

            {/* Agricultural Records Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <ClipboardListIcon className="h-4 w-4 text-brand" />
                  Field Plantings & Soil Records
                </h3>
                <span className="text-xs text-muted">{records.length} records</span>
              </div>

              {records.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
                  No field records yet. Add a record to track plantings, soil pH, and NPK metrics.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {records.map((rec) => {
                    const rId = rec.id || rec._id || '';
                    return (
                      <div
                        key={rId}
                        className="rounded-2xl border border-line bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <span className="inline-flex items-center gap-1 font-bold text-sm text-brand-dark">
                            <SproutIcon className="h-4 w-4 text-brand" />
                            {rec.cropType.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted">
                            Planted: {formatDate(rec.plantingDate)}
                          </span>
                        </div>

                        {(rec.soilPh || rec.nitrogen) && (
                          <div className="mt-3 flex gap-2 text-xs text-ink/80">
                            {rec.soilPh ? (
                              <span className="rounded-md bg-canvas px-2 py-0.5">
                                pH: <strong>{rec.soilPh}</strong>
                              </span>
                            ) : null}
                            {rec.soilMoisture ? (
                              <span className="rounded-md bg-canvas px-2 py-0.5">
                                Moisture: <strong>{rec.soilMoisture}%</strong>
                              </span>
                            ) : null}
                            {rec.nitrogen ? (
                              <span className="rounded-md bg-canvas px-2 py-0.5">
                                N: <strong>{rec.nitrogen}</strong>
                              </span>
                            ) : null}
                          </div>
                        )}

                        {rec.notes ? (
                          <p className="mt-2 text-xs text-muted line-clamp-2">{rec.notes}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </ScreenLayout>
  );
}
