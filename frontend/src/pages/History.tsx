import React, { useEffect, useMemo, useState } from 'react';
import { SearchIcon, ClipboardListIcon, SearchXIcon, RefreshCwIcon, AlertCircleIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';
import { HistoryRow } from '../components/HistoryRow';
import { StateView } from '../components/StateView';
import { TransportTrendChart } from '../components/TransportTrendChart';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { cropsApi } from '../api/cropsApi';
import { diseasesApi } from '../api/diseasesApi';
import { transportationApi } from '../api/transportationApi';
import { isMockEnabled } from '../api/client';
import { historyItems as mockHistory } from '../data/history';

type FilterType = 'all' | 'crop' | 'disease' | 'harvest' | 'transport';

interface UnifiedHistoryItem {
  id: string;
  type: 'crop' | 'disease' | 'harvest' | 'transport';
  cropKey: any;
  title: string;
  subtitle: string;
  date: string;
  probability?: number;
  level?: string;
  statusKey?: any;
}

export function History() {
  const { t, formatDate } = useLanguage();
  const { current } = useNavigation();
  const [filter, setFilter] = useState<FilterType>((current.params?.filter as FilterType) ?? 'all');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<UnifiedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    if (isMockEnabled()) {
      setItems(mockHistory as any);
      setLoading(false);
      return;
    }

    try {
      const [cropRes, diseaseRes, transportRes] = await Promise.all([
        cropsApi.getCropHistory().catch(() => ({ items: [] })),
        diseasesApi.getDiseaseHistory().catch(() => ({ items: [] })),
        transportationApi.getTransportationHistory().catch(() => ({ items: [] }))
      ]);

      const unified: UnifiedHistoryItem[] = [];

      // Process C1 Crop & Harvest predictions
      if (cropRes && cropRes.items) {
        cropRes.items.forEach((item: any) => {
          const isHarvest = item.predictionType === 'HARVEST_PLANNING';
          const cropName = (item.crop || item.recommendedCrop || 'BANANA').toUpperCase();
          const cropKey = cropName.includes('BANANA') ? 'cropBanana' : cropName.includes('PINEAPPLE') ? 'cropPineapple' : 'cropPepper';

          unified.push({
            id: item.id || item._id,
            type: isHarvest ? 'harvest' : 'crop',
            cropKey,
            title: isHarvest ? `${cropName.replace('_', ' ')} Harvest Target` : `Recommended: ${cropName.replace('_', ' ')}`,
            subtitle: isHarvest && item.expectedHarvestDate
              ? `Expected: ${formatDate(item.expectedHarvestDate)}`
              : `Confidence: ${Math.round((item.confidence || 0.85) * 100)}%`,
            date: item.createdAt || new Date().toISOString(),
            statusKey: 'statusDone'
          });
        });
      }

      // Process C2 Disease assessments
      if (diseaseRes && diseaseRes.items) {
        diseaseRes.items.forEach((item: any) => {
          const cropName = (item.crop || 'BANANA').toUpperCase();
          const cropKey = cropName.includes('BANANA') ? 'cropBanana' : cropName.includes('PINEAPPLE') ? 'cropPineapple' : 'cropPepper';

          unified.push({
            id: item.id || item._id,
            type: 'disease',
            cropKey,
            title: item.diseaseName || 'Foliar Assessment',
            subtitle: `Diagnosis Match: ${Math.round((item.confidence || 0.85) * 100)}%`,
            date: item.createdAt || new Date().toISOString(),
            statusKey: item.severityStatus === 'UNAVAILABLE' ? 'statusDone' : 'statusFollow'
          });
        });
      }

      // Process C4 Transportation assessments
      if (transportRes && transportRes.items) {
        transportRes.items.forEach((item: any) => {
          const cropName = (item.crop || 'BANANA').toUpperCase();
          const cropKey = cropName.includes('BANANA') ? 'cropBanana' : cropName.includes('PINEAPPLE') ? 'cropPineapple' : 'cropPepper';

          unified.push({
            id: item.id || item._id,
            type: 'transport',
            cropKey,
            title: `${cropName.replace('_', ' ')} Damage Assessment`,
            subtitle: `${item.distanceKm || 0} km transit · ${item.vehicleType?.replace('_', ' ') || 'Truck'}`,
            date: item.createdAt || new Date().toISOString(),
            probability: item.damageProbability,
            level: (item.riskLevel || 'MEDIUM').toLowerCase(),
            statusKey: 'statusDone'
          });
        });
      }

      // Sort newest first
      unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(unified);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve assessment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchFilter = filter === 'all' || i.type === filter;
      const matchQuery = !q || i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [items, filter, query]);

  const filterButtons: { id: FilterType; label: string }[] = [
    { id: 'all', label: t('filterAll') },
    { id: 'crop', label: t('navCrop') },
    { id: 'harvest', label: t('navHarvest') },
    { id: 'disease', label: t('navDisease') },
    { id: 'transport', label: t('filterTransport') }
  ];

  const transportOnly = items.filter((i) => i.type === 'transport');
  const showChart = transportOnly.length > 0 && (filter === 'all' || filter === 'transport') && !query;

  return (
    <ScreenLayout title={t('historyTitle')} showBack wide>
      <div className="px-4 pb-12 space-y-4">
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-white px-4 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchHint')}
            className="h-full min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink placeholder:text-[#93A097] focus:outline-none"
          />
        </label>

        <div role="tablist" aria-label="History Filters" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {filterButtons.map((f) => (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-semibold transition-all ${
                filter === f.id ? 'bg-brand text-white shadow-sm' : 'border border-line bg-white text-ink hover:bg-canvas'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {showChart && <TransportTrendChart items={transportOnly as any} />}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-brand" />
            <p className="mt-3 text-sm">Loading assessment records...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-danger/30 bg-danger-tint p-6 text-center">
            <AlertCircleIcon className="mx-auto h-8 w-8 text-danger" />
            <p className="mt-2 text-sm font-semibold text-danger-ink">{error}</p>
            <Button variant="secondary" onClick={loadHistory} className="mx-auto mt-4 w-auto text-xs">
              {t('retry')}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          query ? (
            <StateView
              icon={SearchXIcon}
              title={t('noResultsTitle')}
              body={t('noResultsBody')}
              tone="neutral"
              actionLabel="Clear Search"
              onAction={() => setQuery('')}
            />
          ) : (
            <StateView
              icon={ClipboardListIcon}
              title="No Assessment History Yet"
              body="Run crop advice, plant disease diagnostics, or transport risk evaluations to see persistent research history."
              tone="neutral"
            />
          )
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((item) => (
              <HistoryRow key={item.id} item={item as any} />
            ))}
          </ul>
        )}
      </div>
    </ScreenLayout>
  );
}