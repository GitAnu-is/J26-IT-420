import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Option } from '../types/forms';

interface SelectInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  invalid?: boolean;
}

export function SelectInput({ id, value, onChange, options, placeholder, invalid }: SelectInputProps) {
  const { t } = useLanguage();
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        className={`min-h-14 w-full appearance-none rounded-2xl border bg-white py-3 pl-4 pr-11 text-base text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${
        invalid ? 'border-danger' : 'border-line'} ${
        value ? '' : 'text-[#93A097]'}`}>
        
        {placeholder &&
        <option value="" disabled>
            {placeholder}
          </option>
        }
        {options.map((o) =>
        <option key={o.value} value={o.value} className="text-ink">
            {o.label || (o.labelKey ? t(o.labelKey) : o.value)}
          </option>
        )}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
    </div>);

}