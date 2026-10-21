import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parentScreen, screenPaths } from '../data/routes';
import type { ScreenEntry, ScreenId, ScreenParams, TabId } from '../types/navigation';

interface NavigationValue {
  current: ScreenEntry;
  tab: TabId | null;
  go: (id: ScreenId, params?: ScreenParams) => void;
  replace: (id: ScreenId, params?: ScreenParams) => void;
  reset: (id: ScreenId, params?: ScreenParams) => void;
  back: () => void;
  canGoBack: boolean;
}

// Screen-level navigation API on top of react-router. Pages call go('crop-results') instead of hardcoding URLs.
export function useNavigation(): NavigationValue {
  const navigate = useNavigate();
  const location = useLocation();
  const id = screenFromPath(location.pathname);
  const params = location.state as ScreenParams | null ?? undefined;

  const go = useCallback((target: ScreenId, p?: ScreenParams) => navigate(screenPaths[target], { state: p }), [navigate]);
  const replace = useCallback(
    (target: ScreenId, p?: ScreenParams) => navigate(screenPaths[target], { state: p, replace: true }),
    [navigate]
  );
  const back = useCallback(() => {
    const idx = (window.history.state as {idx?: number;} | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);else
    navigate(screenPaths[parentScreen[id] ?? 'home'], { replace: true });
  }, [navigate, id]);

  return useMemo(
    () => ({ current: { id, params }, tab: tabFor(id), go, replace, reset: go, back, canGoBack: true }),
    [id, params, go, replace, back]
  );
}

export function screenFromPath(pathname: string): ScreenId {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const match = (Object.entries(screenPaths) as [ScreenId, string][]).find(([, path]) => path === clean);
  return match ? match[0] : 'home';
}

function tabFor(id: ScreenId): TabId | null {
  if (id === 'home') return 'home';
  if (id.startsWith('crop')) return 'crop';
  if (id.startsWith('disease')) return 'disease';
  if (id.startsWith('harvest')) return 'harvest';
  if (id.startsWith('transport')) return 'transport';
  if (id.startsWith('packaging')) return 'packaging';
  if (id === 'history') return 'history';
  if (id.startsWith('farm')) return 'farms';
  if (id.startsWith('record')) return 'records';
  if (['notifications', 'more', 'settings', 'dev-notes'].includes(id)) return 'more';
  return null;
}