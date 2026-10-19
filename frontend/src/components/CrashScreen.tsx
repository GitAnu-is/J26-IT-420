import React from 'react';
import { TriangleAlertIcon } from 'lucide-react';
import { StateView } from './StateView';
import { useLanguage } from '../contexts/LanguageContext';

export function CrashScreen() {
  const { t } = useLanguage();
  return (
    <div className="grid h-[100dvh] w-full place-items-center bg-canvas">
      <StateView icon={TriangleAlertIcon} tone="danger" title={t('crashTitle')} body={t('crashBody')} actionLabel={t('reload')} onAction={() => window.location.reload()} />
    </div>);

}