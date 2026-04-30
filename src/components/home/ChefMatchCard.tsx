import ImageBox from '../system/ImageBox';
import { ICON_TOKENS, TASTE_TOKENS, type TasteId } from '../../constants/designTokens';
import {
  getTasteTint,
  getTasteTintSurface,
  getTasteTintSurfaceSubText,
  getTasteTintSurfaceText,
} from '../../constants/tasteColors';
import { cn } from '../ui/utils';

interface ChefMatchCardProps {
  chefName: string;
  className?: string;
  hoverMotion?: boolean;
  hoverShadow?: boolean;
  imageSrc?: string | null;
  matchRate: number;
  matchReason?: string;
  restaurant: string;
  tasteId: TasteId;
}

export default function ChefMatchCard({
  chefName,
  className,
  hoverMotion = true,
  hoverShadow = true,
  imageSrc,
  matchRate,
  matchReason,
  restaurant,
  tasteId,
}: ChefMatchCardProps) {
  const taste = TASTE_TOKENS[tasteId];
  const tasteLabel = taste.label;

  return (
    <div
      className={cn(
        'box-border flex h-[132px] w-[132px] shrink-0 cursor-pointer flex-col items-start gap-[12px] overflow-clip rounded-[20px] p-[12px]',
        hoverMotion && 'transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]',
        hoverShadow && 'hover:shadow-[var(--tb-shadow-strong)]',
        className,
      )}
      style={{
        backgroundColor: getTasteTintSurface(tasteLabel),
        border: `1px solid ${getTasteTint(tasteLabel, 0.18)}`,
      }}
      aria-label={`${chefName}, ${restaurant}, 매칭률 ${matchRate}%${matchReason ? `. ${matchReason}` : ''}`}
    >
      <ImageBox
        alt={chefName}
        className="shrink-0"
        fallbackIconColor={taste.palette.main}
        fallbackIconSize={ICON_TOKENS.size.xl}
        imageSrc={imageSrc}
        kind="chef"
        size="lg"
        taste={tasteLabel}
        variant="taste"
      />

      <div className="flex w-full grow flex-col items-start justify-between leading-[normal]">
        <div className="flex w-full shrink-0 flex-col items-start gap-[2px]">
          <p
            className="w-full truncate text-[14px] font-bold"
            style={{ color: getTasteTintSurfaceText(tasteLabel) }}
          >
            {chefName}
          </p>
          <p
            className="w-full truncate text-[10px] font-normal"
            style={{ color: getTasteTintSurfaceSubText(tasteLabel) }}
          >
            {restaurant}
          </p>
        </div>
        <p
          className="text-[10px] font-semibold"
          style={{ color: getTasteTintSurfaceText(tasteLabel) }}
        >
          매칭률 {matchRate}%
        </p>
      </div>
    </div>
  );
}
