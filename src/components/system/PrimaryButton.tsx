import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../ui/utils';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  size?: 'default' | 'compact';
  visualDisabled?: boolean;
}

export default function PrimaryButton({
  children,
  className,
  disabled = false,
  fullWidth = true,
  size = 'default',
  type = 'button',
  visualDisabled = false,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'tb-primary-button',
        (disabled || visualDisabled) && 'tb-primary-button--disabled',
        !fullWidth && 'w-auto self-start',
        size === 'compact' && 'h-auto min-h-[40px] px-4 py-2 text-[12px] font-semibold shadow-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
