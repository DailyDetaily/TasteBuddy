import type { HTMLAttributes } from 'react';

import { cn } from '../ui/utils';
import OutlineBadge from './OutlineBadge';

interface StepBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  currentIndex?: number;
  currentStep?: number;
  total: number;
}

export default function StepBadge({
  className,
  currentIndex,
  currentStep,
  total,
  ...props
}: StepBadgeProps) {
  if (total <= 0) {
    return null;
  }

  const resolvedStep = Math.min(
    Math.max(currentStep ?? (currentIndex ?? 0) + 1, 1),
    total,
  );

  return (
    <OutlineBadge
      aria-label={`진행 단계 ${resolvedStep} / ${total}`}
      className={cn('shrink-0', className)}
      {...props}
    >
      <span>{resolvedStep}</span>
      <span aria-hidden="true" className="mx-1 text-[var(--tb-color-text-muted)]">
        /
      </span>
      <span>{total}</span>
    </OutlineBadge>
  );
}
