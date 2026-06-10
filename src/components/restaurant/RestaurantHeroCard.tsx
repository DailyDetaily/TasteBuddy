import { useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  Clock,
  MapPin,
  Phone,
} from 'lucide-react';

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
    displayLabel?: string;
    name: string;
  };
  heroImageUrl?: string | null;
  locationLabel: string;
  mediaStatus?: 'placeholder' | 'verified';
  name: string;
  scores: {
    overallScore: number;
    palateFriendsAverageScore: number;
    personalMatchRate: number;
  };
  summaryLine: string;
  tags: RestaurantScoreTag[];
}

interface RestaurantHeroQuickInfo {
  address?: string;
  hours?: string;
  phone?: string;
}

type RestaurantHeroQuickInfoItem = {
  allValues?: string[];
  icon: typeof MapPin;
  id: string;
  value: string;
};

type HoursDisplay = {
  all: string[];
  today: string;
};

interface RestaurantHeroCardProps {
  isBookmarked?: boolean;
  onBookmarkClick?: () => void;
  onVisitedClick?: () => void;
  quickInfo?: RestaurantHeroQuickInfo;
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

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function splitHoursByDay(value: string) {
  return value
    .split(/\s*\/\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getHoursLineWeekday(line: string) {
  const normalizedLine = line.replace(/^요일\s*/, '');

  return WEEKDAY_LABELS.find(
    (weekdayLabel) =>
      normalizedLine.startsWith(`${weekdayLabel} `) ||
      normalizedLine.startsWith(`${weekdayLabel}요일`) ||
      normalizedLine.startsWith(`${weekdayLabel}:`),
  );
}

function getHoursDisplay(value?: string): HoursDisplay | null {
  if (!value) {
    return null;
  }

  const all = splitHoursByDay(value);
  const dayLines = all.filter((line) => getHoursLineWeekday(line));

  if (dayLines.length < 2) {
    return null;
  }

  const todayLabel = WEEKDAY_LABELS[new Date().getDay()];
  const today = all.find((line) => getHoursLineWeekday(line) === todayLabel) ?? dayLines[0];

  return { all, today };
}

export default function RestaurantHeroCard({
  isBookmarked = false,
  onBookmarkClick,
  onVisitedClick,
  quickInfo,
  restaurant,
}: RestaurantHeroCardProps) {
  const [isQuickHoursExpanded, setIsQuickHoursExpanded] = useState(false);
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
  const hasVerifiedMedia = restaurant.mediaStatus !== 'placeholder';
  const chefLine =
    restaurant.chef.displayLabel ??
    (restaurant.chef.name === 'Taste Buddy 분석 준비 중' && quickInfo?.address
      ? quickInfo.address
      : `${restaurant.chef.name} 셰프`);
  const hoursDisplay = getHoursDisplay(quickInfo?.hours);
  const quickHoursValue = hoursDisplay?.today ?? quickInfo?.hours;
  const quickInfoItems = [
    quickInfo?.address
      ? {
          icon: MapPin,
          id: 'address',
          value: quickInfo.address,
        }
      : null,
    quickHoursValue
      ? {
          allValues: hoursDisplay?.all,
          icon: Clock,
          id: 'hours',
          value: quickHoursValue,
        }
      : null,
    quickInfo?.phone
      ? {
          icon: Phone,
          id: 'phone',
          value: quickInfo.phone,
        }
      : null,
  ].filter((item): item is RestaurantHeroQuickInfoItem => Boolean(item));

  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-4">
        <ImageBox
          alt={`${restaurant.name} 대표 이미지`}
          className="h-[172px] w-full rounded-[16px]"
          imageSrc={hasVerifiedMedia ? restaurant.heroImageUrl : null}
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
                fallback="person"
                imageSrc={hasVerifiedMedia ? restaurant.chef.avatarUrl : null}
                kind="chef"
                size="lg"
                variant="neutral"
              />
              <div className="min-w-0">
                <SectionTitle as="h1" size="lg" className="truncate leading-snug">
                  {restaurant.name}
                </SectionTitle>
                <p className="min-w-0 truncate text-[13px] font-medium text-[var(--tb-color-text-subtle)]">
                  {chefLine}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {onVisitedClick ? (
                <button
                  type="button"
                  aria-label="먹어본 식당 피드백 남기기"
                  title="먹어본 식당"
                  onClick={(event) => {
                    event.stopPropagation();
                    onVisitedClick();
                  }}
                  className="flex size-[32px] items-center justify-center text-[var(--tb-color-text-secondary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                >
                  <CirclePlus aria-hidden="true" size={ICON_TOKENS.size.xl} strokeWidth={1.8} />
                </button>
              ) : null}
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

          {quickInfoItems.length > 0 ? (
            <div className="flex flex-col gap-0.5 text-[11px] font-medium leading-relaxed text-[var(--tb-color-text-muted)]">
              {quickInfoItems.map((item) => (
                <div
                  className={`flex gap-1.5 ${item.id === 'hours' && isQuickHoursExpanded ? 'items-start' : 'items-center'}`}
                  key={item.id}
                >
                  <item.icon
                    aria-hidden="true"
                    className={`shrink-0 text-[var(--tb-color-icon-secondary)] ${item.id === 'hours' && isQuickHoursExpanded ? 'mt-[2px]' : ''}`}
                    size={12}
                    strokeWidth={1.8}
                  />
                  <div className="min-w-0">
                    {item.id === 'hours' && isQuickHoursExpanded && item.allValues ? (
                      <div className="space-y-0.5">
                        {item.allValues.map((line) => (
                          <p className="break-words" key={line}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="break-words">
                        {item.value}
                      </p>
                    )}
                  </div>
                  {item.id === 'address' ? (
                    <button
                      className="shrink-0 text-[11px] font-semibold text-[var(--tb-user-accent-main)] transition-colors hover:text-[var(--tb-user-accent-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-user-accent-tint-soft-border)]"
                      onClick={() => {
                        void navigator.clipboard?.writeText(item.value);
                      }}
                      type="button"
                    >
                      복사
                    </button>
                  ) : null}
                  {item.id === 'hours' && item.allValues ? (
                    <button
                      aria-expanded={isQuickHoursExpanded}
                      aria-label={isQuickHoursExpanded ? '전체 영업시간 접기' : '전체 영업시간 펼치기'}
                      className={`shrink-0 text-[var(--tb-color-icon-secondary)] transition-colors hover:text-[var(--tb-color-icon-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)] ${isQuickHoursExpanded ? 'self-start' : 'self-center'}`}
                      onClick={() => setIsQuickHoursExpanded((current) => !current)}
                      type="button"
                    >
                      {isQuickHoursExpanded ? (
                        <ChevronUp aria-hidden="true" size={14} strokeWidth={1.9} />
                      ) : (
                        <ChevronDown aria-hidden="true" size={14} strokeWidth={1.9} />
                      )}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

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
