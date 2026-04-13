import React from 'react';

import TopAppBar from '../../src/components/TopAppBar';
import SectionCard from '../../src/components/SectionCard';
import SectionTitle from '../../src/components/system/SectionTitle';
import StatusChip from '../../src/components/system/StatusChip';
import TasteChip from '../../src/components/system/TasteChip';
import ProfileConfidenceCard, {
  type ProfileConfidenceStage,
} from '../../src/components/system/ProfileConfidenceCard';
import TasteMeasurementMiniCta from '../../src/components/measurement/TasteMeasurementMiniCta';
import {
  type TasteMeasurementSnapshot,
  getTasteMeasurementEntries,
  isTasteMeasurementStale,
  getTasteMeasurementAgeLabel,
  formatMeasurementDate,
  type TasteMeasurementEntry,
} from '../../src/constants/tasteMeasurementData';
import { TASTE_TOKENS } from '../../src/constants/designTokens';
import {
  TASTE_COLORS,
  getTasteTint,
  getTasteTintSurface,
  getTasteTintSurfaceSubText,
} from '../../src/constants/tasteColors';

import chefHwangJeongin from '../../src/assets/HwangJeongin.png';
import chefLeeEunji from '../../src/assets/LeeEunji.png';
import chefLimJeongsik from '../../src/assets/LimJeongsik.png';
import chefHyunseokChoi from '../../src/assets/HyunseokChoi.png';
import chefSonJongwon from '../../src/assets/SonJongwon.png';
import chefLeeJun from '../../src/assets/LeeJun.png';

interface ReservationAdjustment {
  direction: string;
  taste: string;
}

interface ReservationRecord {
  adjustments: ReservationAdjustment[];
  chef: string;
  chefImage: string | null;
  course: string;
  date: string;
  diningPromise: string;
  guests: number;
  guestUnderstanding: string;
  id: number;
  matchRate: number;
  restaurant: string;
  status: 'upcoming' | 'preparing' | 'ready' | 'completed';
  tcsStatus: string;
  time: string;
}

interface ReservationPersonalizationSummary {
  chefGuidance: string[];
  guestMessage: string;
  headline: string;
  nextStepCta: string;
  primary: TasteMeasurementEntry[];
  recommendationLogic: string;
  softest: TasteMeasurementEntry;
}

interface ChefCard {
  chef: string;
  image: string | null;
  match: number;
  restaurant: string;
  tasteId: keyof typeof TASTE_TOKENS;
}

const PREVIEW_RESERVATION: ReservationRecord = {
  id: 1,
  restaurant: '이타닉가든',
  chef: '손종원',
  chefImage: chefSonJongwon,
  date: '2026.04.18',
  time: '저녁 7:00',
  guests: 2,
  status: 'preparing',
  course: '스프링 시그니처 디너',
  matchRate: 91,
  tcsStatus: '셰프가 맞춤화 포인트를 정리 중입니다',
  adjustments: [
    { taste: '단맛', direction: '살리기' },
    { taste: '신맛', direction: '정리하기' },
  ],
  diningPromise:
    '해산물 중심의 깊이를 유지하면서도 피니시는 더 가볍고 또렷하게 정리되도록 코스 리듬을 맞추고 있어요.',
  guestUnderstanding:
    '현재 프로필은 단맛과 산미가 분명하게 살아날 때 만족이 높고, 감칠맛은 한 번에 몰아주기보다 여운 있게 이어질 때 더 편안할 가능성을 보여줘요.',
};

const PREVIEW_CHEFS: ChefCard[] = [
  {
    chef: '손종원',
    image: chefSonJongwon,
    match: 96,
    restaurant: '이타닉가든',
    tasteId: 'umami',
  },
  {
    chef: '이은지',
    image: chefLeeEunji,
    match: 92,
    restaurant: '리제',
    tasteId: 'sweet',
  },
  {
    chef: '임정식',
    image: chefLimJeongsik,
    match: 88,
    restaurant: '정식당',
    tasteId: 'salty',
  },
  {
    chef: '최현석',
    image: chefHyunseokChoi,
    match: 84,
    restaurant: '쵸이닷',
    tasteId: 'fat',
  },
  {
    chef: '황정인',
    image: chefHwangJeongin,
    match: 81,
    restaurant: '레스토랑 베누',
    tasteId: 'bitter',
  },
  {
    chef: '이준',
    image: chefLeeJun,
    match: 79,
    restaurant: '에빗',
    tasteId: 'sour',
  },
];

