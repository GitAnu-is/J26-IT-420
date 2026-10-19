import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  suffix?: string;
  trailing?: React.ReactNode;
}

export function TextInput({ invalid, suffix, trailing, className, ...rest }: TextInputProps) {
  return (
    <div
      className={twMerge(
        'flex min-h-14 items-center rounded-2xl border bg-white px-4 transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
        invalid ? 'border-danger' : 'border-line',
        className
      )}>
      
      <input
        aria-invalid={invalid || undefined}
        className="h-full min-w-0 flex-1 bg-transparent py-3 text-base text-ink placeholder:text-[#93A097] focus:outline-none"
        {...rest} />
      
      {suffix && <span className="ml-2 shrink-0 text-sm font-medium text-muted">{suffix}</span>}
      {trailing}
    </div>);

}