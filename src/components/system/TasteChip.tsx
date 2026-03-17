import type { HTMLAttributes, ReactNode } from 'react';

import { getTasteColor } from '../../constants/tasteColors';
import { cn } from '../ui/utils';

interface TasteChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  taste: string;
  value?: ReactNode;
}

export default function TasteChip({ className, taste, value, ...props }: TasteChipProps) {
  const color = getTasteColor(taste);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-medium',
        className,
      )}
      {...props}
    >
      <span className="text-[var(--tb-color-text-primary)]">{taste}</span>
      {value ? (
        <span className="font-semibold" style={{ color }}>
          {value}
        </span>
      ) : null}
    </span>
  );
}
