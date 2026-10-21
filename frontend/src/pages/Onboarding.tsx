import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { onboardingSlides } from '../data/onboarding';
import { features } from '../data/features';

export function Onboarding() {
  const { t } = useLanguage();
  const { go } = useNavigation();
  const [index, setIndex] = useState(0);
  const slide = onboardingSlides[index];
  const feature = features.find((f) => f.id === slide.featureId)!;
  const Icon = feature.icon;
  const isLast = index === onboardingSlides.length - 1;

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex justify-end px-4 pt-1">
        <button type="button" onClick={() => go('login')} className="rounded-xl px-3 py-2 text-[15px] font-semibold text-brand hover:bg-brand-soft">
          {t('skip')}
        </button>
      </div>
      <div className="flex flex-1 flex-col px-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-1 flex-col">
            
            <div className="relative">
              <img src={slide.image} alt="" className="h-[300px] w-full rounded-[32px] object-cover" />
              <span
                className="absolute -bottom-6 left-5 grid h-14 w-14 place-items-center rounded-2xl shadow-card"
                style={{ backgroundColor: feature.tint, color: feature.color }}>
                
                <Icon className="h-7 w-7" aria-hidden />
              </span>
            </div>
            <h1 className="mt-10 text-2xl font-bold leading-snug text-ink">{t(slide.titleKey)}</h1>
            <p className="mt-2 text-base leading-relaxed text-muted">{t(slide.bodyKey)}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-5 pb-6">
        <div className="mb-5 flex justify-center gap-2" aria-hidden>
          {onboardingSlides.map((s, i) =>
          <span key={s.titleKey} className={`h-2 rounded-full transition-[width,background-color] duration-200 ease-out ${i === index ? 'w-6 bg-brand' : 'w-2 bg-line'}`} />
          )}
        </div>
        <Button onClick={() => isLast ? go('login') : setIndex(index + 1)}>{isLast ? t('getStarted') : t('next')}</Button>
      </div>
    </div>);

}