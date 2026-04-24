import {
  UserRound as UserRoundIcon
} from 'lucide-react';

import { getTasteColor } from '../../constants/tasteColors';
import { cn } from '../ui/utils';

interface ChefAvatarProps {
  alt: string;
  className?: string;
  iconSize?: number;
  imageSrc?: string | null;
  taste?: string;
  variant?: 'neutral' | 'taste';
}

export default function ChefAvatar({
  alt,
  className,
  iconSize = 32,
  imageSrc,
  taste = '감칠맛',
  variant = 'taste',
}: ChefAvatarProps) {
  if (imageSrc) {
    return <img src={imageSrc} alt={alt} className={cn('object-cover', className)} />;
  }

  const iconColor =
    variant === 'neutral' ? 'var(--tb-color-text-body)' : getTasteColor(taste);
  const backgroundClass =
    variant === 'neutral' ? 'bg-[var(--tb-color-surface-muted)]' : 'bg-white';

  return (
    <div
      aria-label={alt}
      role="img"
      className={cn('flex items-center justify-center', backgroundClass, className)}
    >
      <UserRoundIcon
        aria-hidden="true"
        style={{
          color: iconColor,
          fontSize: iconSize,
          height: iconSize,
          width: iconSize,
        }}
      />
    </div>
  );
}
