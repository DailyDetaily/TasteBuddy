import SectionCard from '../SectionCard';
import TasteMeasurementMiniCta from '../measurement/TasteMeasurementMiniCta';
import ChefAvatar from '../system/ChefAvatar';
import InspectableComponent, {
  type InspectableNavigateHandler,
} from '../system/InspectableComponent';
import InterpretationCard from '../system/InterpretationCard';
import TCSBadge from '../system/TCSBadge';
import { type ProfileConfidenceStage } from '../system/ProfileConfidenceCard';
import TCSHintCard from '../system/TCSHintCard';
import SectionTitle from '../system/SectionTitle';
import StatusChip from '../system/StatusChip';
import TasteChip from '../system/TasteChip';
import CardScrollList from '../system/CardScrollList';
import ChefMatchCard from './ChefMatchCard';
import { type TasteId } from '../../constants/designTokens';
import { type ReservationRecord, RESERVATION_CATALOG } from '../../constants/reservationCatalog';
import {
  createInitialTasteMeasurementSnapshot,
  formatMeasurementDate,
  getStrongestTasteMeasurement,
  getTasteMeasurementAgeLabel,
  getTasteMeasurementEntries,
  isBroadStarterMeasurementSnapshot,
  isTasteMeasurementStale,
  type TasteMeasurementEntry,
  type TasteMeasurementSnapshot,
} from '../../constants/tasteMeasurementData';
import { type RestaurantReadyGuidance } from '../../constants/quickTasteCalibrationData';
import {
  getTasteColor,
} from '../../constants/tasteColors';
import type { PersonalizedMatchConfidence } from '../../lib/chefMatching';

import { getChefImageByName } from '../../constants/chefImages';

const CURRENT_HOME_PREVIEW_CHEFS: HomeChefMatchCardData[] = [
  {
    chef: '황정인',
    image: getChefImageByName('황정인'),
    match: 75,
    restaurant: '레스토랑 베누',
    tasteId: 'umami',
  },
  {
    chef: '이은지',
    image: getChefImageByName('이은지'),
    match: 72,
    restaurant: '숍 리제 (Lysee)',
    tasteId: 'sweet',
  },
  {
    chef: '임정식',
    image: getChefImageByName('임정식'),
    match: 70,
    restaurant: '정식당',
    tasteId: 'fat',
  },
] as const;

export interface HomeChefMatchCardData {
  chef: string;
  chefAvatarPath?: string | null;
  image: string | null;
  match: number;
  matchConfidence?: PersonalizedMatchConfidence;
  matchReason?: string;
  representativeDishTitle?: string;
  restaurant: string;
  restaurantSlug?: string;
  sourceTasteId?: TasteId;
  tasteId: TasteId;
}

export interface ReservationPersonalizationSummary {
  chefGuidance: string[];
  guestMessage: string;
  headline: string;
  nextStepCta: string;
  primary: TasteMeasurementEntry[];
  recommendationLogic: string;
  softest: TasteMeasurementEntry;
}

export interface HomeCardPreviewData {
  chefCards: HomeChefMatchCardData[];
  confidenceStage: ProfileConfidenceStage;
  featuredReservation: ReservationRecord | null;
  featuredSummary: ReservationPersonalizationSummary | null;
  measurementAgeLabel: string;
  measurementCount: number;
  measurementSnapshot: TasteMeasurementSnapshot;
  needsMeasurementRefresh: boolean;
  recentChangeText: string;
  starterGuidance: RestaurantReadyGuidance | null;
}

interface HomeDiningPreparationCardProps {
  onNavigateToSection?: InspectableNavigateHandler;
  reservation: ReservationRecord;
  summary: ReservationPersonalizationSummary;
}

interface HomeChefMatchStripProps {
  chefCards: HomeChefMatchCardData[];
  fullBleed?: boolean;
  onNavigateToSection?: InspectableNavigateHandler;
  onSelectChefMatch?: (chef: HomeChefMatchCardData) => void;
  showSectionTitle?: boolean;
}

interface HomeCardStackProps
  extends Omit<HomeCardPreviewData, 'confidenceStage' | 'measurementCount'> {
  onNavigateToSection?: InspectableNavigateHandler;
  onSelectChefMatch?: (chef: HomeChefMatchCardData) => void;
  onStartMeasurement: () => void;
  onStartRemeasurement: () => void;
}

