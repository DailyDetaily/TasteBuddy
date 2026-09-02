import React, { type CSSProperties } from 'react';
import { ICON_TOKENS } from '../../constants/designTokens';
import PrimaryButton from './PrimaryButton';

type EmptyStateActionTone = 'default' | 'user-accent';

interface EmptyStateProps {
  /** Main title shown in empty state */
  title: string;
  /** Descriptive message below the title */
  description: string;
  /** Optional CTA button label; if provided, onAction must also be provided */
  actionLabel?: string;
  /** Callback when the CTA button is pressed */
  onAction?: () => void;
  /** Visual tone for the optional CTA button */
  actionTone?: EmptyStateActionTone;
  /** Optional icon element to display above the title */
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionTone = 'default',
  icon,
}: EmptyStateProps) {
  const actionStyle: CSSProperties | undefined =
    actionTone === 'user-accent'
      ? {
          background: 'var(--tb-user-accent-tint-surface, var(--tb-taste-sweet-bg))',
          border: 'none',
          color: 'var(--tb-user-accent-dark, var(--tb-taste-sweet-dark))',
        }
      : undefined;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center animate-fadeIn">
      {icon && (
        <div
          className="flex items-center justify-center rounded-[14px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-icon-muted)]"
          style={{
            width: ICON_TOKENS.container.lg,
            height: ICON_TOKENS.container.lg,
          }}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-bold text-[var(--tb-color-text-primary)]">{title}</p>
        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">{description}</p>
      </div>
      {actionLabel && onAction && (
        <PrimaryButton
          className="mt-2 !self-center"
          fullWidth={false}
          onClick={onAction}
          size="compact"
          style={actionStyle}
        >
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
}
