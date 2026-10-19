import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function SampleTag() {
  const { t } = useLanguage();
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-info-tint px-2 py-0.5 text-[11px] font-semibold leading-tight text-info">
      {t('sampleTag')}
    </span>);

}