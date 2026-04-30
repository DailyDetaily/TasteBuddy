import ImageBox from './ImageBox';

interface ChefAvatarProps {
  alt: string;
  className?: string;
  iconSize?: number;
  imageSrc?: string | null;
  size?: 'sm' | 'md' | 'lg';
  taste?: string;
  variant?: 'neutral' | 'taste';
}

export default function ChefAvatar({
  alt,
  className,
  iconSize,
  imageSrc,
  size,
  taste = '감칠맛',
  variant = 'taste',
}: ChefAvatarProps) {
  return (
    <ImageBox
      alt={alt}
      className={className}
      fallbackIconSize={iconSize}
      imageSrc={imageSrc}
      kind="chef"
      size={size}
      taste={taste}
      variant={variant}
    />
  );
}
