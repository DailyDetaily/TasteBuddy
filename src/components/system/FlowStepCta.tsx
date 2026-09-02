import type { ReactNode } from 'react';

import { cn } from '../ui/utils';
import FlowBottomCta, { type FlowBottomCtaProps } from './FlowBottomCta';
import StepIndicator from './StepIndicator';

export interface FlowStepCtaProps
  extends Omit<FlowBottomCtaProps, 'topSlot' | 'topSlotClassName'> {
  currentIndex: number;
  indicatorActiveColor?: string;
  indicatorClassName?: string;
  indicatorInactiveColor?: string;
  showIndicator?: boolean;
  stepLabel?: ReactNode;
  total: number;
}

export default function FlowStepCta({
  contentClassName,
  currentIndex,
  indicatorActiveColor,
  indicatorClassName,
  indicatorInactiveColor,
  showIndicator = true,
  stepLabel,
  total,
  ...ctaProps
}: FlowStepCtaProps) {
  const indicator = showIndicator ? (
    <StepIndicator
      activeColor={indicatorActiveColor}
      className={cn(!stepLabel && 'mb-8', indicatorClassName)}
      currentIndex={currentIndex}
      inactiveColor={indicatorInactiveColor}
      total={total}
    />
  ) : null;

  return (
    <FlowBottomCta
      {...ctaProps}
      contentClassName={cn('gap-0', contentClassName)}
      topSlot={
        stepLabel && indicator ? (
          <div className="mb-8 flex flex-col items-center">
            {indicator}
            <p className="text-center text-[12px] font-medium text-[var(--tb-color-text-faint)]">
              {stepLabel}
            </p>
          </div>
        ) : (
          indicator
        )
      }
    />
  );
}
