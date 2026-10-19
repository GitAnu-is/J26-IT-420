import React from 'react';
import { Outlet } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';
import type { Locale } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { getWebNavGroups } from '../data/webNav';
import { languages } from '../data/languages';
import { initials, roleKey } from '../utils/user';

// Signed-in layout: sidebar on desktop, bottom navigation (inside each screen) on phones.
export function WebShell() {
  const { t, locale, setLocale } = useLanguage();
  const { current, go, reset } = useNavigation();
  const { user, logout } = useAuth();
  const navGroups = getWebNavGroups(user?.role);

  return (
    <div className="flex h-[100dvh] w-full bg-canvas">
      <aside className="no-scrollbar hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-line bg-white px-4 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <Logo size={36} />
          <span className="text-xl font-bold text-ink">AgriGuard</span>
        </div>

        <nav aria-label="Main" className="mt-8 flex-1 space-y-6">
          {navGroups.map((group, gi) =>
          <ul key={gi} className="space-y-1">
              {group.items.map(({ screen, icon: Icon, labelKey, match }) => {
              const active = match.includes(current.id);
              return (
                <li key={screen}>
                    <button
                    type="button"
                    onClick={() => go(screen)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] leading-snug transition-colors duration-150 ease-out ${
                    active ? 'bg-brand-tint font-semibold text-brand-dark' : 'text-ink hover:bg-canvas'}`
                    }>
                    
                      <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-brand' : 'text-muted'}`} aria-hidden />
                      {t(labelKey)}
                    </button>
                  </li>);

            })}
            </ul>
          )}
        </nav>

        <div className="mt-6 space-y-4 border-t border-line pt-5">
          <div role="radiogroup" aria-label={t('language')} className="grid grid-cols-3 gap-1 rounded-xl bg-canvas p-1">
            {languages.map((l) =>
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={locale === l.code}
              lang={l.code}
              onClick={() => setLocale(l.code as Locale)}
              className={`min-h-9 rounded-lg text-sm font-semibold transition-colors duration-150 ease-out ${locale === l.code ? 'bg-white text-brand shadow-sm' : 'text-muted hover:text-ink'}`}>
              
                {l.native}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white" aria-hidden>
              {initials(user?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-muted">{t(roleKey(user?.role))}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                reset('login');
              }}
              aria-label={t('logout')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-tint hover:text-danger">
              
              <LogOutIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </aside>
      <main className="relative min-w-0 flex-1">
        <Outlet />
      </main>
    </div>);

}