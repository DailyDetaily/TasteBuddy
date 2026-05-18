import { type ReactNode } from 'react';

import { cn } from '../ui/utils';

export interface ActionOverlayCardAction {
  label: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'destructive';
}

interface ActionOverlayCardProps {
  actions: ActionOverlayCardAction[];
  title: ReactNode;
  description?: ReactNode;
  layout?: 'stack' | 'split';
  onBackdropClick?: () => void;
}

export default function ActionOverlayCard({
  actions,
  title,
  description,
  layout = 'stack',
  onBackdropClick,
}: ActionOverlayCardProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-5"
      onClick={onBackdropClick}
    >
      <div
        className={cn(
          "w-full overflow-hidden bg-[var(--tb-color-bg-focus)] shadow-[var(--tb-shadow-drawer)]",
          layout === 'split' ? "max-w-[320px] rounded-[20px]" : "max-w-[320px] rounded-[20px] p-4",
        )}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
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

        <div
          className={cn(
            layout === 'split'
              ? "grid grid-cols-2 border-t border-[var(--tb-color-border-default)]"
              : "flex flex-col gap-2",
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
      </div>
    </div>
  );
}
