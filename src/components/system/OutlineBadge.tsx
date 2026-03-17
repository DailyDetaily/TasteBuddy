import type { HTMLAttributes } from 'react';

import { cn } from '../ui/utils';

export default function OutlineBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('tb-outline-badge', className)} {...props} />;
}
