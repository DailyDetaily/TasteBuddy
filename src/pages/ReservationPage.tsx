import { useEffect, useState } from 'react';
import {
  ChevronRightRegular, LocationRegular, ClockRegular, FoodRegular,
  HeartPulseRegular, CheckmarkCircleRegular, CircleRegular
} from '@fluentui/react-icons';
import React from 'react';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const ChevronRight = wrapIcon(ChevronRightRegular);
const MapPin = wrapIcon(LocationRegular);
const Clock = wrapIcon(ClockRegular);
const Utensils = wrapIcon(FoodRegular);
const Activity = wrapIcon(HeartPulseRegular);
const CheckCircle2 = wrapIcon(CheckmarkCircleRegular);
const Circle = wrapIcon(CircleRegular);
import TasteMeasurementMiniCta from '../components/measurement/TasteMeasurementMiniCta';
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import {
  DiningAiAnalysisScreen,
  DiningFeedbackScreen,
} from '../components/reservation/DiningFeedbackFlow';
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
import { getTasteColor } from '../constants/tasteColors';
import {
  formatMeasurementDate,
  getTasteMeasurementAgeLabel,
  getTasteMeasurementEntries,
  isTasteMeasurementStale,
  type TasteMeasurementEntry,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import {
  RESERVATION_CATALOG,
  type ReservationRecord as Reservation,
  type ReservationStatus,
} from '../constants/reservationCatalog';
import { COLOR_TOKENS, ICON_TOKENS } from '../constants/designTokens';
import {
  hydrateReservationPageData,
  submitDiningFeedbackToSupabase,
} from '../lib/tasteBuddySupabase';
import { isSupabaseConfigured } from '../lib/supabase';

type ReservationView = 'detail' | 'feedback' | 'analysis';
const CARD_TRAILING_ICON_SIZE = ICON_TOKENS.size.md;

const statusConfig: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: '예약 확정', color: '#3F3F3F', bg: '#F3F3F3' },
  preparing: {
    label: 'TCS 준비 중',
    color: COLOR_TOKENS.text.secondary,
    bg: COLOR_TOKENS.surface.muted,
  },
  ready: {
    label: '준비 완료',
    color: COLOR_TOKENS.text.primary,
    bg: COLOR_TOKENS.surface.muted,
  },
  completed: { label: '완료', color: '#AFAFAF', bg: '#F3F3F3' },
};

interface ReservationPersonalizationSummary {
  chefGuidance: string[];
  guestMessage: string;
  headline: string;
  nextStepCta: string;
  primary: TasteMeasurementEntry[];
  recommendationLogic: string;
  softest: TasteMeasurementEntry;
}

function buildReservationPersonalizationSummary(
  measurementSnapshot: TasteMeasurementSnapshot,
  reservation: Reservation,
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
    headline: `${reservation.restaurant} 예약은 ${topTasteLabels} 중심의 현재 프로필을 바탕으로 더 잘 맞춰집니다.`,
    guestMessage: reservation.guestUnderstanding,
    nextStepCta:
      reservation.status === 'completed'
        ? '이번 다이닝 피드백으로 다음 예약을 더 정교하게 만들기'
        : '이 프로필을 이번 예약에 반영해 더 맞춤화된 다이닝 준비하기',
    primary,
    softest,
    chefGuidance,
    recommendationLogic: `${topTasteLabels}이 현재 더 또렷하게 반응하는 포인트로 읽히고, ${softest.label}은 한 번에 강하게 밀기보다 여유 있게 연결될 때 더 편안할 가능성이 있어요. 예약 화면의 추천은 이 현재 프로필과 예약 코스 특성을 함께 반영해 정리됩니다.`,
  };
}

