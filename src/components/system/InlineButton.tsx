import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ICON_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

type InlineButtonContent =
  | { iconOnly: true; icon: LucideIcon; 'aria-label': string; children?: never }
  | { iconOnly?: false; icon?: LucideIcon; children: ReactNode };

export type InlineButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & InlineButtonContent & {
  tone?: 'neutral' | 'accent';
  iconPosition?: 'leading' | 'trailing';
};

/** A compact action within content. Icon-only actions require an accessible name. */
export default function InlineButton({
  className, type = 'button', tone = 'accent', icon: Icon,
  iconPosition = 'trailing', iconOnly = false, children, ...props
}: InlineButtonProps) {
  const icon = Icon ? <Icon aria-hidden="true" size={ICON_TOKENS.size.sm} strokeWidth={ICON_TOKENS.strokeWidth.regular} className="shrink-0" style={{ color: "var(--tb-inline-button-icon-color, currentColor)" }} /> : null;
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-[16.5px] shrink-0 items-center justify-center gap-0.5 whitespace-nowrap rounded-[2px] text-[11px] font-semibold leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:opacity-70 disabled:pointer-events-none disabled:text-[var(--tb-color-text-disabled)]',
        tone === 'accent'
          ? 'text-[var(--tb-user-accent-main)] hover:text-[var(--tb-user-accent-dark)] focus-visible:ring-[var(--tb-color-border-focus)]'
          : 'text-[var(--tb-color-icon-muted)] hover:text-[var(--tb-color-text-primary)] focus-visible:ring-[var(--tb-color-border-focus)]',
        className,
      )}
      {...props}
    >
      {iconOnly ? icon : <>{iconPosition === 'leading' && icon}{children}{iconPosition === 'trailing' && icon}</>}
    </button>
  );
}
