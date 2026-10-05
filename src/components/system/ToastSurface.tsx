import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../ui/utils';

interface ToastSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  actionLabel?: string;
  onAction?: () => void;
  media?: ReactNode;
  message: ReactNode;
}

export default function ToastSurface({
  actionLabel,
  onAction,
  className,
  media,
  message,
  ...props
}: ToastSurfaceProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex w-full items-center gap-3 rounded-[20px] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-[var(--tb-color-text-primary)] shadow-[var(--tb-shadow-strong)]',
        className,
      )}
      {...props}
    >
      {media ? <span className="shrink-0">{media}</span> : null}
      <p className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-snug">
        {message}
      </p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="min-h-[44px] shrink-0 rounded-lg px-2 text-[12px] font-bold leading-none text-[var(--tb-color-text-primary)] focus-visible:outline focus-visible:outline-2">
          {actionLabel}
        </button>
      ) : actionLabel ? (
        <span className="shrink-0 text-[12px] font-bold leading-none text-[var(--tb-color-text-primary)]">
          {actionLabel}
        </span>
      ) : null}
    </div>
  );
}
