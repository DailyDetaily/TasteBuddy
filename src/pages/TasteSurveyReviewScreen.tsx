import { ChevronLeft as ChevronLeftIcon } from 'lucide-react';

import SectionCard from '../components/SectionCard';
import FlowBottomCta from '../components/system/FlowBottomCta';
import OutlineBadge from '../components/system/OutlineBadge';
import SectionTitle from '../components/system/SectionTitle';
import TasteChip from '../components/system/TasteChip';
import { ICON_TOKENS, TASTE_TOKENS } from '../constants/designTokens';
import { TASTE_SURVEY_LIKERT_SCALE } from '../constants/tasteSurveyConfig';
import type { TasteSurveyItem, TasteSurveyResponse } from '../types/tasteSurvey';

interface TasteSurveyReviewScreenProps {
  items: readonly TasteSurveyItem[];
  onBack: () => void;
  onEditItem: (index: number) => void;
  onSubmit: () => void;
  responses: Record<string, TasteSurveyResponse | undefined>;
}

function getResponseLabel(response: TasteSurveyResponse | undefined) {
  if (!response) {
    return '미응답';
  }

  if (response.uncertain) {
    return TASTE_SURVEY_LIKERT_SCALE.uncertainLabel;
  }

  return response.selectedValue
    ? TASTE_SURVEY_LIKERT_SCALE.labels[response.selectedValue]
    : '미응답';
}

export default function TasteSurveyReviewScreen({
  items,
  onBack,
  onEditItem,
  onSubmit,
  responses,
}: TasteSurveyReviewScreenProps) {
  const completedCount = items.filter((item) => {
    const response = responses[item.id];
    return Boolean(response?.uncertain || response?.selectedValue);
  }).length;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-focus)] font-sans">
      <header className="z-20 flex w-full shrink-0 justify-center">
        <div
          className="w-full max-w-[1440px] border-b border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-overlay)] backdrop-blur-md"
          style={{ paddingTop: 'var(--tb-safe-area-top)' }}
        >
          <div className="relative flex min-h-[var(--tb-size-top-app-bar-height)] items-center justify-between px-5">
            <button
              type="button"
              aria-label="설문 문항으로 돌아가기"
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-opacity active:opacity-70"
              onClick={onBack}
              style={{
                width: ICON_TOKENS.container.lg,
                height: ICON_TOKENS.container.lg,
              }}
            >
              <ChevronLeftIcon size={ICON_TOKENS.size.lg} strokeWidth={1.5} />
            </button>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-[var(--tb-color-text-primary)]">
              응답 검토
            </span>
            <div
              aria-hidden="true"
              style={{
                width: ICON_TOKENS.container.lg,
                height: ICON_TOKENS.container.lg,
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-4 no-scrollbar">
        <div className="tb-section-stack pb-[calc(156px+var(--tb-safe-area-bottom))]">
          <div className="tb-card-stack">
            <div className="flex items-center justify-between gap-3">
              <OutlineBadge>Review</OutlineBadge>
              <OutlineBadge>
                {completedCount} / {items.length}
              </OutlineBadge>
            </div>
            <SectionTitle size="lg" className="leading-tight">
              응답을 한 번 확인해 주세요
            </SectionTitle>
            <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              이 응답은 첫 프로필을 해석하는 출발점으로 쓰입니다. 떠올리기 어려웠던 항목은 그대로 남겨도 됩니다.
            </p>
          </div>

          <div className="grid gap-3">
            {items.map((item, index) => {
              const taste = TASTE_TOKENS[item.tasteId];
              const response = responses[item.id];

              return (
                <button
                  key={item.id}
                  type="button"
                  className="text-left"
                  onClick={() => onEditItem(index)}
                >
                  <SectionCard
                    hoverEffect
                    className="border border-[var(--tb-color-border-subtle)]"
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <TasteChip taste={taste.label} value={item.construct === 'salience' ? '감지' : '부담'} />
                          {item.exploratoryMetadata ? (
                            <TasteChip taste="탐색" tone="neutral" />
                          ) : null}
                        </div>
                        <p className="mt-3 text-[13px] font-semibold leading-snug text-[var(--tb-color-text-primary)]">
                          {item.anchor.label}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
                          {item.prompt}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-medium text-[var(--tb-color-text-faint)]">
                          응답
                        </p>
                        <p className="mt-1 max-w-[104px] text-[12px] font-semibold leading-snug text-[var(--tb-color-text-primary)]">
                          {getResponseLabel(response)}
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <FlowBottomCta
        actionLabel="프로필 해석 보기"
        fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-focus)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
        onAction={onSubmit}
      />
    </div>
  );
}