function ReservationCard({ reservation, onSelect }: { reservation: Reservation; onSelect: () => void }) {
  const status = statusConfig[reservation.status];

  return (
    <SectionCard onClick={onSelect}>
      {/* 상태 배지 + 레스토랑 */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <StatusChip color={status.color} backgroundColor={status.bg}>
            {status.label}
          </StatusChip>
          <span className="font-bold text-[14px] text-[var(--tb-color-text-primary)]">{reservation.restaurant}</span>
        </div>
        <ChevronRight
          size={CARD_TRAILING_ICON_SIZE}
          className="text-[var(--tb-color-text-disabled)]"
        />
      </div>

      {/* 셰프 정보 */}
      <div className="flex items-center gap-3 w-full">
        <ChefAvatar
          alt={reservation.chef}
          className="h-[40px] w-[40px] rounded-[8px]"
          iconSize={ICON_TOKENS.size.lg}
          imageSrc={reservation.chefImage}
          taste={reservation.adjustments[0]?.taste}
          variant="neutral"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-[14px] text-[var(--tb-color-text-primary)]">{reservation.chef} 셰프</span>
          <span className="text-[12px] text-[var(--tb-color-text-subtle)]">프로필 반영 중</span>
        </div>
      </div>

      {/* 예약 정보 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 w-full">
        <div className="flex items-center gap-1">
          <Clock size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-muted)]" />
          <span className="text-[12px] text-[var(--tb-color-text-muted)]">{reservation.date} {reservation.time}</span>
        </div>
        <div className="flex items-center gap-1">
          <Utensils size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-muted)]" />
          <span className="text-[12px] text-[var(--tb-color-text-muted)]">{reservation.course}</span>
        </div>
      </div>

      {/* TCS 상태 */}
      <div className="flex items-center gap-2 w-full rounded-[12px] bg-[var(--tb-color-surface-muted)] px-3 py-2">
        <Activity size={ICON_TOKENS.size.sm} style={{ color: status.color }} />
        <span className="text-[12px] text-[var(--tb-color-text-primary)]">{reservation.tcsStatus}</span>
      </div>

      <p className="w-full text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
        {reservation.diningPromise}
      </p>

      {/* 예상 보정 태그 */}
      {reservation.adjustments.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {reservation.adjustments.map((adj, idx) => (
            <TasteChip
              key={idx}
              taste={adj.taste}
              value={adj.direction}
            />
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
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
}: {
  feedbackScenario: DiningFeedbackScenario | null;
  feedbackSubmitted: boolean;
  measurementSnapshot: TasteMeasurementSnapshot;
  onBack: () => void;
  onOpenAnalysis: () => void;
  onOpenFeedback: () => void;
  onStartMeasurement: () => void;
  reservation: Reservation;
}) {
  const status = statusConfig[reservation.status];
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const personalizationSummary = buildReservationPersonalizationSummary(
    measurementSnapshot,
    reservation,
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
          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <StatusChip color="#0F0F0F" backgroundColor="white">
                    Personalized Dining
                  </StatusChip>
                  <SectionTitle size="md">{personalizationSummary.headline}</SectionTitle>
                </div>
                <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                  프로필 반영 중
                </span>
              </div>

              <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
                {personalizationSummary.guestMessage}
              </p>

              <div className="flex flex-wrap gap-2">
                {personalizationSummary.primary.map((entry) => (
                  <TasteChip key={entry.id} taste={entry.label} value="현재 더 또렷한 포인트" />
                ))}
                <TasteChip
                  taste={personalizationSummary.softest.label}
                  value="천천히 이어지는 포인트"
                />
              </div>

              <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">이번 예약에서 달라지는 점</p>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                  {reservation.diningPromise}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* 셰프 + 상태 */}
          <div className="flex items-center gap-4">
            <ChefAvatar
              alt={reservation.chef}
              className="h-[56px] w-[56px] rounded-[14px]"
              iconSize={ICON_TOKENS.size.lg}
              imageSrc={reservation.chefImage}
              taste={reservation.adjustments[0]?.taste}
              variant="neutral"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[18px]">{reservation.chef} 셰프</span>
                <StatusChip color={status.color} backgroundColor={status.bg}>
                  {status.label}
                </StatusChip>
              </div>
              <span className="text-[14px] text-[var(--tb-color-text-subtle)]">
                {reservation.course} · {reservation.guests}명
              </span>
            </div>
          </div>

          {/* 예약 정보 카드 */}
          <SectionCard>
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center gap-2">
                <Clock size={ICON_TOKENS.size.md} className="text-[var(--tb-color-text-secondary)]" />
                <span className="text-[14px] font-medium">{reservation.date} {reservation.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={ICON_TOKENS.size.md} className="text-[var(--tb-color-text-secondary)]" />
                <span className="text-[14px] font-medium">{reservation.restaurant}</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils size={ICON_TOKENS.size.md} className="text-[var(--tb-color-text-secondary)]" />
                <span className="text-[14px] font-medium">{reservation.course}</span>
              </div>
            </div>
          </SectionCard>
          </div>

          <PageSection title="프로필 기반 예약 개인화">
            <SectionCard hoverEffect={false}>
              <div className="flex flex-col gap-4 w-full">
                <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
                  Taste Buddy는 레시피를 바꾸라고 지시하지 않고, 현재 프로필이 더 편안하게 받아들일 수 있는 전달 강도와 마무리 방향을 셰프가 참고할 수 있게 정리합니다.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                    <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">게스트 관점</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                      코스가 내 현재 입맛과 더 자연스럽게 연결되도록 준비된다는 뜻이에요.
                    </p>
                  </div>
                  <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                    <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">셰프 관점</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                      셰프는 코스의 의도는 유지한 채, 어느 포인트를 더 선명하게 전달하고 어디를 더 부드럽게 정리할지 참고할 수 있어요.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </PageSection>

          {/* 다이닝 타임라인 */}
          <PageSection title="다이닝 타임라인">
            <div className="flex flex-col gap-0">
              {reservation.timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {step.done ? (
                      <CheckCircle2 size={ICON_TOKENS.size.md} className="text-[var(--tb-color-text-primary)] shrink-0" />
                    ) : step.current ? (
                      <div className="relative">
                        <Circle size={ICON_TOKENS.size.md} className="text-[var(--tb-color-text-secondary)] shrink-0" />
                        <div className="absolute inset-[4px] rounded-full bg-[var(--tb-color-icon-primary)] animate-pulse-soft" />
                      </div>
                    ) : (
                      <Circle size={ICON_TOKENS.size.md} className="text-[#e0e0e0] shrink-0" />
                    )}
                    {idx < reservation.timeline.length - 1 && (
                      <div className={`w-[2px] h-[28px] ${step.done ? 'bg-[var(--tb-color-text-primary)]' : 'bg-[var(--tb-color-border-disabled)]'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <span className={`text-[14px] ${step.current ? 'font-bold text-[var(--tb-color-text-primary)]' : step.done ? 'font-medium text-[var(--tb-color-text-primary)]' : 'font-medium text-[var(--tb-color-text-disabled)]'}`}>
                      {step.step}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </PageSection>

          {/* 셰프용 캘리브레이션 요약 */}
          <PageSection title="셰프용 캘리브레이션 요약">
            <SectionCard hoverEffect={false}>
              <div className="flex flex-col gap-4 w-full">
                <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                    Recommendation logic
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                    {personalizationSummary.recommendationLogic}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {personalizationSummary.chefGuidance.map((guidance) => (
                    <div
                      key={guidance}
                      className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3"
                    >
                      <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">{guidance}</p>
                    </div>
                  ))}
                </div>

                {reservation.adjustments.length > 0 ? (
                  <div className="flex flex-col gap-3 w-full mt-1">
                    <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                      이번 예약에서 참고 중인 조정 포인트
                    </p>
                    {reservation.adjustments.map((adj, idx) => {
                      const color = getTasteColor(adj.taste);
                      return (
                        <div key={idx} className="flex items-center gap-3 w-full">
                          <div className="w-[6px] h-[32px] rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-medium text-[14px] text-[var(--tb-color-text-primary)] w-[50px]">{adj.taste}</span>
                          <div className="flex-1 h-[8px] bg-[var(--tb-color-border-subtle)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full animate-grow"
                              style={{
                                width: '60%',
                                backgroundColor: color,
                                animationDelay: `${idx * 200}ms`,
                                animationFillMode: 'both',
                              }}
                            />
                          </div>
                          <span className="font-bold text-[14px] w-[56px] text-right" style={{ color }}>{adj.direction}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </PageSection>

          {reservation.status !== 'completed' && (
            <SectionCard hoverEffect={false}>
              <div className="flex flex-col gap-3 w-full">
                <div>
                  <SectionTitle size="md">다음 액션</SectionTitle>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
                    {personalizationSummary.nextStepCta}
                  </p>
                </div>
                <PrimaryButton onClick={onStartMeasurement}>
                  {needsMeasurementRefresh ? '현재 컨디션 다시 반영하기' : '현재 프로필 한 번 더 점검하기'}
                </PrimaryButton>
                <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  마지막 측정 {formatMeasurementDate(measurementSnapshot.measuredAt)} · {measurementAgeLabel}
                </p>
              </div>
            </SectionCard>
          )}

          {reservation.status === 'completed' && feedbackScenario && (
            <SectionCard hoverEffect={false}>
              <div className="flex items-start justify-between gap-4 w-full">
                <div className="flex flex-col gap-2">
                  <SectionTitle size="md">다음 다이닝을 위한 식후 피드백</SectionTitle>
                  <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
                    짧게 남겨주신 인상은 이번 다이닝에서 무엇이 잘 맞았는지 배우고, 다음 예약과 셰프용 캘리브레이션을 더 정교하게 만드는 데 바로 반영됩니다.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <PrimaryButton onClick={feedbackSubmitted ? onOpenAnalysis : onOpenFeedback}>
                  {feedbackSubmitted ? '프로필 정교화 보기' : '다음 다이닝을 위한 피드백 남기기'}
                </PrimaryButton>
                {feedbackSubmitted ? (
                  <button
                    type="button"
                    onClick={onOpenFeedback}
                    className="self-center text-[12px] font-semibold text-[var(--tb-color-text-muted)]"
                  >
                    피드백 수정하기
                  </button>
                ) : null}
              </div>
            </SectionCard>
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
  onStartMeasurement: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function ReservationPage({
  disableHydration = false,
  initialReservations,
  measurementSnapshot,
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
      />
    );
  }

  const upcoming = reservations.filter(r => r.status !== 'completed');
  const completed = reservations.filter(r => r.status === 'completed');
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const featuredReservation = upcoming[0] ?? null;
  const featuredSummary = featuredReservation
    ? buildReservationPersonalizationSummary(measurementSnapshot, featuredReservation)
    : null;
  const measurementHighlights = getTasteMeasurementEntries(measurementSnapshot).sort(
    (left, right) => right.valueMm - left.valueMm,
  );
  const topTasteLabels = measurementHighlights.slice(0, 2).map((entry) => entry.label);

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <TopAppBar onStartMeasurement={onStartMeasurement} onOpenNotifications={onOpenNotifications} onOpenMenu={onOpenMenu} hasUnreadNotifications={hasUnreadNotifications} />
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
                      <StatusChip color="#0F0F0F" backgroundColor="white">
                        Chef-ready Personalization
                      </StatusChip>
                      <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                        {featuredReservation.date}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <ChefAvatar
                        alt={featuredReservation.chef}
                        className="h-[44px] w-[44px] rounded-[14px]"
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

                  <div className="shrink-0 rounded-[8px] bg-[var(--tb-color-surface-muted)] px-3 py-2 text-right">
                    <p className="text-[11px] font-medium text-[var(--tb-color-text-hint)]">
                      match
                    </p>
                    <p className="mt-1 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                      {featuredReservation.matchRate}%
                    </p>
                  </div>
                </div>

                <h2 className="text-[18px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
                  {featuredSummary.headline}
                </h2>

                <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
                  {featuredReservation.diningPromise}
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
                      셰프가 참고하는 포인트
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
                title={needsMeasurementRefresh ? '예약 개인화 정확도 업데이트 추천' : '현재 컨디션 반영하기'}
                description={
                  needsMeasurementRefresh
                    ? `${measurementAgeLabel} 데이터예요. 예약 전에 갱신해두면 셰프용 캘리브레이션 가이드가 이번 식사에 더 잘 맞아져요.`
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
