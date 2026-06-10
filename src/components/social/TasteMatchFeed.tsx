import { useState } from 'react';

import { getChefImageByName } from '../../constants/chefImages';
import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../../constants/designTokens';
import {
  getTasteTint,
  getTasteTintSurface,
  getTasteTintSurfaceSubText,
  getTasteTintSurfaceText,
} from '../../constants/tasteColors';
import type {
  PublicTasteProfile,
  TasteProfileSnapshot,
  TasteMatchFeedItem,
} from '../../types/tasteBuddyAgent';
import PalateBloomAvatar, {
  createPalateBloomProfileFromMeasurementSnapshot,
} from '../system/PalateBloomAvatar';
import CardScrollList from '../system/CardScrollList';
import ImageBox from '../system/ImageBox';
import SectionTitle from '../system/SectionTitle';
import { DishFeedbackCardSkeleton } from '../dining/DishFeedbackCard';
import SocialDishFeedbackCard from './SocialDishFeedbackCard';

type RecommendationSectionMode = 'buddy' | 'restaurant' | 'chef';

interface TasteMatchFeedProps {
  commentCountsByItemId?: Record<string, number>;
  feedItems: TasteMatchFeedItem[];
  fallbackBuddyProfiles?: PublicTasteProfile[];
  isFeedLoading?: boolean;
  onLikeDishFeedback?: (item: TasteMatchFeedItem) => void;
  onOpenBuddyProfile?: (profile: PublicTasteProfile) => void;
  onOpenDishComments?: (item: TasteMatchFeedItem) => void;
  onOpenRestaurantDetail?: (item: TasteMatchFeedItem) => void;
  viewerProfile?: TasteProfileSnapshot;
}

interface AxisRecommendationItem {
  axisScore: number;
  item: TasteMatchFeedItem;
  sourceTasteId: TasteId;
}

const RECOMMENDATION_MODE_OPTIONS: Array<{
  label: string;
  mode: RecommendationSectionMode;
}> = [
  { label: '버디 추천', mode: 'buddy' },
  { label: '레스토랑 추천', mode: 'restaurant' },
  { label: '셰프 추천', mode: 'chef' },
];
const RECOMMENDATION_SKELETON_CARD_COUNT = 3;
const FOLLOWING_DISH_FEEDBACK_SKELETON_CARD_COUNT = 3;

const CHEF_NAME_BY_RESTAURANT: Record<string, string> = {
  밍글스: '강민구',
  숍리제: '이은지',
  정식당: '임정식',
};