export { getChefImageByName } from '../../constants/chefImages';

export function buildReservationPersonalizationSummary(
  measurementSnapshot: TasteMeasurementSnapshot,
  reservation: ReservationRecord,
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
    chefGuidance,
    guestMessage: starterGuidance?.summaryLine ?? reservation.guestUnderstanding,
    headline: starterGuidance
      ? `${reservation.restaurant}에서도 바로 참고할 시작 기준이 준비됐어요.`
      : `${reservation.restaurant} 예약은 ${topTasteLabels} 중심의 현재 프로필을 바탕으로 더 잘 맞춰집니다.`,
    nextStepCta:
      reservation.status === 'completed'
        ? '이번 다이닝 피드백으로 다음 예약을 더 정교하게 만들기'
        : '이 프로필을 이번 예약에 반영해 더 맞춤화된 다이닝 준비하기',
    primary,
    recommendationLogic:
      starterGuidance?.summaryLine ??
      `${topTasteLabels}이 현재 더 또렷하게 반응하는 포인트로 읽히고, ${softest.label}은 한 번에 강하게 밀기보다 여유 있게 연결될 때 더 편안할 가능성이 있어요. 예약 화면의 추천은 이 현재 프로필과 예약 코스 특성을 함께 반영해 정리됩니다.`,
    softest,
  };
}

export function deriveProfileConfidenceStage(
  measurementCount: number,
): ProfileConfidenceStage {
  if (measurementCount >= 4) {
    return 'Refined';
  }

  if (measurementCount >= 2) {
    return 'Building';
  }

  return 'Starter';
}

export function getRecentChangeSummary(
  measurementSnapshot: TasteMeasurementSnapshot,
): string {
  const biggestDeltaTaste = getRecentChangeTasteMeasurement(measurementSnapshot);

  if (Math.abs(biggestDeltaTaste.deltaMm) < 0.5) {
    return '현재 프로필은 안정적인 상태를 유지하고 있어요.';
  }

  const direction =
    biggestDeltaTaste.deltaMm > 0 ? '빠르게 적응하는' : '부드럽게 연결되는';

  return `최근 측정에서 ${biggestDeltaTaste.label}이(가) 더 ${direction} 패턴이 관찰됐어요.`;
}

export function getRecentChangeTasteMeasurement(
  measurementSnapshot: TasteMeasurementSnapshot,
) {
  const entries = getTasteMeasurementEntries(measurementSnapshot);
  return entries.reduce((biggestDelta, entry) =>
    Math.abs(entry.deltaMm) > Math.abs(biggestDelta.deltaMm) ? entry : biggestDelta,
  );
}

export function getCurrentHomeCardPreviewData(): HomeCardPreviewData {
  const measurementSnapshot = createInitialTasteMeasurementSnapshot();
  const featuredReservation =
    RESERVATION_CATALOG.find((reservation) => reservation.status !== 'completed') ??
    RESERVATION_CATALOG[0] ??
    null;
  const measurementCount = 3;

  return {
    chefCards: [...CURRENT_HOME_PREVIEW_CHEFS],
    confidenceStage: deriveProfileConfidenceStage(measurementCount),
    featuredReservation,
    featuredSummary: featuredReservation
      ? buildReservationPersonalizationSummary(measurementSnapshot, featuredReservation, null)
      : null,
    measurementAgeLabel: getTasteMeasurementAgeLabel(measurementSnapshot),
    measurementCount,
    measurementSnapshot,
    needsMeasurementRefresh: isTasteMeasurementStale(measurementSnapshot),
    recentChangeText: getRecentChangeSummary(measurementSnapshot),
    starterGuidance: null,
  };
}

