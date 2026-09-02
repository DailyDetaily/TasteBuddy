import type { CSSProperties, ElementType, HTMLAttributes, KeyboardEventHandler, ReactNode } from 'react';

import SectionCard from '../SectionCard';
import { ICON_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

interface SummaryMetricCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'> {
  color: string;
  hoverEffect?: boolean;
  icon: ElementType;
  iconAriaLabel?: string;
  iconClassName?: string;
  iconContainerClassName?: string;
  label: ReactNode;
  labelClassName?: string;
  onClick?: () => void;
  value: ReactNode;
  valueClassName?: string;
}

function getIconBackgroundColor(color: string) {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return `${color}20`;
  }

  return `color-mix(in srgb, ${color} 12%, transparent)`;
}

export default function SummaryMetricCard({
  className,
  color,
  hoverEffect,
  icon: Icon,
  iconAriaLabel,
  iconClassName,
  iconContainerClassName,
  label,
  labelClassName,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  value,
  valueClassName,
  ...props
}: SummaryMetricCardProps) {
  const isInteractive = Boolean(onClick);
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    onKeyDown?.(event);

    if (!onClick || event.defaultPrevented) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <SectionCard
      className={cn(
        isInteractive
          ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2'
          : undefined,
        className,
      )}
      hoverEffect={hoverEffect ?? isInteractive}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={role ?? (isInteractive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (isInteractive ? 0 : undefined)}
      {...props}
    >
      <div className="flex w-full items-center gap-2">
        <div
          aria-hidden={iconAriaLabel ? undefined : true}
          aria-label={iconAriaLabel}
          className={cn(
            'flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px]',
            iconContainerClassName,
          )}
          role={iconAriaLabel ? 'img' : undefined}
          style={{ backgroundColor: getIconBackgroundColor(color) }}
        >
          <Icon
            className={iconClassName}
            size={ICON_TOKENS.size.md}
            strokeWidth={1.8}
            style={{ color } as CSSProperties}
          />
        </div>
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate text-[12px] font-normal text-[var(--tb-color-text-muted)]',
              labelClassName,
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              'truncate text-[14px] font-semibold text-[var(--tb-color-text-primary)]',
              valueClassName,
            )}
          >
            {value}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
