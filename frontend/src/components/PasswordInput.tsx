import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { TextInput } from './TextInput';
import { useLanguage } from '../contexts/LanguageContext';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

export function PasswordInput({ id, value, onChange, invalid, placeholder, autoComplete }: PasswordInputProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  return (
    <TextInput
      id={id}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      invalid={invalid}
      placeholder={placeholder}
      autoComplete={autoComplete}
      trailing={
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:text-ink">
        
          {visible ? <EyeOffIcon className="h-5 w-5" aria-hidden /> : <EyeIcon className="h-5 w-5" aria-hidden />}
        </button>
      } />);


}