function buildReservationPersonalizationSummary(
  measurementSnapshot: TasteMeasurementSnapshot,
  reservation: ReservationRecord,
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
    recommendationLogic: `${topTasteLabels}이 현재 더 또렷하게 반응하는 포인트로 읽히고, ${softest.label}은 한 번에 강하게 밀기보다 여유 있게 연결될 때 더 편안할 가능성이 있어요.`,
  };
}

function deriveProfileConfidenceStage(measurementCount: number): ProfileConfidenceStage {
  if (measurementCount >= 4) return 'Refined';
  if (measurementCount >= 2) return 'Building';
  return 'Starter';
}

function getRecentChangeSummary(measurementSnapshot: TasteMeasurementSnapshot): string {
  const entries = getTasteMeasurementEntries(measurementSnapshot);
  const biggestDeltaTaste = entries.reduce((biggestDelta, entry) =>
    Math.abs(entry.deltaMm) > Math.abs(biggestDelta.deltaMm) ? entry : biggestDelta,
  );

  if (Math.abs(biggestDeltaTaste.deltaMm) < 0.5) {
    return '현재 프로필은 안정적인 상태를 유지하고 있어요.';
  }

  const direction = biggestDeltaTaste.deltaMm > 0 ? '빠르게 적응하는' : '부드럽게 연결되는';
  return `최근 측정에서 ${biggestDeltaTaste.label}이(가) 더 ${direction} 패턴이 관찰됐어요.`;
}

interface StaticHomePageProps {
  measurementCount: number;
  measurementSnapshot: TasteMeasurementSnapshot;
}

