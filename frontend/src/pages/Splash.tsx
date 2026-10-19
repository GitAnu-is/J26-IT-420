import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { images } from '../data/images';

export function Splash() {
  const { t } = useLanguage();
  const { go } = useNavigation();
  return (
    <div className="flex h-full flex-col bg-brand px-6 pb-8 text-white">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="grid h-24 w-24 place-items-center rounded-[28px] bg-white/10">
          
          <Logo size={64} inverted />
        </motion.div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">AgriGuard</h1>
        <p className="mt-3 text-lg font-semibold leading-snug">{t('tagline')}</p>
        <p className="mt-4 max-w-[300px] text-[15px] leading-relaxed text-white/90">{t('splashIntro')}</p>
      </div>
      <img src={images.farm} alt="" className="mb-6 h-32 w-full rounded-3xl object-cover" />
      <Button variant="inverse" onClick={() => go('language')}>
        {t('getStarted')}
      </Button>
    </div>);

}