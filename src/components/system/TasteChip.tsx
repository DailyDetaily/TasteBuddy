import type { HTMLAttributes, ReactNode } from 'react';

import { getTasteColor, getTasteTintSoft, getTasteTintSoftBorder } from '../../constants/tasteColors';
import { cn } from '../ui/utils';

interface TasteChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  taste: string;
  tone?: 'taste' | 'neutral';
  value?: ReactNode;
}

export default function TasteChip({
  className,
  style,
  taste,
  tone = 'taste',
  value,
  ...props
}: TasteChipProps) {
  const isNeutral = tone === 'neutral';
  const color = isNeutral ? 'var(--tb-color-text-tertiary)' : getTasteColor(taste);
  const backgroundColor = isNeutral ? 'var(--tb-color-surface-muted)' : getTasteTintSoft(taste);
  const borderColor = isNeutral ? 'var(--tb-color-border-strong)' : getTasteTintSoftBorder(taste);
  const tasteLabelColor = isNeutral ? color : value ? 'var(--tb-color-text-primary)' : color;

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
