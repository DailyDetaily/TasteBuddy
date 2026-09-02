import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../ui/utils';

interface ToastSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  actionLabel?: string;
  media?: ReactNode;
  message: ReactNode;
}

export default function ToastSurface({
  actionLabel,
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
        'flex w-full items-center gap-3 rounded-[20px] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-[var(--tb-color-text-inverse)] shadow-[var(--tb-shadow-strong)]',
        className,
      )}
      {...props}
    >
      {media ? <span className="shrink-0">{media}</span> : null}
      <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-snug">
        {message}
      </p>
      {actionLabel ? (
        <span className="shrink-0 text-[12px] font-bold leading-none text-[var(--tb-user-accent-main,var(--tb-taste-sweet-accent))]">
          {actionLabel}
        </span>
      ) : null}
    </div>
  );
}
