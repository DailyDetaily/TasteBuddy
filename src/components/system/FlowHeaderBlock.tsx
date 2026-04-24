import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { cn } from '../ui/utils';
import SectionTitle from './SectionTitle';

interface FlowHeaderBlockProps extends HTMLAttributes<HTMLDivElement> {
  description?: ReactNode;
  descriptionClassName?: string;
  title: ReactNode;
  titleAs?: ElementType;
  titleClassName?: string;
  titleSize?: 'md' | 'lg';
  topLeft?: ReactNode;
  topRight?: ReactNode;
  topRowClassName?: string;
}

export default function FlowHeaderBlock({
  className,
  description,
  descriptionClassName,
  title,
  titleAs = 'h1',
  titleClassName,
  titleSize = 'lg',
  topLeft,
  topRight,
  topRowClassName,
  ...props
}: FlowHeaderBlockProps) {
  return (
    <div className={cn('tb-card-stack', className)} {...props}>
      {topLeft || topRight ? (
        <div className={cn('flex items-center justify-between gap-3', topRowClassName)}>
          <div className="min-w-0">{topLeft}</div>
          {topRight ? <div className="shrink-0">{topRight}</div> : null}
        </div>
      ) : null}

      <div className="tb-card-stack gap-2">
        <SectionTitle as={titleAs} size={titleSize} className={titleClassName}>
          {title}
        </SectionTitle>
        {description ? (
          <p
            className={cn(
              'text-[14px] leading-relaxed text-[var(--tb-color-text-subtle)]',
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
