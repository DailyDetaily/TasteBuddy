import type { HTMLAttributes, ReactNode } from 'react';

import { getTasteColor, getTasteTint } from '../../constants/tasteColors';
import { cn } from '../ui/utils';

interface TasteChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  taste: string;
  value?: ReactNode;
}

export default function TasteChip({ className, style, taste, value, ...props }: TasteChipProps) {
  const color = getTasteColor(taste);
  const backgroundColor = getTasteTint(taste, 0.05);
  const borderColor = getTasteTint(taste, 0.18);
  const tasteLabelColor = value ? 'var(--tb-color-text-primary)' : color;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium',
        className,
      )}
      style={{ backgroundColor, border: `1px solid ${borderColor}`, ...style }}
      {...props}
    >
      <span style={{ color: tasteLabelColor }}>{taste}</span>
      {value ? (
        <span className="font-semibold" style={{ color }}>
          {value}
        </span>
      ) : null}
    </span>
  );
}
