import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  Clock as ClockIcon,
  Heart as HeartIcon,
  MessageCircle as MessageCircleIcon,
  Share2 as Share2Icon,
} from 'lucide-react';

import TasteMeasurementMiniCta from '../components/measurement/TasteMeasurementMiniCta';
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import {
  DiningAiAnalysisScreen,
  DiningFeedbackScreen,
  findTasteExperience,
  type TasteAxisId,
} from '../components/reservation/DiningFeedbackFlow';
import {
  ReservationChefCalibrationSection,
  ReservationChefSummary,
  ReservationCompletedFeedbackCard,
  ReservationDiningInterpretationSection,
  ReservationPendingActionCard,
  ReservationPersonalizationHero,
  ReservationTimelineSection,
  type ReservationPersonalizationSummary,
} from '../components/reservation/ReservationDetailSections';
import CardDetailLabel from '../components/system/CardDetailLabel';
import ImageBox from '../components/system/ImageBox';
import PageSection from '../components/system/PageSection';
import HospitalityEmptyState from '../components/system/HospitalityEmptyState';
import StatusChip from '../components/system/StatusChip';
import TasteChip from '../components/system/TasteChip';
import EmptyState from '../components/system/EmptyState';
import {
  createDiningFeedbackDraft,
  getDiningFeedbackScenario,
  type DiningDishMetadata,
  type DiningFeedbackDraft,
  type DiningFeedbackScenario,
} from '../constants/diningFeedbackData';
import {
  formatMeasurementDate,
  getTasteMeasurementAgeLabel,
  getTasteMeasurementEntries,
  isBroadStarterMeasurementSnapshot,
  isTasteMeasurementStale,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { type RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
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

type ReservationView = 'detail' | 'feedback' | 'analysis';

interface ReservationNavigationLocation {
  selectedId: number | null;
  selectedView: ReservationView;
}

interface DishTasteTag {
  colorTaste?: string;
  label: string;
}

interface DishFeedbackItem {
  courseLabel: string;
  dish: DiningDishMetadata;
  feedbackDateLabel: string;
  feedbackTimestamp: number;
  reservation: Reservation;
  scenario: DiningFeedbackScenario;
  synthesisSummary: string;
  tasteTags: DishTasteTag[];
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

    const draft = feedbackByReservationId[reservation.id] ?? (
      reservation.status === 'completed' ? createDiningFeedbackDraft(scenario) : null
    );

    if (!draft) {
      return [];
    }

    const feedbackTimestamp = new Date(scenario.completedAt).getTime();
    const safeFeedbackTimestamp = Number.isNaN(feedbackTimestamp) ? 0 : feedbackTimestamp;

    return scenario.dishes
      .map<DishFeedbackItem | null>((dish) => {
        const response = draft.dishResponses[dish.id];

        const selectedExperienceIds = [
          ...(response?.selectedExperienceIds ?? []),
          response?.selectedExperienceId ?? null,
        ].filter((experienceId): experienceId is string => Boolean(experienceId));
        const mainSelectedExperienceId = [...new Set(selectedExperienceIds)][0] ?? null;

        if (!response?.selectedChoiceId && !mainSelectedExperienceId) {
          return null;
        }

        const selectedChoice =
          dish.feedbackChoices.find((choice) => choice.id === response.selectedChoiceId) ?? null;
        const selectedExperience = findTasteExperience(mainSelectedExperienceId);
        const tasteTags = buildDishTasteTags({
          affectedTastes: selectedChoice?.affectedTastes ?? [],
          selectedExperience,
        });

        const selectedFeedbackReason =
          selectedChoice?.reason ??
          selectedExperience?.description ??
          null;

        return {
          courseLabel: dish.courseLabel,
          dish,
          feedbackDateLabel: formatFeedbackDate(scenario.completedAt),
          feedbackTimestamp: safeFeedbackTimestamp,
          reservation,
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
  onOpenRestaurantDetail,
  restaurant,
}: {
  nickname: string;
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
      <span className="shrink-0 whitespace-nowrap font-semibold">
        {visibleNickname}
      </span>
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

function DishFeedbackCard({
  avatarImageSrc,
  avatarStyle,
  initials,
  item,
  nickname,
  onOpenRestaurantDetail,
  onSelect,
}: {
  avatarImageSrc?: string | null;
  avatarStyle?: CSSProperties;
  initials: string;
  item: DishFeedbackItem;
  nickname: string;
  onOpenRestaurantDetail?: () => void;
  onSelect: () => void;
}) {
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.target !== event.currentTarget) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="block w-full text-left"
      onClick={onSelect}
      onKeyDown={handleCardKeyDown}
    >
      <SectionCard hoverEffect className="gap-[12px]">
        <div className="flex w-full items-start gap-3">
          <div
            className="flex size-[40px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:rgba(255,153,0,0.2)]"
            style={avatarImageSrc ? undefined : avatarStyle}
          >
            {avatarImageSrc ? (
              <img
                alt=""
                className="size-full object-cover"
                referrerPolicy="no-referrer"
                src={avatarImageSrc}
              />
            ) : (
              <span className="text-[13px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.32)]">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <FeedbackAuthorLine
              nickname={nickname}
              onOpenRestaurantDetail={onOpenRestaurantDetail}
              restaurant={item.reservation.restaurant}
            />
            <p className="mt-1 max-w-full truncate text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
              {getRestaurantLocationLabel(item.reservation.restaurant)}
            </p>
          </div>
        </div>

        <div className="flex w-full items-start gap-[12px]">
          <ImageBox
            alt={`${item.dish.title} 메뉴 사진`}
            className="size-[128px] shrink-0 rounded-[12px]"
            fallbackIconSize={ICON_TOKENS.size.xl}
            kind="menu"
          />
          <div className="min-w-0 grow">
            <h2 className="text-[16px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
              {item.dish.title}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
              {item.courseLabel} · 테이스팅 코스
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-normal text-[var(--tb-color-text-muted)]">
              <ClockIcon
                size={ICON_TOKENS.size.sm}
                className="text-[var(--tb-color-icon-muted)]"
                strokeWidth={1.8}
              />
              {item.feedbackDateLabel}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-start gap-[6px]">
          {item.tasteTags.length > 0 ? (
            item.tasteTags.map((tag) => (
              <TasteChip
                colorTaste={tag.colorTaste}
                key={`${item.dish.id}-${tag.label}`}
                taste={tag.label}
                tone={tag.colorTaste ? 'taste' : 'neutral'}
              />
            ))
          ) : (
            <TasteChip taste="미각 단어" tone="neutral" value="아직 없음" />
          )}
        </div>

        <div className="w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
          <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
            피드백 종합 해석
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {item.synthesisSummary}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 border-t border-[rgba(15,15,15,0.08)] pt-[12px]">
          <button
            type="button"
            aria-label="좋아요"
            className="flex size-8 items-center justify-center rounded-full text-[var(--tb-color-text-muted)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
            onClick={(event) => event.stopPropagation()}
          >
            <HeartIcon size={ICON_TOKENS.size.md} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="댓글"
            className="flex size-8 items-center justify-center rounded-full text-[var(--tb-color-text-muted)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
            onClick={(event) => event.stopPropagation()}
          >
            <MessageCircleIcon size={ICON_TOKENS.size.md} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="공유"
            className="flex size-8 items-center justify-center rounded-full text-[var(--tb-color-text-muted)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
            onClick={(event) => event.stopPropagation()}
          >
            <Share2Icon size={ICON_TOKENS.size.md} strokeWidth={1.8} />
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function buildReservationPersonalizationSummary(
  measurementSnapshot: TasteMeasurementSnapshot,
  reservation: Reservation,
  starterGuidance?: RestaurantReadyGuidance | null,
): ReservationPersonalizationSummary {
  const entries = getTasteMeasurementEntries(measurementSnapshot).sort(
    (left, right) => right.valueMm - left.valueMm,
  );
  const primary = entries.slice(0, 2);
  const softest = entries[entries.length - 1];
  const topTasteLabels = primary.map((entry) => entry.label).join('과 ');
  const chefGuidance = reservation.adjustments.map((adjustment, index) => {
    const matchingAxis = primary[index] ?? primary[0];
    return `${adjustment.taste} 포인트는 ${adjustment.direction} 방향으로 ${matchingAxis.label} 인상이 더 자연스럽게 전달되도록 참고합니다.`;
  });

  return {
    headline: starterGuidance
      ? `${reservation.restaurant}에서도 바로 참고할 시작 기준이 준비됐어요.`
      : `${reservation.restaurant} 예약은 ${topTasteLabels} 중심의 현재 프로필을 바탕으로 더 잘 맞춰집니다.`,
    guestMessage: starterGuidance?.summaryLine ?? reservation.guestUnderstanding,
    nextStepCta:
      reservation.status === 'completed'
        ? '이번 다이닝 피드백으로 다음 예약을 더 정교하게 만들기'
        : '이 프로필을 이번 예약에 반영해 더 맞춤화된 다이닝 준비하기',
    primary,
    softest,
    chefGuidance,
    recommendationLogic:
      starterGuidance?.summaryLine ??
      `${topTasteLabels}이 현재 더 또렷하게 반응하는 포인트로 읽히고, ${softest.label}은 한 번에 강하게 밀기보다 여유 있게 연결될 때 더 편안할 가능성이 있어요. 예약 화면의 추천은 이 현재 프로필과 예약 코스 특성을 함께 반영해 정리됩니다.`,
  };
}

function ReservationDetail({
  feedbackScenario,
  feedbackSubmitted,
  measurementSnapshot,
  onBack,
  onOpenAnalysis,
  onOpenFeedback,
  onOpenRestaurantDetail,
  onStartMeasurement,
  reservation,
  starterGuidance,
}: {
  feedbackScenario: DiningFeedbackScenario | null;
  feedbackSubmitted: boolean;
  measurementSnapshot: TasteMeasurementSnapshot;
  onBack: () => void;
  onOpenAnalysis: () => void;
  onOpenFeedback: () => void;
  onOpenRestaurantDetail?: (reservation: Reservation) => void;
  onStartMeasurement: () => void;
  reservation: Reservation;
  starterGuidance: RestaurantReadyGuidance | null;
}) {
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const isBroadStarterProfile = isBroadStarterMeasurementSnapshot(measurementSnapshot);
  const personalizationSummary = buildReservationPersonalizationSummary(
    measurementSnapshot,
    reservation,
    starterGuidance,
  );

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)] animate-slideIn">
      <TopAppBar
        title={reservation.restaurant}
        showBack
        onBack={onBack}
        onStartMeasurement={onStartMeasurement}
      />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack p-[20px]">
          <div className="tb-card-stack">
            <ReservationPersonalizationHero
              diningPromise={reservation.diningPromise}
              summary={personalizationSummary}
            />
            <ReservationChefSummary reservation={reservation} />
            {onOpenRestaurantDetail ? (
              <button
                type="button"
                onClick={() => onOpenRestaurantDetail(reservation)}
                className="self-start"
              >
                <CardDetailLabel label="레스토랑 정보 보기" />
              </button>
            ) : null}
          </div>

          <ReservationDiningInterpretationSection />
          <ReservationTimelineSection timeline={reservation.timeline} />
          <ReservationChefCalibrationSection
            adjustments={reservation.adjustments}
            chefGuidance={personalizationSummary.chefGuidance}
            recommendationLogic={personalizationSummary.recommendationLogic}
          />

          {reservation.status !== 'completed' && (
            <ReservationPendingActionCard
              isBroadStarterProfile={isBroadStarterProfile}
              measurementAgeLabel={measurementAgeLabel}
              measurementSnapshotMeasuredAt={measurementSnapshot.measuredAt}
              needsMeasurementRefresh={needsMeasurementRefresh}
              nextStepCta={personalizationSummary.nextStepCta}
              onStartMeasurement={onStartMeasurement}
            />
          )}

          {reservation.status === 'completed' && feedbackScenario && (
            <ReservationCompletedFeedbackCard
              feedbackSubmitted={feedbackSubmitted}
              onOpenAnalysis={onOpenAnalysis}
              onOpenFeedback={onOpenFeedback}
            />
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

interface ReservationPageProps {
  disableHydration?: boolean;
  initialReservations?: Reservation[];
  measurementSnapshot: TasteMeasurementSnapshot;
  starterGuidance?: RestaurantReadyGuidance | null;
  userAvatarImageSrc?: string | null;
  userAvatarStyle?: CSSProperties;
  userInitials?: string;
  userNickname?: string | null;
  onFeedbackMapViewChange?: (isMapView: boolean) => void;
  onRootViewChange?: (isRootView: boolean) => void;
  onOpenRestaurantDetail?: (reservation: Reservation) => void;
  onStartMeasurement: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function ReservationPage({
  disableHydration = false,
  initialReservations,
  measurementSnapshot,
  starterGuidance = null,
  userAvatarImageSrc,
  userAvatarStyle,
  userInitials = 'JH',
  userNickname = null,
  onFeedbackMapViewChange,
  onRootViewChange,
  onOpenRestaurantDetail,
  onStartMeasurement,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
}: ReservationPageProps) {
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
  const visibleReservations = reservations.length > 0 ? reservations : RESERVATION_CATALOG;
  const selectedReservation = visibleReservations.find(r => r.id === selectedId);
  const selectedScenario = selectedReservation
    ? feedbackScenariosByReservationId[selectedReservation.id] ?? FALLBACK_FEEDBACK_SCENARIOS[selectedReservation.id] ?? null
    : null;
  const activeFeedbackDraft =
    selectedReservation && selectedScenario
      ? feedbackByReservationId[selectedReservation.id] ?? createDiningFeedbackDraft(selectedScenario)
      : null;

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

    trackPageView('Taste Buddy - Reservations', '/reservation', {
      reservation_count: visibleReservations.length,
      selected_view: selectedView,
    });
  }, [selectedReservation, selectedView, visibleReservations.length]);

  useEffect(() => {
    onRootViewChange?.(!selectedReservation);
  }, [onRootViewChange, selectedReservation]);

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

      setReservations(hydratedData.reservations);
      setFeedbackByReservationId((current) => ({
        ...hydratedData.feedbackByReservationId,
        ...current,
      }));
      setFeedbackScenariosByReservationId(hydratedData.feedbackScenariosByReservationId);
      setIsHydratingReservations(false);
    })();

    return () => {
      isCancelled = true;
    };
  }, [disableHydration]);

  if (selectedReservation) {
    if (selectedView === 'feedback' && selectedScenario) {
      return (
        <DiningFeedbackScreen
          scenario={selectedScenario}
          draft={activeFeedbackDraft ?? createDiningFeedbackDraft(selectedScenario)}
          onBack={() =>
            goBackToPreviousReservationLocation({
              selectedId: selectedReservation.id,
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
                  (response) =>
                    response.selectedChoiceId ||
                    response.selectedExperienceId ||
                    (response.selectedExperienceIds?.length ?? 0) > 0,
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
              (response) =>
                response.selectedChoiceId ||
                response.selectedExperienceId ||
                (response.selectedExperienceIds?.length ?? 0) > 0,
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
              await submitDiningFeedbackToSupabase({
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
              trackEvent('dining_feedback_persist_success', {
                reservation_id: selectedReservation.id,
              });
            } catch (error) {
              trackEvent('dining_feedback_persist_error', {
                reservation_id: selectedReservation.id,
              });
              console.warn('Failed to persist dining feedback to Supabase.', error);
            }

            navigateToReservationLocation({
              selectedId: selectedReservation.id,
              selectedView: 'analysis',
            });
          }}
        />
      );
    }

    if (selectedView === 'analysis' && selectedScenario) {
      return (
        <DiningAiAnalysisScreen
          scenario={selectedScenario}
          draft={activeFeedbackDraft ?? createDiningFeedbackDraft(selectedScenario)}
          measurementSnapshot={measurementSnapshot}
          onBack={() =>
            goBackToPreviousReservationLocation({
              selectedId: selectedReservation.id,
              selectedView: 'detail',
            })
          }
          onClose={() =>
            navigateToReservationLocation(
              {
                selectedId: selectedReservation.id,
                selectedView: 'detail',
              },
              { replace: true },
            )
          }
        />
      );
    }

    return (
      <ReservationDetail
        feedbackScenario={selectedScenario}
        reservation={selectedReservation}
        feedbackSubmitted={Boolean(feedbackByReservationId[selectedReservation.id])}
        measurementSnapshot={measurementSnapshot}
        onBack={() => {
          goBackToPreviousReservationLocation();
        }}
        onOpenFeedback={() =>
          navigateToReservationLocation({
            selectedId: selectedReservation.id,
            selectedView: 'feedback',
          })
        }
        onOpenAnalysis={() =>
          navigateToReservationLocation({
            selectedId: selectedReservation.id,
            selectedView: 'analysis',
          })
        }
        onOpenRestaurantDetail={onOpenRestaurantDetail}
        onStartMeasurement={onStartMeasurement}
        starterGuidance={starterGuidance}
      />
    );
  }

  const upcoming = visibleReservations.filter(r => r.status !== 'completed');
  const completed = visibleReservations.filter(r => r.status === 'completed');
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const isBroadStarterProfile = isBroadStarterMeasurementSnapshot(measurementSnapshot);
  const measurementHighlights = getTasteMeasurementEntries(measurementSnapshot).sort(
    (left, right) => right.valueMm - left.valueMm,
  );
  const topTasteLabels = measurementHighlights.slice(0, 2).map((entry) => entry.label);
  const remeasurementAccentTaste = measurementHighlights[0]?.label;
  const dishFeedbackItems = buildDishFeedbackItems({
    feedbackByReservationId,
    feedbackScenariosByReservationId,
    reservations: visibleReservations,
  });
  const feedbackAuthorName = userNickname?.trim() || userInitials;

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
                dishFeedbackItems.map((item) => (
                  <DishFeedbackCard
                    key={`${item.scenario.reservationId}-${item.dish.id}`}
                    avatarImageSrc={userAvatarImageSrc}
                    avatarStyle={userAvatarStyle}
                    initials={userInitials}
                    item={item}
                    nickname={feedbackAuthorName}
                    onOpenRestaurantDetail={
                      onOpenRestaurantDetail
                        ? () => onOpenRestaurantDetail(item.reservation)
                        : undefined
                    }
                    onSelect={() => {
                      navigateToReservationLocation({
                        selectedId: item.reservation.id,
                        selectedView: 'analysis',
                      });
                    }}
                  />
                ))
              ) : (
                <EmptyState
                  title="아직 기록된 디시 피드백이 없어요"
                  description="식후 피드백에서 기억나는 메뉴와 미각 단어를 남기면, 이곳에 나만의 디시 로그가 쌓입니다."
                />
              )}
            </PageSection>

            {upcoming.length > 0 && (
              <TasteMeasurementMiniCta
                accentTaste={remeasurementAccentTaste}
                title={
                  needsMeasurementRefresh
                    ? isBroadStarterProfile
                      ? '스타터 프로필 업데이트 추천'
                      : '예약 개인화 정확도 업데이트 추천'
                    : isBroadStarterProfile
                      ? '현재 식사 취향 다시 반영하기'
                      : '현재 컨디션 반영하기'
                }
                description={
                  needsMeasurementRefresh
                    ? isBroadStarterProfile
                      ? `${measurementAgeLabel} 질문 기반 스타터 프로필이에요. 다시 점검해두면 이번 식사 메뉴 선택과 매장 전달 포인트가 더 자연스러워져요.`
                      : `${measurementAgeLabel} 데이터예요. 예약 전에 갱신해두면 셰프용 캘리브레이션 가이드가 이번 식사에 더 잘 맞아져요.`
                    : isBroadStarterProfile
                      ? '다가오는 식사 전에 한 번 더 점검하면 지금 취향에 맞는 시작 기준을 더 자연스럽게 맞출 수 있어요.'
                      : '다가오는 식사 전에 한 번 더 측정하면 현재 컨디션까지 반영된 개인화 가이드를 준비할 수 있어요.'
                }
                meta={`마지막 측정 ${formatMeasurementDate(measurementSnapshot.measuredAt)}`}
                actionLabel={needsMeasurementRefresh ? '프로필 업데이트' : '현재 컨디션 반영'}
                actionFullWidth={!needsMeasurementRefresh}
                onAction={onStartMeasurement}
                tone={needsMeasurementRefresh ? 'alert' : 'neutral'}
              />
            )}
          </div>

          {isHydratingReservations && reservations.length === 0 && (
            <EmptyState
              title="예약을 불러오는 중이에요"
              description="현재 프로필과 연결된 다이닝 예약을 정리하고 있어요."
            />
          )}

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
