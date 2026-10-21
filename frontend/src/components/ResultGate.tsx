import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2Icon, ServerCrashIcon, WifiOffIcon } from 'lucide-react';
import { StateView } from './StateView';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrototype } from '../contexts/PrototypeContext';

// Wraps every AI result screen: loading → (error | offline | result). Mirrors an AsyncValue in Flutter.
export function ResultGate({ children }: {children: React.ReactNode;}) {
  const { t } = useLanguage();
  const { resultMode } = usePrototype();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoading(true);
    if (resultMode === 'loading') return;
    const id = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(id);
  }, [attempt, resultMode]);

  if (loading) {
    return (
      <div className="px-4 py-6" aria-busy="true" aria-live="polite">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
          <Loader2Icon className="h-6 w-6 animate-spin text-brand" aria-hidden />
          <div>
            <p className="text-[15px] font-semibold leading-snug text-ink">{t('loadingCheck')}</p>
            <p className="text-sm leading-snug text-muted">{t('loadingWait')}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-40 animate-pulse rounded-3xl bg-[#E9EEE6]" />
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-[#E9EEE6]" />
          <div className="h-5 w-1/2 animate-pulse rounded-full bg-[#E9EEE6]" />
        </div>
      </div>);

  }

  const failedFirstTry = attempt === 0 && (resultMode === 'error' || resultMode === 'offline');
  if (failedFirstTry) {
    const offline = resultMode === 'offline';
    return (
      <StateView
        icon={offline ? WifiOffIcon : ServerCrashIcon}
        tone={offline ? 'warn' : 'danger'}
        title={t(offline ? 'offlineTitle' : 'errorTitle')}
        body={t(offline ? 'offlineBody' : 'errorBody')}
        actionLabel={t('retry')}
        onAction={() => setAttempt((a) => a + 1)} />);


  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
      {children}
    </motion.div>);

}