export function HomeDiningPreparationCard({
  onNavigateToSection,
  reservation,
  summary,
}: HomeDiningPreparationCardProps) {
  const reservationStatusLabel =
    reservation.status === 'ready'
      ? '준비 완료'
      : reservation.status === 'preparing'
        ? '셰프 준비 중'
        : '예약 확정';

  return (
    <div className="relative w-full rounded-[20px] bg-white transition-all duration-300">
      <div className="size-full overflow-clip rounded-[inherit]">
        <div className="box-border flex w-full flex-col items-start gap-[12px] p-[12px]">
          <div className="flex w-full items-center gap-2">
            <InspectableComponent
              className="shrink-0"
              componentName="TCSBadge"
              onNavigate={onNavigateToSection}
              sectionId="badges"
            >
              <TCSBadge
                adjustments={reservation.adjustments.map((adjustment, index) => ({
                  change: `${Math.max(6, 12 - index * 2)}%`,
                  taste: adjustment.taste,
                }))}
              />
            </InspectableComponent>
            <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
              {reservation.course}
            </p>
            <InspectableComponent
              className="shrink-0"
              componentName="StatusChip"
              onNavigate={onNavigateToSection}
              sectionId="badges"
            >
              <StatusChip
              >
                {reservationStatusLabel}
              </StatusChip>
            </InspectableComponent>
          </div>

          <div className="flex w-full items-start justify-between gap-[8px]">
            <ChefAvatar
              alt={reservation.chef}
              className="size-[40px] shrink-0 rounded-[8px]"
              iconSize={24}
              imageSrc={reservation.chefImage}
              taste={reservation.adjustments[0]?.taste}
              variant="neutral"
            />
            <div className="grow">
              <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                {reservation.chef} 셰프
              </p>
              <p className="text-[12px] text-[var(--tb-color-text-muted)]">
                {reservation.restaurant}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-start gap-[8px] text-[12px] text-[var(--tb-color-text-muted)]">
            <p className="font-normal">
              {reservation.date} {reservation.time}
            </p>
            <p className="font-normal">• {reservation.guests}인</p>
            <p className="font-normal">• {reservation.tcsStatus}</p>
          </div>

          <div className="flex w-full flex-wrap items-start gap-[6px]">
            {reservation.adjustments.map((adjustment, index) => (
              <InspectableComponent
                key={`${reservation.id}-${adjustment.taste}-${index}`}
                componentName="TasteChip"
                onNavigate={onNavigateToSection}
                sectionId="badges"
              >
                <TasteChip
                  taste={adjustment.taste}
                  value={adjustment.direction}
                />
              </InspectableComponent>
            ))}
          </div>

          <div className="w-full border-t border-[rgba(15,15,15,0.08)] pt-[12px]">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)] tracking-[0.2px]">
              다음 다이닝 준비
            </p>
            <p className="mt-[6px] text-[16px] font-bold leading-[1.35] text-[var(--tb-color-text-primary)]">
              {summary.headline}
            </p>
          </div>

          <InspectableComponent
            className="block w-full"
            componentName="TCSHintCard"
            onNavigate={onNavigateToSection}
            sectionId="appSpecific"
          >
            <TCSHintCard
              title="이번 식사에서 달라지는 점"
              description={summary.guestMessage}
              surface="nested"
            />
          </InspectableComponent>
        </div>
      </div>
    </div>
  );
}

export function HomeChefMatchCard({
  chef,
  onNavigateToSection,
  onSelect,
}: {
  chef: HomeChefMatchCardData;
  onNavigateToSection?: InspectableNavigateHandler;
  onSelect?: (chef: HomeChefMatchCardData) => void;
}) {
  const chefName = chef.chef.endsWith('셰프') ? chef.chef : `${chef.chef} 셰프`;

  return (
    <InspectableComponent
      className="shrink-0"
      componentName="ChefMatchCard"
      onNavigate={onNavigateToSection}
      sectionId="cards"
    >
      <button
        type="button"
        className="block text-left"
        onClick={() => onSelect?.(chef)}
      >
        <ChefMatchCard
          chefName={chefName}
          hoverMotion={false}
          hoverShadow={false}
          imageSrc={chef.image}
          matchRate={chef.match}
          matchReason={chef.matchReason}
          restaurant={chef.restaurant}
          tasteId={chef.tasteId}
        />
      </button>
    </InspectableComponent>
  );
}

