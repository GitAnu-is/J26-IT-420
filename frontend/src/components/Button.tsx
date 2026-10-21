import React from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-[#9DB8A8]',
  secondary: 'bg-white text-brand border border-brand/30 hover:bg-brand-soft disabled:text-muted',
  ghost: 'bg-transparent text-brand hover:bg-brand-soft',
  inverse: 'bg-white text-brand hover:bg-brand-tint'
};

export function Button({ variant = 'primary', icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={twMerge(
        'inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold leading-snug transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...rest}>
      
      {icon}
      <span className="text-center">{children}</span>
    </button>);

}