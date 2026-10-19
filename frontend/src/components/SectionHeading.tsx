import React from 'react';

interface SectionHeadingProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  trailing?: React.ReactNode;
}

export function SectionHeading({ title, actionLabel, onAction, trailing }: SectionHeadingProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[17px] font-semibold leading-snug text-ink">{title}</h2>
      {trailing}
      {actionLabel && onAction &&
      <button type="button" onClick={onAction} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand hover:bg-brand-soft">
          {actionLabel}
        </button>
      }
    </div>);

}