import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

import { cn } from '../ui/utils';

type CompactCardElement = 'button' | 'div';

type CompactCardProps = {
  actions?: ReactNode;
  actionsClassName?: string;
  as?: CompactCardElement;
  contentClassName?: string;
  heading: ReactNode;
  headingClassName?: string;
  media: ReactNode;
  mediaClassName?: string;
  metadata?: ReactNode;
  metadataClassName?: string;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  HTMLAttributes<HTMLDivElement>;

export default function CompactCard({
  actions,
  actionsClassName,
  as = 'button',
  className,
  contentClassName,
  heading,
  headingClassName,
  media,
  mediaClassName,
  metadata,
  metadataClassName,
  type = 'button',
  ...props
}: CompactCardProps) {
  const cardClassName = cn(
    'flex w-full items-center gap-3 rounded-[20px] bg-white p-3 text-left transition-transform active:scale-[0.99]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2',
    className,
  );
  const contents = (
    <>
      <span className={cn('shrink-0', mediaClassName)}>{media}</span>
      <span className={cn('min-w-0 flex-1', contentClassName)}>
        <span
          className={cn(
            'block truncate text-[14px] font-semibold text-[var(--tb-color-text-primary)]',
            headingClassName,
          )}
        >
          {heading}
        </span>
        {metadata ? (
          <span
            className={cn(
              'block truncate text-[12px] font-normal text-[var(--tb-color-text-muted)]',
              metadataClassName,
            )}
          >
            {metadata}
          </span>
        ) : null}
      </span>
      {actions ? (
        <span className={cn('shrink-0', actionsClassName)}>{actions}</span>
      ) : null}
    </>
  );

  if (as === 'div') {
    const { type: _type, ...divProps } = props;

    return (
      <div className={cardClassName} {...divProps}>
        {contents}
      </div>
    );
  }

  return (
    <button type={type} className={cardClassName} {...props}>
      {contents}
    </button>
  );
}