const REVIEW_TAG_TASTE_HINTS: Record<string, Partial<Record<TasteId, number>>> = {
  crisp: { sour: 0.58, bitter: 0.16 },
  deep: { umami: 0.62, fat: 0.28 },
  delicate: { sour: 0.22, bitter: 0.16, fat: 0.2 },
  dessert: { sweet: 0.58, fat: 0.22 },
  fermented: { umami: 0.52, sour: 0.24 },
  fresh: { sour: 0.5, bitter: 0.18 },
  gentle: { sweet: 0.2, fat: 0.1, salty: 0.1 },
  grilled: { bitter: 0.22, umami: 0.46, fat: 0.2 },
  rich: { fat: 0.58, umami: 0.22 },
  savory: { umami: 0.6, salty: 0.2 },
  seafood: { umami: 0.48, salty: 0.22, sour: 0.14 },
  smoky: { bitter: 0.28, umami: 0.36 },
  spicy: { bitter: 0.18, sour: 0.2 },
  sweet: { sweet: 0.62 },
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getTasteLabel(tasteId: TasteId) {
  return TASTE_TOKENS[tasteId].label;
}

function getPrimaryTasteId(item: TasteMatchFeedItem): TasteId {
  const sharedTasteId = item.sharedSignals.find((signal) => signal.tasteId)?.tasteId;

  if (sharedTasteId) {
    return sharedTasteId;
  }

  return TASTE_IDS
    .slice()
    .sort((left, right) => {
      const leftPresence = getItemAxisPresence(item, left);
      const rightPresence = getItemAxisPresence(item, right);

      return rightPresence - leftPresence;
    })[0] ?? 'umami';
}

function getPrimaryTasteLabel(item: TasteMatchFeedItem, sourceTasteId?: TasteId) {
  return getTasteLabel(sourceTasteId ?? getPrimaryTasteId(item));
}

function getRankedTasteAxes(viewerProfile?: TasteProfileSnapshot) {
  if (!viewerProfile) {
    return [];
  }

  return TASTE_IDS
    .slice()
    .sort((left, right) => {
      const leftScore =
        viewerProfile.preferenceVector[left] * 0.55 +
        viewerProfile.tasteVector[left] * 0.3 +
        viewerProfile.confidenceByAxis[left] * 0.15;
      const rightScore =
        viewerProfile.preferenceVector[right] * 0.55 +
        viewerProfile.tasteVector[right] * 0.3 +
        viewerProfile.confidenceByAxis[right] * 0.15;

      return rightScore - leftScore;
    })
    .map((tasteId, index) => ({
      rank: index + 1,
      tasteId,
      value: clamp(
        viewerProfile.preferenceVector[tasteId] * 0.55 +
        viewerProfile.tasteVector[tasteId] * 0.3 +
        viewerProfile.confidenceByAxis[tasteId] * 0.15,
      ),
    }));
}

function getTagAxisPresence(item: TasteMatchFeedItem, tasteId: TasteId) {
  const tags = [...item.tasteTags, ...item.experienceTags];
  const totalPresence = tags.reduce((sum, tag) => {
    const hint = REVIEW_TAG_TASTE_HINTS[tag]?.[tasteId] ?? 0;

    return sum + Math.max(0, hint);
  }, 0);

  return clamp(totalPresence / 1.1);
}

function getSharedAxisPresence(item: TasteMatchFeedItem, tasteId: TasteId) {
  const sharedSignal = item.sharedSignals.find((signal) => signal.tasteId === tasteId);

  return sharedSignal ? clamp(0.55 + sharedSignal.confidence * 0.45) : 0;
}

function getItemAxisPresence(item: TasteMatchFeedItem, tasteId: TasteId) {
  const tagPresence = getTagAxisPresence(item, tasteId);
  const sharedPresence = getSharedAxisPresence(item, tasteId);
  const reviewerPresence =
    item.reviewer.snapshot.preferenceVector[tasteId] ??
    item.reviewer.snapshot.tasteVector[tasteId] ??
    0.5;

  return clamp(tagPresence * 0.48 + sharedPresence * 0.32 + reviewerPresence * 0.2);
}

function createAxisRecommendationItem(
  item: TasteMatchFeedItem,
  sourceTasteId: TasteId,
  axisValue = 0.5,
): AxisRecommendationItem {
  const axisPresence = getItemAxisPresence(item, sourceTasteId);
  const matchScore = clamp(item.matchScore / 100);
  const learnedConfidence = clamp(item.learnedConfidenceScore ?? 0);

  return {
    axisScore: clamp(matchScore * 0.68 + axisPresence * 0.18 + axisValue * 0.07 + learnedConfidence * 0.07),
    item,
    sourceTasteId,
  };
}

function getBestUniqueRecommendationItems(
  items: TasteMatchFeedItem[],
  getEntityKey: (item: TasteMatchFeedItem) => string,
) {
  const itemMap = new Map<string, TasteMatchFeedItem>();

  for (const item of items) {
    const key = getEntityKey(item);
    const existing = itemMap.get(key);

    if (!existing || item.matchScore > existing.matchScore) {
      itemMap.set(key, item);
    }
  }

  return Array.from(itemMap.values())
    .sort((left, right) => right.matchScore - left.matchScore)
    .map((item) => createAxisRecommendationItem(item, getPrimaryTasteId(item)));
}

function getAxisMatchedRecommendationItems({
  getEntityKey,
  items,
  viewerProfile,
}: {
  getEntityKey: (item: TasteMatchFeedItem) => string;
  items: TasteMatchFeedItem[];
  viewerProfile?: TasteProfileSnapshot;
}) {
  const rankedAxes = getRankedTasteAxes(viewerProfile);

  if (rankedAxes.length === 0) {
    return getBestUniqueRecommendationItems(items, getEntityKey);
  }

  const selectedItems: AxisRecommendationItem[] = [];
  const consumedEntityKeys = new Set<string>();

  for (const rankedAxis of rankedAxes) {
    const axisCandidates = items
      .map((item) => createAxisRecommendationItem(item, rankedAxis.tasteId, rankedAxis.value))
      .filter((candidate) => getItemAxisPresence(candidate.item, rankedAxis.tasteId) >= 0.12)
      .sort((left, right) => {
        if (right.axisScore !== left.axisScore) {
          return right.axisScore - left.axisScore;
        }

        return right.item.matchScore - left.item.matchScore;
      });
    const fallbackCandidates = axisCandidates.length > 0
      ? axisCandidates
      : items
          .map((item) => createAxisRecommendationItem(item, rankedAxis.tasteId, rankedAxis.value))
          .sort((left, right) => right.axisScore - left.axisScore);
    const selectedCandidate = fallbackCandidates.find(
      (candidate) => !consumedEntityKeys.has(getEntityKey(candidate.item)),
    );

    if (!selectedCandidate) {
      continue;
    }

    consumedEntityKeys.add(getEntityKey(selectedCandidate.item));
    selectedItems.push(selectedCandidate);
  }

  const remainingItems = getBestUniqueRecommendationItems(items, getEntityKey)
    .filter((candidate) => !consumedEntityKeys.has(getEntityKey(candidate.item)));

  return [...selectedItems, ...remainingItems];
}

function getBuddyRecommendationItems(items: TasteMatchFeedItem[], viewerProfile?: TasteProfileSnapshot) {
  return getAxisMatchedRecommendationItems({
    getEntityKey: (item) => item.reviewerId,
    items,
    viewerProfile,
  });
}

function getRestaurantRecommendationItems(items: TasteMatchFeedItem[], viewerProfile?: TasteProfileSnapshot) {
  return getAxisMatchedRecommendationItems({
    getEntityKey: (item) => item.restaurantId,
    items,
    viewerProfile,
  });
}

function getChefRecommendationItems(items: TasteMatchFeedItem[], viewerProfile?: TasteProfileSnapshot) {
  return getAxisMatchedRecommendationItems({
    getEntityKey: (item) => getChefNameForRestaurant(item.restaurantName).trim().toLowerCase(),
    items,
    viewerProfile,
  });
}

function getLegacyBuddyRecommendationItems(items: TasteMatchFeedItem[]) {
  const buddyMap = new Map<string, TasteMatchFeedItem>();

  for (const item of items) {
    const existing = buddyMap.get(item.reviewerId);

    if (!existing || item.matchScore > existing.matchScore) {
      buddyMap.set(item.reviewerId, item);
    }
  }

  return Array.from(buddyMap.values()).sort((left, right) => right.matchScore - left.matchScore);
}

function getLegacyRestaurantRecommendationItems(items: TasteMatchFeedItem[]) {
  const restaurantMap = new Map<string, TasteMatchFeedItem>();

  for (const item of items) {
    const existing = restaurantMap.get(item.restaurantId);

    if (!existing || item.matchScore > existing.matchScore) {
      restaurantMap.set(item.restaurantId, item);
    }
  }

  return Array.from(restaurantMap.values()).sort((left, right) => right.matchScore - left.matchScore);
}

function getChefNameForRestaurant(restaurantName: string) {
  const normalizedRestaurantName = restaurantName.replace(/\s|\(|\)|Lysée|Lysee/g, '');

  return CHEF_NAME_BY_RESTAURANT[normalizedRestaurantName] ?? `${restaurantName} 셰프`;
}

function formatBuddyHandle(nickname: string) {
  return nickname.startsWith('@') ? nickname : `@${nickname}`;
}

function getProfilePrimaryTasteId(profile: PublicTasteProfile): TasteId {
  return TASTE_IDS
    .slice()
    .sort((left, right) => {
      const leftPresence =
        profile.snapshot.preferenceVector[left] * 0.55 +
        profile.snapshot.tasteVector[left] * 0.3 +
        profile.snapshot.confidenceByAxis[left] * 0.15;
      const rightPresence =
        profile.snapshot.preferenceVector[right] * 0.55 +
        profile.snapshot.tasteVector[right] * 0.3 +
        profile.snapshot.confidenceByAxis[right] * 0.15;

      return rightPresence - leftPresence;
    })[0] ?? 'umami';
}

function getProfileMatchScore(profile: PublicTasteProfile, viewerProfile?: TasteProfileSnapshot) {
  if (!viewerProfile) {
    return 80;
  }

  const sharedFit = TASTE_IDS.reduce((total, tasteId) => {
    const viewerValue = viewerProfile.preferenceVector[tasteId] ?? viewerProfile.tasteVector[tasteId] ?? 0.5;
    const profileValue =
      profile.snapshot.preferenceVector[tasteId] ??
      profile.snapshot.tasteVector[tasteId] ??
      0.5;

    return total + (1 - Math.abs(viewerValue - profileValue));
  }, 0) / TASTE_IDS.length;

  return Math.round(clamp(sharedFit, 0.5, 0.95) * 100);
}

function GhostBuddyRecommendationCard({
  onOpenProfile,
  profile,
  sourceTasteId,
  viewerProfile,
}: {
  onOpenProfile?: (profile: PublicTasteProfile) => void;
  profile: PublicTasteProfile;
  sourceTasteId: TasteId;
  viewerProfile?: TasteProfileSnapshot;
}) {
  const primaryTasteLabel = getTasteLabel(sourceTasteId);
  const reviewerName = profile.displayName || profile.nickname;
  const reviewerHandle = profile.nickname ? formatBuddyHandle(profile.nickname) : profile.tasteSignature;
  const matchScore = getProfileMatchScore(profile, viewerProfile);

  return (
    <button
      type="button"
      className="box-border flex h-[132px] w-[132px] shrink-0 flex-col items-start gap-[12px] overflow-clip rounded-[20px] p-[12px] text-left"
      style={{
        backgroundColor: getTasteTintSurface(primaryTasteLabel),
        border: `1px solid ${getTasteTint(primaryTasteLabel, 0.18)}`,
      }}
      aria-label={`${reviewerName}, ${reviewerHandle}, 취향 적합도 ${matchScore}%`}
      onClick={() => onOpenProfile?.(profile)}
    >
      <PalateBloomAvatar
        ariaLabel={`${reviewerName} 버디 아바타`}
        profile={createPalateBloomProfileFromMeasurementSnapshot(null, profile.userId)}
        shapeSeed={`${profile.userId}|${profile.stage}`}
        size="md"
      />

      <div className="flex w-full grow flex-col items-start justify-between text-left leading-[normal]">
        <div className="flex w-full shrink-0 flex-col items-start gap-[2px]">
          <p
            className="w-full truncate text-[14px] font-bold"
            style={{ color: getTasteTintSurfaceText(primaryTasteLabel) }}
          >
            {reviewerName}
          </p>
          <p
            className="w-full truncate text-[10px] font-normal"
            style={{ color: getTasteTintSurfaceSubText(primaryTasteLabel) }}
          >
            {reviewerHandle}
          </p>
        </div>
        <p
          className="text-[10px] font-semibold"
          style={{ color: getTasteTintSurfaceText(primaryTasteLabel) }}
        >
          취향 적합도 {matchScore}%
        </p>
      </div>
    </button>
  );
}

function BuddyRecommendationCard({
  item,
  onOpenProfile,
  sourceTasteId,
}: {
  item: TasteMatchFeedItem;
  onOpenProfile?: (profile: PublicTasteProfile) => void;
  sourceTasteId: TasteId;
}) {
  const primaryTasteLabel = getPrimaryTasteLabel(item, sourceTasteId);
  const reviewerName = item.reviewer.displayName || item.reviewer.nickname;
  const reviewerHandle = item.reviewer.nickname
    ? formatBuddyHandle(item.reviewer.nickname)
    : item.relationLabel;

  return (
    <button
      type="button"
      className="box-border flex h-[132px] w-[132px] shrink-0 flex-col items-start gap-[12px] overflow-clip rounded-[20px] p-[12px] text-left"
      style={{
        backgroundColor: getTasteTintSurface(primaryTasteLabel),
        border: `1px solid ${getTasteTint(primaryTasteLabel, 0.18)}`,
      }}
      aria-label={`${reviewerName}, ${reviewerHandle}, 취향 적합도 ${item.matchScore}%`}
      onClick={() => onOpenProfile?.(item.reviewer)}
    >
      <PalateBloomAvatar
        ariaLabel={`${reviewerName} 버디 아바타`}
        profile={createPalateBloomProfileFromMeasurementSnapshot(null, item.reviewer.userId)}
        shapeSeed={`${item.reviewer.userId}|${item.reviewer.stage}`}
        size="md"
      />

      <div className="flex w-full grow flex-col items-start justify-between text-left leading-[normal]">
        <div className="flex w-full shrink-0 flex-col items-start gap-[2px]">
          <p
            className="w-full truncate text-[14px] font-bold"
            style={{ color: getTasteTintSurfaceText(primaryTasteLabel) }}
          >
            {reviewerName}
          </p>
          <p
            className="w-full truncate text-[10px] font-normal"
            style={{ color: getTasteTintSurfaceSubText(primaryTasteLabel) }}
          >
            {reviewerHandle}
          </p>
        </div>
        <p
          className="text-[10px] font-semibold"
          style={{ color: getTasteTintSurfaceText(primaryTasteLabel) }}
        >
          취향 적합도 {item.matchScore}%
        </p>
      </div>
    </button>
  );
}

function RecommendationSkeletonCard() {
  return (
    <article
      aria-label="추천 카드를 불러오는 중"
      aria-busy="true"
      className="box-border flex h-[132px] w-[132px] shrink-0 flex-col items-start gap-[12px] overflow-clip rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] p-[12px]"
    >
      <span
        aria-hidden="true"
        className="block size-[42px] shrink-0 rounded-full tb-skeleton-shimmer"
      />
      <div className="flex w-full grow flex-col items-start justify-between">
        <div className="flex w-full shrink-0 flex-col items-start gap-[6px]">
          <span
            aria-hidden="true"
            className="block h-[14px] w-[74px] rounded-full tb-skeleton-shimmer"
          />
          <span
            aria-hidden="true"
            className="block h-[10px] w-[58px] rounded-full tb-skeleton-shimmer"
          />
        </div>
        <span
          aria-hidden="true"
          className="block h-[10px] w-[82px] rounded-full tb-skeleton-shimmer"
        />
      </div>
    </article>
  );
}

function RestaurantRecommendationCard({
  item,
  sourceTasteId,
}: {
  item: TasteMatchFeedItem;
  sourceTasteId: TasteId;
}) {
  const primaryTasteLabel = getPrimaryTasteLabel(item, sourceTasteId);
  const dishLabel = item.dishTitle ?? '추천 다이닝';

  return (
    <article
      className="box-border flex h-[132px] w-[132px] shrink-0 flex-col items-start gap-[12px] overflow-clip rounded-[20px] p-[12px] text-left"
      style={{
        backgroundColor: getTasteTintSurface(primaryTasteLabel),
        border: `1px solid ${getTasteTint(primaryTasteLabel, 0.18)}`,
      }}
      aria-label={`${item.restaurantName}, ${dishLabel}, 적합도 ${item.matchScore}%`}
    >
      <ImageBox
        alt={`${item.restaurantName} 레스토랑`}
        fallbackIconColor={getTasteTintSurfaceText(primaryTasteLabel)}
        fallbackIconSize={28}
        kind="restaurant"
        size="lg"
        taste={primaryTasteLabel}
        variant="taste"
      />

      <div className="flex w-full grow flex-col items-start justify-between text-left leading-[normal]">
        <div className="flex w-full shrink-0 flex-col items-start gap-[2px]">
          <p
            className="w-full truncate text-[14px] font-bold"
            style={{ color: getTasteTintSurfaceText(primaryTasteLabel) }}
          >
            {item.restaurantName}
          </p>
          <p
            className="w-full truncate text-[10px] font-normal"
            style={{ color: getTasteTintSurfaceSubText(primaryTasteLabel) }}
          >
            {dishLabel}
          </p>
        </div>
        <p
          className="text-[10px] font-semibold"
          style={{ color: getTasteTintSurfaceText(primaryTasteLabel) }}
        >
          적합도 {item.matchScore}%
        </p>
      </div>
    </article>
  );
}

function ChefRecommendationCard({
  item,
  sourceTasteId,
}: {
  item: TasteMatchFeedItem;
  sourceTasteId: TasteId;
}) {
  const primaryTasteLabel = getPrimaryTasteLabel(item, sourceTasteId);
  const chefName = getChefNameForRestaurant(item.restaurantName);

  return (
    <article
      className="box-border flex h-[132px] w-[132px] shrink-0 flex-col items-start gap-[12px] overflow-clip rounded-[20px] p-[12px] text-left"
      style={{
        backgroundColor: getTasteTintSurface(primaryTasteLabel),
        border: `1px solid ${getTasteTint(primaryTasteLabel, 0.18)}`,
      }}
      aria-label={`${chefName}, ${item.restaurantName}, 적합도 ${item.matchScore}%`}
    >
      <ImageBox
        alt={chefName}
        fallbackIconColor={getTasteTintSurfaceText(primaryTasteLabel)}
        fallbackIconSize={28}
        imageSrc={getChefImageByName(chefName)}
        kind="chef"
        size="lg"
        taste={primaryTasteLabel}
        variant="taste"
      />

      <div className="flex w-full grow flex-col items-start justify-between text-left leading-[normal]">
        <div className="flex w-full shrink-0 flex-col items-start gap-[2px]">
          <p
            className="w-full truncate text-[14px] font-bold"
            style={{ color: getTasteTintSurfaceText(primaryTasteLabel) }}
          >
            {chefName}
          </p>
          <p
            className="w-full truncate text-[10px] font-normal"
            style={{ color: getTasteTintSurfaceSubText(primaryTasteLabel) }}
          >
            {item.restaurantName}
          </p>
        </div>
        <p
          className="text-[10px] font-semibold"
          style={{ color: getTasteTintSurfaceText(primaryTasteLabel) }}
        >
          적합도 {item.matchScore}%
        </p>
      </div>
    </article>
  );
}

export default function TasteMatchFeed({
  commentCountsByItemId = {},
  fallbackBuddyProfiles = [],
  feedItems,
  isFeedLoading = false,
  onLikeDishFeedback,
  onOpenBuddyProfile,
  onOpenDishComments,
  onOpenRestaurantDetail,
  viewerProfile,
}: TasteMatchFeedProps) {
  const [recommendationMode, setRecommendationMode] = useState<RecommendationSectionMode>('buddy');
  const [isRecommendationEditorOpen, setIsRecommendationEditorOpen] = useState(false);
  const visibleItems = feedItems.slice(0, 12);
  const visibleFallbackBuddyProfiles = fallbackBuddyProfiles
    .filter((profile) => profile.visibility === 'public' || profile.visibility === 'followers')
    .slice(0, 12);
  const buddyRecommendationItems = getBuddyRecommendationItems(visibleItems, viewerProfile);
  const restaurantRecommendationItems = getRestaurantRecommendationItems(visibleItems, viewerProfile);
  const chefRecommendationItems = getChefRecommendationItems(visibleItems, viewerProfile);
  const recommendationSectionTitle =
    RECOMMENDATION_MODE_OPTIONS.find((option) => option.mode === recommendationMode)?.label ?? '버디 추천';
  const visibleRecommendationItems =
    recommendationMode === 'restaurant'
      ? restaurantRecommendationItems
      : recommendationMode === 'chef'
        ? chefRecommendationItems
        : buddyRecommendationItems;
  const shouldShowRecommendationSkeleton =
    visibleRecommendationItems.length === 0 &&
    isFeedLoading &&
    (recommendationMode !== 'buddy' || visibleFallbackBuddyProfiles.length === 0);
  const shouldShowFollowingSkeleton = visibleItems.length === 0 && isFeedLoading;
  const shouldShowFollowingSection = shouldShowFollowingSkeleton || visibleItems.length > 0;

  return (
    <div className="tb-section-stack">
      <section className="tb-card-stack">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle as="h3" size="md">
            {recommendationSectionTitle}
          </SectionTitle>
          <button
            type="button"
            aria-expanded={isRecommendationEditorOpen}
            className="shrink-0 rounded-[var(--tb-radius-6)] px-1 py-0.5 text-[11px] font-semibold text-[var(--tb-user-accent-main)] underline-offset-2 transition-colors hover:text-[var(--tb-user-accent-main)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]"
            onClick={() => setIsRecommendationEditorOpen((current) => !current)}
          >
            편집
          </button>
        </div>

        {isRecommendationEditorOpen ? (
          <div className="flex flex-wrap gap-2">
            {RECOMMENDATION_MODE_OPTIONS.map((option) => {
              const isActive = option.mode === recommendationMode;

              return (
                <button
                  type="button"
                  key={option.mode}
                  aria-pressed={isActive}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    isActive
                      ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-white'
                      : 'border-[var(--tb-color-border-default)] bg-white text-[var(--tb-color-text-muted)] hover:border-[var(--tb-color-border-strong)] hover:text-[var(--tb-color-text-primary)]'
                  }`}
                  onClick={() => {
                    setRecommendationMode(option.mode);
                    setIsRecommendationEditorOpen(false);
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {visibleRecommendationItems.length === 0 && recommendationMode === 'buddy' && visibleFallbackBuddyProfiles.length > 0 ? (
          <CardScrollList aria-label={`${recommendationSectionTitle} 목록`}>
            {visibleFallbackBuddyProfiles.map((profile) => (
              <GhostBuddyRecommendationCard
                key={profile.userId}
                onOpenProfile={onOpenBuddyProfile}
                profile={profile}
                sourceTasteId={getProfilePrimaryTasteId(profile)}
                viewerProfile={viewerProfile}
              />
            ))}
          </CardScrollList>
        ) : shouldShowRecommendationSkeleton ? (
          <CardScrollList aria-label={`${recommendationSectionTitle} 로딩 목록`}>
            {Array.from({ length: RECOMMENDATION_SKELETON_CARD_COUNT }, (_, index) => (
              <RecommendationSkeletonCard key={`recommendation-skeleton-${index}`} />
            ))}
          </CardScrollList>
        ) : (
          <CardScrollList aria-label={`${recommendationSectionTitle} 목록`}>
            {visibleRecommendationItems.map(({ item, sourceTasteId }) => {
              if (recommendationMode === 'restaurant') {
                return (
                  <RestaurantRecommendationCard
                    key={`${sourceTasteId}:${item.restaurantId}`}
                    item={item}
                    sourceTasteId={sourceTasteId}
                  />
                );
              }

              if (recommendationMode === 'chef') {
                return (
                  <ChefRecommendationCard
                    key={`${sourceTasteId}:${getChefNameForRestaurant(item.restaurantName)}`}
                    item={item}
                    sourceTasteId={sourceTasteId}
                  />
                );
              }

              return (
                <BuddyRecommendationCard
                  key={`${sourceTasteId}:${item.reviewerId}`}
                  item={item}
                  onOpenProfile={onOpenBuddyProfile}
                  sourceTasteId={sourceTasteId}
                />
              );
            })}
          </CardScrollList>
        )}
      </section>

      {shouldShowFollowingSection ? (
        <div className="tb-card-stack">
          <SectionTitle as="h3" size="md">
            팔로잉 디시 카드
          </SectionTitle>
          <div className="grid gap-3">
            {shouldShowFollowingSkeleton ? (
              Array.from({ length: FOLLOWING_DISH_FEEDBACK_SKELETON_CARD_COUNT }, (_, index) => (
                <DishFeedbackCardSkeleton key={`following-dish-feedback-skeleton-${index}`} />
              ))
            ) : null}
            {visibleItems.map((item) => (
              <SocialDishFeedbackCard
                key={item.id}
                commentCount={commentCountsByItemId[item.id] ?? 0}
                item={item}
                onLike={onLikeDishFeedback}
                onOpenBuddyProfile={(nextItem) => onOpenBuddyProfile?.(nextItem.reviewer)}
                onOpenComments={onOpenDishComments}
                onOpenRestaurantDetail={onOpenRestaurantDetail}
              />
            ))}
          </div>
        </div>
      ) : null}

    </div>
  );
}
