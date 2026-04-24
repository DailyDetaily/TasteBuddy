"use client";

import BottomSheetShell, {
  BottomSheetCloseButton,
} from './BottomSheetShell';
import SectionCard from '../SectionCard';

export interface InterpretationDetailContent {
  accentColor?: string;
  description: string;
  eyebrow?: string;
  indicatorBackground?: string;
  meaning: string;
  nextStep: string;
  title: string;
}

interface InterpretationDetailDrawerProps {
  interpretation: InterpretationDetailContent | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export default function InterpretationDetailDrawer({
  interpretation,
  onOpenChange,
  open,
}: InterpretationDetailDrawerProps) {
  if (!interpretation) {
    return null;
  }

  return (
    <BottomSheetShell
      open={open}
      onOpenChange={onOpenChange}
      headerStart={<BottomSheetCloseButton />}
    >
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col overflow-y-auto px-5 pb-8">
        <div className="flex items-start gap-3 pr-10">
          <div
            className="h-[36px] w-[8px] shrink-0 rounded-full"
            style={
              interpretation.indicatorBackground
                ? { background: interpretation.indicatorBackground }
                : {
                    backgroundColor:
                      interpretation.accentColor ?? 'var(--tb-color-icon-muted)',
                  }
            }
          />
          <div className="min-w-0 flex-1">
            {interpretation.eyebrow ? (
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
                {interpretation.eyebrow}
              </p>
            ) : null}
            <h2 className="mt-1 text-[16px] leading-[1.45] text-[var(--tb-color-text-primary)] font-semibold">
              {interpretation.title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-secondary)]">
              지금 프로필에서 읽히는 내용을, 다음 식사에 어떻게 이어질지 중심으로 풀어봤어요.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <SectionCard hoverEffect={false}>
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              지금 읽히는 포인트
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
              {interpretation.description}
            </p>
          </SectionCard>

          <SectionCard hoverEffect={false}>
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              무슨 의미인가요
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
              {interpretation.meaning}
            </p>
          </SectionCard>

          <SectionCard hoverEffect={false}>
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              다음 식사에는 이렇게 반영돼요
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
              {interpretation.nextStep}
            </p>
          </SectionCard>
        </div>
      </div>
    </BottomSheetShell>
  );
}
