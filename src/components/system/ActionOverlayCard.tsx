import { type ReactNode } from 'react';

import { cn } from '../ui/utils';

export interface ActionOverlayCardAction {
  label: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'destructive';
}

interface ActionOverlayCardProps {
  actions?: ActionOverlayCardAction[];
  cardClassName?: string;
  children?: ReactNode;
  headerEnd?: ReactNode;
  headerStart?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  layout?: 'stack' | 'split';
  onBackdropClick?: () => void;
}

export default function ActionOverlayCard({
  actions,
  cardClassName,
  children,
  title,
  description,
  headerEnd,
  headerStart,
  layout = 'stack',
  onBackdropClick,
}: ActionOverlayCardProps) {
  const hasCustomContent = children !== undefined;
  const hasHeaderSlots = headerStart !== undefined || headerEnd !== undefined;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-5"
      onClick={onBackdropClick}
    >
      <div
        className={cn(
          "w-full overflow-hidden bg-[var(--tb-color-bg-focus)] shadow-[var(--tb-shadow-drawer)]",
          hasCustomContent
            ? "max-w-[320px] rounded-[20px] px-5 py-4"
            : layout === 'split'
              ? "max-w-[320px] rounded-[20px]"
              : "max-w-[320px] rounded-[20px] p-4",
          cardClassName,
        )}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {hasHeaderSlots ? (
          <div className="grid min-h-10 w-full grid-cols-[40px_1fr_40px] items-center">
            <div className="flex min-h-10 items-center justify-start">
              {headerStart}
            </div>
            <h3 className="text-center text-[15px] font-bold text-[var(--tb-color-text-primary)]">
              {title}
            </h3>
            <div className="flex min-h-10 items-center justify-end">
              {headerEnd}
            </div>
          </div>
        ) : (
          <div className={cn(layout === 'split' ? "px-5 py-5" : "mb-4")}>
            <h3 className="text-center text-[16px] font-bold leading-relaxed text-[var(--tb-color-text-primary)]">
              {title}
            </h3>
            {description ? (
              <p className="mt-2 text-center text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
        )}

        {children ? (
          <div className="mt-5 flex flex-col items-center gap-5">
            {children}
          </div>
        ) : null}

        {actions ? (
          <div
            className={cn(
              layout === 'split'
                ? "grid grid-cols-2 border-t border-[var(--tb-color-border-default)]"
                : "flex flex-col gap-2",
              hasCustomContent ? "mt-4 w-full" : null,
            )}
          >
            {actions.map((action, index) => (
              <button
                key={index}
                type="button"
                disabled={action.disabled}
                onClick={action.onClick}
                className={cn(
                  "h-11 px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-colors disabled:opacity-45",
                  layout === 'split'
                    ? "h-12 bg-white"
                    : "rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] hover:bg-[var(--tb-color-border-subtle)]",
                  layout === 'split' && index === 0
                    ? "border-r border-[var(--tb-color-border-default)]"
                    : null,
                  action.tone === 'destructive' ? "text-[var(--destructive)]" : null,
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
