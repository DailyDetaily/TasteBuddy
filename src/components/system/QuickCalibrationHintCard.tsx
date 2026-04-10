import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

import SectionCard from '../SectionCard';
import { ICON_TOKENS } from '../../constants/designTokens';

type QuickCalibrationHintCardSize = 'sm' | 'md';

interface QuickCalibrationHintCardProps {
  className?: string;
  description: string;
  icon?: ReactNode;
  size?: QuickCalibrationHintCardSize;
  title?: string;
}

const SIZE_STYLES: Record<
  QuickCalibrationHintCardSize,
  {
    iconSize: number;
    iconWrapperRadius: string;
    iconWrapperSize: number;
  }
> = {
  md: {
    iconSize: ICON_TOKENS.size.md,
    iconWrapperRadius: 'var(--tb-radius-12)',
    iconWrapperSize: ICON_TOKENS.container.md,
  },
  sm: {
    iconSize: ICON_TOKENS.size.sm,
    iconWrapperRadius: 'var(--tb-radius-10)',
    iconWrapperSize: ICON_TOKENS.container.sm,
  },
};

export default function QuickCalibrationHintCard({
  className = '',
  description,
  icon,
  size = 'sm',
  title,
}: QuickCalibrationHintCardProps) {
  const sizeStyle = SIZE_STYLES[size];

  return (
    <SectionCard
      hoverEffect={false}
      className={`bg-[var(--tb-color-surface-muted)] ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex shrink-0 items-center justify-center bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]"
          style={{
            width: sizeStyle.iconWrapperSize,
            height: sizeStyle.iconWrapperSize,
            borderRadius: sizeStyle.iconWrapperRadius,
          }}
        >
          {icon ?? <Sparkles size={sizeStyle.iconSize} strokeWidth={ICON_TOKENS.strokeWidth.regular} />}
        </div>
        {title ? (
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              {title}
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              {description}
            </p>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {description}
          </p>
        )}
      </div>
    </SectionCard>
  );
}
