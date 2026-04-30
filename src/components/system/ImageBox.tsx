import { useEffect, useState, type CSSProperties, type HTMLAttributes } from 'react';
import {
  ChefHat,
  ImageIcon,
  Store,
  Utensils,
  UserRound,
} from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';
import { getChefImageByName } from '../../constants/chefImages';
import TokenBox, { type TokenBoxSize } from './TokenBox';
import { cn } from '../ui/utils';

type ImageBoxSize = TokenBoxSize;
export type ImageBoxKind = 'chef' | 'restaurant' | 'menu';
type ImageBoxFallback = ImageBoxKind | 'person' | 'generic';
type ImageBoxVariant = 'neutral' | 'taste';

interface ImageBoxProps extends HTMLAttributes<HTMLDivElement> {
  alt: string;
  kind?: ImageBoxKind;
  fallback?: ImageBoxFallback;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
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

const KIND_FALLBACK = {
  chef: 'person',
  menu: 'menu',
  restaurant: 'restaurant',
} satisfies Record<ImageBoxKind, ImageBoxFallback>;

const FALLBACK_ICON_SIZE: Record<ImageBoxSize, number> = {
  sm: ICON_TOKENS.size.sm,
  md: ICON_TOKENS.size.md,
  lg: ICON_TOKENS.size.lg,
};

const SIZE_CLASS: Record<ImageBoxSize, string> = {
  sm: 'size-[var(--tb-box-size-sm)]',
  md: 'size-[var(--tb-box-size-md)]',
  lg: 'size-[var(--tb-box-size-lg)]',
};

export default function ImageBox({
  alt,
  className,
  fallback,
  fallbackIconColor = 'var(--tb-color-icon-muted)',
  fallbackIconSize,
  imageClassName,
  imageSrc,
  kind,
  size,
  style,
  taste = '감칠맛',
  variant = 'neutral',
  ...props
}: ImageBoxProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const effectiveFallback = fallback ?? (kind ? KIND_FALLBACK[kind] : 'generic');
  const FallbackIcon = FALLBACK_ICON[effectiveFallback];
  const effectiveSize = size ?? 'md';
  const chefFallbackImageSrc = kind === 'chef' ? getChefImageByName(alt) : null;
  const resolvedImageSrc = imageLoadFailed
    ? chefFallbackImageSrc
    : imageSrc ?? chefFallbackImageSrc;
  const shouldApplySize = Boolean(size) || !className;
  const shouldShowImage = Boolean(resolvedImageSrc);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [chefFallbackImageSrc, imageSrc]);

  if (shouldShowImage) {
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
          src={resolvedImageSrc}
          alt={alt}
          className={cn('size-full object-cover', imageClassName)}
          onError={() => {
            if (resolvedImageSrc !== chefFallbackImageSrc) {
              setImageLoadFailed(true);
            }
          }}
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
        color: fallbackIconColor,
        ...style,
      }}
      textToken="icon-muted"
      {...props}
    >
      <FallbackIcon
        aria-hidden="true"
        size={fallbackIconSize ?? FALLBACK_ICON_SIZE[effectiveSize]}
        strokeWidth={ICON_TOKENS.strokeWidth.regular}
      />
    </TokenBox>
  );
}
