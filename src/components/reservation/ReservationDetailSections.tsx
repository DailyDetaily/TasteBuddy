import React from 'react';
import {
  MapPin as MapPinIcon,
  Clock as ClockIcon,
  Utensils as UtensilsIcon,
  CircleCheck as CircleCheckIcon,
  Circle as CircleIcon
} from 'lucide-react';

import type {
  ReservationAdjustment,
  ReservationRecord,
  ReservationTimelineStep,
} from '../../constants/reservationCatalog';
import { ICON_TOKENS } from '../../constants/designTokens';
import { getTasteColor } from '../../constants/tasteColors';
import {
  formatMeasurementDate,
  type TasteMeasurementEntry,
} from '../../constants/tasteMeasurementData';
import SectionCard from '../SectionCard';
import ChefAvatar from '../system/ChefAvatar';
import PageSection from '../system/PageSection';
import PrimaryButton from '../system/PrimaryButton';
import SectionTitle from '../system/SectionTitle';
import StatusChip from '../system/StatusChip';
import TasteChip from '../system/TasteChip';
import { reservationStatusConfig } from './reservationStatusConfig';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, className, ...props }: any) => (
    <IconComponent
      {...props}
      className={className}
      style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }}
    />
  );
};

const MapPin = wrapIcon(MapPinIcon);
const Clock = wrapIcon(ClockIcon);
const Utensils = wrapIcon(UtensilsIcon);
const CheckCircle2 = wrapIcon(CircleCheckIcon);
const Circle = wrapIcon(CircleIcon);

export interface ReservationPersonalizationSummary {
  chefGuidance: string[];
  guestMessage: string;
  headline: string;
  nextStepCta: string;
  primary: TasteMeasurementEntry[];
  recommendationLogic: string;
  softest: TasteMeasurementEntry;
}

interface ReservationPersonalizationHeroProps {
  diningPromise: string;
  summary: ReservationPersonalizationSummary;
}

