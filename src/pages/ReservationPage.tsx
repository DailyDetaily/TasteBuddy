import { useState } from 'react';
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
import SectionTitle from '../components/system/SectionTitle';
import StatusChip from '../components/system/StatusChip';
import TasteChip from '../components/system/TasteChip';
import {
  createDiningFeedbackDraft,
  getDiningFeedbackScenario,
  type DiningFeedbackDraft,
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
import { COLOR_TOKENS } from '../constants/designTokens';

import chefHwangJeongin from '../assets/HwangJeongin.png';
import chefLeeEunji from '../assets/LeeEunji.png';
import chefLimJeongsik from '../assets/LimJeongsik.png';

type ReservationStatus = 'upcoming' | 'preparing' | 'ready' | 'completed';
type ReservationView = 'detail' | 'feedback' | 'analysis';

interface Reservation {
  id: number;
  restaurant: string;
  chef: string;
  chefImage: string;
  date: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  course: string;
  matchRate: number;
  tcsStatus: string;
  adjustments: { taste: string; change: string }[];
  diningPromise: string;
  guestUnderstanding: string;
  timeline: { step: string; done: boolean; current?: boolean }[];
}

const reservations: Reservation[] = [
  {
    id: 1,
    restaurant: '레스토랑 베누',
    chef: '황정인',
    chefImage: chefHwangJeongin,
    date: '2025.03.15',
    time: '저녁 7:00',
    guests: 2,
    status: 'preparing',
    course: '시그니처 디너 코스',
    matchRate: 75,
    tcsStatus: '셰프가 보정 전략을 준비 중입니다',
    adjustments: [
      { taste: '감칠맛', change: '+12%' },
      { taste: '짠맛', change: '-8%' },
    ],
    diningPromise:
      '코스의 중심 풍미는 살리되, 피니시는 조금 더 또렷하게 정리해 황정인 셰프의 의도가 더 자연스럽게 전달되도록 준비 중입니다.',
    guestUnderstanding:
      '지금의 프로필은 깊이감은 즐기지만 마무리가 무거워지면 만족이 떨어질 수 있다는 점을 보여줘요.',
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: true },
      { step: '셰프 TCS 준비', done: false, current: true },
      { step: '사전 미각 측정', done: false },
      { step: '다이닝 당일', done: false },
    ],
  },
  {
    id: 2,
    restaurant: '숍 리제 (Lysée)',
    chef: '이은지',
    chefImage: chefLeeEunji,
    date: '2025.03.22',
    time: '저녁 6:30',
    guests: 2,
    status: 'upcoming',
    course: '봄 시즌 테이스팅 코스',
    matchRate: 72,
    tcsStatus: '예약이 확정되었습니다',
    adjustments: [
      { taste: '단맛', change: '+15%' },
      { taste: '신맛', change: '+5%' },
    ],
    diningPromise:
      '디저트와 피니시 코스에서 단맛과 산미의 균형이 더 잘 맞도록, 이은지 셰프가 전달 강도를 조율할 수 있는 상태예요.',
    guestUnderstanding:
      '지금의 프로필은 부드러운 단맛은 좋아하지만 마무리에 선명한 정리감이 함께 있을 때 더 만족할 가능성을 보여줘요.',
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: false, current: true },
      { step: '셰프 TCS 준비', done: false },
      { step: '사전 미각 측정', done: false },
      { step: '다이닝 당일', done: false },
    ],
  },
  {
    id: 3,
    restaurant: '정식당',
    chef: '임정식',
    chefImage: chefLimJeongsik,
    date: '2025.02.28',
    time: '저녁 7:30',
    guests: 4,
    status: 'completed',
    course: '한식 모던 코스',
    matchRate: 70,
    tcsStatus: '다이닝이 완료되었습니다',
    adjustments: [
      { taste: '감칠맛', change: '+10%' },
      { taste: '지방맛', change: '+7%' },
    ],
    diningPromise:
      '메인 코스의 밀도와 발효 감칠맛이 더 자연스럽게 이어지도록 프로필이 반영된 다이닝이었습니다.',
    guestUnderstanding:
      '당시 프로필은 중심 풍미가 살아 있는 코스에서 만족이 높고, 후반 무게감은 더 섬세한 정리가 필요하다는 방향을 보여줬어요.',
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: true },
      { step: '셰프 TCS 준비', done: true },
      { step: '사전 미각 측정', done: true },
      { step: '다이닝 완료', done: true },
    ],
  },
];

