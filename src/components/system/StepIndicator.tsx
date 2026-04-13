import type { CSSProperties } from 'react';

interface StepIndicatorProps {
  total: number;
  currentIndex: number;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
}

export default function StepIndicator({
  total,
  currentIndex,
  activeColor = 'var(--tb-color-text-primary)',
  inactiveColor = 'var(--tb-color-border-strong)',
  className = '',
}: StepIndicatorProps) {
  if (total <= 0) {
    return null;
  }

  return (
    <div
      aria-label={`진행 단계 ${Math.min(currentIndex + 1, total)} / ${total}`}
      aria-valuemax={total}
      aria-valuemin={1}
      aria-valuenow={Math.min(currentIndex + 1, total)}
      className={`flex items-center gap-[6px] ${className}`}
      role="progressbar"
    >
      {Array.from({ length: total }).map((_, index) => {
        const isCurrent = index === currentIndex;

        return (
          <div
            key={index}
            aria-hidden="true"
            className={`h-[6px] rounded-full transition-all duration-300 ${
              isCurrent ? 'w-[16px]' : 'w-[6px]'
            }`}
            style={
              {
                backgroundColor: isCurrent ? activeColor : inactiveColor,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
