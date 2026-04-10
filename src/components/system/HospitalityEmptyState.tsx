import OutlineBadge from './OutlineBadge';
import PrimaryButton from './PrimaryButton';
import SectionCard from '../SectionCard';

interface HospitalityEmptyStateProps {
  actionLabel: string;
  description: string;
  onAction: () => void;
  secondaryLabel?: string;
  title: string;
  topTasteLabels: string[];
}

export default function HospitalityEmptyState({
  actionLabel,
  description,
  onAction,
  secondaryLabel,
  title,
  topTasteLabels,
}: HospitalityEmptyStateProps) {
  return (
    <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <OutlineBadge>Next Dining</OutlineBadge>
            <h2 className="text-[18px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
              {title}
            </h2>
          </div>

          <div className="shrink-0 rounded-[16px] bg-white px-3 py-2 text-right">
            <p className="text-[11px] font-medium text-[var(--tb-color-text-hint)]">
              현재 준비 상태
            </p>
            <p className="mt-1 text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
              예약 전 단계
            </p>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          {description}
        </p>

        <div className="grid gap-2">
          <div className="rounded-[16px] bg-white px-4 py-3">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              지금 준비된 프로필
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
              {topTasteLabels.join(' · ')}처럼 또렷한 포인트를 기준으로, 어떤 코스 흐름이 더 편안할지 미리 정리할 수 있어요.
            </p>
          </div>

          <div className="rounded-[16px] bg-white px-4 py-3">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              예약이 생기면 바로 하는 일
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
              Taste Buddy가 현재 프로필을 셰프가 읽기 쉬운 가이드로 바꿔, 코스의 의도는 유지하면서 전달 강도와 마무리 방향을 더 잘 맞출 수 있게 도와줘요.
            </p>
          </div>

          <div className="rounded-[16px] bg-white px-4 py-3">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              식후 피드백의 역할
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
              한 줄 피드백만 남겨도 다음 예약과 셰프용 캘리브레이션이 더 정교해져요.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
          {secondaryLabel ? (
            <p className="text-center text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
              {secondaryLabel}
            </p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
