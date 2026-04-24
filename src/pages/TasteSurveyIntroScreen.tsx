import { ChevronLeft as ChevronLeftIcon } from 'lucide-react';

import SectionCard from '../components/SectionCard';
import FlowBottomCta from '../components/system/FlowBottomCta';
import FlowHeaderBlock from '../components/system/FlowHeaderBlock';
import OutlineBadge from '../components/system/OutlineBadge';
import SectionTitle from '../components/system/SectionTitle';
import { ICON_TOKENS } from '../constants/designTokens';

interface TasteSurveyIntroScreenProps {
  onBack?: () => void;
  onStart: () => void;
}

const INTRO_POINTS = [
  {
    label: '최근 3개월 기준',
    text: '일시적인 하루 컨디션보다 최근 식사에서 반복된 감각 반응을 기준으로 봅니다.',
  },
  {
    label: '약 1-2분',
    text: '열두 문항으로 현재 프로필의 시작점을 차분하게 잡습니다.',
  },
  {
    label: '다음 다이닝을 위한 해석',
    text: '응답은 예약 개인화와 셰프가 참고할 수 있는 표현으로 정리됩니다.',
  },
] as const;

export default function TasteSurveyIntroScreen({
  onBack,
  onStart,
}: TasteSurveyIntroScreenProps) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-focus)] font-sans">
      <header className="z-20 flex w-full shrink-0 justify-center">
        <div
          className="w-full max-w-[1440px] border-b border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-overlay)] backdrop-blur-md"
          style={{ paddingTop: 'var(--tb-safe-area-top)' }}
        >
          <div className="relative flex min-h-[var(--tb-size-top-app-bar-height)] items-center justify-between px-5">
            {onBack ? (
              <button
                type="button"
                aria-label="이전 화면으로 돌아가기"
                className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-opacity active:opacity-70"
                onClick={onBack}
                style={{
                  width: ICON_TOKENS.container.lg,
                  height: ICON_TOKENS.container.lg,
                }}
              >
                <ChevronLeftIcon size={ICON_TOKENS.size.lg} strokeWidth={1.5} />
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
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-[var(--tb-color-text-primary)]">
              미각 설문
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
          <FlowHeaderBlock
            title={
              <>
                최근의 감각 반응으로
                <br />
                첫 미각 프로필을 준비해요
              </>
            }
            titleClassName="leading-tight"
            description="작은 차이가 얼마나 빨리 느껴지는지, 조금 강해졌을 때 어디서 부담이 생기는지 차분하게 확인합니다."
            topLeft={<OutlineBadge>Initial Survey</OutlineBadge>}
            topRight={<OutlineBadge>12문항</OutlineBadge>}
          />

          <div className="grid gap-3">
            {INTRO_POINTS.map((point) => (
              <SectionCard
                key={point.label}
                hoverEffect={false}
                className="border border-[var(--tb-color-border-subtle)]"
              >
                <div className="w-full">
                  <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                    {point.label}
                  </p>
                  <SectionTitle size="md" className="mt-1 leading-tight">
                    {point.text}
                  </SectionTitle>
                </div>
              </SectionCard>
            ))}
          </div>
        </div>
      </main>

      <FlowBottomCta
        actionLabel="설문 시작"
        fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-focus)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
        onAction={onStart}
      />
    </div>
  );
}
