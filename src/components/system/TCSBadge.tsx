import { buildTasteAdjustmentGradient, type TasteAdjustmentLike } from '../../constants/tasteColors';
import { cn } from '../ui/utils';

const TCS_BADGE_BOX_SHADOW =
  '0 2px 8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), 1px 1px 2px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.5), inset 1px 0 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.1), inset -1px 0 1px rgba(0,0,0,0.1)';

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
          ? { boxShadow: TCS_BADGE_BOX_SHADOW }
          : {
              background: buildTasteAdjustmentGradient(adjustments),
              boxShadow: TCS_BADGE_BOX_SHADOW,
            }
      }
    >
      {label}
    </span>
  );
}
