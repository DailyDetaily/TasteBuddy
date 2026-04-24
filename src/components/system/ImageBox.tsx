import type { CSSProperties, HTMLAttributes } from 'react';
import {
  ChefHat,
  ImageIcon,
  Store,
  Utensils,
  UserRound,
} from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';
import { getTasteColor } from '../../constants/tasteColors';
import TokenBox, { type TokenBoxSize } from './TokenBox';
import { cn } from '../ui/utils';

type ImageBoxSize = TokenBoxSize;
type ImageBoxFallback = 'person' | 'chef' | 'restaurant' | 'menu' | 'generic';
type ImageBoxVariant = 'neutral' | 'taste';

interface ImageBoxProps extends HTMLAttributes<HTMLDivElement> {
  alt: string;
  fallback?: ImageBoxFallback;
  fallbackIconSize?: number;
  imageClassName?: string;
  imageSrc?: string | null;
  size?: ImageBoxSize;
  style?: CSSProperties;
  taste?: string;
  variant?: ImageBoxVariant;
}

const FALLBACK_ICON = {
  chef: ChefHat,
  generic: ImageIcon,
  menu: Utensils,
  person: UserRound,
  restaurant: Store,
} satisfies Record<ImageBoxFallback, typeof UserRound>;

const FALLBACK_ICON_SIZE: Record<ImageBoxSize, number> = {
  sm: ICON_TOKENS.size.md,
  md: ICON_TOKENS.size.control,
  lg: ICON_TOKENS.size.xl,
};

const SIZE_CLASS: Record<ImageBoxSize, string> = {
  sm: 'size-[var(--tb-box-size-sm)]',
  md: 'size-[var(--tb-box-size-md)]',
  lg: 'size-[var(--tb-box-size-lg)]',
};

export default function ImageBox({
  alt,
  className,
  fallback = 'generic',
  fallbackIconSize,
  imageClassName,
  imageSrc,
  size,
  style,
  taste = '감칠맛',
  variant = 'neutral',
  ...props
}: ImageBoxProps) {
  const fallbackColor =
    variant === 'taste' ? getTasteColor(taste) : 'var(--tb-color-icon-muted)';
  const FallbackIcon = FALLBACK_ICON[fallback];
  const effectiveSize = size ?? 'md';
  const shouldApplySize = Boolean(size) || !className;

  if (imageSrc) {
    return (
      <div
        className={cn(
          'shrink-0 overflow-hidden rounded-[var(--tb-radius-8)] bg-[var(--tb-color-surface-muted)]',
          shouldApplySize && SIZE_CLASS[effectiveSize],
          className,
        )}
        style={{
          ...style,
        }}
        {...props}
      >
        <img
          src={imageSrc}
          alt={alt}
          className={cn('size-full object-cover', imageClassName)}
        />
      </div>
    );
  }

  return (
    <TokenBox
      aria-label={alt}
      backgroundToken={variant === 'taste' ? 'surface-base' : 'surface-muted'}
      className={className}
      role="img"
      size={shouldApplySize ? effectiveSize : null}
      style={{
        color: fallbackColor,
        ...style,
      }}
      textToken="icon-muted"
      {...props}
    >
      <FallbackIcon aria-hidden="true" size={fallbackIconSize ?? FALLBACK_ICON_SIZE[effectiveSize]} />
    </TokenBox>
  );
}
