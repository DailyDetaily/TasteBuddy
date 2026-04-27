import { Bookmark, CircleCheck, CirclePlus } from 'lucide-react';

import SectionCard from '../SectionCard';
import ChefAvatar from '../system/ChefAvatar';
import Chip from '../system/Chip';
import ImageBox from '../system/ImageBox';
import SectionTitle from '../system/SectionTitle';
import { ICON_TOKENS } from '../../constants/designTokens';

export interface RestaurantHeroViewModel {
  category: string;
  chef: {
    avatarUrl?: string | null;
    name: string;
  };
  heroImageUrl?: string | null;
  locationLabel: string;
  name: string;
  summaryLine: string;
}

interface RestaurantHeroCardProps {
  isBookmarked?: boolean;
  onBookmarkClick?: () => void;
  restaurant: RestaurantHeroViewModel;
}

export default function RestaurantHeroCard({
  isBookmarked = false,
  onBookmarkClick,
  restaurant,
}: RestaurantHeroCardProps) {
  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-4">
        <ImageBox
          alt={`${restaurant.name} 대표 이미지`}
          className="h-[172px] w-full rounded-[16px]"
          fallback="restaurant"
          imageSrc={restaurant.heroImageUrl}
          imageClassName="object-cover"
          variant="neutral"
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="xs" tone="neutral" variant="soft">
              {restaurant.category}
            </Chip>
            <Chip size="xs" tone="neutral" variant="soft">
              {restaurant.locationLabel}
            </Chip>
          </div>

          <div className="flex flex-col gap-2">
            <SectionTitle as="h1" size="lg" className="leading-snug">
              {restaurant.name}
            </SectionTitle>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                <ChefAvatar
                  alt={restaurant.chef.name}
                  className="size-[40px] rounded-[8px]"
                  imageSrc={restaurant.chef.avatarUrl}
                  variant="neutral"
                />
                <p className="min-w-0 truncate text-[13px] font-medium text-[var(--tb-color-text-subtle)]">
                  {restaurant.chef.name} 셰프
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                type="button"
                aria-label="먹어본 식당에 추가"
                title="먹어본 식당"
                  className="flex size-[32px] items-center justify-center text-[var(--tb-color-text-secondary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                >
                  <CirclePlus aria-hidden="true" size={ICON_TOKENS.size.xl} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  aria-label="북마크"
                  title="북마크"
                  onClick={onBookmarkClick}
                  className={`flex size-[32px] items-center justify-center transition-colors hover:text-[var(--tb-color-text-primary)] ${
                    isBookmarked
                      ? 'text-[var(--tb-color-text-primary)] [&>svg]:fill-current'
                      : 'text-[var(--tb-color-text-secondary)]'
                  }`}
                >
                  <Bookmark aria-hidden="true" size={ICON_TOKENS.size.xl} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
              Taste Buddy 해석
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
              {restaurant.summaryLine}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-[12px] border border-[var(--tb-color-border-subtle)] px-3 py-2">
          <CircleCheck
            aria-hidden="true"
            className="mt-[2px] shrink-0 text-[var(--tb-color-icon-primary)]"
            size={14}
            strokeWidth={1.8}
          />
          <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
            방문 후 메뉴별 Dish Memory를 남기면 다음 다이닝 기준이 더 정교해집니다.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
