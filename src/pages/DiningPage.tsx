import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type CSSProperties,
} from 'react';

import TopAppBar from '../components/TopAppBar';
import DishFeedbackCard, {
  DishFeedbackCardSkeleton,
  type DishFeedbackCardViewModel,
} from '../components/dining/DishFeedbackCard';
import {
  DiningFeedbackScreen,
  findTasteExperience,
  type TasteAxisId,
  type TasteExperienceWord,
} from '../components/reservation/DiningFeedbackFlow';
import PageSection from '../components/system/PageSection';
import HospitalityEmptyState from '../components/system/HospitalityEmptyState';
import PalateBloomAvatar, {
  DEFAULT_PALATE_BLOOM_PROFILE,
  type TasteProfile as PalateBloomTasteProfile,
} from '../components/system/PalateBloomAvatar';
import {
  createDiningDishFeedbackDraft,
  createDiningFeedbackDraft,
  getDiningFeedbackScenario,
  hasDiningDishFeedbackResponse,
  type DiningDishFeedbackDraft,
  type DiningDishMetadata,
  type DiningFeedbackDraft,
  type DiningFeedbackScenario,
} from '../constants/diningFeedbackData';
import {
  diningDetailTagCategories,
  getDiningDetailTagMetadata,
  type DiningDetailTagMetadata,
} from '../constants/diningDetailTags';
import {
  inferDishKindIds,
  resolveDishKindLabels,
} from '../constants/dishKindTags';
import {
  getTasteMeasurementAgeLabel,
  getTasteMeasurementEntries,
  isTasteMeasurementStale,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import {
  RESERVATION_CATALOG,
  type ReservationRecord as Reservation,
} from '../constants/reservationCatalog';
import { ICON_TOKENS } from '../constants/designTokens';
import { TASTE_TYPES } from '../constants/tasteColors';
import {
  clearDiningFeedbackItemInSupabase,
  hydrateReservationPageData,
  submitDiningFeedbackToSupabase,
} from '../lib/tasteBuddySupabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { trackEvent, trackPageView } from '../lib/analytics';
import { resolvePublicMediaPath } from '../lib/mediaAssets';
import {
  buildRestaurantFeedbackExternalRef,
  mergeHydratedFeedbackById,
  type FeedbackSyncMetadata,
} from '../lib/restaurantFeedbackSync';
import { TBA, type TasteBuddyAgentDiningNote } from '../lib/tasteBuddyAgent';
import type {
  TasteBuddyAgentDiningAnalysisSnapshot,
  TasteProfileSnapshot,
} from '../types/tasteBuddyAgent';

type ReservationView = 'detail' | 'feedback';

interface ReservationNavigationLocation {
  selectedId: number | null;
  selectedView: ReservationView;
}

interface DishTasteTag {
  colorTaste?: string;
  label: string;
}

interface DishReactionBubble {
  axis: TasteAxisId;
  id: string;
  label: string;
}

interface DishFeedbackCategoryTag {
  categoryId: string;
  categoryLabel: string;
  id: string;
  label: string;
}

interface DishFeedbackItem {
  categoryTags: DishFeedbackCategoryTag[];
  courseLabel: string;
  dish: DiningDishMetadata;
  dishKindLabels: string[];
  dishKindTags: string[];
  diningDateLabel: string;
  feedbackRelativeLabel: string;
  feedbackTimestamp: number;
  reactionBubbles: DishReactionBubble[];
  reservation: Reservation;
  reflectionNote: string | null;
  reflectionPhotoName: string | null;
  reflectionPhotoPreviewUrl: string | null;
  scenario: DiningFeedbackScenario;
  synthesisDetailTags: TasteBuddyAgentDiningNote['detailTags'];
  synthesisSummary: string;
  synthesisTasteBubbles: TasteBuddyAgentDiningNote['tasteBubbles'];
  tasteTags: DishTasteTag[];
  tbaAnalysisSnapshot: TasteBuddyAgentDiningAnalysisSnapshot;
}

type DishFeedbackCommentsByKey = Record<string, string[]>;

const DISH_FEEDBACK_SKELETON_CARD_SLOT_HEIGHT = 500;
const DISH_FEEDBACK_SKELETON_VIEWPORT_OFFSET = 120;
const DISH_FEEDBACK_SKELETON_MIN_COUNT = 2;
const DISH_FEEDBACK_SKELETON_MAX_COUNT = 6;
const DINING_RESERVATION_HYDRATION_SKELETON_MS = 120;

type DishFeedbackEngagementNotificationEvent = {
  comment?: string;
  dishTitle: string;
  kind: 'comment' | 'like';
  restaurantName: string;
};

export interface DiningPageExternalFeedbackSubmission extends FeedbackSyncMetadata {
  draft: DiningFeedbackDraft;
  restaurant: {
    category: string;
    chef: {
      avatarUrl?: string | null;
      name: string;
    };
    decisionReason: string;
    id: string;
    locationLabel: string;
    name: string;
    scores: {
      personalMatchRate: number;
    };
    summaryLine: string;
  };
  scenario: DiningFeedbackScenario;
  submissionId: number;
  submittedAt: string;
}

function getDishFeedbackItemKey(item: DishFeedbackItem) {
  return `${item.scenario.reservationId}-${item.dish.id}`;
}

const FALLBACK_FEEDBACK_SCENARIOS = RESERVATION_CATALOG.reduce<Record<number, DiningFeedbackScenario>>(
  (scenarios, reservation) => {
    const scenario = getDiningFeedbackScenario(reservation.id);

    if (scenario) {
      scenarios[reservation.id] = scenario;
    }

    return scenarios;
  },
  {},
);

const RESTAURANT_LOCATION_LABELS: Record<string, string> = {
  모수: '서울시 용산구',
  정식당: '서울시 강남구',
  '레스토랑 베누': '서울시 강남구',
  '숍 리제 (Lysée)': '서울시 강남구',
};

function getRestaurantLocationLabel(restaurant: string) {
  return RESTAURANT_LOCATION_LABELS[restaurant] ?? '서울시';
}

function createReservationFromExternalFeedbackSubmission(
  submission: DiningPageExternalFeedbackSubmission,
): Reservation {
  const submittedDate = new Date(submission.submittedAt);
  const safeDate = Number.isNaN(submittedDate.getTime()) ? new Date() : submittedDate;

  return {
    adjustments: [],
    chef: submission.restaurant.chef.name.replace(/\s*셰프$/, ''),
    chefImage: submission.restaurant.chef.avatarUrl ?? null,
    course: submission.scenario.courseName || submission.restaurant.category,
    date: new Intl.DateTimeFormat('ko-KR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(safeDate),
    diningPromise: submission.restaurant.summaryLine,
    externalRef: buildRestaurantFeedbackExternalRef(submission.restaurant.id, submission.submissionId),
    guests: 1,
    guestUnderstanding: submission.restaurant.decisionReason,
    id: submission.submissionId,
    matchRate: submission.restaurant.scores.personalMatchRate,
    remoteId: submission.remoteId ?? null,
    restaurant: submission.restaurant.name,
    status: 'completed',
    tcsStatus: '디시 피드백이 저장되었습니다',
    time: new Intl.DateTimeFormat('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(safeDate),
    timeline: [
      { step: '디시 선택', done: true },
      { step: '미각 피드백 저장', done: true },
      { step: '다이닝 로그 반영', done: true },
    ],
  };
}

const TASTE_AXIS_LABEL_BY_ID: Record<TasteAxisId, string> = {
  bitter: '쓴맛',
  fat: '지방맛',
  salty: '짠맛',
  sour: '신맛',
  sweet: '단맛',
  umami: '감칠맛',
};

function isTasteLabel(taste: string) {
  return TASTE_TYPES.includes(taste as (typeof TASTE_TYPES)[number]);
}

function buildDishTasteTags({
  affectedTastes,
  selectedExperience,
}: {
  affectedTastes: readonly string[];
  selectedExperience: ReturnType<typeof findTasteExperience>;
}) {
  const tags: DishTasteTag[] = [];
  const addTag = (tag: DishTasteTag) => {
    if (!tags.some((existingTag) => existingTag.label === tag.label)) {
      tags.push(tag);
    }
  };

  if (selectedExperience) {
    addTag({
      colorTaste: TASTE_AXIS_LABEL_BY_ID[selectedExperience.axis],
      label: selectedExperience.label,
    });
  }

  affectedTastes.forEach((taste) => {
    addTag({
      colorTaste: isTasteLabel(taste) ? taste : undefined,
      label: taste,
    });
  });

  return tags;
}

function buildDishReactionBubbles(selectedExperiences: readonly TasteExperienceWord[]) {
  return selectedExperiences.slice(0, 3).map((experience) => ({
    axis: experience.axis,
    id: experience.id,
    label: experience.label,
  }));
}

function buildDishFeedbackCategoryTags(response: DiningDishFeedbackDraft | undefined) {
  const selectedTagIds = [...new Set(response?.selectedDetailTagIds ?? [])];

  return selectedTagIds
    .map((tagId) => getDiningDetailTagMetadata(tagId))
    .filter((tag): tag is DiningDetailTagMetadata => Boolean(tag));
}

function getReadableDiningDetailTag(tag: TasteBuddyAgentDiningNote['detailTags'][number]) {
  const metadata = getDiningDetailTagMetadata(tag.id) ?? getDiningDetailTagMetadata(tag.label);

  return {
    ...tag,
    label: metadata?.label ?? tag.label,
    title: tag.title ?? metadata?.categoryLabel,
  };
}

function getReadableDiningNote(note: TasteBuddyAgentDiningNote): TasteBuddyAgentDiningNote {
  return {
    ...note,
    detailTags: note.detailTags.map(getReadableDiningDetailTag),
  };
}

function formatFeedbackDate(completedAt: string) {
  const date = new Date(completedAt);

  if (Number.isNaN(date.getTime())) {
    return completedAt;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatFeedbackRelativeTime(completedAt: string) {
  const date = new Date(completedAt);

  if (Number.isNaN(date.getTime())) {
    return '후기 반영';
  }

  const elapsedMs = Math.max(0, Date.now() - date.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

  if (elapsedMinutes < 1) {
    return '방금 전';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}분 전`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours}시간 전`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedDays < 7) {
    return `${elapsedDays}일 전`;
  }

  if (elapsedDays < 35) {
    return `${Math.floor(elapsedDays / 7)}주 전`;
  }

  if (elapsedDays < 365) {
    return `${Math.floor(elapsedDays / 30)}개월 전`;
  }

  return `${Math.floor(elapsedDays / 365)}년 전`;
}

function getFeedbackDisplayTimestamp(value: string | null | undefined) {
  const timestamp = new Date(value ?? '').getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function buildDishFeedbackDiningAnalysisSnapshot({
  detailTags,
  dish,
  dishKindTags,
  reviewerProfile,
  selectedFeedbackReason,
  tasteTags,
}: {
  detailTags: string[];
  dish: DiningDishMetadata;
  dishKindTags: string[];
  reviewerProfile: TasteProfileSnapshot;
  selectedFeedbackReason: string | null;
  tasteTags: DishTasteTag[];
}): TasteBuddyAgentDiningAnalysisSnapshot {
  return TBA.buildDiningAnalysisSnapshot({
    detailTags,
    dishKindTags,
    id: `local-note-${dish.id}`,
    ingredients: dish.ingredients,
    restaurantName: '',
    reviewSnippet: selectedFeedbackReason ?? undefined,
    reviewerProfile,
    subject: dish.title,
    tasteTags: tasteTags.map((tag) => tag.colorTaste ?? tag.label),
    techniques: dish.techniques,
  });
}

function buildDishFeedbackItems({
  feedbackByReservationId,
  feedbackScenariosByReservationId,
  reservations,
  reviewerProfile,
}: {
  feedbackByReservationId: Record<number, DiningFeedbackDraft>;
  feedbackScenariosByReservationId: Record<number, DiningFeedbackScenario>;
  reservations: Reservation[];
  reviewerProfile: TasteProfileSnapshot;
}) {
  return reservations.flatMap<DishFeedbackItem>((reservation) => {
    const scenario = feedbackScenariosByReservationId[reservation.id] ?? FALLBACK_FEEDBACK_SCENARIOS[reservation.id];

    if (!scenario) {
      return [];
    }

    const draft = feedbackByReservationId[reservation.id] ?? null;

    if (!draft) {
      return [];
    }

    const scenarioDishes = [...scenario.dishes, ...(draft.customDishes ?? [])];

    return scenarioDishes
      .map<DishFeedbackItem | null>((dish) => {
        const response = draft.dishResponses[dish.id];

        if (!hasDiningDishFeedbackResponse(response)) {
          return null;
        }

        const feedbackDisplayAt = response.feedbackUpdatedAt ?? scenario.completedAt;
        const safeFeedbackTimestamp = getFeedbackDisplayTimestamp(feedbackDisplayAt);

        const selectedExperienceIds = [
          ...(response?.selectedExperienceIds ?? []),
          response?.selectedExperienceId ?? null,
        ].filter((experienceId): experienceId is string => Boolean(experienceId));
        const uniqueSelectedExperienceIds = [...new Set(selectedExperienceIds)].slice(0, 3);
        const selectedExperiences = uniqueSelectedExperienceIds
          .map((experienceId) => findTasteExperience(experienceId))
          .filter((experience): experience is TasteExperienceWord => Boolean(experience));
        const mainSelectedExperienceId = uniqueSelectedExperienceIds[0] ?? null;

        const selectedChoice =
          dish.feedbackChoices.find((choice) => choice.id === response.selectedChoiceId) ?? null;
        const selectedExperience = findTasteExperience(mainSelectedExperienceId);
        const tasteTags = buildDishTasteTags({
          affectedTastes: selectedChoice?.affectedTastes ?? [],
          selectedExperience,
        });
        const categoryTags = buildDishFeedbackCategoryTags(response);
        const reactionBubbles = buildDishReactionBubbles(selectedExperiences);
        const selectedDishKindIds = response?.selectedDishKindIds?.length
          ? response.selectedDishKindIds
          : inferDishKindIds(dish);
        const dishKindLabels = resolveDishKindLabels(
          selectedDishKindIds,
          response?.customDishKindLabels ?? [],
        );

        const selectedFeedbackReason =
          selectedChoice?.reason ??
          selectedExperience?.description ??
          null;
        const tbaAnalysisSnapshot =
          response?.tbaAnalysisSnapshot ??
          buildDishFeedbackDiningAnalysisSnapshot({
            detailTags: categoryTags.map((tag) => tag.label),
            dish,
            dishKindTags: selectedDishKindIds,
            reviewerProfile,
            selectedFeedbackReason,
            tasteTags,
          });
        const diningNote = getReadableDiningNote({
          detailTags: tbaAnalysisSnapshot.detailTags,
          summary: tbaAnalysisSnapshot.summary,
          tasteBubbles: tbaAnalysisSnapshot.tasteBubbles,
        } satisfies TasteBuddyAgentDiningNote);

        return {
          categoryTags,
          courseLabel: dish.courseLabel,
          dish,
          dishKindLabels,
          dishKindTags: selectedDishKindIds,
          diningDateLabel: formatFeedbackDate(feedbackDisplayAt),
          feedbackRelativeLabel: formatFeedbackRelativeTime(feedbackDisplayAt),
          feedbackTimestamp: safeFeedbackTimestamp,
          reactionBubbles,
          reservation,
          reflectionNote: response?.reflectionNote?.trim() || null,
          reflectionPhotoName: response?.reflectionPhotoName ?? null,
          reflectionPhotoPreviewUrl: resolvePublicMediaPath(response?.reflectionPhotoPreviewUrl) ?? null,
          scenario,
          synthesisDetailTags: diningNote.detailTags,
          synthesisSummary: diningNote.summary,
          synthesisTasteBubbles: diningNote.tasteBubbles,
          tasteTags,
          tbaAnalysisSnapshot,
        };
      })
      .filter((item): item is DishFeedbackItem => Boolean(item));
  }).sort((left, right) => right.feedbackTimestamp - left.feedbackTimestamp);
}

function clearDishFeedbackItemFromDraft(
  draft: DiningFeedbackDraft,
  item: DishFeedbackItem,
): DiningFeedbackDraft {
  const customDishes = draft.customDishes ?? [];
  const isCustomDish = customDishes.some((dish) => dish.id === item.dish.id);

  if (isCustomDish) {
    const { [item.dish.id]: _removedResponse, ...nextDishResponses } = draft.dishResponses;

    return {
      ...draft,
      customDishes: customDishes.filter((dish) => dish.id !== item.dish.id),
      dishResponses: nextDishResponses,
    };
  }

  return {
    ...draft,
    dishResponses: {
      ...draft.dishResponses,
      [item.dish.id]: createDiningDishFeedbackDraft(item.dish),
    },
  };
}

function stampDiningFeedbackDraftUpdatedAt(
  draft: DiningFeedbackDraft,
  updatedAt = new Date().toISOString(),
): DiningFeedbackDraft {
  const nextDishResponses = Object.entries(draft.dishResponses).reduce<DiningFeedbackDraft['dishResponses']>(
    (responses, [dishId, response]) => {
      responses[dishId] = hasDiningDishFeedbackResponse(response)
        ? {
            ...response,
            feedbackUpdatedAt: updatedAt,
          }
        : response;
      return responses;
    },
    {},
  );

  return {
    ...draft,
    dishResponses: nextDishResponses,
  };
}

function getDishFeedbackGalleryDishes(item: DishFeedbackItem) {
  return [
    item.dish,
    ...[...item.scenario.dishes, ...(item.scenario.dishes.some((dish) => dish.id === item.dish.id) ? [] : [item.dish])]
      .filter((dish) => dish.id !== item.dish.id),
  ];
}

function getDishFeedbackSkeletonCardCount(viewportHeight: number) {
  const availableHeight = Math.max(
    DISH_FEEDBACK_SKELETON_CARD_SLOT_HEIGHT,
    viewportHeight - DISH_FEEDBACK_SKELETON_VIEWPORT_OFFSET,
  );

  return Math.min(
    DISH_FEEDBACK_SKELETON_MAX_COUNT,
    Math.max(
      DISH_FEEDBACK_SKELETON_MIN_COUNT,
      Math.ceil(availableHeight / DISH_FEEDBACK_SKELETON_CARD_SLOT_HEIGHT),
    ),
  );
}

function useDishFeedbackSkeletonCardCount() {
  const [skeletonCardCount, setSkeletonCardCount] = useState(() =>
    getDishFeedbackSkeletonCardCount(
      typeof window === 'undefined' ? 0 : window.innerHeight,
    ),
  );

  useEffect(() => {
    const updateSkeletonCardCount = () => {
      setSkeletonCardCount(getDishFeedbackSkeletonCardCount(window.innerHeight));
    };

    updateSkeletonCardCount();
    window.addEventListener('resize', updateSkeletonCardCount);
    window.visualViewport?.addEventListener('resize', updateSkeletonCardCount);

    return () => {
      window.removeEventListener('resize', updateSkeletonCardCount);
      window.visualViewport?.removeEventListener('resize', updateSkeletonCardCount);
    };
  }, []);

  return skeletonCardCount;
}

function DishFeedbackListSkeleton() {
  const skeletonCardCount = useDishFeedbackSkeletonCardCount();

  return (
    <>
      {Array.from({ length: skeletonCardCount }, (_, index) => (
        <DishFeedbackCardSkeleton key={`dish-feedback-skeleton-${index}`} />
      ))}
    </>
  );
}

function createDishFeedbackCardViewModel({
  avatarImageSrc,
  avatarProfile,
  avatarShapeSeed,
  item,
  nickname,
}: {
  avatarImageSrc?: string | null;
  avatarProfile?: PalateBloomTasteProfile;
  avatarShapeSeed?: string;
  item: DishFeedbackItem;
  nickname: string;
}): DishFeedbackCardViewModel {
  const fallbackTasteTags = item.tasteTags.map((tag, index) => ({
    colorTaste: tag.colorTaste,
    id: `${item.dish.id}-taste-${tag.label}-${index}`,
    label: tag.label,
    title: tag.colorTaste,
  }));
  const reactionTasteBubbles = item.reactionBubbles.map((bubble) => {
    const axisLabel = TASTE_AXIS_LABEL_BY_ID[bubble.axis];

    return {
      colorTaste: axisLabel,
      id: `${item.dish.id}-${bubble.id}`,
      label: bubble.label,
      title: axisLabel,
    };
  });
  const tbaTasteBubbles = item.synthesisTasteBubbles.map((bubble, index) => ({
    colorTaste: bubble.colorTaste,
    id: bubble.id || `${item.dish.id}-tba-taste-${index}`,
    label: bubble.label,
    title: bubble.title ?? bubble.colorTaste,
  }));
  const tbaDetailTags = item.synthesisDetailTags.map((tag, index) => ({
    id: tag.id || `${item.dish.id}-tba-detail-${index}`,
    label: tag.label,
    title: tag.title,
  }));
  const fallbackDetailTags = item.categoryTags.map((tag) => ({
    id: tag.id,
    label: tag.label,
    title: tag.categoryLabel,
  }));

  return {
    absoluteDateLabel: item.diningDateLabel,
    author: {
      avatarImageSrc,
      avatarProfile,
      displayName: nickname,
      shapeSeed: avatarShapeSeed,
    },
    detailTags: tbaDetailTags.length > 0 ? tbaDetailTags : fallbackDetailTags,
    id: getDishFeedbackItemKey(item),
    images: getDishFeedbackGalleryDishes(item).map((dish, index) => ({
      alt: index === 0 ? `${item.dish.title} 메뉴 사진` : `${dish.title} 메뉴 사진`,
      imageSrc: index === 0 ? item.reflectionPhotoPreviewUrl : null,
    })),
    restaurantName: item.reservation.restaurant,
    relativeDateLabel: item.feedbackRelativeLabel,
    subject: item.dish.title,
    synthesisSummary: item.synthesisSummary,
    tbaAnalysisSnapshot: item.tbaAnalysisSnapshot,
    tasteBubbles: tbaTasteBubbles.length > 0 ? tbaTasteBubbles : reactionTasteBubbles.length > 0 ? reactionTasteBubbles : fallbackTasteTags,
  };
}

function DishFeedbackDetailScreen({
  item,
  onBack,
}: {
  item: DishFeedbackItem;
  onBack: () => void;
}) {
  const mainReaction = item.reactionBubbles[0] ?? {
    axis: 'umami' as TasteAxisId,
    id: `${item.dish.id}-fallback-reaction`,
    label: item.tasteTags[0]?.label ?? '미각 기록',
  };
  const tagsByCategory = item.categoryTags.reduce<Record<string, DishFeedbackCategoryTag[]>>(
    (groups, tag) => {
      groups[tag.categoryId] = [...(groups[tag.categoryId] ?? []), tag];
      return groups;
    },
    {},
  );
  const visibleCategorySections = diningDetailTagCategories
    .map((category) => ({
      category,
      tags: tagsByCategory[category.id] ?? [],
    }))
    .filter(({ tags }) => tags.length > 0);
  const shortRecordText = item.reflectionNote ?? item.synthesisSummary;
  const accentStyle = {
    backgroundColor: `var(--tb-taste-${mainReaction.axis}-tint-surface)`,
    borderColor: `var(--tb-taste-${mainReaction.axis}-tint-soft-border)`,
    color: `var(--tb-taste-${mainReaction.axis}-tint-surface-text)`,
  } as CSSProperties;

  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-focus)] animate-slideIn">
      <TopAppBar
        appearance="solid"
        solidBackground="focus"
        title={item.dish.title}
        showBack
        onBack={onBack}
        rightActions={
          <div
            aria-hidden="true"
            style={{
              width: ICON_TOKENS.container.lg,
              height: ICON_TOKENS.container.lg,
            }}
          />
        }
      />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pb-24 pt-6">
          <PageSection>
            <div className="flex flex-col items-center gap-4 py-2">
              <div
                className="flex h-[176px] w-[176px] flex-col items-center justify-center rounded-full border px-5 text-center"
                style={accentStyle}
              >
                <span className="text-[11px] font-semibold opacity-70">
                  메인 미각
                </span>
                <span className="mt-2 text-[17px] font-bold leading-tight">
                  {mainReaction.label}
                </span>
              </div>

              {item.reactionBubbles.length > 0 ? (
                <div className="flex items-center justify-center gap-3" aria-label="기록된 미각">
                  {item.reactionBubbles.map((reaction, index) => (
                    <span
                      key={reaction.id}
                      className={`h-6 w-6 rounded-full border ${index === 0 ? 'scale-110' : 'opacity-70'}`}
                      style={{
                        backgroundColor:
                          index === 0
                            ? `var(--tb-taste-${reaction.axis}-tint-surface)`
                            : `var(--tb-taste-${reaction.axis}-tint-soft)`,
                        borderColor: `var(--tb-taste-${reaction.axis}-tint-soft-border)`,
                      }}
                      title={reaction.label}
                    />
                  ))}
                </div>
              ) : null}

              <div className="w-full rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-4">
                <p className="text-[14px] font-medium text-[var(--tb-color-text-primary)]">
                  짧은 미식 기록
                </p>
                <p className="mt-2 text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {shortRecordText}
                </p>
                {item.reflectionPhotoPreviewUrl ? (
                  <img
                    src={item.reflectionPhotoPreviewUrl}
                    alt={item.reflectionPhotoName ?? `${item.dish.title} 미식 기록 사진`}
                    className="mt-3 aspect-[4/3] w-full rounded-[var(--tb-radius-12)] object-cover"
                  />
                ) : null}
              </div>
            </div>
          </PageSection>

          <PageSection>
            {visibleCategorySections.length > 0 ? (
              <div className="flex flex-col gap-7">
                {visibleCategorySections.map(({ category, tags }) => (
                  <section className="flex flex-col gap-3" key={category.id}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                        {category.label}
                      </h2>
                      <span className="text-[11px] font-medium text-[var(--tb-color-text-faint)]">
                        {tags.length}개 기록
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full border px-3 py-2 text-[12px] font-semibold"
                          style={accentStyle}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-4 text-center">
                <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                  저장된 디테일 단서가 없어요
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
                  이 디시에는 메인 미각 중심의 기록만 남아 있습니다.
                </p>
              </div>
            )}
          </PageSection>
        </div>
      </div>
    </div>
  );
}

function DishFeedbackCommentFocusScreen({
  avatarImageSrc,
  avatarProfile,
  avatarShapeSeed,
  comments,
  item,
  nickname,
  onBack,
  onLike,
  onOpenAuthorProfile,
  onOpenRestaurantDetail,
  onSubmitComment,
}: {
  avatarImageSrc?: string | null;
  avatarProfile?: PalateBloomTasteProfile;
  avatarShapeSeed?: string;
  comments: string[];
  item: DishFeedbackItem;
  nickname: string;
  onBack: () => void;
  onLike?: () => void;
  onOpenAuthorProfile?: () => void;
  onOpenRestaurantDetail?: () => void;
  onSubmitComment: (comment: string) => void;
}) {
  const [commentDraft, setCommentDraft] = useState('');
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextComment = commentDraft.trim();

    if (!nextComment) {
      return;
    }

    onSubmitComment(nextComment);
    setCommentDraft('');
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-focus)] animate-slideIn">
      <TopAppBar
        appearance="transparent"
        showBack
        onBack={onBack}
        rightActions={
          <div
            aria-hidden="true"
            style={{
              width: ICON_TOKENS.container.lg,
              height: ICON_TOKENS.container.lg,
            }}
          />
        }
      />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-5 px-5 pb-6">
          <DishFeedbackCard
            card={createDishFeedbackCardViewModel({
              avatarImageSrc,
              avatarProfile,
              avatarShapeSeed,
              item,
              nickname,
            })}
            commentCount={comments.length}
            interactive={false}
            onLike={onLike}
            onOpenAuthorProfile={onOpenAuthorProfile}
            onOpenComments={() => commentInputRef.current?.focus()}
            onOpenSubject={onOpenRestaurantDetail}
            unframed
          />

          <section className="py-1">
            <h2 className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              댓글
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div
                    className="flex items-start gap-3"
                    key={`${item.dish.id}-focus-comment-${index}`}
                  >
                    <PalateBloomAvatar
                      ariaLabel={`${nickname} 댓글 작성자 아바타`}
                      imageSrc={avatarImageSrc}
                      profile={avatarProfile ?? DEFAULT_PALATE_BLOOM_PROFILE}
                      shapeSeed={avatarShapeSeed}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-tight text-[var(--tb-color-text-primary)]">
                        {nickname}
                      </p>
                      <p className="mt-0 text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]">
                        {comment}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] font-normal leading-relaxed text-[var(--tb-color-text-muted)]">
                  아직 댓글이 없어요. 이 디시에 남긴 감상을 짧게 이어갈 수 있어요.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
      <form
        className="flex shrink-0 items-center gap-3 border-t border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-bg-focus)] px-5 pb-[max(14px,var(--tb-safe-area-bottom))] pt-3"
        onSubmit={handleSubmit}
      >
        <PalateBloomAvatar
          ariaLabel={`${nickname} 댓글 입력 아바타`}
          imageSrc={avatarImageSrc}
          profile={avatarProfile ?? DEFAULT_PALATE_BLOOM_PROFILE}
          shapeSeed={avatarShapeSeed}
          size="md"
        />
        <div className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-4 text-left transition-colors hover:bg-[var(--tb-color-surface-disabled)]">
          <input
            ref={commentInputRef}
            aria-label="댓글 입력"
            className="h-full min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-muted)] focus:ring-0"
            onChange={(event) => setCommentDraft(event.target.value)}
            placeholder="댓글을 남겨보세요"
            value={commentDraft}
          />
        </div>
        <button
          type="submit"
          className="shrink-0 text-[13px] font-semibold text-[var(--tb-color-text-body)] transition-colors hover:text-[var(--tb-color-text-primary)] disabled:text-[var(--tb-color-text-hint)]"
          disabled={!commentDraft.trim()}
        >
          등록
        </button>
      </form>
    </div>
  );
}

interface DiningPageProps {
  disableHydration?: boolean;
  externalFeedbackSubmissions?: readonly DiningPageExternalFeedbackSubmission[];
  initialReservations?: Reservation[];
  measurementSnapshot: TasteMeasurementSnapshot;
  userAvatarImageSrc?: string | null;
  userInitials?: string;
  userPalateBloomProfile?: PalateBloomTasteProfile;
  userPalateBloomShapeSeed?: string;
  userNickname?: string | null;
  onDishFeedbackEngagement?: (event: DishFeedbackEngagementNotificationEvent) => void;
  onFeedbackMapViewChange?: (isMapView: boolean) => void;
  onExternalFeedbackSaved?: (
    submissionId: number,
    draft: DiningFeedbackDraft,
    scenario: DiningFeedbackScenario,
    remoteId?: string,
  ) => void;
  onRootViewChange?: (isRootView: boolean) => void;
  onOpenAuthorProfile?: () => void;
  onOpenRestaurantDetail?: (reservation: Reservation) => void;
  onStartMeasurement: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function DiningPage({
  disableHydration = false,
  externalFeedbackSubmissions = [],
  initialReservations,
  measurementSnapshot,
  userAvatarImageSrc,
  userInitials = 'JH',
  userPalateBloomProfile,
  userPalateBloomShapeSeed,
  userNickname = null,
  onDishFeedbackEngagement,
  onFeedbackMapViewChange,
  onExternalFeedbackSaved,
  onRootViewChange,
  onOpenAuthorProfile,
  onOpenRestaurantDetail,
  onStartMeasurement,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
}: DiningPageProps) {
  const fallbackReservations =
    initialReservations ?? (isSupabaseConfigured && !disableHydration ? [] : RESERVATION_CATALOG);
  const [reservations, setReservations] = useState<Reservation[]>(
    fallbackReservations,
  );
  const [isHydratingReservations, setIsHydratingReservations] = useState(
    isSupabaseConfigured && !disableHydration && !initialReservations,
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedView, setSelectedView] = useState<ReservationView>('detail');
  const navigationStackRef = useRef<ReservationNavigationLocation[]>([]);
  const [feedbackByReservationId, setFeedbackByReservationId] = useState<Record<number, DiningFeedbackDraft>>({});
  const [feedbackScenariosByReservationId, setFeedbackScenariosByReservationId] = useState<
    Record<number, DiningFeedbackScenario>
  >(FALLBACK_FEEDBACK_SCENARIOS);
  const [submittedFeedbackReservationIds, setSubmittedFeedbackReservationIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [savingFeedbackReservationId, setSavingFeedbackReservationId] = useState<number | null>(null);
  const [feedbackPersistenceError, setFeedbackPersistenceError] = useState<{
    message: string;
    reservationId: number;
  } | null>(null);
  const [selectedDishFeedbackKey, setSelectedDishFeedbackKey] = useState<string | null>(null);
  const [focusedDishFeedbackKey, setFocusedDishFeedbackKey] = useState<string | null>(null);
  const [commentsByDishFeedbackKey, setCommentsByDishFeedbackKey] =
    useState<DishFeedbackCommentsByKey>({});
  const consumedExternalFeedbackSubmissionIdsRef = useRef<Set<number>>(new Set());
  const feedbackSubmitInFlightRef = useRef(false);
  const hasCompletedInitialReservationHydrationRef = useRef(false);
  const localFeedbackRevisionsRef = useRef(new Map<number, number>());
  const hydrationProtectionRef = useRef(new Set<number>());
  hydrationProtectionRef.current = new Set(externalFeedbackSubmissions
    .filter((submission) => !submission.syncedAt)
    .map((submission) => submission.submissionId));
  if (selectedId !== null && selectedView === 'feedback') {
    hydrationProtectionRef.current.add(selectedId);
  }

  useEffect(() => {
    const newSubmissions = externalFeedbackSubmissions.filter(
      (submission) => !consumedExternalFeedbackSubmissionIdsRef.current.has(submission.submissionId),
    );

    if (newSubmissions.length === 0) {
      return;
    }

    newSubmissions.forEach((submission) => {
      consumedExternalFeedbackSubmissionIdsRef.current.add(submission.submissionId);
    });

    const nextReservations = newSubmissions.map(createReservationFromExternalFeedbackSubmission);
    const nextFeedbackByReservationId = newSubmissions.reduce<Record<number, DiningFeedbackDraft>>(
      (feedbackMap, submission) => {
        feedbackMap[submission.submissionId] = submission.draft;
        return feedbackMap;
      },
      {},
    );
    const nextScenariosByReservationId = newSubmissions.reduce<Record<number, DiningFeedbackScenario>>(
      (scenarioMap, submission) => {
        scenarioMap[submission.submissionId] = {
          ...submission.scenario,
          completedAt: submission.submittedAt,
          reservationId: submission.submissionId,
        };
        return scenarioMap;
      },
      {},
    );

    setReservations((current) => [
      ...nextReservations,
      ...current.filter(
        (reservation) =>
          !nextReservations.some((nextReservation) => nextReservation.id === reservation.id),
      ),
    ]);
    setFeedbackByReservationId((current) => ({
      ...current,
      ...nextFeedbackByReservationId,
    }));
    setFeedbackScenariosByReservationId((current) => ({
      ...current,
      ...nextScenariosByReservationId,
    }));
    setSubmittedFeedbackReservationIds((current) => {
      const nextReservationIds = new Set(current);
      nextReservations.forEach((reservation) => nextReservationIds.add(reservation.id));
      return nextReservationIds;
    });
    navigationStackRef.current = [];
    setSelectedDishFeedbackKey(null);
    setFocusedDishFeedbackKey(null);
    setSelectedId(null);
    setSelectedView('detail');
    onFeedbackMapViewChange?.(false);
    onRootViewChange?.(true);
  }, [externalFeedbackSubmissions, onFeedbackMapViewChange, onRootViewChange]);

  const visibleReservations = reservations.length > 0 ? reservations : RESERVATION_CATALOG;
  const selectedReservation = visibleReservations.find(r => r.id === selectedId);
  const selectedScenario = selectedReservation
    ? feedbackScenariosByReservationId[selectedReservation.id] ?? FALLBACK_FEEDBACK_SCENARIOS[selectedReservation.id] ?? null
    : null;
  const activeFeedbackDraft =
    selectedReservation && selectedScenario
      ? feedbackByReservationId[selectedReservation.id] ?? createDiningFeedbackDraft(selectedScenario)
      : null;
  const submittedFeedbackByReservationId = Object.fromEntries(
    Object.entries(feedbackByReservationId).filter(([reservationId]) =>
      submittedFeedbackReservationIds.has(Number(reservationId)),
    ),
  ) as Record<number, DiningFeedbackDraft>;
  const localTasteProfile = measurementSnapshot.source === 'recalled-intensity' ? undefined : TBA.buildTasteIdentity({
    feedbackCount: Object.keys(submittedFeedbackByReservationId).length,
    measurementSnapshot,
    reviewCount: Object.values(submittedFeedbackByReservationId)
      .flatMap((feedbackDraft) => Object.values(feedbackDraft.dishResponses))
      .filter(hasDiningDishFeedbackResponse).length,
  });
  const dishFeedbackItems = buildDishFeedbackItems({
    feedbackByReservationId: submittedFeedbackByReservationId,
    feedbackScenariosByReservationId,
    reviewerProfile: localTasteProfile,
    reservations: visibleReservations,
  });
  const selectedDishFeedbackItem =
    selectedDishFeedbackKey
      ? dishFeedbackItems.find((item) => getDishFeedbackItemKey(item) === selectedDishFeedbackKey) ?? null
      : null;
  const focusedDishFeedbackItem =
    focusedDishFeedbackKey
      ? dishFeedbackItems.find((item) => getDishFeedbackItemKey(item) === focusedDishFeedbackKey) ?? null
      : null;
  const isDishCommentFocusOpen = Boolean(focusedDishFeedbackItem);
  const feedbackAuthorName = userNickname?.trim() || userInitials;

  const getCurrentNavigationLocation = (): ReservationNavigationLocation => ({
    selectedId,
    selectedView,
  });

  const navigateToReservationLocation = (
    nextLocation: ReservationNavigationLocation,
    options: { replace?: boolean } = {},
  ) => {
    const currentLocation = getCurrentNavigationLocation();

    if (
      currentLocation.selectedId === nextLocation.selectedId &&
      currentLocation.selectedView === nextLocation.selectedView
    ) {
      return;
    }

    trackEvent('reservation_navigation', {
      from_selected_id: currentLocation.selectedId,
      from_view: currentLocation.selectedView,
      to_selected_id: nextLocation.selectedId,
      to_view: nextLocation.selectedView,
      replace: Boolean(options.replace),
    });

    if (!options.replace) {
      navigationStackRef.current = [
        ...navigationStackRef.current.slice(-9),
        currentLocation,
      ];
    }

    setSelectedId(nextLocation.selectedId);
    setSelectedView(nextLocation.selectedView);
  };

  const goBackToPreviousReservationLocation = (
    fallback: ReservationNavigationLocation = { selectedId: null, selectedView: 'detail' },
  ) => {
    const previousLocation = navigationStackRef.current.pop() ?? fallback;

    trackEvent('reservation_navigation_back', {
      to_selected_id: previousLocation.selectedId,
      to_view: previousLocation.selectedView,
    });

    setSelectedId(previousLocation.selectedId);
    setSelectedView(previousLocation.selectedView);
  };

  const openDishFeedbackComments = (item: DishFeedbackItem) => {
    const itemKey = getDishFeedbackItemKey(item);

    trackEvent('dish_feedback_comments_open', {
      dish_id: item.dish.id,
      reservation_id: item.scenario.reservationId,
      restaurant_name: item.reservation.restaurant,
    });

    setFocusedDishFeedbackKey(itemKey);
  };

  const notifyDishFeedbackEngagement = (
    kind: DishFeedbackEngagementNotificationEvent['kind'],
    item: DishFeedbackItem,
    comment?: string,
  ) => {
    onDishFeedbackEngagement?.({
      comment,
      dishTitle: item.dish.title,
      kind,
      restaurantName: item.reservation.restaurant,
    });
  };

  const submitDishFeedbackComment = (itemKey: string, item: DishFeedbackItem, comment: string) => {
    trackEvent('dish_feedback_comment_submit', {
      dish_id: item.dish.id,
      reservation_id: item.scenario.reservationId,
      restaurant_name: item.reservation.restaurant,
    });

    setCommentsByDishFeedbackKey((current) => ({
      ...current,
      [itemKey]: [...(current[itemKey] ?? []), comment],
    }));
    notifyDishFeedbackEngagement('comment', item, comment);
  };

  const openDishFeedbackEditor = (item: DishFeedbackItem) => {
    trackEvent('dish_feedback_edit_open', {
      dish_id: item.dish.id,
      reservation_id: item.scenario.reservationId,
      restaurant_name: item.reservation.restaurant,
    });

    setSelectedDishFeedbackKey(null);
    setFocusedDishFeedbackKey(null);
    navigateToReservationLocation({
      selectedId: item.reservation.id,
      selectedView: 'feedback',
    });
  };

  const shareDishFeedbackItem = async (item: DishFeedbackItem) => {
    const shareText = `${item.reservation.restaurant} ${item.dish.title}의 미각 기록`;

    trackEvent('dish_feedback_share_click', {
      dish_id: item.dish.id,
      reservation_id: item.scenario.reservationId,
      restaurant_name: item.reservation.restaurant,
    });

    if (navigator.share) {
      await navigator.share({ text: shareText }).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(shareText).catch(() => undefined);
  };

  const deleteDishFeedbackItem = async (item: DishFeedbackItem) => {
    const draftBeforeDelete =
      feedbackByReservationId[item.reservation.id] ?? createDiningFeedbackDraft(item.scenario);

    trackEvent('dish_feedback_delete_click', {
      dish_id: item.dish.id,
      reservation_id: item.scenario.reservationId,
      restaurant_name: item.reservation.restaurant,
    });

    setFeedbackPersistenceError(null);

    try {
      const persistenceResult = await clearDiningFeedbackItemInSupabase({
        dish: item.dish,
        draft: draftBeforeDelete,
        reservation: {
          id: item.reservation.id,
          restaurant: item.reservation.restaurant,
          chef: item.reservation.chef,
          date: item.reservation.date,
          time: item.reservation.time,
          guests: item.reservation.guests,
          course: item.reservation.course,
          externalRef: item.reservation.externalRef,
          remoteId: item.reservation.remoteId,
          status: item.reservation.status,
        },
        scenario: item.scenario,
      });

      if (!persistenceResult.persisted) {
        throw new Error('Dining feedback item was not cleared in Supabase.');
      }
      localFeedbackRevisionsRef.current.set(item.reservation.id,
        (localFeedbackRevisionsRef.current.get(item.reservation.id) ?? 0) + 1);

      setFeedbackByReservationId((current) => {
        const currentDraft = current[item.reservation.id] ?? draftBeforeDelete;

        return {
          ...current,
          [item.reservation.id]: clearDishFeedbackItemFromDraft(currentDraft, item),
        };
      });
      onExternalFeedbackSaved?.(
        item.reservation.id,
        clearDishFeedbackItemFromDraft(draftBeforeDelete, item),
        item.scenario,
        persistenceResult.remoteId,
      );
    } catch (error) {
      trackEvent('dish_feedback_delete_error', {
        dish_id: item.dish.id,
        reservation_id: item.scenario.reservationId,
      });
      console.warn('Failed to clear dining feedback item from Supabase.', error);
      setFeedbackPersistenceError({
        reservationId: item.reservation.id,
        message: '디시 기록을 삭제하지 못했어요. 연결과 로그인 상태를 확인한 뒤 다시 시도해주세요.',
      });
    }
  };

  useEffect(() => {
    if (selectedReservation) {
      trackPageView(
        `Taste Buddy - Reservation ${selectedView}`,
        `/reservation/${selectedReservation.id}/${selectedView}`,
        {
          reservation_id: selectedReservation.id,
          reservation_status: selectedReservation.status,
          restaurant_name: selectedReservation.restaurant,
          chef_name: selectedReservation.chef,
          selected_view: selectedView,
        },
      );
      return;
    }

    if (focusedDishFeedbackItem) {
      trackPageView('Taste Buddy - Dish Comments', `/reservation/dishes/${focusedDishFeedbackKey}/comments`, {
        dish_id: focusedDishFeedbackItem.dish.id,
        reservation_id: focusedDishFeedbackItem.scenario.reservationId,
        restaurant_name: focusedDishFeedbackItem.reservation.restaurant,
      });
      return;
    }

    if (selectedDishFeedbackItem) {
      trackPageView('Taste Buddy - Dish Detail', `/reservation/dishes/${selectedDishFeedbackKey}`, {
        dish_id: selectedDishFeedbackItem.dish.id,
        reservation_id: selectedDishFeedbackItem.scenario.reservationId,
        restaurant_name: selectedDishFeedbackItem.reservation.restaurant,
      });
      return;
    }

    trackPageView('Taste Buddy - Reservations', '/reservation', {
      reservation_count: visibleReservations.length,
      selected_view: selectedView,
    });
  }, [focusedDishFeedbackItem, focusedDishFeedbackKey, selectedDishFeedbackItem, selectedDishFeedbackKey, selectedReservation, selectedView, visibleReservations.length]);

  useEffect(() => {
    onRootViewChange?.(!selectedReservation && !isDishCommentFocusOpen && !selectedDishFeedbackItem);
  }, [isDishCommentFocusOpen, onRootViewChange, selectedDishFeedbackItem, selectedReservation]);

  useEffect(() => {
    if (selectedReservation && focusedDishFeedbackKey) {
      setFocusedDishFeedbackKey(null);
    }
  }, [focusedDishFeedbackKey, selectedReservation]);

  useEffect(() => {
    if (selectedReservation && selectedDishFeedbackKey) {
      setSelectedDishFeedbackKey(null);
    }
  }, [selectedDishFeedbackKey, selectedReservation]);

  useEffect(() => {
    if (selectedReservation && selectedView !== 'feedback') {
      navigationStackRef.current = [];
      setSelectedId(null);
      setSelectedView('detail');
    }
  }, [selectedReservation, selectedView]);

  useEffect(() => {
    if (selectedView !== 'feedback') {
      onFeedbackMapViewChange?.(false);
    }

    return () => {
      onFeedbackMapViewChange?.(false);
    };
  }, [onFeedbackMapViewChange, selectedView]);

  useEffect(() => {
    if (disableHydration) {
      setIsHydratingReservations(false);
      return;
    }

    let isCancelled = false;
    const revisionsBeforeHydration = new Map(localFeedbackRevisionsRef.current);
    const shouldShowBriefSkeleton =
      isSupabaseConfigured &&
      !initialReservations &&
      !hasCompletedInitialReservationHydrationRef.current;
    const fallbackReservationsTimer = shouldShowBriefSkeleton
      ? window.setTimeout(() => {
          if (isCancelled) {
            return;
          }

          hasCompletedInitialReservationHydrationRef.current = true;
          setReservations((current) => (current.length > 0 ? current : RESERVATION_CATALOG));
          setIsHydratingReservations(false);
        }, DINING_RESERVATION_HYDRATION_SKELETON_MS)
      : null;

    if (shouldShowBriefSkeleton) {
      setIsHydratingReservations(true);
    }

    void (async () => {
      let didHydrateReservations = false;

      try {
        const hydratedData = await hydrateReservationPageData();

        if (isCancelled) {
          return;
        }

        if (fallbackReservationsTimer) {
          window.clearTimeout(fallbackReservationsTimer);
        }

        setReservations((current) => {
          const hydratedReservationIds = new Set(
            hydratedData.reservations.map((reservation) => reservation.id),
          );
          const localReservations = current.filter(
            (reservation) => !hydratedReservationIds.has(reservation.id),
          );

          return [...localReservations, ...hydratedData.reservations];
        });
        const protectedIds = new Set(hydrationProtectionRef.current);
        localFeedbackRevisionsRef.current.forEach((revision, id) => {
          if (revision !== revisionsBeforeHydration.get(id)) protectedIds.add(id);
        });
        setFeedbackByReservationId((current) => mergeHydratedFeedbackById(
          current, hydratedData.feedbackByReservationId, protectedIds,
        ));
        setSubmittedFeedbackReservationIds((current) => {
          const nextReservationIds = new Set(current);

          Object.keys(hydratedData.feedbackByReservationId).forEach((reservationId) => {
            nextReservationIds.add(Number(reservationId));
          });

          return nextReservationIds;
        });
        setFeedbackScenariosByReservationId((current) => mergeHydratedFeedbackById(
          current, hydratedData.feedbackScenariosByReservationId, protectedIds,
        ));
        hasCompletedInitialReservationHydrationRef.current = true;
        didHydrateReservations = true;
      } catch {
        if (!isCancelled && !shouldShowBriefSkeleton) {
          setReservations((current) => (current.length > 0 ? current : RESERVATION_CATALOG));
        }
      } finally {
        if (!isCancelled && (didHydrateReservations || !shouldShowBriefSkeleton)) {
          setIsHydratingReservations(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
      if (fallbackReservationsTimer) {
        window.clearTimeout(fallbackReservationsTimer);
      }
    };
  }, [disableHydration, initialReservations]);

  if (selectedReservation && selectedView === 'feedback' && selectedScenario) {
    return (
      <DiningFeedbackScreen
        scenario={selectedScenario}
        draft={activeFeedbackDraft ?? createDiningFeedbackDraft(selectedScenario)}
        onBack={() =>
          goBackToPreviousReservationLocation({
            selectedId: null,
            selectedView: 'detail',
          })
        }
        onChange={(nextDraft) =>
          {
            trackEvent('dining_feedback_change', {
              reservation_id: selectedReservation.id,
              restaurant_name: selectedReservation.restaurant,
              chef_name: selectedReservation.chef,
              dish_count: selectedScenario.dishes.length,
              completed_dish_count: Object.values(nextDraft.dishResponses).filter(
                hasDiningDishFeedbackResponse,
              ).length,
            });
            setFeedbackByReservationId((current) => ({
              ...current,
              [selectedReservation.id]: nextDraft,
            }));
          }
        }
        onMapViewChange={onFeedbackMapViewChange}
        isSubmitting={savingFeedbackReservationId === selectedReservation.id}
        submitErrorMessage={
          feedbackPersistenceError?.reservationId === selectedReservation.id
            ? feedbackPersistenceError.message
            : null
        }
        onSubmit={async (submittedDraft) => {
          if (feedbackSubmitInFlightRef.current) {
            return;
          }

          feedbackSubmitInFlightRef.current = true;
          setSavingFeedbackReservationId(selectedReservation.id);
          setFeedbackPersistenceError(null);

          const nextDraft = stampDiningFeedbackDraftUpdatedAt(
            submittedDraft ?? activeFeedbackDraft ?? createDiningFeedbackDraft(selectedScenario),
          );
          const completedDishCount = Object.values(nextDraft.dishResponses).filter(
            hasDiningDishFeedbackResponse,
          ).length;

          trackEvent('dining_feedback_submit', {
            reservation_id: selectedReservation.id,
            reservation_status: selectedReservation.status,
            restaurant_name: selectedReservation.restaurant,
            chef_name: selectedReservation.chef,
            course_name: selectedReservation.course,
            dish_count: selectedScenario.dishes.length,
            completed_dish_count: completedDishCount,
          });

          setFeedbackByReservationId((current) => ({
            ...current,
            [selectedReservation.id]: nextDraft,
          }));

          try {
            const persistenceResult = await submitDiningFeedbackToSupabase({
              draft: nextDraft,
              reservation: {
                id: selectedReservation.id,
                restaurant: selectedReservation.restaurant,
                chef: selectedReservation.chef,
                date: selectedReservation.date,
                time: selectedReservation.time,
                guests: selectedReservation.guests,
                course: selectedReservation.course,
                externalRef: selectedReservation.externalRef,
                remoteId: selectedReservation.remoteId,
                status: selectedReservation.status,
              },
              scenario: selectedScenario,
            });

            if (!persistenceResult.persisted) {
              throw new Error('Dining feedback was not persisted to Supabase.');
            }
            localFeedbackRevisionsRef.current.set(selectedReservation.id,
              (localFeedbackRevisionsRef.current.get(selectedReservation.id) ?? 0) + 1);
            onExternalFeedbackSaved?.(selectedReservation.id, nextDraft, selectedScenario, persistenceResult.remoteId);

            setSubmittedFeedbackReservationIds((current) => {
              const nextReservationIds = new Set(current);
              nextReservationIds.add(selectedReservation.id);
              return nextReservationIds;
            });

            navigateToReservationLocation(
              {
                selectedId: null,
                selectedView: 'detail',
              },
              { replace: true },
            );

            trackEvent('dining_feedback_persist_success', {
              reservation_id: selectedReservation.id,
            });
          } catch (error) {
            trackEvent('dining_feedback_persist_error', {
              reservation_id: selectedReservation.id,
            });
            console.warn('Failed to persist dining feedback to Supabase.', error);
            setFeedbackPersistenceError({
              reservationId: selectedReservation.id,
              message: '피드백을 저장하지 못했어요. 연결과 로그인 상태를 확인한 뒤 다시 시도해주세요.',
            });
          } finally {
            feedbackSubmitInFlightRef.current = false;
            setSavingFeedbackReservationId((current) =>
              current === selectedReservation.id ? null : current,
            );
          }
        }}
      />
    );
  }

  if (focusedDishFeedbackItem && focusedDishFeedbackKey) {
    const focusedComments = commentsByDishFeedbackKey[focusedDishFeedbackKey] ?? [];

    return (
      <DishFeedbackCommentFocusScreen
        avatarImageSrc={userAvatarImageSrc}
        avatarProfile={userPalateBloomProfile}
        avatarShapeSeed={userPalateBloomShapeSeed}
        comments={focusedComments}
        item={focusedDishFeedbackItem}
        nickname={feedbackAuthorName}
        onBack={() => setFocusedDishFeedbackKey(null)}
        onLike={() => notifyDishFeedbackEngagement('like', focusedDishFeedbackItem)}
        onOpenAuthorProfile={onOpenAuthorProfile}
        onOpenRestaurantDetail={
          onOpenRestaurantDetail
            ? () => onOpenRestaurantDetail(focusedDishFeedbackItem.reservation)
            : undefined
        }
        onSubmitComment={(comment) =>
          submitDishFeedbackComment(focusedDishFeedbackKey, focusedDishFeedbackItem, comment)
        }
      />
    );
  }

  if (selectedDishFeedbackItem && selectedDishFeedbackKey) {
    return (
      <DishFeedbackDetailScreen
        item={selectedDishFeedbackItem}
        onBack={() => setSelectedDishFeedbackKey(null)}
      />
    );
  }

  const upcoming = visibleReservations.filter(r => r.status !== 'completed');
  const completed = visibleReservations.filter(r => r.status === 'completed');
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const measurementHighlights = getTasteMeasurementEntries(measurementSnapshot).sort(
    (left, right) => right.valueMm - left.valueMm,
  );
  const topTasteLabels = measurementHighlights.slice(0, 2).map((entry) => entry.label);
  const shouldShowDishFeedbackSkeleton = isHydratingReservations || dishFeedbackItems.length === 0;

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pb-20 pt-5" aria-busy={shouldShowDishFeedbackSkeleton}>
          <div className="tb-card-stack">
            <PageSection
              contentClassName="flex flex-col gap-3"
              title="나의 디시"
              titleAs="h2"
              titleSize="md"
            >
              {shouldShowDishFeedbackSkeleton ? (
                <DishFeedbackListSkeleton />
              ) : (
                dishFeedbackItems.map((item) => {
                  const itemKey = getDishFeedbackItemKey(item);

                  return (
                    <DishFeedbackCard
                      key={itemKey}
                      actions={{
                        onDelete: () => deleteDishFeedbackItem(item),
                        onEdit: () => openDishFeedbackEditor(item),
                        onShare: () => shareDishFeedbackItem(item),
                      }}
                      card={createDishFeedbackCardViewModel({
                        avatarImageSrc: userAvatarImageSrc,
                        avatarProfile: userPalateBloomProfile,
                        avatarShapeSeed: userPalateBloomShapeSeed,
                        item,
                        nickname: feedbackAuthorName,
                      })}
                      commentCount={(commentsByDishFeedbackKey[itemKey] ?? []).length}
                      onLike={() => notifyDishFeedbackEngagement('like', item)}
                      onOpenAuthorProfile={onOpenAuthorProfile}
                      onOpenComments={() => openDishFeedbackComments(item)}
                      onOpenSubject={
                        onOpenRestaurantDetail
                          ? () => onOpenRestaurantDetail(item.reservation)
                          : undefined
                      }
                      onSelect={() => {
                        setSelectedDishFeedbackKey(itemKey);
                      }}
                    />
                  );
                })
              )}
            </PageSection>

          </div>

          {!isHydratingReservations && upcoming.length === 0 && completed.length === 0 && (
            <HospitalityEmptyState
              actionLabel={needsMeasurementRefresh ? '현재 컨디션 다시 반영하기' : '현재 프로필 한 번 더 점검하기'}
              description="현재 미각 프로필은 이미 준비되어 있어요. 예약이 생기면 Taste Buddy가 지금의 반응을 셰프가 바로 이해할 수 있는 가이드로 바꿔 다음 다이닝 준비를 시작합니다."
              onAction={onStartMeasurement}
              secondaryLabel={`최근 기준 ${measurementAgeLabel}`}
              title="아직 예약이 없어도 프로필은 이미 준비되고 있어요"
              topTasteLabels={topTasteLabels}
            />
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
