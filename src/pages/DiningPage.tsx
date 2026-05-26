import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type CSSProperties,
} from 'react';
import {
  ChevronRight as ChevronRightIcon,
  Heart as HeartIcon,
  MessageCircle as MessageCircleIcon,
  Send as SendIcon,
} from 'lucide-react';

import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import {
  DiningFeedbackScreen,
  diningDetailTagCategories,
  findTasteExperience,
  getDiningDetailTagMetadata,
  type DiningDetailTagMetadata,
  type TasteAxisId,
  type TasteExperienceWord,
} from '../components/reservation/DiningFeedbackFlow';
import ImageBox from '../components/system/ImageBox';
import PageSection from '../components/system/PageSection';
import HospitalityEmptyState from '../components/system/HospitalityEmptyState';
import TasteChip from '../components/system/TasteChip';
import EmptyState from '../components/system/EmptyState';
import PalateBloomAvatar, {
  DEFAULT_PALATE_BLOOM_PROFILE,
  type TasteProfile as PalateBloomTasteProfile,
} from '../components/system/PalateBloomAvatar';
import {
  createDiningFeedbackDraft,
  getDiningFeedbackScenario,
  hasDiningDishFeedbackResponse,
  type DiningDishFeedbackDraft,
  type DiningDishMetadata,
  type DiningFeedbackDraft,
  type DiningFeedbackScenario,
} from '../constants/diningFeedbackData';
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
  hydrateReservationPageData,
  submitDiningFeedbackToSupabase,
} from '../lib/tasteBuddySupabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { trackEvent, trackPageView } from '../lib/analytics';

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
  diningDateLabel: string;
  feedbackRelativeLabel: string;
  feedbackTimestamp: number;
  reactionBubbles: DishReactionBubble[];
  reservation: Reservation;
  reflectionNote: string | null;
  reflectionPhotoName: string | null;
  reflectionPhotoPreviewUrl: string | null;
  scenario: DiningFeedbackScenario;
  synthesisSummary: string;
  tasteTags: DishTasteTag[];
}

type DishFeedbackCommentsByKey = Record<string, string[]>;

type DishFeedbackEngagementNotificationEvent = {
  comment?: string;
  dishTitle: string;
  kind: 'comment' | 'like';
  restaurantName: string;
};

export interface DiningPageExternalFeedbackSubmission {
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
    externalRef: `restaurant-feedback-${submission.restaurant.id}`,
    guests: 1,
    guestUnderstanding: submission.restaurant.decisionReason,
    id: submission.submissionId,
    matchRate: submission.restaurant.scores.personalMatchRate,
    remoteId: null,
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

function buildDishFeedbackSynthesis({
  dish,
  selectedFeedbackReason,
  tasteTags,
}: {
  dish: DiningDishMetadata;
  selectedFeedbackReason: string | null;
  tasteTags: DishTasteTag[];
}) {
  const tasteTagSummary =
    tasteTags.length > 0
      ? `${tasteTags.slice(0, 2).map((tag) => tag.label).join(', ')} 반응과 함께`
      : '남긴 인상과 함께';
  const interpretation =
    selectedFeedbackReason ??
    `${dish.title}에서 남긴 인상이 다음 다이닝 기준에 반영됩니다.`;

  return `${tasteTagSummary} 보면, ${interpretation} 이 흐름은 다음 다이닝에서 중심 풍미와 끝맛을 조율하는 참고 기준이 됩니다.`;
}

function buildDishFeedbackItems({
  feedbackByReservationId,
  feedbackScenariosByReservationId,
  reservations,
}: {
  feedbackByReservationId: Record<number, DiningFeedbackDraft>;
  feedbackScenariosByReservationId: Record<number, DiningFeedbackScenario>;
  reservations: Reservation[];
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

    const feedbackTimestamp = new Date(scenario.completedAt).getTime();
    const safeFeedbackTimestamp = Number.isNaN(feedbackTimestamp) ? 0 : feedbackTimestamp;

    return scenario.dishes
      .map<DishFeedbackItem | null>((dish) => {
        const response = draft.dishResponses[dish.id];

        if (!hasDiningDishFeedbackResponse(response)) {
          return null;
        }

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

        const selectedFeedbackReason =
          selectedChoice?.reason ??
          selectedExperience?.description ??
          null;

        return {
          categoryTags,
          courseLabel: dish.courseLabel,
          dish,
          diningDateLabel: formatFeedbackDate(scenario.completedAt),
          feedbackRelativeLabel: formatFeedbackRelativeTime(scenario.completedAt),
          feedbackTimestamp: safeFeedbackTimestamp,
          reactionBubbles,
          reservation,
          reflectionNote: response?.reflectionNote?.trim() || null,
          reflectionPhotoName: response?.reflectionPhotoName ?? null,
          reflectionPhotoPreviewUrl: response?.reflectionPhotoPreviewUrl ?? null,
          scenario,
          synthesisSummary: buildDishFeedbackSynthesis({
            dish,
            selectedFeedbackReason,
            tasteTags,
          }),
          tasteTags,
        };
      })
      .filter((item): item is DishFeedbackItem => Boolean(item));
  }).sort((left, right) => right.feedbackTimestamp - left.feedbackTimestamp);
}

