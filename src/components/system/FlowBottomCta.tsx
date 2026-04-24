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
      style={{ paddingBottom: 'var(--tb-safe-area-bottom)' }}
    >
      <div className="w-full max-w-[var(--tb-layout-screen-max-width)]">
        <div
          className={cn(
            'tb-bottom-fade relative flex min-h-[var(--tb-size-bottom-fade-min-height)] w-full flex-col items-center justify-end gap-0 px-5 pb-10',
            fadeClassName,
            contentClassName,
          )}
        >
          {resolvedTopSlot}

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

          {secondaryAction ? (
            <div className={cn('w-full', secondaryActionClassName)}>{secondaryAction}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
