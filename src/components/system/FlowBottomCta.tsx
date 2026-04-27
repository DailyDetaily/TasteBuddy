import { cloneElement, isValidElement, type CSSProperties, type ReactNode } from 'react';

import { cn } from '../ui/utils';
import PrimaryButton from './PrimaryButton';

export interface FlowBottomCtaProps {
  actionClassName?: string;
  actionDisabled?: boolean;
  actionFullWidth?: boolean;
  actionLabel: ReactNode;
  actionSize?: 'default' | 'compact';
  actionStyle?: CSSProperties;
  actionType?: 'button' | 'submit' | 'reset';
  actionVisualDisabled?: boolean;
  className?: string;
  contentClassName?: string;
  fadeClassName?: string;
  helperText?: ReactNode;
  helperTextClassName?: string;
  onAction: () => void;
  secondaryButtonClassName?: string;
  secondaryButtonDisabled?: boolean;
  secondaryButtonLabel?: ReactNode;
  secondaryButtonVisualDisabled?: boolean;
  onSecondaryButtonAction?: () => void;
  secondaryAction?: ReactNode;
  secondaryActionClassName?: string;
  topSlot?: ReactNode;
  topSlotClassName?: string;
}

export default function FlowBottomCta({
  actionClassName,
  actionDisabled = false,
  actionFullWidth = true,
  actionLabel,
  actionSize = 'default',
  actionStyle,
  actionType = 'button',
  actionVisualDisabled = false,
  className,
  contentClassName,
  fadeClassName,
  helperText,
  helperTextClassName,
  onAction,
  secondaryButtonClassName,
  secondaryButtonDisabled = false,
  secondaryButtonLabel,
  secondaryButtonVisualDisabled = false,
  onSecondaryButtonAction,
  secondaryAction,
  secondaryActionClassName,
  topSlot,
  topSlotClassName,
}: FlowBottomCtaProps) {
  const resolvedTopSlot = topSlot
    ? isValidElement<{ className?: string }>(topSlot)
      ? cloneElement(topSlot, {
        className: cn('self-center', topSlot.props.className, topSlotClassName),
      })
      : (
        <div className={cn('flex w-full justify-center', topSlotClassName)}>
          {topSlot}
        </div>
      )
    : null;

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 z-20 flex justify-center',
        className,
      )}
    >
      <div className="w-full max-w-[var(--tb-layout-screen-max-width)]">
        <div
          className={cn(
            'tb-bottom-fade relative flex min-h-[var(--tb-size-bottom-fade-min-height)] w-full flex-col items-center justify-end gap-0 px-5 pb-[max(0px,calc(var(--tb-safe-area-bottom)-20px))]',
            fadeClassName,
            contentClassName,
          )}
        >
          {resolvedTopSlot}

          {secondaryButtonLabel && onSecondaryButtonAction ? (
            <div className="flex w-full gap-2">
              <PrimaryButton
                className={cn(
                  'border border-[var(--tb-color-border-strong)] bg-transparent text-[var(--tb-color-text-tertiary)] shadow-none',
                  secondaryButtonClassName,
                )}
                disabled={secondaryButtonDisabled}
                fullWidth
                onClick={onSecondaryButtonAction}
                size={actionSize}
                type="button"
                visualDisabled={secondaryButtonVisualDisabled}
              >
                {secondaryButtonLabel}
              </PrimaryButton>
              <PrimaryButton
                className={actionClassName}
                disabled={actionDisabled}
                fullWidth
                onClick={onAction}
                size={actionSize}
                style={actionStyle}
                type={actionType}
                visualDisabled={actionVisualDisabled}
              >
                {actionLabel}
              </PrimaryButton>
            </div>
          ) : (
            <PrimaryButton
              className={actionClassName}
              disabled={actionDisabled}
              fullWidth={actionFullWidth}
              onClick={onAction}
              size={actionSize}
              style={actionStyle}
              type={actionType}
              visualDisabled={actionVisualDisabled}
            >
              {actionLabel}
            </PrimaryButton>
          )}

          {secondaryAction ? (
            <div className={cn('w-full', secondaryActionClassName)}>{secondaryAction}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
