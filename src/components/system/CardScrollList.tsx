import type { HTMLAttributes } from 'react';

import { cn } from '../ui/utils';

export interface CardScrollListProps extends HTMLAttributes<HTMLDivElement> {
  contentClassName?: string;
  fullBleed?: boolean;
}

export default function CardScrollList({
  children,
  className,
  contentClassName,
  fullBleed = true,
  ...props
}: CardScrollListProps) {
  return (
    <div
      className={cn(
        fullBleed
          ? 'relative shrink-0 mx-[-20px] w-[calc(100%+40px)] overflow-x-auto no-scrollbar'
          : 'relative shrink-0 w-full overflow-x-auto no-scrollbar',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          fullBleed
            ? 'flex items-start gap-[10px] px-[20px]'
            : 'flex items-start gap-[10px]',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
