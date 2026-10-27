import { buildTasteAdjustmentGradient, type TasteAdjustmentLike } from '../../constants/tasteColors';
import { cn } from '../ui/utils';
import { TCS_BADGE_BOX_SHADOW, tcsBadgeColor } from './tcsBadgeTokens';

export interface TCSBadgeProps {
  adjustments?: TasteAdjustmentLike[];
  className?: string;
  disabled?: boolean;
  label?: string;
}

export default function TCSBadge({
  adjustments = [],
  className,
  disabled = false,
  label = 'TCS',
}: TCSBadgeProps) {
  const gradient = buildTasteAdjustmentGradient(adjustments, { colorForTaste: tcsBadgeColor });
  return (
    <span
      className={cn(
        'tb-tcs-badge tb-badge-elevated relative inline-flex items-center rounded-[6px] px-[6px] py-[2px] text-[10px] font-bold text-white',
        disabled && 'tb-tcs-badge--disabled',
        className,
      )}
      aria-disabled={disabled || undefined}
      data-state={disabled ? 'disabled' : 'default'}
      style={
        disabled
          ? { boxShadow: TCS_BADGE_BOX_SHADOW, color: 'var(--tb-tcs-badge-label)' }
          : {
              background: gradient === '#E0E0E0' ? 'var(--tb-tcs-badge-empty)' : gradient,
              color: 'var(--tb-tcs-badge-label)',
              boxShadow: TCS_BADGE_BOX_SHADOW,
            }
      }
    >
      {label}
    </span>
  );
}
