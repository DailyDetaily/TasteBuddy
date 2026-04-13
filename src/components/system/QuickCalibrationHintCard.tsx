import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

import SectionCard from '../SectionCard';
import CardIconBox from './CardIconBox';
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
  }
> = {
  md: {
    iconSize: ICON_TOKENS.size.md,
  },
  sm: {
    iconSize: ICON_TOKENS.size.md,
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
        <CardIconBox className="bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
          {icon ?? <Sparkles size={sizeStyle.iconSize} strokeWidth={ICON_TOKENS.strokeWidth.regular} />}
        </CardIconBox>
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
