import React from 'react';
import { Outlet } from 'react-router-dom';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';
import { images } from '../data/images';

// Entry screens: full-screen on phones; on desktop the flow sits in a column beside a farm photo.
export function PublicLayout() {
  const { t } = useLanguage();
  return (
    <div className="flex h-[100dvh] w-full bg-canvas">
      <div className="relative hidden flex-1 lg:block">
        <img src={images.farm} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#0B2A1A]/60" />
        <div className="absolute bottom-14 left-14 right-14 max-w-xl text-white">
          <div className="flex items-center gap-3">
            <Logo size={48} inverted />
            <span className="text-3xl font-bold">AgriGuard</span>
          </div>
          <p className="mt-6 text-3xl font-semibold leading-snug">{t('tagline')}</p>
          <p className="mt-3 text-lg leading-relaxed text-white/90">{t('splashIntro')}</p>
        </div>
      </div>
      <div className="relative h-full w-full lg:w-[480px] lg:shrink-0 lg:border-l lg:border-line">
        <Outlet />
      </div>
    </div>);

}