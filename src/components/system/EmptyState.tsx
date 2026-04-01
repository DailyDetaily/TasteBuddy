import React from 'react';

interface EmptyStateProps {
  /** Main title shown in empty state */
  title: string;
  /** Descriptive message below the title */
  description: string;
  /** Optional CTA button label; if provided, onAction must also be provided */
  actionLabel?: string;
  /** Callback when the CTA button is pressed */
  onAction?: () => void;
  /** Optional icon element (e.g. a Fluent icon) to display above the title */
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center animate-fadeIn">
      {icon && (
        <div className="flex items-center justify-center size-[48px] rounded-[14px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-icon-muted)]">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-bold text-[var(--tb-color-text-primary)]">{title}</p>
        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-[10px] bg-[var(--tb-color-text-primary)] px-5 py-[10px] text-[13px] font-semibold text-white transition-all hover:bg-black active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
