import { ChevronRight } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import InlineButton from './InlineButton';
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

  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const supportingId = useId();

  useLayoutEffect(() => {
    setExpanded(false);
    let active = true;
    const measure = () => {
      if (active && rowRef.current && measureRef.current) {
        setOverflows(measureRef.current.getBoundingClientRect().width > rowRef.current.clientWidth + 0.5);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (rowRef.current) observer.observe(rowRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    void document.fonts.ready.then(measure);
    return () => { active = false; observer.disconnect(); };
  }, [supportingText]);

  return (
    <SectionCard
      hoverEffect={isInteractive}
      className={cn(
        isInteractive && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-focus)]',
        className,
      )}
      onClick={isInteractive ? onExpand : undefined}
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
          {onExpand ? (
            <InlineButton tone="neutral" icon={ChevronRight} aria-haspopup="dialog" onClick={(event) => { event.stopPropagation(); onExpand(); }}>
              {detailLabel ?? '자세히보기'}
            </InlineButton>
          ) : detailLabel ? <CardDetailLabel label={detailLabel} /> : null}
        </div>

        <div className="flex w-full items-stretch gap-3">
          <div
            className="my-[5px] w-[8px] shrink-0 self-stretch rounded-full"
            style={indicatorBackground ? { background: indicatorBackground } : { backgroundColor: accentColor }}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <p
              className={cn(
                supportingText ? 'line-clamp-1' : 'line-clamp-2',
                'text-[14px] font-semibold leading-normal text-[var(--tb-color-text-primary)]',
              )}
            >
              {description}
            </p>
            {supportingText ? (
              <div ref={rowRef} className="relative flex min-w-0 items-baseline gap-1.5 text-[12px] font-normal leading-normal text-[var(--tb-color-text-muted)]">
                <span ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap">{supportingText}</span>
                <p id={supportingId} className={cn('min-w-0 flex-1', expanded ? 'break-words' : 'truncate')}>{supportingText}</p>
                {(overflows || expanded) && (
                  <InlineButton
                    aria-expanded={onExpand ? undefined : expanded}
                    aria-controls={onExpand ? undefined : supportingId}
                    aria-haspopup={onExpand ? 'dialog' : undefined}
                    onClick={(event) => { event.stopPropagation(); if (onExpand) onExpand(); else setExpanded((value) => !value); }}
                  >{expanded ? '접기' : '더보기'}</InlineButton>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
