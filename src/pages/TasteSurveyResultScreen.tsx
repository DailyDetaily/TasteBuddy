import { Check as CheckIcon } from 'lucide-react';

import SectionCard from '../components/SectionCard';
import FlowBottomCta from '../components/system/FlowBottomCta';
import FlowHeaderBlock from '../components/system/FlowHeaderBlock';
import OutlineBadge from '../components/system/OutlineBadge';
import SectionTitle from '../components/system/SectionTitle';
import TasteChip from '../components/system/TasteChip';
import TasteTintCard from '../components/system/TasteTintCard';
import { ICON_TOKENS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import type { TasteSurveyCompatibleResult } from '../types/tasteSurvey';

type TasteSurveyMockConfidence = 'low' | 'medium' | 'high';

interface TasteSurveyMockSummaryCard {
  confidence: TasteSurveyMockConfidence;
  description: string;
  emphasis: string;
  tasteId: TasteId;
  title: string;
}

interface TasteSurveyResultScreenProps {
  compatibleResult?: TasteSurveyCompatibleResult | null;
  confidenceLabel?: string;
  confidenceSummary?: string;
  onComplete?: () => void;
  starterProfileTone?: string;
  summaryCards?: readonly TasteSurveyMockSummaryCard[];
}

const DEFAULT_SUMMARY_CARDS: readonly TasteSurveyMockSummaryCard[] = [
  {
    tasteId: 'sour',
    title: '작은 산미 차이를 빨리 읽는 편',
    emphasis: '먼저 또렷해지는 축',
    description: '밝은 신맛이 조금만 달라져도 초반 인상에서 빠르게 잡힐 수 있어요.',
    confidence: 'medium',
  },
  {
    tasteId: 'salty',
    title: '간의 누적은 조심스럽게 보는 편',
    emphasis: '부담 신호 확인',
    description: '짠맛이 강해질 때 다음 맛으로 넘어가는 리듬이 빨리 무거워질 수 있어요.',
    confidence: 'medium',
  },
  {
    tasteId: 'umami',
    title: '감칠맛은 더 확인이 필요한 축',
    emphasis: '탐색 신호',
    description: '육수의 깊이는 맥락 영향을 받기 쉬워 식후 피드백과 함께 조심스럽게 다듬어야 해요.',
    confidence: 'low',
  },
  {
    tasteId: 'fat',
    title: '지방감은 잔여감을 중심으로 확인',
    emphasis: '탐색 신호',
    description: '지방감은 질감과 온도 영향을 함께 받으므로 아직은 낮은 확신의 참고 신호로 둡니다.',
    confidence: 'low',
  },
];

const CONFIDENCE_COPY: Record<TasteSurveyMockConfidence, string> = {
  high: '안정적',
  low: '더 확인 중',
  medium: '시작 기준',
};

function getConfidenceLabelFromCompatibleResult(
  compatibleResult: TasteSurveyCompatibleResult | null | undefined,
) {
  return compatibleResult
    ? `${compatibleResult.starterGuidance.confidence} Profile`
    : 'Starter Profile';
}

function getConfidenceSummaryFromCompatibleResult(
  compatibleResult: TasteSurveyCompatibleResult | null | undefined,
) {
  return compatibleResult
    ? compatibleResult.starterGuidance.evidence.slice(0, 2).join(' ')
    : '설문 응답만으로 만든 첫 해석이라, 다음 예약과 식후 피드백을 통해 더 정교해집니다.';
}

function getStarterProfileToneFromCompatibleResult(
  compatibleResult: TasteSurveyCompatibleResult | null | undefined,
) {
  return compatibleResult
    ? compatibleResult.starterGuidance.summaryLine
    : '현재는 작은 차이를 빨리 읽는 축과 쉽게 부담이 생기는 축을 나누어 보는 단계예요.';
}

function createSummaryCardsFromCompatibleResult(
  compatibleResult: TasteSurveyCompatibleResult | null | undefined,
): readonly TasteSurveyMockSummaryCard[] {
  if (!compatibleResult) {
    return DEFAULT_SUMMARY_CARDS;
  }

  const guidance = compatibleResult.starterGuidance;
  const topCards = guidance.topAxes.map<TasteSurveyMockSummaryCard>((tasteId) => ({
    tasteId,
    title: `${TASTE_TOKENS[tasteId].label} 차이가 먼저 읽히는 편`,
    emphasis: '먼저 읽히는 축',
    description:
      guidance.evidence.find((line) => line.includes(TASTE_TOKENS[tasteId].label)) ??
      `${TASTE_TOKENS[tasteId].label}은 현재 시작 프로필에서 먼저 참고할 축으로 읽혀요.`,
    confidence: tasteId === 'umami' || tasteId === 'fat' ? 'low' : 'medium',
  }));
  const cautionCard = {
    tasteId: guidance.cautionAxis,
    title: `${guidance.cautionLabel}은 더 조심스럽게 확인`,
    emphasis: '부담 신호 확인',
    description:
      guidance.evidence.find((line) => line.includes(guidance.cautionLabel)) ??
      `${guidance.cautionLabel}은 다음 식사 피드백과 함께 강도 변화를 더 확인할 포인트예요.`,
    confidence:
      guidance.cautionAxis === 'umami' || guidance.cautionAxis === 'fat'
        ? 'low'
        : 'medium',
  } satisfies TasteSurveyMockSummaryCard;
  const exploratoryCards = (['umami', 'fat'] as const)
    .filter((tasteId) => !topCards.some((card) => card.tasteId === tasteId))
    .map<TasteSurveyMockSummaryCard>((tasteId) => ({
      tasteId,
      title: `${TASTE_TOKENS[tasteId].label}은 더 확인하며 다듬는 축`,
      emphasis: '탐색 신호',
      description:
        guidance.evidence.find((line) => line.includes(TASTE_TOKENS[tasteId].label)) ??
        `${TASTE_TOKENS[tasteId].label}은 재료 상태와 식사 맥락의 영향을 함께 보며 조심스럽게 해석합니다.`,
      confidence: 'low',
    }));

  return [cautionCard, ...topCards, ...exploratoryCards].filter(
    (card, index, cards) =>
      cards.findIndex((candidate) => candidate.tasteId === card.tasteId) === index,
  );
}

export default function TasteSurveyResultScreen({
  compatibleResult = null,
  confidenceLabel,
  confidenceSummary,
  onComplete,
  starterProfileTone,
  summaryCards,
}: TasteSurveyResultScreenProps) {
  const resolvedConfidenceLabel =
    confidenceLabel ?? getConfidenceLabelFromCompatibleResult(compatibleResult);
  const resolvedConfidenceSummary =
    confidenceSummary ?? getConfidenceSummaryFromCompatibleResult(compatibleResult);
  const resolvedStarterProfileTone =
    starterProfileTone ?? getStarterProfileToneFromCompatibleResult(compatibleResult);
  const resolvedSummaryCards =
    summaryCards ?? createSummaryCardsFromCompatibleResult(compatibleResult);
  const primaryCards = resolvedSummaryCards.slice(0, 2);
  const exploratoryCards = resolvedSummaryCards.filter((card) => card.confidence === 'low');

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-focus)] font-sans">
      <main className="flex-1 overflow-y-auto px-5 pt-[calc(var(--tb-safe-area-top)+16px)] no-scrollbar">
        <div className="tb-section-stack pb-[calc(156px+var(--tb-safe-area-bottom))]">
          <FlowHeaderBlock
            title={
              <span className="inline-flex items-center gap-2">
                <span>첫 미각 프로필이 준비됐어요</span>
                <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--tb-color-text-primary)]">
                  <CheckIcon size={ICON_TOKENS.size.xs} strokeWidth={ICON_TOKENS.strokeWidth.emphasis} className="text-white" />
                </span>
              </span>
            }
            titleClassName="leading-tight"
            description={resolvedStarterProfileTone}
            topLeft={<OutlineBadge>{resolvedConfidenceLabel}</OutlineBadge>}
          />

          <SectionCard
            hoverEffect={false}
            className="border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)]"
          >
            <div className="w-full">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                Confidence
              </p>
              <SectionTitle size="md" className="mt-1 leading-tight">
                시작 기준으로는 충분하고, 세부 축은 계속 다듬어집니다
              </SectionTitle>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                {resolvedConfidenceSummary}
              </p>
            </div>
          </SectionCard>

          <div className="tb-card-stack">
            <SectionTitle as="h2" size="md">
              먼저 읽히는 포인트
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {primaryCards.map((card) => {
                const taste = TASTE_TOKENS[card.tasteId];

                return (
                  <TasteTintCard
                    key={card.tasteId}
                    description={card.emphasis}
                    detail={CONFIDENCE_COPY[card.confidence]}
                    leading={
                      <span
                        className="text-[16px] font-bold"
                        style={{ color: taste.palette.dark }}
                      >
                        {taste.label.slice(0, 1)}
                      </span>
                    }
                    leadingClassName="bg-white/80"
                    tasteId={card.tasteId}
                    title={taste.label}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid gap-3">
            {resolvedSummaryCards.map((card) => {
              const taste = TASTE_TOKENS[card.tasteId];

              return (
                <SectionCard
                  key={`${card.tasteId}-${card.title}`}
                  hoverEffect={false}
                  className="border border-[var(--tb-color-border-subtle)]"
                >
                  <div className="w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <TasteChip taste={taste.label} value={card.emphasis} />
                      <TasteChip
                        taste={CONFIDENCE_COPY[card.confidence]}
                        tone={card.confidence === 'low' ? 'neutral' : 'taste'}
                      />
                    </div>
                    <p className="mt-3 text-[14px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                      {card.title}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      {card.description}
                    </p>
                  </div>
                </SectionCard>
              );
            })}
          </div>

          {exploratoryCards.length > 0 ? (
            <SectionCard
              hoverEffect={false}
              className="border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)]"
            >
              <div className="w-full">
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                  조심스럽게 보는 축
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  감칠맛과 지방감은 재료 상태, 온도, 질감의 영향을 함께 받습니다. 지금은 확정된 판단보다 다음 식사에서 더 잘 맞추기 위한 참고 신호로 둡니다.
                </p>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </main>

      {onComplete ? (
        <FlowBottomCta
          actionLabel="프로필 저장하고 시작하기"
          fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-focus)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
          onAction={onComplete}
        />
      ) : null}
    </div>
  );
}
