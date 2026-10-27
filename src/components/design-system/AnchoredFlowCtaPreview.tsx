import { cn } from "../ui/utils";
import FlowBottomCta from "../system/FlowBottomCta";
import PrimaryButton from "../system/PrimaryButton";
import StepIndicator from "../system/StepIndicator";
import { SourceFileLink } from "./PreviewableSourceText";

interface AnchoredFlowCtaPreviewProps {
  className?: string;
  indicatorActiveColor: string;
}

function PreviewEyebrow({
  file,
  label,
}: {
  file: string;
  label?: string;
}) {
  return <SourceFileLink file={file} label={label} variant="chip" />;
}

export default function AnchoredFlowCtaPreview({
  className,
  indicatorActiveColor,
}: AnchoredFlowCtaPreviewProps) {
  return (
    <div className={cn("overflow-hidden p-0", className)}>
      <div className="border-b border-[var(--tb-color-border-subtle)] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
              Anchored flow CTA patterns
            </p>
            <p className="mt-1 text-[12px] text-[var(--tb-color-text-subtle)]">
              Flow screens compose StepIndicator and PrimaryButton directly.
              Each screen owns bottom placement, safe-area spacing, and fade.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[rgba(15,15,15,0.06)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-primary)]">
            Currently used
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <PreviewEyebrow file="src/components/system/FlowBottomCta.tsx" label="FlowBottomCta.tsx" />
          <PreviewEyebrow file="src/components/system/PrimaryButton.tsx" label="PrimaryButton.tsx" />
          <PreviewEyebrow file="src/components/system/StepIndicator.tsx" label="StepIndicator.tsx" />
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[28px] border border-[var(--tb-color-border-default)] bg-white">
          <div className="relative min-h-[240px] bg-[var(--tb-color-surface-base)]">
            <div className="px-4 pt-6">
              <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                <SourceFileLink file="src/components/system/FlowBottomCta.tsx" label="FlowBottomCta.tsx" />
              </p>
              <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                Safe-area spacing, bottom fade, helper copy, and secondary actions
                are managed here.
              </p>
            </div>
            <FlowBottomCta
              actionLabel="연결 없이 계속"
              helperText="하드웨어 없이도 다음 단계로 이어집니다."
              onAction={() => undefined}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[var(--tb-color-border-default)] bg-white">
          <div className="relative min-h-[240px] bg-[var(--tb-color-surface-base)]">
            <div className="px-4 pt-6 pb-[160px]">
              <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                <SourceFileLink file="src/pages/OnboardingScreen.tsx" label="OnboardingScreen.tsx" />
              </p>
              <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                Onboarding and taste measurement use the same composition pattern, while
                measurement can tint the step indicator with taste palette colors.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PreviewEyebrow file="src/components/system/FlowBottomCta.tsx" label="FlowBottomCta.tsx" />
                <PreviewEyebrow file="src/components/system/StepIndicator.tsx" label="StepIndicator.tsx" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
              <div className="w-full max-w-[var(--tb-layout-screen-max-width)]">
                <div className="tb-bottom-fade relative flex min-h-[calc(var(--tb-size-bottom-fade-min-height)+var(--tb-safe-area-bottom))] w-full flex-col items-center justify-end gap-0 px-5 pb-[max(12px,var(--tb-safe-area-bottom))]">
                  <StepIndicator
                    activeColor={indicatorActiveColor}
                    className="mb-8"
                    currentIndex={1}
                    total={4}
                  />
                  <PrimaryButton onClick={() => undefined}>다음</PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[var(--tb-color-border-default)] bg-white">
          <div className="relative min-h-[240px] bg-[var(--tb-color-surface-base)]">
            <div className="px-4 pt-6 pb-[160px]">
              <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                Split CTA state
              </p>
              <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                Existing context can reuse saved details or reopen the context form
                without leaving the anchored footer pattern.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PreviewEyebrow file="src/components/system/FlowBottomCta.tsx" label="FlowBottomCta.tsx" />
                <PreviewEyebrow file="src/pages/TasteSurveyIntroScreen.tsx" label="TasteSurveyIntroScreen.tsx" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
              <div className="w-full max-w-[var(--tb-layout-screen-max-width)]">
                <div className="tb-bottom-fade relative flex min-h-[calc(var(--tb-size-bottom-fade-min-height)+var(--tb-safe-area-bottom))] w-full flex-col items-center justify-end gap-0 px-5 pb-[max(12px,var(--tb-safe-area-bottom))]">
                  <StepIndicator
                    activeColor={indicatorActiveColor}
                    className="mb-8"
                    currentIndex={0}
                    total={3}
                  />
                  <div className="flex w-full gap-2">
                    <PrimaryButton
                      className="border border-[var(--tb-color-border-strong)] bg-transparent text-[var(--tb-color-text-tertiary)] shadow-none"
                      onClick={() => undefined}
                    >
                      건너뛰기
                    </PrimaryButton>
                    <PrimaryButton onClick={() => undefined}>다시 작성</PrimaryButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