export function HomeChefMatchStrip({
  chefCards,
  fullBleed = true,
  onNavigateToSection,
  onSelectChefMatch,
  showSectionTitle = true,
}: HomeChefMatchStripProps) {
  if (chefCards.length === 0) {
    return null;
  }

  return (
    <div className="tb-card-stack">
      {showSectionTitle ? (
        <SectionTitle as="h3" size="md">
          셰프 매칭
        </SectionTitle>
      ) : null}
      <CardScrollList fullBleed={fullBleed}>
        {chefCards.map((chef) => (
          <HomeChefMatchCard
            key={`${chef.chef}-${chef.restaurant}-${chef.match}`}
            chef={chef}
            onNavigateToSection={onNavigateToSection}
            onSelect={onSelectChefMatch}
          />
        ))}
      </CardScrollList>
    </div>
  );
}

export function HomeCardStack({
  chefCards,
  featuredReservation,
  featuredSummary,
  measurementAgeLabel,
  measurementSnapshot,
  needsMeasurementRefresh,
  onNavigateToSection,
  onSelectChefMatch,
  onStartMeasurement,
  onStartRemeasurement,
  recentChangeText,
}: HomeCardStackProps) {
  const recentChangeTasteLabel = getRecentChangeTasteMeasurement(measurementSnapshot).label;
  const remeasurementAccentTaste = getStrongestTasteMeasurement(measurementSnapshot).label;
  const isBroadStarterProfile = isBroadStarterMeasurementSnapshot(measurementSnapshot);

  return (
    <div className="tb-section-stack">
      <HomeChefMatchStrip
        chefCards={chefCards}
        onNavigateToSection={onNavigateToSection}
        onSelectChefMatch={onSelectChefMatch}
      />

      {featuredReservation && featuredSummary ? (
        <div className="tb-card-stack">
          <SectionTitle as="h2" size="md">
            다음 다이닝 준비
          </SectionTitle>
          <HomeDiningPreparationCard
            onNavigateToSection={onNavigateToSection}
            reservation={featuredReservation}
            summary={featuredSummary}
          />
        </div>
      ) : null}

      <div className="tb-card-stack">
        <SectionTitle as="h3" size="md">
          최근 프로필 변화
        </SectionTitle>
        <InspectableComponent
          className="block w-full"
          componentName="InterpretationCard"
          onNavigate={onNavigateToSection}
          sectionId="cards"
        >
          <InterpretationCard
            accentColor={getTasteColor(recentChangeTasteLabel)}
            detailLabel="변화 보기"
            description={recentChangeText}
            eyebrow="최근 반영 내용"
            supportingText="가장 최근 다이닝 피드백과 측정을 통해 반영된 내용이에요."
          />
        </InspectableComponent>
      </div>

      <InspectableComponent
        className="block w-full"
        componentName="TasteMeasurementMiniCta"
        onNavigate={onNavigateToSection}
        sectionId="appSpecific"
      >
        <TasteMeasurementMiniCta
          accentTaste={remeasurementAccentTaste}
          title={
            needsMeasurementRefresh
              ? isBroadStarterProfile
                ? '스타터 프로필을 더 정교하게 만들 수 있어요'
                : '미각 갱신 추천'
              : '현재 프로필 반영 완료'
          }
          actionFullWidth={!needsMeasurementRefresh}
          padding={needsMeasurementRefresh ? 'default' : 'compact'}
          description={
            needsMeasurementRefresh
              ? isBroadStarterProfile
                ? `${measurementAgeLabel} 질문 기반 스타터 프로필이에요. 다시 점검하거나 식사 기록이 쌓이면 메뉴 추천과 매장 전달 포인트가 더 자연스러워집니다.`
                : `${measurementAgeLabel} 데이터예요. 예약 전에 갱신해두면 셰프용 캘리브레이션 가이드가 더 정밀해집니다.`
              : isBroadStarterProfile
                ? '질문 기반 시작 프로필이 반영되어 있어요. 식사 기록이 쌓일수록 더 정교해집니다.'
                : '가장 최근 입맛 상태가 반영되어 있습니다. 다시 측정할 수도 있어요.'
          }
          meta={`마지막 측정 ${formatMeasurementDate(measurementSnapshot.measuredAt)}`}
          actionLabel={needsMeasurementRefresh ? '프로필 업데이트' : '다시 측정'}
          onAction={onStartRemeasurement}
          tone={needsMeasurementRefresh ? 'alert' : 'neutral'}
        />
      </InspectableComponent>
    </div>
  );
}
