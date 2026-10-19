import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';
import type { TranslationKey } from '../data/translations/en';

export interface FormStep {
  titleKey: TranslationKey;
  content: React.ReactNode;
  validate?: () => boolean;
}

interface FormStepsProps {
  steps: FormStep[];
  submitLabelKey: TranslationKey;
  onSubmit: () => void;
}

// Long forms are split into short sections with one primary action each.
export function FormSteps({ steps, submitLabelKey, onSubmit }: FormStepsProps) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLast = index === steps.length - 1;

  const move = (next: number) => {
    setIndex(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const handleNext = () => {
    const ok = steps[index].validate ? steps[index].validate!() : true;
    if (!ok) return;
    if (isLast) onSubmit();else
    move(index + 1);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex gap-1.5 px-4 pb-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={index + 1}
        aria-label={t(steps[index].titleKey)}>
        
        {steps.map((s, i) =>
        <span key={s.titleKey} className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ease-out ${i <= index ? 'bg-brand' : 'bg-line'}`} />
        )}
      </div>
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
            
            <h2 className="mb-5 text-lg font-semibold leading-snug text-ink">{t(steps[index].titleKey)}</h2>
            {steps[index].content}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-3 border-t border-line bg-white px-4 py-3">
        {index > 0 &&
        <Button variant="secondary" onClick={() => move(index - 1)} className="w-auto shrink-0 px-5">
            {t('back')}
          </Button>
        }
        <Button onClick={handleNext} className="flex-1">
          {isLast ? t(submitLabelKey) : t('next')}
        </Button>
      </div>
    </div>);

}