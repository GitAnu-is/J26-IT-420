import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';
import { StateView } from '../components/StateView';
import { Logo } from '../components/Logo';
import { useLanguage } from '../contexts/LanguageContext';

export function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <main className="flex h-[100dvh] w-full flex-col items-center justify-center bg-canvas px-6">
      <Logo size={40} />
      <p className="mt-6 text-6xl font-bold text-brand">404</p>
      <StateView icon={CompassIcon} title={t('notFoundTitle')} body={t('notFoundBody')} actionLabel={t('goHome')} onAction={() => navigate('/', { replace: true })} />
    </main>);

}