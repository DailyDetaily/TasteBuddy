import type { MouseEventHandler } from 'react';

import { cn } from '../ui/utils';

export type DiningFriendActionButtonVariant = 'accent' | 'neutral';
type DiningFriendActionButtonTextSize = 'sm' | 'md';

interface DiningFriendActionButtonProps {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  textSize?: DiningFriendActionButtonTextSize;
  title?: string;
  variant?: DiningFriendActionButtonVariant;
}

export default function DiningFriendActionButton({
  ariaLabel,
  className,
  disabled = false,
  label,
  onClick,
  textSize = 'sm',
  title,
  variant = 'neutral',
}: DiningFriendActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        'flex h-9 shrink-0 items-center justify-center rounded-full px-3 font-semibold disabled:opacity-55',
        textSize === 'md' ? 'text-[12px]' : 'text-[11px]',
        variant === 'neutral'
          ? 'border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]'
          : 'transition-[filter,opacity] hover:brightness-[0.98]',
        className,
      )}
      style={
        variant === 'accent'
          ? {
            background: 'var(--tb-user-accent-tint-surface, var(--tb-taste-sweet-bg))',
            color: 'var(--tb-user-accent-dark, var(--tb-taste-sweet-dark))',
          }
          : undefined
      }
    >
      {label}
    </button>
  );
}