function FeedbackAuthorLine({
  nickname,
  onOpenAuthorProfile,
  onOpenRestaurantDetail,
  restaurant,
}: {
  nickname: string;
  onOpenAuthorProfile?: () => void;
  onOpenRestaurantDetail?: () => void;
  restaurant: string;
}) {
  const lineRef = useRef<HTMLParagraphElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const restRef = useRef<HTMLSpanElement | null>(null);
  const [visibleNickname, setVisibleNickname] = useState(nickname);

  useLayoutEffect(() => {
    const lineElement = lineRef.current;
    const measureElement = measureRef.current;
    const restElement = restRef.current;

    if (!lineElement || !measureElement || !restElement) {
      return;
    }

    const getTextWidth = (text: string) => {
      measureElement.textContent = text;
      return measureElement.scrollWidth;
    };
    const nicknameCharacters = Array.from(nickname);

    const updateVisibleNickname = () => {
      const availableWidth = lineElement.clientWidth - restElement.scrollWidth;

      if (nicknameCharacters.length <= 2 || getTextWidth(nickname) <= availableWidth) {
        setVisibleNickname(nickname);
        return;
      }

      let low = 2;
      let high = nicknameCharacters.length - 1;
      let bestFit = nicknameCharacters.slice(0, 2).join('');

      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const candidate = `${nicknameCharacters.slice(0, middle).join('')}..`;

        if (getTextWidth(candidate) <= availableWidth) {
          bestFit = nicknameCharacters.slice(0, middle).join('');
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      setVisibleNickname(`${bestFit}..`);
    };

    updateVisibleNickname();

    const resizeObserver = new ResizeObserver(updateVisibleNickname);
    resizeObserver.observe(lineElement);
    resizeObserver.observe(restElement);
    window.addEventListener('resize', updateVisibleNickname);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateVisibleNickname);
    };
  }, [nickname, restaurant]);

  return (
    <p
      ref={lineRef}
      className="relative flex min-w-0 max-w-full items-baseline overflow-hidden whitespace-nowrap text-[14px] font-normal leading-snug text-[var(--tb-color-text-primary)]"
    >
      <span
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap font-semibold"
        ref={measureRef}
      />
      {onOpenAuthorProfile ? (
        <button
          type="button"
          className="shrink-0 whitespace-nowrap font-semibold underline-offset-2 transition-colors hover:text-[var(--tb-color-text-primary)] hover:underline focus-visible:rounded-[var(--tb-radius-6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAuthorProfile();
          }}
        >
          {visibleNickname}
        </button>
      ) : (
        <span className="shrink-0 whitespace-nowrap font-semibold">
          {visibleNickname}
        </span>
      )}
      <span
        ref={restRef}
        className="shrink-0 whitespace-nowrap"
      >
        님이&nbsp;
        {onOpenRestaurantDetail ? (
          <button
            type="button"
            className="font-semibold underline-offset-2 transition-colors hover:text-[var(--tb-color-text-primary)] hover:underline focus-visible:rounded-[var(--tb-radius-6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]"
            onClick={(event) => {
              event.stopPropagation();
              onOpenRestaurantDetail();
            }}
          >
            {restaurant}
          </button>
        ) : (
          <span className="font-semibold">{restaurant}</span>
        )}
        의 후기를 남기셨습니다.
      </span>
    </p>
  );
}

