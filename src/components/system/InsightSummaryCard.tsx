import type { CSSProperties, ReactNode } from 'react';

import { cn } from '../ui/utils';

interface InsightSummaryCardProps {
  action?: ReactNode;
  as?: 'button' | 'div' | 'summary';
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  indicator?: ReactNode;
  onClick?: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
}

export default function InsightSummaryCard({
  action,
  as = 'div',
  children,
  className,
  contentClassName,
  indicator,
  onClick,
  subtitle,
  title,
  titleClassName,
}: InsightSummaryCardProps) {
  const Component = as;
  const interactive = as === 'button' || onClick;
  const componentProps = as === 'button'
    ? { type: 'button' as const, onClick }
    : { onClick };

  return (
    <Component
      {...componentProps}
      className={cn(
        'w-full rounded-[20px] bg-white text-left',
        interactive && 'cursor-pointer transition-transform active:scale-[0.98]',
        as === 'summary' && 'list-none',
        className,
      )}
    >
      <div className="overflow-clip rounded-[inherit]">
        <div className={cn('flex w-full flex-col gap-[12px] p-3', contentClassName)}>
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-[6px]">
              {indicator}
              <p className="truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                {title}
              </p>
            </div>
            {action}
          </div>
          {subtitle ? (
            <p className={cn('text-[16px] font-bold leading-[1.25] text-[var(--tb-color-text-primary)]', titleClassName)}>
              {subtitle}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </Component>
  );
}

export function InsightSummaryIndicator({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('size-4 shrink-0 rounded-full', className)}
      style={style}
    />
  );
}
