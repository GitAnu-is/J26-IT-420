import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left">
      
      <span className="text-[15px] font-medium leading-snug text-ink">{label}</span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 ease-out ${checked ? 'bg-brand' : 'bg-[#C9D3CC]'}`}>
        
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ease-out ${
          checked ? 'translate-x-6' : 'translate-x-1'}`
          } />
        
      </span>
    </button>);

}