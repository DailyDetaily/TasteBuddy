import { type ReactNode } from 'react';

import {
  ChevronLeft as ChevronLeftIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from 'lucide-react';

import SurveyStepCard from '../components/measurement/SurveyStepCard';
import FlowStepCta from '../components/system/FlowStepCta';
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

      <main className="flex-1 overflow-y-auto px-5 pb-24 no-scrollbar">
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

      <FlowStepCta
        actionLabel={resolvedActionLabel}
        currentIndex={safeActiveStepIndex}
        fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-page)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
        onAction={onAction}
        secondaryButtonLabel={secondaryActionLabel}
        onSecondaryButtonAction={onSecondaryAction}
        total={steps.length}
      />
    </div>
  );
}
