import {
  Check as CheckIcon
} from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

import { ICON_TOKENS } from "../../constants/designTokens";
import { cn } from '../ui/utils';

const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...props }: any) => (
  <Icon
    {...props}
    className={className}
    style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }}
  />
);

const Checkmark = wrapIcon(CheckIcon);

interface SelectionCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  description?: string;
  indicator?: 'checkbox' | 'radio';
  selected?: boolean;
  title: string;
}

export default function SelectionCard({
  className,
  description,
  indicator = 'radio',
  selected = false,
  title,
  type = 'button',
  ...props
}: SelectionCardProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-3 rounded-[var(--tb-radius-20)] border p-4 text-left transition-all outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        selected
          ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-surface-base)] shadow-[0_12px_24px_rgba(15,15,15,0.06)]'
          : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] hover:border-[var(--tb-color-border-strong)] hover:bg-[var(--tb-color-surface-card-hover)]',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-[2px] flex size-[18px] shrink-0 items-center justify-center border transition-colors',
          indicator === 'checkbox' ? 'rounded-[6px]' : 'rounded-full',
          selected
            ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
            : 'border-[var(--tb-color-border-disabled)] bg-transparent text-transparent',
        )}
      >
        <Checkmark size={ICON_TOKENS.size.xs} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[14px] font-semibold leading-snug text-[var(--tb-color-text-primary)]">
          {title}
        </span>
        {description ? (
          <span className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