export function ReservationPersonalizationHero({
  diningPromise,
  summary,
}: ReservationPersonalizationHeroProps) {
  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <StatusChip
              color="var(--tb-color-text-primary)"
              backgroundColor="var(--tb-color-surface-base)"
            >
              Personalized Dining
            </StatusChip>
            <SectionTitle size="md">{summary.headline}</SectionTitle>
          </div>
          <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
            프로필 반영 중
          </span>
        </div>

        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
          {summary.guestMessage}
        </p>

        <div className="flex flex-wrap gap-2">
          {summary.primary.map((entry) => (
            <TasteChip key={entry.id} taste={entry.label} value="현재 더 또렷한 포인트" />
          ))}
          <TasteChip
            taste={summary.softest.label}
            value="천천히 이어지는 포인트"
          />
        </div>

        <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
          <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
            이번 예약에서 달라지는 점
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
            {diningPromise}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

interface ReservationChefSummaryProps {
  reservation: ReservationRecord;
}

export function ReservationChefSummary({
  reservation,
}: ReservationChefSummaryProps) {
  const status = reservationStatusConfig[reservation.status];

  return (
    <>
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
            <span className="text-[18px] font-bold">{reservation.chef} 셰프</span>
            <StatusChip color={status.color} backgroundColor={status.bg}>
              {status.label}
            </StatusChip>
          </div>
          <span className="text-[14px] text-[var(--tb-color-text-subtle)]">
            {reservation.course} · {reservation.guests}명
          </span>
        </div>
      </div>

      <SectionCard>
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-2">
            <Clock
              size={ICON_TOKENS.size.md}
              className="text-[var(--tb-color-text-secondary)]"
            />
            <span className="text-[14px] font-medium">
              {reservation.date} {reservation.time}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin
              size={ICON_TOKENS.size.md}
              className="text-[var(--tb-color-text-secondary)]"
            />
            <span className="text-[14px] font-medium">{reservation.restaurant}</span>
          </div>
          <div className="flex items-center gap-2">
            <Utensils
              size={ICON_TOKENS.size.md}
              className="text-[var(--tb-color-text-secondary)]"
            />
            <span className="text-[14px] font-medium">{reservation.course}</span>
          </div>
        </div>
      </SectionCard>
    </>
  );
}

export function ReservationDiningInterpretationSection() {
  return (
    <PageSection title="프로필 기반 예약 개인화">
      <SectionCard hoverEffect={false}>
        <div className="flex w-full flex-col gap-4">
          <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
            Taste Buddy는 레시피를 바꾸라고 지시하지 않고, 현재 프로필이 더 편안하게
            받아들여질 수 있는 방향을 매장과 주방이 참고할 수 있게 정리합니다.
          </p>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                게스트 관점
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                코스가 내 현재 입맛과 더 자연스럽게 연결되도록 준비된다는 뜻이에요.
              </p>
            </div>
            <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                매장 전달 포인트
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                파인다이닝에서는 셰프용 가이드로, 일반 매장에서는 메뉴 추천과 간 방향
                참고용으로 같은 기준을 쓸 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageSection>
  );
}

interface ReservationTimelineSectionProps {
  timeline: ReservationTimelineStep[];
}

export function ReservationTimelineSection({
  timeline,
}: ReservationTimelineSectionProps) {
  return (
    <PageSection title="다이닝 타임라인">
      <div className="flex flex-col gap-0">
        {timeline.map((step, index) => (
          <div key={`${step.step}-${index}`} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              {step.done ? (
                <CheckCircle2
                  size={ICON_TOKENS.size.md}
                  className="shrink-0 text-[var(--tb-color-text-primary)]"
                />
              ) : step.current ? (
                <div className="relative">
                  <Circle
                    size={ICON_TOKENS.size.md}
                    className="shrink-0 text-[var(--tb-color-text-secondary)]"
                  />
                  <div className="absolute inset-[4px] rounded-full bg-[var(--tb-color-icon-primary)] animate-pulse-soft" />
                </div>
              ) : (
                <Circle size={ICON_TOKENS.size.md} className="shrink-0 text-[#e0e0e0]" />
              )}
              {index < timeline.length - 1 ? (
                <div
                  className={`h-[28px] w-[2px] ${
                    step.done
                      ? 'bg-[var(--tb-color-text-primary)]'
                      : 'bg-[var(--tb-color-border-disabled)]'
                  }`}
                />
              ) : null}
            </div>
            <div className="pb-6">
              <span
                className={`text-[14px] ${
                  step.current
                    ? 'font-bold text-[var(--tb-color-text-primary)]'
                    : step.done
                      ? 'font-medium text-[var(--tb-color-text-primary)]'
                      : 'font-medium text-[var(--tb-color-text-disabled)]'
                }`}
              >
                {step.step}
              </span>
            </div>
          </div>
        ))}
      </div>
    </PageSection>
  );
}

interface ReservationChefCalibrationSectionProps {
  adjustments: ReservationAdjustment[];
  chefGuidance: string[];
  recommendationLogic: string;
}

export function ReservationChefCalibrationSection({
  adjustments,
  chefGuidance,
  recommendationLogic,
}: ReservationChefCalibrationSectionProps) {
  return (
    <PageSection title="셰프용 캘리브레이션 요약">
      <SectionCard hoverEffect={false}>
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
              매장 공통 한 줄 가이드
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
              {recommendationLogic}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {chefGuidance.map((guidance) => (
              <div
                key={guidance}
                className="rounded-[12px] bg-[var(--tb-color-surface-muted)] px-4 py-3"
              >
                <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                  {guidance}
                </p>
              </div>
            ))}
          </div>

          {adjustments.length > 0 ? (
            <div className="mt-1 flex w-full flex-col gap-3">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                이번 예약에서 참고 중인 조정 포인트
              </p>
              {adjustments.map((adjustment, index) => {
                const color = getTasteColor(adjustment.taste);

                return (
                  <div
                    key={`${adjustment.taste}-${adjustment.direction}-${index}`}
                    className="flex w-full items-center gap-3"
                  >
                    <div
                      className="h-[32px] w-[6px] rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="w-[50px] text-[14px] font-medium text-[var(--tb-color-text-primary)]">
                      {adjustment.taste}
                    </span>
                    <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[var(--tb-color-border-subtle)]">
                      <div
                        className="h-full rounded-full animate-grow"
                        style={{
                          width: '60%',
                          backgroundColor: color,
                          animationDelay: `${index * 200}ms`,
                          animationFillMode: 'both',
                        }}
                      />
                    </div>
                    <span
                      className="w-[56px] text-right text-[14px] font-bold"
                      style={{ color }}
                    >
                      {adjustment.direction}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </SectionCard>
    </PageSection>
  );
}

interface ReservationPendingActionCardProps {
  isBroadStarterProfile: boolean;
  measurementAgeLabel: string;
  measurementSnapshotMeasuredAt: string;
  needsMeasurementRefresh: boolean;
  nextStepCta: string;
  onStartMeasurement: () => void;
}

export function ReservationPendingActionCard({
  isBroadStarterProfile,
  measurementAgeLabel,
  measurementSnapshotMeasuredAt,
  needsMeasurementRefresh,
  nextStepCta,
  onStartMeasurement,
}: ReservationPendingActionCardProps) {
  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-3">
        <div>
          <SectionTitle size="md">다음 액션</SectionTitle>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
            {nextStepCta}
          </p>
        </div>
        <PrimaryButton onClick={onStartMeasurement}>
          {needsMeasurementRefresh ? '현재 컨디션 다시 반영하기' : '현재 프로필 한 번 더 점검하기'}
        </PrimaryButton>
        <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          마지막 측정 {formatMeasurementDate(measurementSnapshotMeasuredAt)} · {measurementAgeLabel}
          {isBroadStarterProfile ? ' · 질문 기반 스타터 프로필' : ''}
        </p>
      </div>
    </SectionCard>
  );
}

interface ReservationCompletedFeedbackCardProps {
  feedbackSubmitted: boolean;
  onOpenAnalysis: () => void;
  onOpenFeedback: () => void;
}

export function ReservationCompletedFeedbackCard({
  feedbackSubmitted,
  onOpenAnalysis,
  onOpenFeedback,
}: ReservationCompletedFeedbackCardProps) {
  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SectionTitle size="md">다음 다이닝을 위한 식후 피드백</SectionTitle>
          <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
            짧게 남겨주신 인상은 이번 다이닝에서 무엇이 잘 맞았는지 배우고, 다음 예약과
            셰프용 캘리브레이션을 더 정교하게 만드는 데 바로 반영됩니다.
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
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
  );
}
