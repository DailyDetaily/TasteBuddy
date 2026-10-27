import { type ReactNode } from 'react';

import {
  ChevronLeft as ChevronLeftIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from 'lucide-react';

import SurveyStepCard from '../components/measurement/SurveyStepCard';
import PrimaryButton from '../components/system/PrimaryButton';
import StepIndicator from '../components/system/StepIndicator';
import { ICON_TOKENS } from '../constants/designTokens';

export interface FlowIntroStep {
  id: number;
  title: string;
  desc: string;
}

interface FlowIntroScreenProps {
  /** 0-based active step index */
  activeStepIndex?: number;
  /** Primary CTA label */
  actionLabel?: string;
  /** Defaults to the first step's action label when omitted */
  defaultActionLabel?: string;
  /** Title node rendered in the hero area */
  title: ReactNode;
  /** Subtitle rendered below the title */
  subtitle: string;
  /** Ordered list of steps to render as SurveyStepCards */
  steps: readonly FlowIntroStep[];
  onBack?: () => void;
  /** When provided, renders the ellipsis (⋯) button in the header */
  onMore?: () => void;
  secondaryActionLabel?: ReactNode;
  onSecondaryAction?: () => void;
  onAction: () => void;
}

export default function FlowIntroScreen({
  activeStepIndex = 0,
  actionLabel,
  defaultActionLabel,
  title,
  subtitle,
  steps,
  onBack,
  onMore,
  secondaryActionLabel,
  onSecondaryAction,
  onAction,
}: FlowIntroScreenProps) {
  const safeActiveStepIndex = Math.min(Math.max(activeStepIndex, 0), steps.length - 1);
  const resolvedActionLabel = actionLabel ?? defaultActionLabel ?? '계속하기';

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-page)] font-sans">
      <header
        className="z-10 flex min-h-[calc(var(--tb-size-flow-top-bar-height)+var(--tb-safe-area-top))] shrink-0 items-center justify-between bg-[var(--tb-color-bg-page)] px-5"
        style={{ paddingTop: 'var(--tb-safe-area-top)' }}
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
        {onMore ? (
          <button
            type="button"
            aria-label="안내 더보기"
            className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] active:opacity-70"
            onClick={onMore}
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
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: ICON_TOKENS.container.lg,
              height: ICON_TOKENS.container.lg,
            }}
          />
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-[188px] no-scrollbar">
        <div className="mb-12 mt-6 text-center">
          <h1 className="mb-3 text-[18px] font-bold leading-tight tracking-normal text-[var(--tb-color-text-primary)]">
            {title}
          </h1>
          <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-body)]">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {steps.map((step, index) => {
            const status =
              index < safeActiveStepIndex
                ? 'completed'
                : index === safeActiveStepIndex
                  ? 'active'
                  : 'inactive';

            return (
              <SurveyStepCard
                key={step.id}
                stepNumber={step.id}
                title={step.title}
                description={step.desc}
                status={status}
              />
            );
          })}
        </div>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
        <div className="w-full max-w-[var(--tb-layout-screen-max-width)]">
          <div className="tb-bottom-fade relative flex min-h-[calc(var(--tb-size-bottom-fade-min-height)+var(--tb-safe-area-bottom))] w-full flex-col items-center justify-end gap-0 px-5 pb-[max(12px,var(--tb-safe-area-bottom))] bg-[linear-gradient(to_top,var(--tb-color-bg-page)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]">
            <StepIndicator
              className="mb-8 self-center"
              currentIndex={safeActiveStepIndex}
              total={steps.length}
            />
            {secondaryActionLabel && onSecondaryAction ? (
              <div className="flex w-full flex-col">
                <PrimaryButton onClick={onAction}>{resolvedActionLabel}</PrimaryButton>
                <button type="button" className="min-h-10 text-[12px] font-semibold text-[var(--tb-color-text-faint)]" onClick={onSecondaryAction}>
                  {secondaryActionLabel}
                </button>
              </div>
            ) : (
              <PrimaryButton onClick={onAction}>{resolvedActionLabel}</PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
