import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { cn } from '../ui/utils';

import SectionTitle from './SectionTitle';

interface PageSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  contentClassName?: string;
  title?: ReactNode;
  titleAs?: ElementType;
  titleClassName?: string;
  titleSize?: 'md' | 'lg';
}

export default function PageSection({
  children,
  className,
  contentClassName,
  title,
  titleAs = 'h3',
  titleClassName,
  titleSize = 'lg',
  ...props
}: PageSectionProps) {
  return (
    <div className={cn('tb-card-stack', className)} {...props}>
      {title ? (
        <SectionTitle as={titleAs} size={titleSize} className={titleClassName}>
          {title}
        </SectionTitle>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
