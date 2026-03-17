import type { ElementType, HTMLAttributes } from 'react';

import { cn } from '../ui/utils';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: ElementType;
  size?: 'md' | 'lg';
}

const SIZE_CLASS = {
  md: 'text-[16px]',
  lg: 'text-[18px]',
} as const;

export default function SectionTitle({
  as: Comp = 'h3',
  className,
  size = 'lg',
  ...props
}: SectionTitleProps) {
  return (
    <Comp
      className={cn(
        'font-bold text-[var(--tb-color-text-primary)]',
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  );
}
