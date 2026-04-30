import { Bookmark, CirclePlus } from 'lucide-react';

import SectionCard from '../SectionCard';
import Chip from '../system/Chip';
import ImageBox from '../system/ImageBox';
import SectionTitle from '../system/SectionTitle';
import TasteChip from '../system/TasteChip';
import { ICON_TOKENS } from '../../constants/designTokens';
import type { RestaurantScoreTag } from './RestaurantScoreSummaryCard';

export interface RestaurantHeroViewModel {
  category: string;
  chef: {
    avatarUrl?: string | null;
    name: string;
  };
  heroImageUrl?: string | null;
  locationLabel: string;
  name: string;
  scores: {
    overallScore: number;
    palateFriendsAverageScore: number;
    personalMatchRate: number;
  };
  summaryLine: string;
  tags: RestaurantScoreTag[];
}

interface RestaurantHeroCardProps {
  isBookmarked?: boolean;
  onBookmarkClick?: () => void;
  onVisitedClick?: () => void;
  restaurant: RestaurantHeroViewModel;
}

const TASTE_AXIS_LABEL = {
  bitter: '쓴맛',
  fat: '지방맛',
  salty: '짠맛',
  sour: '신맛',
  sweet: '단맛',
  umami: '감칠맛',
} as const;

export default function RestaurantHeroCard({
  isBookmarked = false,
  onBookmarkClick,
  onVisitedClick,
  restaurant,
}: RestaurantHeroCardProps) {
  const scoreItems = [
    {
      label: '나와의 매칭률',
      value: `${restaurant.scores.personalMatchRate}%`,
    },
    {
      label: '비슷한 미각 기준',
      value: `${restaurant.scores.palateFriendsAverageScore}점`,
    },
    {
      label: '전체 평판',
      value: `${restaurant.scores.overallScore.toFixed(1)} / 5`,
    },
  ];
  const tasteTags = restaurant.tags.filter((tag) => tag.tone === 'taste' && tag.tasteAxis);
  const contextTags = restaurant.tags.filter((tag) => tag.tone !== 'taste' || !tag.tasteAxis);

  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-4">
        <ImageBox
          alt={`${restaurant.name} 대표 이미지`}
          className="h-[172px] w-full rounded-[16px]"
          imageSrc={restaurant.heroImageUrl}
          imageClassName="object-cover"
          kind="restaurant"
          variant="neutral"
        />

        <div className="flex flex-col gap-3 border-b border-[var(--tb-color-border-subtle)] pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <ImageBox
                alt={`${restaurant.name} 이미지`}
                className="rounded-[8px]"
                imageSrc={restaurant.heroImageUrl}
                kind="restaurant"
                size="lg"
                variant="neutral"
              />
              <div className="min-w-0">
                <SectionTitle as="h1" size="lg" className="truncate leading-snug">
                  {restaurant.name}
                </SectionTitle>
                <p className="min-w-0 truncate text-[13px] font-medium text-[var(--tb-color-text-subtle)]">
                  {restaurant.chef.name} 셰프
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="먹어본 식당 피드백 남기기"
                title="먹어본 식당"
                onClick={onVisitedClick}
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

          <p className="text-[12px] font-normal leading-relaxed text-[var(--tb-color-text-muted)]">
            • {restaurant.summaryLine}
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {tasteTags.map((tag) => (
                <TasteChip
                  key={tag.id}
                  taste={TASTE_AXIS_LABEL[tag.tasteAxis]}
                  value={tag.label}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip size="xs" tone="neutral" variant="soft">
                {restaurant.category}
              </Chip>
              <Chip size="xs" tone="neutral" variant="soft">
                {restaurant.locationLabel}
              </Chip>
              {contextTags.map((tag) => (
                <Chip key={tag.id} size="xs" tone="neutral" variant="soft">
                  {tag.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {scoreItems.map((item) => (
            <div
              key={item.label}
              className="min-w-0 px-2 py-1 text-center"
            >
              <p className="text-[18px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
                {item.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-snug text-[var(--tb-color-text-muted)]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
