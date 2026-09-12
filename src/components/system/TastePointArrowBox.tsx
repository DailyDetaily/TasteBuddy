import type { CSSProperties } from 'react';

import svgPaths from '../../imports/svg-h9nsrm0gkv';
import { getTasteColor } from '../../constants/tasteColors';
import { cn } from '../ui/utils';

export const TASTE_POINT_ARROW_BOX_SIZE_TOKENS = {
  sm: 18,
  md: 24,
  lg: 32,
} as const;

export const TASTE_POINT_ARROW_BOX_DIRECTION_TOKENS = {
  increase: 'increase',
  decrease: 'decrease',
  neutral: 'neutral',
} as const;

export type TastePointArrowBoxSize = keyof typeof TASTE_POINT_ARROW_BOX_SIZE_TOKENS;
export type TastePointArrowBoxTrend = keyof typeof TASTE_POINT_ARROW_BOX_DIRECTION_TOKENS;

const TASTE_POINT_ARROW_BOX_DIRECTION_PATHS: Record<TastePointArrowBoxTrend, string> = {
  increase: svgPaths.p3d191ac0,
  decrease: svgPaths.p1157b300,
  neutral: 'M5.25 9H12.75',
};

interface TastePointArrowBoxProps {
  className?: string;
  parentTaste?: string;
  size?: TastePointArrowBoxSize;
  trend: TastePointArrowBoxTrend;
}

export default function TastePointArrowBox({
  className,
  parentTaste,
  size = 'sm',
  trend,
}: TastePointArrowBoxProps) {
  const boxSize = TASTE_POINT_ARROW_BOX_SIZE_TOKENS[size];
  const fillColor = parentTaste ? getTasteColor(parentTaste) : 'var(--tb-color-text-hint)';

  return (
    <div
      aria-hidden="true"
      className={cn('relative shrink-0', className)}
      data-name="Taste Point Arrow Box"
      style={{
        width: boxSize,
        height: boxSize,
        '--fill-0': fillColor,
      } as CSSProperties}
    >
      <div className="absolute inset-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
          <g>
            <rect fill="var(--fill-0, #B372B4)" height="18" rx="4" width="18" />
            <path
              d={TASTE_POINT_ARROW_BOX_DIRECTION_PATHS[trend]}
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
