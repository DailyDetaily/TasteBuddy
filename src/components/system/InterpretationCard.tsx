import { type KeyboardEvent } from 'react';
import CardDetailLabel from './CardDetailLabel';
import SectionCard from '../SectionCard';
import { cn } from '../ui/utils';

// A compact hospitality card for "what we know now" style interpretation summaries.
interface InterpretationCardProps {
  accentColor?: string;
  className?: string;
  detailLabel?: string;
  description: string;
  eyebrow?: string;
  indicatorBackground?: string;
  onExpand?: () => void;
  supportingText?: string;
}

export default function InterpretationCard({
  accentColor = 'var(--tb-color-icon-muted)',
  className = '',
  detailLabel,
  description,
  eyebrow,
  indicatorBackground,
  onExpand,
  supportingText,
}: InterpretationCardProps) {
  const isInteractive = typeof onExpand === 'function';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onExpand?.();
    }
  };

  return (
    <SectionCard
      hoverEffect={isInteractive}
      className={cn(
        isInteractive && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-default)]',
        className,
      )}
      onClick={isInteractive ? onExpand : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-haspopup={isInteractive ? 'dialog' : undefined}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                {eyebrow}
              </p>
            ) : null}
          </div>
          <CardDetailLabel label={detailLabel} />
        </div>

        <div className="flex w-full items-stretch gap-3">
          <div
            className="my-[5px] w-[8px] shrink-0 self-stretch rounded-full"
            style={indicatorBackground ? { background: indicatorBackground } : { backgroundColor: accentColor }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p
              className={cn(
                supportingText ? 'line-clamp-1' : 'line-clamp-2',
                'text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]',
              )}
            >
              {description}
            </p>
            {supportingText ? (
              <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
                {supportingText}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
