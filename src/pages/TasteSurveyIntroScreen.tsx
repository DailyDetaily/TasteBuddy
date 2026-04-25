import {
  Check as CheckIcon,
  ChevronLeft as ChevronLeftIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from 'lucide-react';

import FlowStepCta from '../components/system/FlowStepCta';
import { ICON_TOKENS } from '../constants/designTokens';

interface TasteSurveyIntroScreenProps {
  activeStepIndex?: number;
  actionLabel?: string;
  onBack?: () => void;
  onStart: () => void;
}

const SURVEY_STEPS = [
  {
    id: 1,
    title: '해석 참고 정보',
    desc: '연령대, 성별 관련 정보, 흡연 상태를 선택해 미각 응답을 더 안정적으로 읽을 준비를 합니다.',
  },
  {
    id: 2,
    title: '감각 반응 정리',
    desc: '열두 문항으로 작은 차이와 부담이 생기는 지점을 차분하게 확인합니다.',
  },
  {
    id: 3,
    title: '첫 미각 프로필 준비',
    desc: '응답은 예약 개인화와 셰프가 참고할 수 있는 표현으로 정리됩니다.',
  },
] as const;

export default function TasteSurveyIntroScreen({
  activeStepIndex = 0,
  actionLabel,
  onBack,
  onStart,
}: TasteSurveyIntroScreenProps) {
  const safeActiveStepIndex = Math.min(Math.max(activeStepIndex, 0), SURVEY_STEPS.length - 1);
  const resolvedActionLabel =
    actionLabel ??
    (safeActiveStepIndex === 0
      ? '설문 시작'
      : safeActiveStepIndex === 1
        ? '감각 반응으로 이어가기'
        : '응답 확인하기');

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-page)] font-sans">
      <header
        className="z-10 flex min-h-[var(--tb-size-top-app-bar-height)] shrink-0 items-center justify-between bg-[var(--tb-color-bg-page)] px-5 py-3"
        style={{ paddingTop: 'calc(var(--tb-safe-area-top) + 12px)' }}
      >
        {onBack ? (
          <button
            type="button"
            aria-label="이전 화면으로 돌아가기"
            className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] active:opacity-70"
            onClick={onBack}
            style={{
              width: ICON_TOKENS.container.lg,
              height: ICON_TOKENS.container.lg,
            }}
          >
            <ChevronLeftIcon
              size={ICON_TOKENS.size.lg}
              strokeWidth={ICON_TOKENS.strokeWidth.regular}
            />
          </button>
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: ICON_TOKENS.container.lg,
              height: ICON_TOKENS.container.lg,
            }}
          />
        )}
        <button
          type="button"
          aria-label="설문 안내 더보기"
          className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] active:opacity-70"
          style={{
            width: ICON_TOKENS.container.lg,
            height: ICON_TOKENS.container.lg,
          }}
        >
          <MoreHorizontalIcon
            size={ICON_TOKENS.size.lg}
            strokeWidth={ICON_TOKENS.strokeWidth.regular}
          />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-24 no-scrollbar">
        <div className="mb-12 mt-6 text-center">
          <h1 className="mb-3 text-[18px] font-bold leading-tight tracking-normal text-[var(--tb-color-text-primary)]">
            지금부터 고객님의 미각을
            <br />
            정밀하게 준비합니다.
          </h1>
          <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-body)]">
            최근의 감각 반응을 바탕으로 첫 프로필을 차분하게 잡아볼게요.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {SURVEY_STEPS.map((step, index) => {
            const isCompleted = index < safeActiveStepIndex;
            const isActive = index === safeActiveStepIndex;
            const cardClassName = isActive
              ? 'border border-[var(--tb-color-border-strong)] bg-[var(--tb-color-surface-elevated)]'
              : isCompleted
                ? 'bg-[var(--tb-color-surface-elevated)] opacity-80'
                : 'bg-[var(--tb-color-surface-muted)]';
            const markerClassName =
              isCompleted || isActive
                ? 'bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
                : 'bg-[var(--tb-color-text-disabled)] text-[var(--tb-color-text-inverse)]';
            const titleClassName = isActive || isCompleted
              ? 'text-[var(--tb-color-text-primary)]'
              : 'text-[var(--tb-color-text-tertiary)]';

            return (
              <div
                key={step.id}
                className={`w-full rounded-[20px] p-3 transition-all duration-300 ${cardClassName}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] ${markerClassName}`}>
                    {isCompleted ? (
                      <CheckIcon size={ICON_TOKENS.size.sm} strokeWidth={3} />
                    ) : (
                      <span className="text-[13px] font-bold">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-[14px] font-bold tracking-normal ${titleClassName}`}>
                      {step.title}
                    </h3>
                    {isActive && step.desc ? (
                      <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--tb-color-text-body)]">
                        {step.desc}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <FlowStepCta
        actionLabel={resolvedActionLabel}
        currentIndex={safeActiveStepIndex}
        fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-page)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
        onAction={onStart}
        total={3}
      />
    </div>
  );
}
