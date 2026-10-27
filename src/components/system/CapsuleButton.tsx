import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../ui/utils';
import './capsule-button.css';

export interface CapsuleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: 'outlined' | 'tonal';
  textSize?: 'sm' | 'md';
  icon?: LucideIcon;
  children: ReactNode;
}

/** Inherits the signed-in user's accent tokens; icons inherit the label color. */
const CapsuleButton = forwardRef<HTMLButtonElement, CapsuleButtonProps>(function CapsuleButton({
  appearance = 'outlined', textSize = 'md', icon: Icon, children,
  className, type = 'button', ...props
}, ref) {
  return (
    <button ref={ref} type={type} className={cn('tb-capsule-button', className)}
      data-appearance={appearance} data-text-size={textSize} {...props}>
      {Icon && <Icon aria-hidden="true" size={16} strokeWidth={1.8} className="tb-capsule-button__icon" />}
      <span className="tb-capsule-button__label">{children}</span>
    </button>
  );
});

export default CapsuleButton;
