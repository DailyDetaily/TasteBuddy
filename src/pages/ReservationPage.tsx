import { useEffect, useState } from 'react';

import TasteMeasurementMiniCta from '../components/measurement/TasteMeasurementMiniCta';
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import {
  DiningAiAnalysisScreen,
  DiningFeedbackScreen,
} from '../components/reservation/DiningFeedbackFlow';
import ReservationCard from '../components/reservation/ReservationCard';
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
import PrimaryButton from '../components/system/PrimaryButton';
import ChefAvatar from '../components/system/ChefAvatar';
import PageSection from '../components/system/PageSection';
import HospitalityEmptyState from '../components/system/HospitalityEmptyState';
import SectionTitle from '../components/system/SectionTitle';
import StatusChip from '../components/system/StatusChip';
import TasteChip from '../components/system/TasteChip';
import EmptyState from '../components/system/EmptyState';
import {
  createDiningFeedbackDraft,
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
import {
  hydrateReservationPageData,
  submitDiningFeedbackToSupabase,
} from '../lib/tasteBuddySupabase';
import { isSupabaseConfigured } from '../lib/supabase';

type ReservationView = 'detail' | 'feedback' | 'analysis';

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
  onRootViewChange?: (isRootView: boolean) => void;
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
  onRootViewChange,
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
  const [feedbackByReservationId, setFeedbackByReservationId] = useState<Record<number, DiningFeedbackDraft>>({});
  const [feedbackScenariosByReservationId, setFeedbackScenariosByReservationId] = useState<
    Record<number, DiningFeedbackScenario>
  >({});
  const selectedReservation = reservations.find(r => r.id === selectedId);
  const selectedScenario = selectedReservation
    ? feedbackScenariosByReservationId[selectedReservation.id] ?? null
    : null;
  const activeFeedbackDraft =
    selectedReservation && selectedScenario
      ? feedbackByReservationId[selectedReservation.id] ?? createDiningFeedbackDraft(selectedScenario)
      : null;

  useEffect(() => {
    onRootViewChange?.(!selectedReservation);
  }, [onRootViewChange, selectedReservation]);

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
          onBack={() => setSelectedView('detail')}
          onChange={(nextDraft) =>
            setFeedbackByReservationId((current) => ({
              ...current,
              [selectedReservation.id]: nextDraft,
            }))
          }
          onSubmit={async () => {
            const nextDraft = activeFeedbackDraft ?? createDiningFeedbackDraft(selectedScenario);

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
            } catch (error) {
              console.warn('Failed to persist dining feedback to Supabase.', error);
            }

            setSelectedView('analysis');
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
          onBack={() => setSelectedView('feedback')}
          onClose={() => setSelectedView('detail')}
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
          setSelectedId(null);
          setSelectedView('detail');
        }}
        onOpenFeedback={() => setSelectedView('feedback')}
        onOpenAnalysis={() => setSelectedView('analysis')}
        onStartMeasurement={onStartMeasurement}
        starterGuidance={starterGuidance}
      />
    );
  }

  const upcoming = reservations.filter(r => r.status !== 'completed');
  const completed = reservations.filter(r => r.status === 'completed');
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const featuredReservation = upcoming[0] ?? null;
  const featuredSummary = featuredReservation
    ? buildReservationPersonalizationSummary(
      measurementSnapshot,
      featuredReservation,
      starterGuidance,
    )
    : null;
  const isBroadStarterProfile = isBroadStarterMeasurementSnapshot(measurementSnapshot);
  const measurementHighlights = getTasteMeasurementEntries(measurementSnapshot).sort(
    (left, right) => right.valueMm - left.valueMm,
  );
  const topTasteLabels = measurementHighlights.slice(0, 2).map((entry) => entry.label);

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="tb-section-stack p-5 animate-fadeIn">
          <div className="tb-card-stack">
            <h1 className="font-bold text-[18px] text-[var(--tb-color-text-primary)] tracking-[-0.24px]">다이닝</h1>

            {featuredReservation && featuredSummary && (
              <SectionCard hoverEffect={false}>
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip
                          color="var(--tb-color-text-primary)"
                          backgroundColor="var(--tb-color-surface-base)"
                        >
                          {starterGuidance ? 'Restaurant-ready Profile' : 'Chef-ready Personalization'}
                        </StatusChip>
                        <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                          {featuredReservation.date}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <ChefAvatar
                          alt={featuredReservation.chef}
                          className="h-[40px] w-[40px] rounded-[var(--tb-radius-8)]"
                          iconSize={ICON_TOKENS.size.lg}
                          imageSrc={featuredReservation.chefImage}
                          taste={featuredReservation.adjustments[0]?.taste}
                          variant="neutral"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-[var(--tb-color-text-hint)]">
                            {featuredReservation.restaurant}
                          </p>
                          <p className="truncate text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                            {featuredReservation.chef} 셰프
                          </p>
                        </div>
                      </div>
                    </div>

                    <StatusChip className="shrink-0 gap-1">
                      <span>매칭</span>
                      <span>{featuredReservation.matchRate}%</span>
                    </StatusChip>
                  </div>

                  <h2 className="text-[18px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
                    {featuredSummary.headline}
                  </h2>

                  <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
                    {starterGuidance?.summaryLine ?? featuredReservation.diningPromise}
                  </p>

                  <div className="grid gap-2">
                    <div className="rounded-[8px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                        게스트가 기대할 변화
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                        {featuredSummary.guestMessage}
                      </p>
                    </div>

                    <div className="rounded-[8px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                        {starterGuidance ? '매장이 참고하는 포인트' : '셰프가 참고하는 포인트'}
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                        {featuredSummary.chefGuidance[0] ?? featuredSummary.recommendationLogic}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {featuredSummary.primary.map((entry) => (
                      <TasteChip key={entry.id} taste={entry.label} value="현재 더 또렷한 포인트" />
                    ))}
                    <TasteChip
                      taste={featuredSummary.softest.label}
                      value="부드럽게 연결할 포인트"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <PrimaryButton
                      onClick={() => {
                        setSelectedId(featuredReservation.id);
                        setSelectedView('detail');
                      }}
                    >
                      예약 개인화 자세히 보기
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={onStartMeasurement}
                      className="self-center text-[12px] font-semibold text-[var(--tb-color-text-muted)]"
                    >
                      {needsMeasurementRefresh ? '현재 프로필 다시 반영하기' : '현재 컨디션 한 번 더 반영하기'}
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}

            {upcoming.length > 0 && (
              <TasteMeasurementMiniCta
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
                onAction={onStartMeasurement}
                tone={needsMeasurementRefresh ? 'alert' : 'neutral'}
              />
            )}
          </div>

          {/* 다가오는 예약 */}
          {upcoming.length > 0 && (
            <PageSection
              contentClassName="flex flex-col gap-3"
              title="다가오는 다이닝"
              titleAs="h3"
              titleClassName="font-semibold text-[var(--tb-color-text-subtle)]"
              titleSize="md"
            >
              {upcoming.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onSelect={() => {
                    setSelectedId(r.id);
                    setSelectedView('detail');
                  }}
                />
              ))}
            </PageSection>
          )}

          {/* 지난 예약 */}
          {completed.length > 0 && (
            <PageSection
              contentClassName="flex flex-col gap-3"
              title="지난 다이닝"
              titleAs="h3"
              titleClassName="font-semibold text-[var(--tb-color-text-subtle)]"
              titleSize="md"
            >
              {completed.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onSelect={() => {
                    setSelectedId(r.id);
                    setSelectedView('detail');
                  }}
                />
              ))}
            </PageSection>
          )}

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
