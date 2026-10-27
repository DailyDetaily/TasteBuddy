import type { MouseEventHandler } from 'react';

import CapsuleButton from '../system/CapsuleButton';

export type DiningFriendActionButtonVariant = 'accent' | 'neutral';
type DiningFriendActionButtonTextSize = 'sm' | 'md';

interface DiningFriendActionButtonProps {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  textSize?: DiningFriendActionButtonTextSize;
  title?: string;
  variant?: DiningFriendActionButtonVariant;
}

export default function DiningFriendActionButton({
  ariaLabel,
  className,
  disabled = false,
  label,
  onClick,
  textSize = 'sm',
  title,
  variant = 'neutral',
}: DiningFriendActionButtonProps) {
  return (
    <CapsuleButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={className}
      appearance={variant === 'accent' ? 'tonal' : 'outlined'}
      textSize={textSize}
    >
      {label}
    </CapsuleButton>
  );
}
