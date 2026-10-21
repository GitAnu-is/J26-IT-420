import React from "react";
import { Button } from "./Button";
import { BoxIcon } from "lucide-react";
interface StateViewProps {
  icon: typeof BoxIcon;
  title: string;
  body: string;
  tone?: 'neutral' | 'danger' | 'warn';
  actionLabel?: string;
  onAction?: () => void;
}
const tones = {
  neutral: 'bg-brand-tint text-brand',
  danger: 'bg-danger-tint text-danger',
  warn: 'bg-warn-tint text-warn-ink'
};
export function StateView({
  icon: Icon,
  title,
  body,
  tone = 'neutral',
  actionLabel,
  onAction
}: StateViewProps) {
  return <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className={`grid h-16 w-16 place-items-center rounded-full ${tones[tone]}`}>
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold leading-snug text-ink">{title}</h2>
      <p className="mt-1.5 max-w-[280px] text-[15px] leading-snug text-muted">{body}</p>
      {actionLabel && onAction && <Button onClick={onAction} className="mt-6 w-auto min-w-[200px]">
          {actionLabel}
        </Button>}
    </div>;
}