import type { ReactNode } from 'react';
import {
  Sparkles as SparklesIcon
} from 'lucide-react';

import SectionCard from '../SectionCard';
import CardIconBox from './CardIconBox';
import { ICON_TOKENS } from '../../constants/designTokens';

type TCSHintCardSize = 'sm' | 'md';
type TCSHintCardSurface = 'nested' | 'standalone';

interface TCSHintCardProps {
  className?: string;
  description: string;
  icon?: ReactNode;
  size?: TCSHintCardSize;
  surface?: TCSHintCardSurface;
  title?: string;
}

const SIZE_STYLES: Record<
  TCSHintCardSize,
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

export default function TCSHintCard({
  className = '',
  description,
  icon,
  size = 'sm',
  surface = 'nested',
  title,
}: TCSHintCardProps) {
  const sizeStyle = SIZE_STYLES[size];
  const surfaceClassName =
    surface === 'standalone'
      ? 'bg-[var(--tb-color-surface-card)]'
      : 'bg-[var(--tb-color-surface-muted)]';

  return (
    <SectionCard
      hoverEffect={false}
      className={`${surfaceClassName} ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <CardIconBox className="bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
          {icon ?? <SparklesIcon size={sizeStyle.iconSize} />}
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
