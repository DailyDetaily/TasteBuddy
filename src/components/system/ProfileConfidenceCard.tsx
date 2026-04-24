import InspectableComponent, {
  type InspectableNavigateHandler,
} from './InspectableComponent';
import OutlineBadge from './OutlineBadge';
import SectionTitle from './SectionTitle';
import StatusChip from './StatusChip';
import TasteChip from './TasteChip';
import SectionCard from '../SectionCard';

export type ProfileConfidenceStage = 'Starter' | 'Building' | 'Refined';

interface ProfileConfidenceCardProps {
  measurementAgeLabel: string;
  measurementCount: number;
  needsMeasurementRefresh?: boolean;
  onNavigateToSection?: InspectableNavigateHandler;
  stage: ProfileConfidenceStage;
  strongestTasteLabel: string;
  weakestTasteLabel: string;
}

const PROFILE_STEPS = [
  { label: 'Starter', caption: '첫 측정 기준' },
  { label: 'Building', caption: '반복 학습 중' },
  { label: 'Refined', caption: '충분히 안정화' },
] as const;

const PROFILE_COPY: Record<
  ProfileConfidenceStage,
  {
    description: string;
    nextStep: string;
    title: string;
  }
> = {
  Starter: {
    title: '첫 기준으로 다음 식사를 맞추기 시작한 Starter 단계예요',
    description:
      '첫 기준으로 현재 취향의 기본 윤곽이 만들어졌어요. 지금도 메뉴 선택과 매장 전달에는 바로 활용할 수 있고, 한두 번 더 쌓이면 더 안정적인 가이드가 됩니다.',
    nextStep:
      '한 번 더 점검하거나 첫 식사 피드백이 쌓이면 다음 식사에 반영되는 기준이 더 자연스러워져요.',
  },
  Building: {
    title: '다음 식사를 더 안정적으로 맞춰가는 Building 단계예요',
    description:
      '측정과 식사 피드백이 겹치며 무엇이 잘 맞고 어디에서 조정이 필요한지 읽히기 시작했어요. 현재도 충분히 유용하고, 반복될수록 다음 식사에 더 정교하게 반영됩니다.',
    nextStep:
      '이번 식사의 짧은 피드백 한 줄이 다음 식사와 매장 전달 가이드를 더 안정적으로 맞춰줘요.',
  },
  Refined: {
    title: '다음 식사에 안정적으로 반영되는 Refined 단계예요',
    description:
      '반복 측정과 피드백이 누적되어, 취향과 컨디션 변화의 패턴이 비교적 안정적으로 읽히는 상태예요. 작은 업데이트만으로도 좋은 개인화를 유지할 수 있어요.',
    nextStep:
      '중요한 예약 전에만 현재 컨디션을 다시 반영해도 다음 식사에 충분히 좋은 정확도를 유지할 수 있어요.',
  },
};

export default function ProfileConfidenceCard({
  measurementAgeLabel,
  measurementCount,
  needsMeasurementRefresh = false,
  onNavigateToSection,
  stage,
  strongestTasteLabel,
  weakestTasteLabel,
}: ProfileConfidenceCardProps) {
  const currentStageIndex = PROFILE_STEPS.findIndex((step) => step.label === stage);
  const copy = PROFILE_COPY[stage];

  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <InspectableComponent
              componentName="OutlineBadge"
              onNavigate={onNavigateToSection}
              sectionId="badges"
            >
              <OutlineBadge>{stage} Profile</OutlineBadge>
            </InspectableComponent>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                Profile Confidence
              </p>
              <SectionTitle size="md" className="mt-1 leading-tight">
                {copy.title}
              </SectionTitle>
            </div>
          </div>

          <InspectableComponent
            className="shrink-0"
            componentName="StatusChip"
            onNavigate={onNavigateToSection}
            sectionId="badges"
          >
            <StatusChip
              className="gap-1 whitespace-nowrap"
              color="var(--tb-color-text-primary)"
              backgroundColor="var(--tb-color-surface-muted)"
            >
              <span className="font-medium text-[var(--tb-color-text-hint)]">
                {measurementCount <= 1 ? '측정 기준' : '누적 기준'}
              </span>
              <span className="font-semibold text-[var(--tb-color-text-primary)]">
                {measurementCount}회
              </span>
            </StatusChip>
          </InspectableComponent>
        </div>

        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          {copy.description}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {PROFILE_STEPS.map((step, index) => {
            const isCurrent = index === currentStageIndex;
            const isPast = index < currentStageIndex;

            return (
              <div
                key={step.label}
                className={`rounded-[8px] border px-3 py-3 ${
                  isCurrent
                    ? 'border-[var(--tb-color-text-secondary)] bg-[var(--tb-color-surface-muted)]'
                    : isPast
                      ? 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] opacity-70'
                      : 'border-dashed border-[var(--tb-color-border-disabled)] bg-[var(--tb-color-surface-base)]'
                }`}
              >
                <p
                  className={`text-[12px] font-semibold ${
                    isCurrent
                      ? 'text-[var(--tb-color-text-primary)]'
                      : 'text-[var(--tb-color-text-hint)]'
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                  {step.caption}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="px-1 py-1">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              지금 식사에 먼저 반영되는 포인트
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              지금 프로필에서 비교적 먼저 읽히는 축이에요.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <InspectableComponent
                componentName="TasteChip"
                onNavigate={onNavigateToSection}
                sectionId="badges"
              >
                <TasteChip taste={strongestTasteLabel} value="우선 반영" />
              </InspectableComponent>
              <InspectableComponent
                componentName="TasteChip"
                onNavigate={onNavigateToSection}
                sectionId="badges"
              >
                <TasteChip taste={weakestTasteLabel} value="더 확인 중" />
              </InspectableComponent>
            </div>
          </div>

          <div className="px-1 py-1">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              다음 식사에 더 잘 반영되는 순간
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
              {needsMeasurementRefresh
                ? '최근 컨디션을 다시 반영하면 이번 예약에 현재 프로필이 더 자연스럽게 맞춰져요.'
                : copy.nextStep}
            </p>
            <p className="mt-2 text-[11px] text-[var(--tb-color-text-subtle)]">
              최근 기준 {measurementAgeLabel}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
