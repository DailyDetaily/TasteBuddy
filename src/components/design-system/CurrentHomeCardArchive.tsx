import { useMemo } from 'react';

import {
  getStrongestTasteMeasurement,
  getWeakestTasteMeasurement,
} from '../../constants/tasteMeasurementData';
import {
  getCurrentHomeCardPreviewData,
  getRecentChangeTasteMeasurement,
  HomeCardStack,
  HomeChefMatchStrip,
  HomeDiningPreparationCard,
} from '../home/HomeCards';
import TasteMeasurementMiniCta from '../measurement/TasteMeasurementMiniCta';
import InspectableComponent, {
  type InspectableNavigateHandler,
} from '../system/InspectableComponent';
import InterpretationCard from '../system/InterpretationCard';
import ProfileConfidenceCard from '../system/ProfileConfidenceCard';
import { getTasteColor } from '../../constants/tasteColors';

function ArchiveEyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
      {children}
    </span>
  );
}

function ArchivePanel({
  children,
  componentNames,
  description,
  title,
}: {
  children: React.ReactNode;
  componentNames?: string[];
  description: string;
  title: string;
}) {
  return (
    <div
      className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-4 shadow-[var(--tb-shadow-soft)]"
      data-component-preview={componentNames?.length === 1 ? componentNames[0] : undefined}
      data-component-preview-list={componentNames?.length ? JSON.stringify(componentNames) : undefined}
    >
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{title}</p>
        <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">{description}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ArchivePhoneFrame({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          {description}
        </p>
      </div>
      <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[32px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] shadow-[0_24px_60px_rgba(15,15,15,0.12)]">
        <div className="pointer-events-none flex justify-center pt-3">
          <div className="h-1.5 w-24 rounded-full bg-[var(--tb-color-border-strong)]" />
        </div>
        <div className="h-[844px] overflow-y-auto bg-[var(--tb-color-bg-page)] p-5 no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function CurrentHomeCardArchive({
  onNavigateToSection,
}: {
  onNavigateToSection?: InspectableNavigateHandler;
}) {
  const previewData = useMemo(() => getCurrentHomeCardPreviewData(), []);
  const strongestTasteLabel = getStrongestTasteMeasurement(
    previewData.measurementSnapshot,
  ).label;
  const weakestTasteLabel = getWeakestTasteMeasurement(
    previewData.measurementSnapshot,
  ).label;
  const recentChangeTasteLabel = getRecentChangeTasteMeasurement(
    previewData.measurementSnapshot,
  ).label;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
      <div className="grid gap-4">
        <ArchivePanel
          componentNames={['HomeDiningPreparationCard']}
          title="다음 다이닝 준비 카드"
          description="레거시 조정 히스토리 카드의 리듬을 참고해, 현재 예약 준비와 셰프 개인화 메시지를 다시 구성한 홈 대표 카드입니다."
        >
          <div className="flex flex-wrap gap-2">
            <ArchiveEyebrow>HomeDiningPreparationCard</ArchiveEyebrow>
            <ArchiveEyebrow>History Card reference</ArchiveEyebrow>
            <ArchiveEyebrow>TCSBadge</ArchiveEyebrow>
            <ArchiveEyebrow>TasteChip</ArchiveEyebrow>
            <ArchiveEyebrow>TCSHintCard</ArchiveEyebrow>
          </div>
          <div className="mt-4">
            {previewData.featuredReservation && previewData.featuredSummary ? (
              <HomeDiningPreparationCard
                onNavigateToSection={onNavigateToSection}
                reservation={previewData.featuredReservation}
                summary={previewData.featuredSummary}
              />
            ) : null}
          </div>
        </ArchivePanel>

        <div className="grid gap-4 lg:grid-cols-2">
          <ArchivePanel
            componentNames={['ProfileConfidenceCard']}
            title="프로필 신뢰도 카드"
            description="현재 홈 중단에서 반복 측정 단계와 지금 예약에 먼저 반영되는 축, 다음 식사 정확도를 높이는 계기를 설명합니다."
          >
            <div className="flex flex-wrap gap-2">
              <ArchiveEyebrow>ProfileConfidenceCard</ArchiveEyebrow>
              <ArchiveEyebrow>OutlineBadge</ArchiveEyebrow>
              <ArchiveEyebrow>TasteChip</ArchiveEyebrow>
            </div>
            <div className="mt-4">
              <ProfileConfidenceCard
                stage={previewData.confidenceStage}
                measurementAgeLabel={previewData.measurementAgeLabel}
                measurementCount={previewData.measurementCount}
                needsMeasurementRefresh={previewData.needsMeasurementRefresh}
                onNavigateToSection={onNavigateToSection}
                strongestTasteLabel={strongestTasteLabel}
                weakestTasteLabel={weakestTasteLabel}
              />
            </div>
          </ArchivePanel>

          <ArchivePanel
            componentNames={['InterpretationCard', 'TasteMeasurementMiniCta']}
            title="변화 요약과 재측정 CTA"
            description="현재 홈 하단의 변화 요약을 InterpretationCard 패턴으로 정리하고, 재측정 CTA와 함께 보관합니다."
          >
            <div className="flex flex-wrap gap-2">
              <ArchiveEyebrow>InterpretationCard</ArchiveEyebrow>
              <ArchiveEyebrow>TasteMeasurementMiniCta</ArchiveEyebrow>
            </div>
            <div className="mt-4 grid gap-3">
              <InspectableComponent
                className="block w-full"
                componentName="InterpretationCard"
                onNavigate={onNavigateToSection}
                sectionId="cards"
              >
                <InterpretationCard
                  accentColor={getTasteColor(recentChangeTasteLabel)}
                  detailLabel="변화 보기"
                  description={previewData.recentChangeText}
                  eyebrow="최근 반영 내용"
                  supportingText="가장 최근 다이닝 피드백과 측정을 통해 반영된 내용이에요."
                />
              </InspectableComponent>
              <InspectableComponent
                className="block w-full"
                componentName="TasteMeasurementMiniCta"
                onNavigate={onNavigateToSection}
                sectionId="appSpecific"
              >
                <TasteMeasurementMiniCta
                  accentTaste={strongestTasteLabel}
                  title={
                    previewData.needsMeasurementRefresh
                      ? '미각 갱신 추천'
                      : '현재 프로필 반영 완료'
                  }
                  actionFullWidth={!previewData.needsMeasurementRefresh}
                  padding={previewData.needsMeasurementRefresh ? 'default' : 'compact'}
                  description={
                    previewData.needsMeasurementRefresh
                      ? `${previewData.measurementAgeLabel} 데이터예요. 예약 전에 갱신해두면 셰프용 캘리브레이션 가이드가 더 정밀해집니다.`
                      : '가장 최근 입맛 상태가 반영되어 있습니다. 다시 측정할 수도 있어요.'
                  }
                  meta={`현재 홈 카드 미리보기`}
                  actionLabel={
                    previewData.needsMeasurementRefresh ? '프로필 업데이트' : '다시 측정'
                  }
                  onAction={() => undefined}
                  tone={previewData.needsMeasurementRefresh ? 'alert' : 'neutral'}
                />
              </InspectableComponent>
            </div>
          </ArchivePanel>
        </div>

        <ArchivePanel
          componentNames={['HomeChefMatchCard', 'LegacyHomeChefCard']}
          title="셰프 매칭 카드"
          description="현재 홈에서 레거시 셰프 카드 패턴을 다시 사용해, 레스토랑별 상위 매칭 셰프를 가로 스크롤로 노출합니다."
        >
          <div className="flex flex-wrap gap-2">
            <ArchiveEyebrow>HomeChefMatchCard</ArchiveEyebrow>
            <ArchiveEyebrow>LegacyHomeChefCard reference</ArchiveEyebrow>
            <ArchiveEyebrow>가로 스크롤 카드</ArchiveEyebrow>
            <ArchiveEyebrow>현재 홈 실사용</ArchiveEyebrow>
          </div>
          <div className="mt-4">
            <HomeChefMatchStrip
              chefCards={previewData.chefCards}
              fullBleed={false}
              onNavigateToSection={onNavigateToSection}
              showSectionTitle={false}
            />
          </div>
        </ArchivePanel>
      </div>

      <div className="grid gap-6">
        <ArchivePhoneFrame
          title="현재 홈 카드 스택"
          description="HomePage에 실제로 쓰이는 카드 순서를 그대로 보관한 프리뷰입니다."
        >
          <div className="grid gap-6">
            <HomeCardStack
              chefCards={previewData.chefCards}
              confidenceStage={previewData.confidenceStage}
              featuredReservation={previewData.featuredReservation}
              featuredSummary={previewData.featuredSummary}
              measurementAgeLabel={previewData.measurementAgeLabel}
              measurementCount={previewData.measurementCount}
              measurementSnapshot={previewData.measurementSnapshot}
              needsMeasurementRefresh={previewData.needsMeasurementRefresh}
              onNavigateToSection={onNavigateToSection}
              onStartMeasurement={() => undefined}
              onStartRemeasurement={() => undefined}
              recentChangeText={previewData.recentChangeText}
            />
          </div>
        </ArchivePhoneFrame>
      </div>
    </div>
  );
}