function getDishFeedbackGalleryDishes(item: DishFeedbackItem) {
  return [
    item.dish,
    ...item.scenario.dishes.filter((dish) => dish.id !== item.dish.id),
  ];
}

function DishFeedbackImageRail({
  item,
  unframed = false,
}: {
  item: DishFeedbackItem;
  unframed?: boolean;
}) {
  const galleryDishes = getDishFeedbackGalleryDishes(item);
  const railBleedOffset = unframed ? '-20px' : 'calc(var(--tb-space-12) * -1)';
  const railRef = useRef<HTMLDivElement | null>(null);
  const railInset = unframed ? '20px' : 'var(--tb-space-12)';
  const railWidth = unframed ? '100dvw' : 'calc(100% + (var(--tb-space-12) * 2))';
  const tileMaxSize = '220px';
  const visibleTileCount = 2.25;
  const tileSize = unframed
    ? `min(calc((100dvw - 40px - 16px) / ${visibleTileCount}), ${tileMaxSize})`
    : `min(calc((100% - 16px) / ${visibleTileCount}), ${tileMaxSize})`;

  useEffect(() => {
    const railElement = railRef.current;

    if (railElement) {
      railElement.scrollLeft = 0;
    }
  }, [item.dish.id, unframed]);

  return (
    <div
      className="overflow-x-auto pb-1 no-scrollbar"
      ref={railRef}
      style={{
        marginInlineStart: railBleedOffset,
        width: railWidth,
      }}
    >
      <div
        className="flex w-full gap-2"
        style={{ paddingInline: railInset }}
      >
        {galleryDishes.map((dish, index) => (
          <ImageBox
            alt={index === 0 ? `${item.dish.title} 메뉴 사진` : `${dish.title} 메뉴 사진`}
            className="aspect-square rounded-[var(--tb-radius-12)]"
            fallbackIconSize={ICON_TOKENS.size.xl}
            key={`${item.dish.id}-${dish.id}-${index}`}
            kind="menu"
            style={{
              flex: `0 0 ${tileSize}`,
              width: tileSize,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DishReactionBubbleChip({ bubble }: { bubble: DishReactionBubble }) {
  const axisLabel = TASTE_AXIS_LABEL_BY_ID[bubble.axis];

  return (
    <TasteChip
      className="max-w-full px-3 py-1.5 text-[10px] font-semibold leading-none"
      colorTaste={axisLabel}
      taste={bubble.label}
      title={axisLabel}
    />
  );
}

function DishFeedbackCard({
  avatarImageSrc,
  avatarProfile,
  avatarShapeSeed,
  commentCount = 0,
  defaultSynthesisExpanded = false,
  interactive = true,
  item,
  nickname,
  onLike,
  onOpenAuthorProfile,
  onOpenComments,
  onOpenRestaurantDetail,
  onSelect,
  unframed = false,
}: {
  avatarImageSrc?: string | null;
  avatarProfile?: PalateBloomTasteProfile;
  avatarShapeSeed?: string;
  commentCount?: number;
  defaultSynthesisExpanded?: boolean;
  interactive?: boolean;
  item: DishFeedbackItem;
  nickname: string;
  onLike?: () => void;
  onOpenAuthorProfile?: () => void;
  onOpenComments: () => void;
  onOpenRestaurantDetail?: () => void;
  onSelect?: () => void;
  unframed?: boolean;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSynthesisExpanded, setIsSynthesisExpanded] = useState(defaultSynthesisExpanded);
  const isCardInteractive = interactive && Boolean(onSelect);
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isCardInteractive || event.defaultPrevented || event.target !== event.currentTarget) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
    }
  };
  const handleLikeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);

    if (nextIsLiked) {
      onLike?.();
    }
  };
  const handleCommentClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onOpenComments();
  };
  const handleSynthesisToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsSynthesisExpanded((current) => !current);
  };

  const cardContent = (
    <>
        <div className="flex w-full items-center gap-2">
          <PalateBloomAvatar
            ariaLabel={`${nickname} 프로필 아바타`}
            imageSrc={avatarImageSrc}
            profile={avatarProfile ?? DEFAULT_PALATE_BLOOM_PROFILE}
            shapeSeed={avatarShapeSeed}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <FeedbackAuthorLine
              nickname={nickname}
              onOpenAuthorProfile={onOpenAuthorProfile}
              onOpenRestaurantDetail={onOpenRestaurantDetail}
              restaurant={item.reservation.restaurant}
            />
            <p className="max-w-full truncate text-[12px] text-[var(--tb-color-text-muted)]">
              {getRestaurantLocationLabel(item.reservation.restaurant)}
              <span aria-hidden="true"> · </span>
              {item.feedbackRelativeLabel}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <DishFeedbackImageRail item={item} unframed={unframed} />
          <div className="min-w-0">
            <h2 className="text-[14px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
              {item.dish.title}
            </h2>
            <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
              {item.courseLabel} · 테이스팅 코스
            </p>
          </div>
        </div>

        {item.reactionBubbles.length > 0 ? (
          <div className="flex w-full flex-wrap items-start gap-[6px]">
            {item.reactionBubbles.map((bubble) => (
              <DishReactionBubbleChip
                bubble={bubble}
                key={`${item.dish.id}-${bubble.id}`}
              />
            ))}
          </div>
        ) : null}

        {item.categoryTags.length > 0 ? (
          <div className="flex w-full flex-wrap items-start gap-[6px]">
            {item.categoryTags.map((tag) => (
              <TasteChip
                key={`${item.dish.id}-${tag.id}`}
                taste={tag.label}
                tone="neutral"
                title={tag.categoryLabel}
              />
            ))}
          </div>
        ) : item.tasteTags.length > 0 ? (
          <div className="flex w-full flex-wrap items-start gap-[6px]">
            {item.tasteTags.map((tag) => (
              <TasteChip
                colorTaste={tag.colorTaste}
                key={`${item.dish.id}-${tag.label}`}
                taste={tag.label}
                tone={tag.colorTaste ? 'taste' : 'neutral'}
              />
            ))}
          </div>
        ) : null}

        <div className="w-full">
          <button
            type="button"
            aria-expanded={isSynthesisExpanded}
            className="flex w-full items-center justify-between rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-left transition-colors hover:bg-[var(--tb-color-surface-card-hover)]"
            onClick={handleSynthesisToggle}
          >
            <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
              피드백 종합 해석
            </span>
            <ChevronRightIcon
              aria-hidden="true"
              className={`shrink-0 text-[var(--tb-color-icon-muted)] transition-transform ${isSynthesisExpanded ? 'rotate-90' : ''}`}
              size={ICON_TOKENS.size.md}
              strokeWidth={1.8}
            />
          </button>
          {isSynthesisExpanded ? (
            <p className="mt-2 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-3 text-[12px] font-normal leading-relaxed text-[var(--tb-color-text-subtle)]">
              {item.synthesisSummary}
            </p>
          ) : null}
        </div>

        <div className="flex w-full items-center gap-2 border-t border-[rgba(15,15,15,0.08)] pt-[12px]">
          <button
            type="button"
            aria-label={isLiked ? '좋아요 취소' : '좋아요'}
            aria-pressed={isLiked}
            className={`flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-color-surface-muted)] ${
              isLiked
                ? 'text-[var(--tb-user-accent-main)]'
                : 'text-[var(--tb-color-text-muted)]'
            }`}
            onClick={handleLikeClick}
          >
            <HeartIcon
              fill={isLiked ? 'currentColor' : 'none'}
              size={ICON_TOKENS.size.md}
              strokeWidth={1.8}
            />
          </button>
          <button
            type="button"
            aria-label="댓글"
            className={`flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--tb-color-surface-muted)] ${
              commentCount > 0
                ? 'text-[var(--tb-color-text-primary)]'
                : 'text-[var(--tb-color-text-muted)]'
            }`}
            onClick={handleCommentClick}
          >
            <MessageCircleIcon size={ICON_TOKENS.size.md} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="공유"
            className="flex size-8 items-center justify-center rounded-full text-[var(--tb-color-text-muted)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
            onClick={(event) => event.stopPropagation()}
          >
            <SendIcon size={ICON_TOKENS.size.md} strokeWidth={1.8} />
          </button>
          <span className="ml-auto shrink-0 whitespace-nowrap text-right text-[11px] font-normal text-[var(--tb-color-text-muted)]">
            {item.diningDateLabel}
          </span>
        </div>
    </>
  );

  const content = unframed ? (
    <div className="flex w-full flex-col items-start gap-[12px]">
      {cardContent}
    </div>
  ) : (
    <SectionCard hoverEffect={isCardInteractive} className="gap-[12px]">
      {cardContent}
      </SectionCard>
  );

  if (!isCardInteractive) {
    return <div className="block w-full text-left">{content}</div>;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="block w-full text-left"
      onClick={onSelect}
      onKeyDown={handleCardKeyDown}
    >
      {content}
    </div>
  );
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
            avatarImageSrc={avatarImageSrc}
            avatarProfile={avatarProfile}
            avatarShapeSeed={avatarShapeSeed}
            commentCount={comments.length}
            interactive={false}
            item={item}
            nickname={nickname}
            onLike={onLike}
            onOpenAuthorProfile={onOpenAuthorProfile}
            onOpenComments={() => commentInputRef.current?.focus()}
            onOpenRestaurantDetail={onOpenRestaurantDetail}
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
  onRootViewChange,
  onOpenAuthorProfile,
  onOpenRestaurantDetail,
  onStartMeasurement,
  onOpenSearch,
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
  const [selectedDishFeedbackKey, setSelectedDishFeedbackKey] = useState<string | null>(null);
  const [focusedDishFeedbackKey, setFocusedDishFeedbackKey] = useState<string | null>(null);
  const [commentsByDishFeedbackKey, setCommentsByDishFeedbackKey] =
    useState<DishFeedbackCommentsByKey>({});
  const consumedExternalFeedbackSubmissionIdsRef = useRef<Set<number>>(new Set());

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
  const dishFeedbackItems = buildDishFeedbackItems({
    feedbackByReservationId: submittedFeedbackByReservationId,
    feedbackScenariosByReservationId,
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
      return;
    }

    let isCancelled = false;

    void (async () => {
      const hydratedData = await hydrateReservationPageData();

      if (isCancelled) {
        return;
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
      setFeedbackByReservationId((current) => ({
        ...hydratedData.feedbackByReservationId,
        ...current,
      }));
      setSubmittedFeedbackReservationIds((current) => {
        const nextReservationIds = new Set(current);

        Object.keys(hydratedData.feedbackByReservationId).forEach((reservationId) => {
          nextReservationIds.add(Number(reservationId));
        });

        return nextReservationIds;
      });
      setFeedbackScenariosByReservationId((current) => ({
        ...hydratedData.feedbackScenariosByReservationId,
        ...current,
      }));
      setIsHydratingReservations(false);
    })();

    return () => {
      isCancelled = true;
    };
  }, [disableHydration]);

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
        onSubmit={async () => {
          const nextDraft = activeFeedbackDraft ?? createDiningFeedbackDraft(selectedScenario);
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

          void submitDiningFeedbackToSupabase({
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
            })
            .then(() => {
              trackEvent('dining_feedback_persist_success', {
                reservation_id: selectedReservation.id,
              });
            })
            .catch((error) => {
              trackEvent('dining_feedback_persist_error', {
                reservation_id: selectedReservation.id,
              });
              console.warn('Failed to persist dining feedback to Supabase.', error);
            });
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

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pb-20 pt-5 animate-fadeIn">
          <div className="tb-card-stack">
            <PageSection
              contentClassName="flex flex-col gap-3"
              title="나의 디시"
              titleAs="h2"
              titleSize="md"
            >
              {dishFeedbackItems.length > 0 ? (
                dishFeedbackItems.map((item) => {
                  const itemKey = getDishFeedbackItemKey(item);

                  return (
                    <DishFeedbackCard
                      key={itemKey}
                      avatarImageSrc={userAvatarImageSrc}
                      avatarProfile={userPalateBloomProfile}
                      avatarShapeSeed={userPalateBloomShapeSeed}
                      commentCount={(commentsByDishFeedbackKey[itemKey] ?? []).length}
                      item={item}
                      nickname={feedbackAuthorName}
                      onLike={() => notifyDishFeedbackEngagement('like', item)}
                      onOpenAuthorProfile={onOpenAuthorProfile}
                      onOpenComments={() => openDishFeedbackComments(item)}
                      onOpenRestaurantDetail={
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
              ) : (
                <EmptyState
                  title="아직 기록된 디시 피드백이 없어요"
                  description="식후 피드백에서 기억나는 메뉴와 미각 단어를 남기면, 이곳에 나만의 디시 로그가 쌓입니다."
                  actionLabel="레스토랑·메뉴 검색하기"
                  actionTone="user-accent"
                  onAction={onOpenSearch}
                />
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
