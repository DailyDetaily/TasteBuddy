import { cn } from "../ui/utils";
import FlowBottomCta from "../system/FlowBottomCta";
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
              FlowBottomCta remains the reusable shell, FlowStepCta is the shared
              product wrapper, and this preview exposes the StepIndicator component
              directly inside the footer.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-[rgba(15,15,15,0.12)] bg-[rgba(15,15,15,0.06)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-primary)]">
            Currently used
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <PreviewEyebrow file="src/components/system/FlowBottomCta.tsx" label="FlowBottomCta.tsx" />
          <PreviewEyebrow file="src/components/system/FlowStepCta.tsx" label="FlowStepCta.tsx" />
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
                <SourceFileLink file="src/components/system/FlowStepCta.tsx" label="FlowStepCta.tsx" />
              </p>
              <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                Onboarding and taste measurement share one footer component, while
                measurement can tint the step indicator with taste palette colors.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PreviewEyebrow file="src/components/system/FlowBottomCta.tsx" label="FlowBottomCta.tsx" />
                <PreviewEyebrow file="src/components/system/StepIndicator.tsx" label="StepIndicator.tsx" />
              </div>
            </div>
            <FlowBottomCta
              actionLabel="다음"
              contentClassName="gap-0"
              onAction={() => undefined}
              topSlot={
                <StepIndicator
                  activeColor={indicatorActiveColor}
                  className="mb-8"
                  currentIndex={1}
                  total={4}
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