export default function StaticHomePage({
  measurementCount,
  measurementSnapshot,
}: StaticHomePageProps) {
  const featuredSummary = buildReservationPersonalizationSummary(
    measurementSnapshot,
    PREVIEW_RESERVATION,
  );
  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const confidenceStage = deriveProfileConfidenceStage(measurementCount);
  const recentChangeText = getRecentChangeSummary(measurementSnapshot);

  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
      <TopAppBar
        onStartMeasurement={() => undefined}
        onOpenNotifications={() => undefined}
        onOpenMenu={() => undefined}
        hasUnreadNotifications
      />

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col gap-6 p-5 animate-fadeIn">
          <div className="flex flex-col gap-3">
            <SectionTitle as="h2" size="md">
              다음 다이닝 준비
            </SectionTitle>
            <SectionCard hoverEffect={false}>
              <div className="flex w-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip color="#0F0F0F" backgroundColor="var(--tb-color-surface-muted)">
                        Chef-ready Personalization
                      </StatusChip>
                      <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                        {PREVIEW_RESERVATION.date}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={PREVIEW_RESERVATION.chefImage ?? ''}
                        alt={PREVIEW_RESERVATION.chef}
                        className="h-[44px] w-[44px] rounded-[14px] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-[var(--tb-color-text-hint)]">
                          {PREVIEW_RESERVATION.restaurant}
                        </p>
                        <p className="truncate text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                          {PREVIEW_RESERVATION.chef} 셰프
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className="text-[18px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
                  {featuredSummary.headline}
                </h2>

                <div className="rounded-[8px] bg-[var(--tb-color-surface-muted)] px-4 py-3">
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                    이번 식사에서 달라지는 점
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                    {featuredSummary.guestMessage}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {featuredSummary.primary.map((entry) => (
                    <TasteChip key={entry.id} taste={entry.label} value="메인 타겟" />
                  ))}
                  <TasteChip taste={featuredSummary.softest.label} value="서브 밸런스" />
                </div>
              </div>
            </SectionCard>
          </div>

          <ProfileConfidenceCard
            stage={confidenceStage}
            measurementAgeLabel={measurementAgeLabel}
            measurementCount={measurementCount}
            needsMeasurementRefresh={needsMeasurementRefresh}
            strongestTasteLabel={
              getTasteMeasurementEntries(measurementSnapshot).reduce((a, b) =>
                a.valueMm > b.valueMm ? a : b,
              ).label
            }
            weakestTasteLabel={
              getTasteMeasurementEntries(measurementSnapshot).reduce((a, b) =>
                a.valueMm < b.valueMm ? a : b,
              ).label
            }
          />

          <div>
            <SectionTitle as="h3" size="md" className="mb-3">
              셰프 매칭
            </SectionTitle>
            <div className="mx-[-20px] flex w-[calc(100%+40px)] gap-[10px] overflow-x-auto no-scrollbar px-[20px] pb-4 pt-2">
              {PREVIEW_CHEFS.map((chef, index) => {
                const dominantTasteLabel = TASTE_TOKENS[chef.tasteId].label;
                const colors = TASTE_COLORS[dominantTasteLabel];
                const tintSurfaceTextColor = `var(--tb-taste-${chef.tasteId}-tint-surface-text)`;
                const tintSurfaceSubTextColor = `var(--tb-taste-${chef.tasteId}-tint-surface-sub-text)`;

                return (
                  <div
                    key={`${chef.chef}-${index}`}
                    className="box-border flex h-[132px] w-[132px] shrink-0 flex-col gap-[12px] overflow-clip rounded-[20px] p-[12px]"
                    style={{
                      backgroundColor: getTasteTintSurface(dominantTasteLabel),
                      border: `1px solid ${getTasteTint(dominantTasteLabel, 0.18)}`,
                    }}
                  >
                    <div className="relative flex h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[8px] bg-[var(--tb-color-surface-muted)]">
                      <img
                        alt={`${chef.chef} 셰프`}
                        className="absolute inset-0 h-full w-full object-cover"
                        src={chef.image ?? ''}
                      />
                    </div>

                    <div className="flex grow flex-col justify-between">
                      <div className="flex flex-col gap-[2px]">
                        <p
                          className="w-full truncate text-[14px] font-bold"
                          style={{ color: tintSurfaceTextColor }}
                        >
                          {chef.chef} 셰프
                        </p>
                        <p
                          className="w-full truncate text-[10px] font-normal"
                          style={{
                            color:
                              tintSurfaceSubTextColor ||
                              getTasteTintSurfaceSubText(dominantTasteLabel),
                          }}
                        >
                          {chef.restaurant}
                        </p>
                      </div>
                      <p className="text-[10px] font-semibold text-[var(--tb-color-text-primary)]">
                        매칭률 {chef.match}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <SectionTitle as="h3" size="md" className="mb-3">
              최근 프로필 변화
            </SectionTitle>
            <SectionCard>
              <div className="flex w-full flex-col gap-1">
                <p className="text-[14px] font-medium text-[var(--tb-color-text-primary)]">
                  {recentChangeText}
                </p>
                <span className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">
                  가장 최근 다이닝 피드백과 측정을 통해 반영된 내용이에요.
                </span>
              </div>
            </SectionCard>
          </div>

          <TasteMeasurementMiniCta
            title={needsMeasurementRefresh ? '미각 갱신 추천' : '현재 프로필 반영 완료'}
            description={
              needsMeasurementRefresh
                ? `${measurementAgeLabel} 데이터예요. 예약 전에 갱신해두면 셰프용 캘리브레이션 가이드가 더 정밀해집니다.`
                : '가장 최근 입맛 상태가 반영되어 있습니다. 다시 측정할 수도 있어요.'
            }
            meta={`마지막 측정 ${formatMeasurementDate(measurementSnapshot.measuredAt)}`}
            actionLabel={needsMeasurementRefresh ? '프로필 업데이트' : '다시 측정'}
            onAction={() => undefined}
            tone={needsMeasurementRefresh ? 'alert' : 'neutral'}
          />

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
