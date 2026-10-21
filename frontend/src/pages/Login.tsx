import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { MailCheckIcon, XIcon, AlertCircleIcon, Loader2Icon, ClockIcon } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { TextInput } from '../components/TextInput';
import { PasswordInput } from '../components/PasswordInput';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, isValidPassword } from '../utils/validation';
import { errorMessageKey, fieldErrorKeys } from '../utils/apiErrors';
import { screenPaths } from '../data/routes';
import type { TranslationKey } from '../data/translations/en';

export function Login() {
  const { t } = useLanguage();
  const { go } = useNavigation();
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as {from?: string;} | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<TranslationKey | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, TranslationKey>>({});
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetState, setResetState] = useState<'idle' | 'invalid' | 'sent'>('idle');

  const emailError = submitted && !isValidEmail(email) ? t('errEmail') : serverFields.email ? t(serverFields.email) : undefined;
  const passwordError = submitted && !password ? t('errRequired') : serverFields.password ? t(serverFields.password) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    setServerFields({});
    if (!isValidEmail(email) || !password) return;
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from && from !== screenPaths.login ? from : screenPaths.home, { replace: true });
    } catch (err) {
      setServerFields(fieldErrorKeys(err));
      setServerError(errorMessageKey(err));
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="relative flex h-full flex-col bg-canvas">
      <form onSubmit={handleSubmit} noValidate className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-5 pb-6 pt-8 lg:px-10 lg:pt-14">
        <Logo size={48} />
        <h1 className="mt-5 text-2xl font-bold leading-snug text-ink">{t('welcomeBack')}</h1>
        <p className="mb-6 mt-1.5 text-[15px] leading-snug text-muted">{t('loginSub')}</p>

        {sessionExpired && !serverError &&
        <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn-tint p-4">
            <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-warn-ink" aria-hidden />
            <p className="text-sm font-medium leading-snug text-[#5C4300]">{t('errSessionExpired')}</p>
          </div>
        }
        {serverError &&
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-tint p-4">
            <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
            <p className="text-sm font-medium leading-snug text-danger-ink">{t(serverError)}</p>
          </div>
        }

        <Field label={t('email')} htmlFor="login-email" error={emailError}>
          <TextInput id="login-email" type="email" autoComplete="email" inputMode="email" placeholder={t('emailHint')} value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!emailError} />
        </Field>
        <Field label={t('password')} htmlFor="login-password" error={passwordError}>
          <PasswordInput id="login-password" autoComplete="current-password" value={password} onChange={setPassword} invalid={!!passwordError} />
        </Field>
        <button type="button" onClick={() => setResetOpen(true)} className="-mt-2 mb-6 self-end rounded-lg px-1 py-1 text-sm font-semibold text-brand">
          {t('forgotPassword')}
        </button>

        <Button type="submit" disabled={submitting} icon={submitting ? <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden /> : undefined}>
          {submitting ? t('signingIn') : t('login')}
        </Button>
        <p className="mt-6 text-center text-[15px] text-muted">
          {t('noAccount')}{' '}
          <button type="button" onClick={() => go('register')} className="font-semibold text-brand">
            {t('register')}
          </button>
        </p>

      </form>

      <AnimatePresence>
        {resetOpen &&
        <motion.div className="absolute inset-0 z-20 flex items-end bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="w-full rounded-t-[28px] bg-white px-5 pb-6 pt-5">
            
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 id="reset-title" className="text-xl font-bold leading-snug text-ink">
                  {t('resetTitle')}
                </h2>
                <button
                type="button"
                aria-label={t('cancel')}
                onClick={() => {
                  setResetOpen(false);
                  setResetState('idle');
                }}
                className="-mr-2 grid h-10 w-10 place-items-center rounded-full hover:bg-canvas">
                
                  <XIcon className="h-5 w-5" aria-hidden />
                </button>
              </div>
              {resetState === 'sent' ?
            <div className="flex items-start gap-3 rounded-2xl bg-brand-tint p-4">
                  <MailCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                  <p className="text-[15px] leading-snug text-brand-dark">{t('resetSent')}</p>
                </div> :

            <>
                  <p className="mb-4 text-[15px] leading-snug text-muted">{t('resetBody')}</p>
                  <Field label={t('email')} htmlFor="reset-email" error={resetState === 'invalid' ? t('errEmail') : undefined}>
                    <TextInput id="reset-email" type="email" placeholder={t('emailHint')} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} invalid={resetState === 'invalid'} />
                  </Field>
                  <Button onClick={() => setResetState(isValidEmail(resetEmail) ? 'sent' : 'invalid')}>{t('sendLink')}</Button>
                </>
            }
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}