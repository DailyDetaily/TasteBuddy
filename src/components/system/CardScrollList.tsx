import type { HTMLAttributes } from 'react';

import { cn } from '../ui/utils';

export interface CardScrollListProps extends HTMLAttributes<HTMLDivElement> {
  contentClassName?: string;
  fullBleed?: boolean;
  snapsToCards?: boolean;
}

export default function CardScrollList({
  children,
  className,
  contentClassName,
  fullBleed = true,
  snapsToCards = false,
  ...props
}: CardScrollListProps) {
  return (
    <div
      className={cn(
        fullBleed
          ? 'relative shrink-0 mx-[-20px] w-[calc(100%+40px)] overflow-x-auto no-scrollbar'
          : 'relative shrink-0 w-full overflow-x-auto no-scrollbar',
        snapsToCards && 'snap-x snap-mandatory scroll-px-5',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          fullBleed
            ? 'flex items-start gap-[10px] px-[20px]'
            : 'flex items-start gap-[10px]',
          snapsToCards && '[&>*]:snap-start',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
