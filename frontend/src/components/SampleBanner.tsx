import React from 'react';
import { FlaskConicalIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function SampleBanner() {
  const { t } = useLanguage();
  return (
    <div role="note" className="mb-4 flex items-start gap-3 rounded-2xl border border-info/20 bg-info-tint px-4 py-3">
      <FlaskConicalIcon className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden />
      <p className="text-sm leading-snug text-[#1F4B73]">{t('sampleBanner')}</p>
    </div>);

}