import { ChevronLeft as ChevronLeftIcon, X as XIcon } from 'lucide-react';

import TasteSurveyProgress from '../components/measurement/TasteSurveyProgress';
import TasteSurveyQuestionCard from '../components/measurement/TasteSurveyQuestionCard';
import FlowStepCta from '../components/system/FlowStepCta';
import { ICON_TOKENS, TASTE_TOKENS } from '../constants/designTokens';
import type {
  TasteSurveyItem,
  TasteSurveyLikertValue,
  TasteSurveyResponse,
} from '../types/tasteSurvey';

interface TasteSurveyScreenProps {
  currentIndex: number;
  currentResponse?: TasteSurveyResponse | null;
  items: readonly TasteSurveyItem[];
  onBack: () => void;
  onNext: () => void;
  onSelectLikert: (itemId: string, value: TasteSurveyLikertValue) => void;
  onSelectUncertain: (itemId: string) => void;
}

export default function TasteSurveyScreen({
  currentIndex,
  currentResponse = null,
  items,
  onBack,
  onNext,
  onSelectLikert,
  onSelectUncertain,
}: TasteSurveyScreenProps) {
  const total = items.length;
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(total - 1, 0));
  const item = items[safeIndex] ?? null;
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === total - 1;
  const hasResponse = Boolean(currentResponse?.uncertain || currentResponse?.selectedValue);
  const activeColor = item ? TASTE_TOKENS[item.tasteId].palette.main : undefined;

  if (!item) {
    return null;
  }

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
              aria-label={isFirst ? '설문 닫기' : '이전 문항으로 돌아가기'}
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-opacity active:opacity-70"
              onClick={onBack}
              style={{
                width: ICON_TOKENS.container.lg,
                height: ICON_TOKENS.container.lg,
              }}
            >
              {isFirst ? (
                <XIcon size={ICON_TOKENS.size.lg} strokeWidth={1.5} />
              ) : (
                <ChevronLeftIcon size={ICON_TOKENS.size.lg} strokeWidth={1.5} />
              )}
            </button>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-[var(--tb-color-text-primary)]">
              {TASTE_TOKENS[item.tasteId].label} 설문
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
        <div className="tb-section-stack pb-[calc(188px+var(--tb-safe-area-bottom))]">
          <TasteSurveyProgress currentIndex={safeIndex} total={total} />
          <TasteSurveyQuestionCard
            item={item}
            onSelectLikert={(value) => onSelectLikert(item.id, value)}
            onSelectUncertain={() => onSelectUncertain(item.id)}
            selectedValue={currentResponse?.selectedValue ?? null}
            uncertain={currentResponse?.uncertain ?? false}
          />
        </div>
      </main>

      <FlowStepCta
        actionLabel={isLast ? '응답 검토' : '다음 문항'}
        actionVisualDisabled={!hasResponse}
        currentIndex={safeIndex}
        fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-focus)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
        indicatorActiveColor={activeColor}
        onAction={onNext}
        total={total}
      />
    </div>
  );
}
