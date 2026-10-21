import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { en, TranslationKey } from '../data/translations/en';
import { si } from '../data/translations/si';
import { ta } from '../data/translations/ta';

export type Locale = 'en' | 'si' | 'ta';
type Vars = Record<string, string | number>;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, si, ta };
const intlLocales: Record<Locale, string> = { en: 'en-LK', si: 'si-LK', ta: 'ta-LK' };
const STORAGE_KEY = 'agriguard.locale';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ initialLocale, children }: {initialLocale: Locale;children: React.ReactNode;}) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale() ?? initialLocale);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLocaleState(initialLocale);
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {

      // Storage unavailable — language still applies for this session.
    }}, []);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = dictionaries[locale];
    const intl = intlLocales[locale];
    return {
      locale,
      setLocale,
      t: (key, vars) => interpolate(dict[key] ?? en[key], vars),
      formatDate: (date, options) =>
      new Intl.DateTimeFormat(intl, options ?? { day: 'numeric', month: 'short', year: 'numeric' }).format(
        typeof date === 'string' ? new Date(`${date}T00:00:00`) : date
      ),
      formatNumber: (n, options) => new Intl.NumberFormat(intl, options).format(n)
    };
  }, [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'si' || stored === 'ta' ? stored : null;
  } catch {
    return null;
  }
}