import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function LocaleRoot({ children }: {children: React.ReactNode;}) {
  const { locale } = useLanguage();
  return (
    <div lang={locale} className="h-full w-full">
      {children}
    </div>);

}