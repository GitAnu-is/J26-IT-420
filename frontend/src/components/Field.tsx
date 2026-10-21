import React from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FieldProps {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, help, error, optional, children }: FieldProps) {
  const { t } = useLanguage();
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[15px] font-semibold leading-snug text-ink">
          {label}
        </label>
        {optional && <span className="shrink-0 text-xs text-muted">{t('optional')}</span>}
      </div>
      {help && <p className="-mt-1 mb-2 text-sm leading-snug text-muted">{help}</p>}
      {children}
      {error &&
      <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium leading-snug text-danger">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      }
    </div>);

}