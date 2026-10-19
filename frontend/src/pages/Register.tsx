import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { TextInput } from '../components/TextInput';
import { PasswordInput } from '../components/PasswordInput';
import { ChoiceChips } from '../components/ChoiceChips';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { roleOptions } from '../data/options';
import { screenPaths } from '../data/routes';
import { isValidEmail, isValidPassword } from '../utils/validation';
import { errorMessageKey, fieldErrorKeys } from '../utils/apiErrors';
import type { TranslationKey } from '../data/translations/en';
import type { UserRole } from '../types/auth';

export function Register() {
  const { t } = useLanguage();
  const { go } = useNavigation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', role: '', password: '', confirm: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<TranslationKey | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, TranslationKey>>({});
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const errors = {
    name: form.name.trim() ? undefined : t('errName'),
    email: isValidEmail(form.email) ? undefined : t('errEmail'),
    role: form.role ? undefined : t('errRole'),
    password: isValidPassword(form.password) ? undefined : t('errPassword'),
    confirm: form.confirm === form.password && form.confirm ? undefined : t('errMatch')
  };
  const show = (key: keyof typeof errors) =>
  (submitted ? errors[key] : undefined) ?? (serverFields[key] ? t(serverFields[key]) : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    setServerFields({});
    if (!Object.values(errors).every((v) => !v)) return;
    setSubmitting(true);
    const roleMap: Record<string, UserRole> = {
      farmer: 'FARMER',
      officer: 'AGRICULTURAL_OFFICER',
      transport: 'TRANSPORT_OPERATOR',
      FARMER: 'FARMER',
      AGRICULTURAL_OFFICER: 'AGRICULTURAL_OFFICER',
      TRANSPORT_OPERATOR: 'TRANSPORT_OPERATOR'
    };
    const mappedRole = roleMap[form.role] || 'FARMER';

    try {
      await register({
        fullName: form.name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: mappedRole,
        password: form.password
      });
      navigate(screenPaths.home, { replace: true });
    } catch (err) {
      setServerFields(fieldErrorKeys(err));
      setServerError(errorMessageKey(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout title={t('register')} subtitle={t('registerSub')} showBack showNav={false}>
      <form onSubmit={handleSubmit} noValidate className="px-5 pb-8 pt-2 lg:px-6">
        {serverError &&
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-tint p-4">
            <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
            <p className="text-sm font-medium leading-snug text-danger-ink">{t(serverError)}</p>
          </div>
        }
        <Field label={t('fullName')} htmlFor="reg-name" error={show('name')}>
          <TextInput id="reg-name" autoComplete="name" placeholder={t('fullNameHint')} value={form.name} onChange={(e) => set('name')(e.target.value)} invalid={!!show('name')} />
        </Field>
        <Field label={t('email')} htmlFor="reg-email" error={show('email')}>
          <TextInput id="reg-email" type="email" autoComplete="email" placeholder={t('emailHint')} value={form.email} onChange={(e) => set('email')(e.target.value)} invalid={!!show('email')} />
        </Field>
        <Field label={t('iAmA')} error={show('role')}>
          <ChoiceChips name={t('iAmA')} options={roleOptions} value={form.role} onChange={set('role')} layout="stack" invalid={!!show('role')} />
        </Field>
        <Field label={t('password')} htmlFor="reg-password" help={t('passwordHint')} error={show('password')}>
          <PasswordInput id="reg-password" autoComplete="new-password" value={form.password} onChange={set('password')} invalid={!!show('password')} />
        </Field>
        <Field label={t('confirmPassword')} htmlFor="reg-confirm" error={show('confirm')}>
          <PasswordInput id="reg-confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} invalid={!!show('confirm')} />
        </Field>
        <Button type="submit" className="mt-2" disabled={submitting} icon={submitting ? <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden /> : undefined}>
          {submitting ? t('creatingAccount') : t('register')}
        </Button>
        <p className="mt-5 text-center text-[15px] text-muted">
          {t('haveAccount')}{' '}
          <button type="button" onClick={() => go('login')} className="font-semibold text-brand">
            {t('login')}
          </button>
        </p>
      </form>
    </ScreenLayout>);

}