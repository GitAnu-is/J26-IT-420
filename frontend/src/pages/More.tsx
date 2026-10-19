import React from "react";
import { TruckIcon, HistoryIcon, BellIcon, SettingsIcon, CodeXmlIcon, LogOutIcon, ChevronRightIcon, BoxIcon } from "lucide-react";
import { ScreenLayout } from "../components/ScreenLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useAuth } from "../contexts/AuthContext";
import { initials, roleKey } from "../utils/user";
import { TranslationKey } from "../data/translations/en";
import { ScreenId } from "../types/navigation";
const rows: {
  icon: typeof BoxIcon;
  labelKey: TranslationKey;
  screen: ScreenId;
  badge?: number;
}[] = [{
  icon: HistoryIcon,
  labelKey: 'historyTitle',
  screen: 'history'
}, {
  icon: BellIcon,
  labelKey: 'notifTitle',
  screen: 'notifications',
  badge: 4
}, {
  icon: SettingsIcon,
  labelKey: 'profileSettings',
  screen: 'settings'
}, {
  icon: CodeXmlIcon,
  labelKey: 'devNotes',
  screen: 'dev-notes'
}];
export function More() {
  const {
    t,
    formatNumber
  } = useLanguage();
  const {
    go,
    reset
  } = useNavigation();
  const {
    user,
    logout
  } = useAuth();
  return <ScreenLayout title={t('moreTitle')}>
      <div className="px-4 pb-8">
        <button type="button" onClick={() => go('settings')} className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand text-lg font-semibold text-white" aria-hidden>
            {initials(user?.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold leading-snug text-ink">{user?.name}</span>
            <span className="block text-sm text-muted">
              {t(roleKey(user?.role))} · {t('placeKurunegala')}
            </span>
          </span>
          <ChevronRightIcon className="h-5 w-5 text-muted" aria-hidden />
        </button>

        <button type="button" onClick={() => go('transport-form')} className="mt-4 flex w-full items-center gap-4 rounded-3xl bg-info p-5 text-left text-white">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
            <TruckIcon className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-semibold leading-snug">{t('fTransportTitle')}</span>
            <span className="mt-0.5 block text-xs leading-snug text-white/85">{t('fTransportOfficial')}</span>
          </span>
          <ChevronRightIcon className="h-5 w-5 shrink-0" aria-hidden />
        </button>

        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-white shadow-card">
          {rows.map(({
          icon: Icon,
          labelKey,
          screen,
          badge
        }) => <li key={screen}>
              <button type="button" onClick={() => go(screen)} className="flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left hover:bg-canvas">
                <Icon className="h-6 w-6 shrink-0 text-brand" aria-hidden />
                <span className="flex-1 text-base font-medium leading-snug text-ink">{t(labelKey)}</span>
                {badge && <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">{formatNumber(badge)}</span>}
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted" aria-hidden />
              </button>
            </li>)}
        </ul>

        <button type="button" onClick={() => {
        logout();
        reset('login');
      }} className="mt-4 flex min-h-16 w-full items-center gap-4 rounded-3xl bg-white px-4 text-left text-danger shadow-card">
          <LogOutIcon className="h-6 w-6" aria-hidden />
          <span className="text-base font-semibold">{t('logout')}</span>
        </button>
        <p className="mt-6 text-center text-xs text-muted">{t('appVersion')}</p>
      </div>
    </ScreenLayout>;
}