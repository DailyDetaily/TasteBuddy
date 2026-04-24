import type { HTMLAttributes } from 'react';

import { cn } from '../ui/utils';

export interface TasteTintCardListProps extends HTMLAttributes<HTMLDivElement> {}

export default function TasteTintCardList({
  children,
  className,
  ...props
}: TasteTintCardListProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-3', className)} {...props}>
      {children}
    </div>
  );
}
