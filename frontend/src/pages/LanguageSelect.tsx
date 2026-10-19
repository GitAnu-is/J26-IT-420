import React from 'react';
import { CheckCircle2Icon, CircleIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { useLanguage } from '../contexts/LanguageContext';
import type { Locale } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { languages } from '../data/languages';

export function LanguageSelect() {
  const { t, locale, setLocale } = useLanguage();
  const { go } = useNavigation();
  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pt-6">
        <Logo size={44} />
        <h1 className="mt-5 text-2xl font-bold leading-snug text-ink">{t('chooseLanguage')}</h1>
        <p className="mt-2 text-[15px] leading-snug text-muted">{t('chooseLanguageSub')}</p>
        <div role="radiogroup" aria-label={t('chooseLanguage')} className="mt-6 space-y-3">
          {languages.map((lang) => {
            const selected = locale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={selected}
                lang={lang.code}
                onClick={() => setLocale(lang.code as Locale)}
                className={`flex w-full items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left transition-[border-color,background-color] duration-150 ease-out ${
                selected ? 'border-brand bg-brand-soft' : 'border-transparent shadow-card'}`
                }>
                
                <span
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-bold ${
                  selected ? 'bg-brand text-white' : 'bg-brand-tint text-brand'}`
                  }
                  aria-hidden>
                  
                  {lang.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-semibold leading-snug text-ink">{lang.native}</span>
                  <span className="block text-sm text-muted" lang="en">
                    {lang.english}
                  </span>
                </span>
                {selected ?
                <CheckCircle2Icon className="h-7 w-7 shrink-0 text-brand" aria-hidden /> :

                <CircleIcon className="h-7 w-7 shrink-0 text-line" aria-hidden />
                }
              </button>);

          })}
        </div>
      </div>
      <div className="px-5 pb-6 pt-3">
        <Button onClick={() => go('onboarding')}>{t('continue')}</Button>
      </div>
    </div>);

}