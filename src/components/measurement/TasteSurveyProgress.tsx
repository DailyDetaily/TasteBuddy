import type { HTMLAttributes } from 'react';

import { cn } from '../ui/utils';

interface TasteSurveyProgressProps extends HTMLAttributes<HTMLDivElement> {
  currentIndex: number;
  total: number;
}

export default function TasteSurveyProgress({
  className,
  currentIndex,
  total,
  ...props
}: TasteSurveyProgressProps) {
  const safeTotal = Math.max(total, 1);
  const currentStep = Math.min(Math.max(currentIndex + 1, 1), safeTotal);
  const progressPercent = (currentStep / safeTotal) * 100;

  return (
    <div className={cn('flex w-full flex-col gap-2', className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-[var(--tb-color-text-secondary)]">
          미각 설문
        </span>
        <span className="text-[12px] font-medium text-[var(--tb-color-text-muted)]">
          {currentStep} / {safeTotal}
        </span>
      </div>
      <div
        aria-label={`설문 진행률 ${currentStep} / ${safeTotal}`}
        aria-valuemax={safeTotal}
        aria-valuemin={1}
        aria-valuenow={currentStep}
        className="h-[6px] overflow-hidden rounded-full bg-[var(--tb-color-border-strong)]"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[var(--tb-color-text-primary)] transition-[width] duration-300 ease-[var(--tb-motion-ease-entrance)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