const statusConfig: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: '예약 확정', color: '#3F3F3F', bg: '#F3F3F3' },
  preparing: {
    label: 'TCS 준비 중',
    color: COLOR_TOKENS.state.warning,
    bg: COLOR_TOKENS.state.warningSoft,
  },
  ready: {
    label: '준비 완료',
    color: COLOR_TOKENS.state.success,
    bg: COLOR_TOKENS.state.successSoft,
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

function getAdjustmentDirection(change: string) {
  return change.trim().startsWith('-') ? '낮추고' : '살리고';
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
    return `${adjustment.taste} 포인트는 ${adjustment.change} 방향으로 ${getAdjustmentDirection(adjustment.change)} ${matchingAxis.label} 인상이 더 자연스럽게 전달되도록 참고합니다.`;
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
          <span className="font-bold text-[14px] text-[#0f0f0f]">{reservation.restaurant}</span>
        </div>
        <ChevronRight size={16} className="text-[#AFAFAF]" />
      </div>

      {/* 셰프 정보 */}
      <div className="flex items-center gap-3 w-full">
        <img
          src={reservation.chefImage}
          alt={reservation.chef}
          className="w-[40px] h-[40px] rounded-[8px] object-cover"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-[13px] text-[#0f0f0f]">{reservation.chef} 셰프</span>
          <span className="text-[11px] text-[rgba(15,15,15,0.5)]">매칭률 {reservation.matchRate}%</span>
        </div>
      </div>

      {/* 예약 정보 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 w-full">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-[rgba(15,15,15,0.4)]" />
          <span className="text-[11px] text-[rgba(15,15,15,0.6)]">{reservation.date} {reservation.time}</span>
        </div>
        <div className="flex items-center gap-1">
          <Utensils size={12} className="text-[rgba(15,15,15,0.4)]" />
          <span className="text-[11px] text-[rgba(15,15,15,0.6)]">{reservation.course}</span>
        </div>
      </div>

      {/* TCS 상태 */}
      <div className="flex items-center gap-2 w-full rounded-[12px] bg-[var(--tb-color-surface-muted)] px-3 py-2">
        <Activity size={14} style={{ color: status.color }} />
        <span className="text-[12px] text-[#0f0f0f]">{reservation.tcsStatus}</span>
      </div>

      <p className="w-full text-[12px] leading-relaxed text-[rgba(15,15,15,0.6)]">
        {reservation.diningPromise}
      </p>

      {/* 예상 보정 태그 */}
      <div className="flex gap-2 flex-wrap">
        {reservation.adjustments.map((adj, idx) => (
          <TasteChip
            key={idx}
            taste={adj.taste}
            value={adj.change}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function ReservationDetail({
  feedbackSubmitted,
  measurementSnapshot,
  onBack,
  onOpenAnalysis,
  onOpenFeedback,
  onStartMeasurement,
  reservation,
}: {
  feedbackSubmitted: boolean;
  measurementSnapshot: TasteMeasurementSnapshot;
  onBack: () => void;
  onOpenAnalysis: () => void;
  onOpenFeedback: () => void;
  onStartMeasurement: () => void;
  reservation: Reservation;
}) {
  const status = statusConfig[reservation.status];
  const feedbackScenario = getDiningFeedbackScenario(reservation.id);
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
        <div className="flex flex-col gap-[24px] p-[20px]">
          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <StatusChip color="#0F0F0F" backgroundColor="white">
                    Personalized Dining
                  </StatusChip>
                  <SectionTitle size="md">{personalizationSummary.headline}</SectionTitle>
                </div>
                <span className="text-[12px] font-semibold text-[rgba(15,15,15,0.45)]">
                  매칭률 {reservation.matchRate}%
                </span>
              </div>

              <p className="text-[13px] leading-relaxed text-[rgba(15,15,15,0.6)]">
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
                <p className="text-[11px] font-semibold text-[rgba(15,15,15,0.45)]">이번 예약에서 달라지는 점</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#0f0f0f]">
                  {reservation.diningPromise}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* 셰프 + 상태 */}
          <div className="flex items-center gap-4">
            <img
              src={reservation.chefImage}
              alt={reservation.chef}
              className="w-[56px] h-[56px] rounded-[14px] object-cover"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[18px]">{reservation.chef} 셰프</span>
                <StatusChip color={status.color} backgroundColor={status.bg}>
                  {status.label}
                </StatusChip>
              </div>
              <span className="text-[13px] text-[rgba(15,15,15,0.5)]">
                {reservation.course} · {reservation.guests}명
              </span>
            </div>
          </div>

          {/* 예약 정보 카드 */}
          <SectionCard>
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#3F3F3F]" />
                <span className="text-[14px] font-medium">{reservation.date} {reservation.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#3F3F3F]" />
                <span className="text-[14px] font-medium">{reservation.restaurant}</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils size={16} className="text-[#3F3F3F]" />
                <span className="text-[14px] font-medium">{reservation.course}</span>
              </div>
            </div>
          </SectionCard>

          <div>
            <SectionTitle className="mb-3">프로필 기반 예약 개인화</SectionTitle>
            <SectionCard hoverEffect={false}>
              <div className="flex flex-col gap-4 w-full">
                <p className="text-[13px] leading-relaxed text-[rgba(15,15,15,0.6)]">
                  Taste Buddy는 레시피를 바꾸라고 지시하지 않고, 현재 프로필이 더 편안하게 받아들일 수 있는 전달 강도와 마무리 방향을 셰프가 참고할 수 있게 정리합니다.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                    <p className="text-[11px] font-semibold text-[rgba(15,15,15,0.45)]">게스트 관점</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#0f0f0f]">
                      코스가 내 현재 입맛과 더 자연스럽게 연결되도록 준비된다는 뜻이에요.
                    </p>
                  </div>
                  <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                    <p className="text-[11px] font-semibold text-[rgba(15,15,15,0.45)]">셰프 관점</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#0f0f0f]">
                      셰프는 코스의 의도는 유지한 채, 어느 포인트를 더 선명하게 전달하고 어디를 더 부드럽게 정리할지 참고할 수 있어요.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* 다이닝 타임라인 */}
          <div>
            <SectionTitle className="mb-4">다이닝 타임라인</SectionTitle>
            <div className="flex flex-col gap-0">
              {reservation.timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {step.done ? (
                      <CheckCircle2 size={20} className="text-[#0f0f0f] shrink-0" />
                    ) : step.current ? (
                      <div className="relative">
                        <Circle size={20} className="text-[#3F3F3F] shrink-0" />
                        <div className="absolute inset-[4px] rounded-full bg-[#3F3F3F] animate-pulse-soft" />
                      </div>
                    ) : (
                      <Circle size={20} className="text-[#e0e0e0] shrink-0" />
                    )}
                    {idx < reservation.timeline.length - 1 && (
                      <div className={`w-[2px] h-[28px] ${step.done ? 'bg-[#0f0f0f]' : 'bg-[#e0e0e0]'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <span className={`text-[14px] ${step.current ? 'font-bold text-[#0f0f0f]' : step.done ? 'font-medium text-[#0f0f0f]' : 'font-medium text-[#AFAFAF]'}`}>
                      {step.step}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 셰프용 캘리브레이션 요약 */}
          <div>
            <SectionTitle className="mb-3">셰프용 캘리브레이션 요약</SectionTitle>
            <SectionCard hoverEffect={false}>
              <div className="flex flex-col gap-4 w-full">
                <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                  <p className="text-[11px] font-semibold text-[rgba(15,15,15,0.45)]">
                    Recommendation logic
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#0f0f0f]">
                    {personalizationSummary.recommendationLogic}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {personalizationSummary.chefGuidance.map((guidance) => (
                    <div
                      key={guidance}
                      className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3"
                    >
                      <p className="text-[13px] leading-relaxed text-[#0f0f0f]">{guidance}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 w-full mt-1">
                  <p className="text-[12px] font-semibold text-[rgba(15,15,15,0.5)]">
                    이번 예약에서 참고 중인 조정 포인트
                  </p>
                {reservation.adjustments.map((adj, idx) => {
                  const color = getTasteColor(adj.taste);
                  const value = parseInt(adj.change);
                  const absValue = Math.abs(value);
                  return (
                    <div key={idx} className="flex items-center gap-3 w-full">
                      <div className="w-[6px] h-[32px] rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-medium text-[14px] text-[#0f0f0f] w-[50px]">{adj.taste}</span>
                      <div className="flex-1 h-[8px] bg-[#e8e8e8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full animate-grow"
                          style={{
                            width: `${absValue * 5}%`,
                            backgroundColor: color,
                            animationDelay: `${idx * 200}ms`,
                            animationFillMode: 'both',
                          }}
                        />
                      </div>
                      <span className="font-bold text-[13px] w-[40px] text-right" style={{ color }}>{adj.change}</span>
                    </div>
                  );
                })}
                </div>
              </div>
            </SectionCard>
          </div>

          {reservation.status !== 'completed' && (
            <SectionCard hoverEffect={false}>
              <div className="flex flex-col gap-3 w-full">
                <div>
                  <SectionTitle size="md">다음 액션</SectionTitle>
                  <p className="mt-2 text-[13px] leading-relaxed text-[rgba(15,15,15,0.6)]">
                    {personalizationSummary.nextStepCta}
                  </p>
                </div>
                <PrimaryButton onClick={onStartMeasurement}>
                  {needsMeasurementRefresh ? '현재 컨디션 다시 반영하기' : '현재 프로필 한 번 더 점검하기'}
                </PrimaryButton>
                <p className="text-[11px] leading-relaxed text-[rgba(15,15,15,0.45)]">
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
                  <p className="text-[13px] leading-relaxed text-[rgba(15,15,15,0.6)]">
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
                    className="self-center text-[12px] font-semibold text-[rgba(15,15,15,0.58)]"
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
  measurementSnapshot: TasteMeasurementSnapshot;
  onStartMeasurement: () => void;
}

export default function ReservationPage({
  measurementSnapshot,
  onStartMeasurement,
}: ReservationPageProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedView, setSelectedView] = useState<ReservationView>('detail');
  const [feedbackByReservationId, setFeedbackByReservationId] = useState<Record<number, DiningFeedbackDraft>>({});
  const selectedReservation = reservations.find(r => r.id === selectedId);
  const selectedScenario = selectedReservation ? getDiningFeedbackScenario(selectedReservation.id) : null;
  const activeFeedbackDraft =
    selectedReservation && selectedScenario
      ? feedbackByReservationId[selectedReservation.id] ?? createDiningFeedbackDraft(selectedScenario)
      : null;

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
          onSubmit={() => {
            setFeedbackByReservationId((current) => ({
              ...current,
              [selectedReservation.id]: activeFeedbackDraft ?? createDiningFeedbackDraft(selectedScenario),
            }));
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

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <TopAppBar onStartMeasurement={onStartMeasurement} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col gap-8 p-5 animate-fadeIn">
          <h1 className="font-bold text-[18px] text-[#0f0f0f] tracking-[-0.24px]">다이닝 예약</h1>

          {featuredReservation && featuredSummary && (
            <SectionCard hoverEffect={false}>
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <StatusChip color="#0F0F0F" backgroundColor="white">
                      Reservation Personalization
                    </StatusChip>
                    <h2 className="mt-3 text-[20px] font-bold leading-tight text-[#0f0f0f]">
                      {featuredSummary.headline}
                    </h2>
                  </div>
                  <span className="text-[12px] font-semibold text-[rgba(15,15,15,0.45)]">
                    {featuredReservation.chef} 셰프
                  </span>
                </div>

                <p className="text-[13px] leading-relaxed text-[rgba(15,15,15,0.6)]">
                  {featuredReservation.diningPromise}
                </p>

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
                    className="self-center text-[12px] font-semibold text-[rgba(15,15,15,0.58)]"
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

          {/* 다가오는 예약 */}
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionTitle as="h3" size="md" className="font-semibold text-[rgba(15,15,15,0.5)]">다가오는 다이닝</SectionTitle>
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
            </div>
          )}

          {/* 지난 예약 */}
          {completed.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionTitle as="h3" size="md" className="font-semibold text-[rgba(15,15,15,0.5)]">지난 다이닝</SectionTitle>
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
            </div>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
