import type { CSSProperties, HTMLAttributes } from 'react';

import { cn } from '../ui/utils';

interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  backgroundColor?: string;
  color?: string;
}

export default function StatusChip({
  backgroundColor,
  className,
  color,
  style,
  ...props
}: StatusChipProps) {
  return (
    <span
      className={cn('tb-status-chip', className)}
      style={{
        ...style,
        ...(backgroundColor ? { backgroundColor } : {}),
        ...(color ? { color } : {}),
      } as CSSProperties}
      {...props}
    />
  );
}
