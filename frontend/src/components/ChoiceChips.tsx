import React from 'react';
import { CheckIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Option } from '../types/forms';

interface ChoiceChipsProps {
  name: string;
  options: Option[];
  value: string | string[];
  onChange: (value: string) => void;
  multiple?: boolean;
  layout?: 'wrap' | 'grid' | 'stack';
  invalid?: boolean;
}

export function ChoiceChips({ name, options, value, onChange, multiple, layout = 'wrap', invalid }: ChoiceChipsProps) {
  const { t } = useLanguage();
  const isSelected = (v: string) => Array.isArray(value) ? value.includes(v) : value === v;
  const container =
  layout === 'grid' ? 'grid grid-cols-2 gap-2.5' : layout === 'stack' ? 'flex flex-col gap-2.5' : 'flex flex-wrap gap-2.5';

  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-label={name} className={container}>
      {options.map((o) => {
        const selected = isSelected(o.value);
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`flex min-h-12 items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-left text-[15px] font-medium leading-snug transition-[background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            selected ?
            'border-brand bg-brand-tint text-brand-dark' :
            `${invalid ? 'border-danger/60' : 'border-line'} bg-white text-ink hover:border-brand/40`} ${
            layout === 'stack' ? 'min-h-16 w-full' : ''}`}>
            
            {Icon &&
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? 'bg-brand text-white' : 'bg-canvas text-brand'}`}>
              
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            }
            <span className="min-w-0 flex-1">
              <span className="block">{o.label || (o.labelKey ? t(o.labelKey) : o.value)}</span>
              {o.descKey && <span className="block text-sm font-normal text-muted">{t(o.descKey)}</span>}
            </span>
            {selected && <CheckIcon className="h-4 w-4 shrink-0" aria-hidden />}
          </button>);

      })}
    </div>);

}