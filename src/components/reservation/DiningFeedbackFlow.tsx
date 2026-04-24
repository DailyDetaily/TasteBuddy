import type { ReactNode } from 'react';
import {
  CircleCheck as CircleCheckIcon,
  ChefHat as ChefHatIcon,
  MessageSquareText as MessageSquareTextIcon,
  Sparkles as SparklesIcon
} from 'lucide-react';
const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />;
const CheckCircle2 = wrapIcon(CircleCheckIcon);
const ChefHat = wrapIcon(ChefHatIcon);
const MessageSquareText = wrapIcon(MessageSquareTextIcon);
const Sparkles = wrapIcon(SparklesIcon);

import SectionCard from '../SectionCard';
import TopAppBar from '../TopAppBar';
import OutlineBadge from '../system/OutlineBadge';
import FlowBottomCta from '../system/FlowBottomCta';
import PageSection from '../system/PageSection';
import CardIconBox from '../system/CardIconBox';
import TasteChip from '../system/TasteChip';
import {
  type DiningDishMetadata,
  type DiningFeedbackChoice,
  type DiningFeedbackDraft,
  type DiningFeedbackScenario,
} from '../../constants/diningFeedbackData';
import {
  getStrongestTasteMeasurement,
  getWeakestTasteMeasurement,
  type TasteMeasurementSnapshot,
} from '../../constants/tasteMeasurementData';
import { ICON_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

const returnIntentOptions = [
  { id: 'yes', label: '이 방향으로 다시 경험하고 싶어요' },
  { id: 'maybe', label: '조금 더 맞추면 다시 좋아질 것 같아요' },
  { id: 'no', label: '다른 방향이 더 잘 맞을 것 같아요' },
] as const;

const overallExperienceOptions = [
  { value: 2, label: '조금 더 다듬고 싶어요' },
  { value: 4, label: '전반적으로 좋았어요' },
  { value: 5, label: '매우 잘 맞았어요' },
] as const;

const feedbackLabelClass =
  'self-start text-left text-[14px] font-semibold text-[var(--tb-color-text-subtle)]';
const feedbackSectionLabelClass = 'text-[12px] font-semibold text-[var(--tb-color-text-muted)]';
const feedbackBodyClass = 'text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]';
const feedbackHintClass = 'text-[12px] font-semibold text-[var(--tb-color-text-faint)]';

function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--tb-color-surface-base)] px-2.5 py-1 text-[10px] font-medium text-[var(--tb-color-text-subtle)]">
      {children}
    </span>
  );
}

function QuickOptionGroup<T extends number | string>({
  onChange,
  options,
  value,
}: {
  onChange: (nextValue: T) => void;
  options: readonly { label: string; value: T }[];
  value: T;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors',
            option.value === value
              ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
              : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-subtle)]',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ChoiceSelector({
  choices,
  selectedChoiceId,
  onSelect,
}: {
  choices: readonly DiningFeedbackChoice[];
  onSelect: (choiceId: string) => void;
  selectedChoiceId: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      {choices.map((choice) => {
        const isActive = selectedChoiceId === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            onClick={() => onSelect(choice.id)}
            className={cn(
              'rounded-[var(--tb-radius-14)] border px-3 py-3 text-left transition-colors',
              isActive
                ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-surface-base)]'
                : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-overlay)]',
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-[2px] size-[14px] rounded-full border transition-colors',
                  isActive
                    ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)]'
                    : 'border-[var(--tb-color-border-disabled)] bg-transparent',
                )}
              />
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                  {choice.label}
                </span>
                <span className="text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                  {choice.reason}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function getChoiceMappedRating(dish: DiningDishMetadata, choiceId: string) {
  const choiceIndex = dish.feedbackChoices.findIndex((choice) => choice.id === choiceId);

  if (choiceIndex === dish.feedbackChoices.length - 1) {
    return 5;
  }

  if (choiceIndex <= 0) {
    return 2;
  }

  return 3;
}

function getSelectedChoice(dish: DiningDishMetadata, draft: DiningFeedbackDraft) {
  const selectedChoiceId = draft.dishResponses[dish.id]?.selectedChoiceId;
  return dish.feedbackChoices.find((choice) => choice.id === selectedChoiceId) ?? dish.feedbackChoices[0];
}

function softenRecommendationCopy(recommendation: string) {
  return recommendation
    .replace(/해보세요\./g, '하는 방향이 더 잘 맞을 수 있어요.')
    .replace(/좋습니다\./g, '좋을 수 있어요.')
    .replace(/편이 좋습니다\./g, '편이 더 잘 맞을 수 있어요.')
    .replace(/편이 좋습니다/g, '편이 더 잘 맞을 수 있어요');
}

function getTasteCounts(choices: DiningFeedbackChoice[]) {
  const counts = new Map<string, number>();

  for (const choice of choices) {
    for (const taste of choice.affectedTastes) {
      counts.set(taste, (counts.get(taste) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([taste]) => taste);
}

function buildAnalysisSummary(
  scenario: DiningFeedbackScenario,
  draft: DiningFeedbackDraft,
  measurementSnapshot: TasteMeasurementSnapshot,
) {
  const strongestTaste = getStrongestTasteMeasurement(measurementSnapshot);
  const weakestTaste = getWeakestTasteMeasurement(measurementSnapshot);
  const selectedChoices = scenario.dishes.map((dish) => getSelectedChoice(dish, draft));
  const topAffectedTastes = getTasteCounts(selectedChoices).slice(0, 3);
  const mostFrictionDish = scenario.dishes
    .map((dish) => ({
      dish,
      response: draft.dishResponses[dish.id],
    }))
    .sort((left, right) => left.response.rating - right.response.rating)[0];
  const mostFrictionChoice = getSelectedChoice(mostFrictionDish.dish, draft);
  const bestAlignedDish = scenario.dishes
    .map((dish) => ({
      dish,
      response: draft.dishResponses[dish.id],
    }))
    .sort((left, right) => right.response.rating - left.response.rating)[0];
  const bestAlignedChoice = getSelectedChoice(bestAlignedDish.dish, draft);

  return {
    profileStage: 'Building Profile',
    strongestTaste,
    weakestTaste,
    mostFrictionChoice,
    mostFrictionDish: mostFrictionDish.dish,
    bestAlignedChoice,
    bestAlignedDish: bestAlignedDish.dish,
    topAffectedTastes,
    summaryTitle: '이번 피드백으로 현재 프로필이 한 단계 더 정교해졌어요',
    summary: `${bestAlignedDish.dish.title}에서 잘 맞은 인상과 ${mostFrictionDish.dish.title}에서 남은 마찰이 함께 반영되면서, 다음 예약은 더 자연스럽게 맞출 수 있는 방향으로 정리됐어요.`,
    changes: [
      {
        title: '더 선명해진 이해',
        body: `${bestAlignedDish.dish.title}에서는 ${bestAlignedChoice.label} 방향이 잘 맞았고, ${strongestTaste.label}은 현재 더 또렷하게 반응하는 포인트로 정리됐어요.`,
      },
      {
        title: '이번에 다듬어진 지점',
        body: `${mostFrictionDish.dish.title}에서는 ${mostFrictionChoice.label} 인상이 남았어요. 다음에는 ${weakestTaste.label}의 연결감과 피니시 정리를 더 섬세하게 맞출 수 있어요.`,
      },
      {
        title: '다음 다이닝 반영',
        body: softenRecommendationCopy(mostFrictionChoice.recommendation),
      },
    ],
    chefReadySummary: `${strongestTaste.label}처럼 강하게 느껴진 포인트는 겹치지 않게 정리하고, ${weakestTaste.label}처럼 짧게 남은 포인트는 더 자연스럽게 이어지는 방향이 현재 가장 잘 맞는 흐름으로 읽혀요.`,
    learningLoop: '이 피드백은 다음 예약, 셰프용 캘리브레이션, 이후 프로필 업데이트에 함께 반영됩니다.',
    progressSteps: [
      { label: 'Starter Profile', caption: '첫 해석' },
      { label: 'Building Profile', caption: '현재 단계' },
      { label: 'Refined Profile', caption: '반복될수록' },
    ] as const,
  };
}

interface DiningFeedbackScreenProps {
  draft: DiningFeedbackDraft;
  onBack: () => void;
  onChange: (nextDraft: DiningFeedbackDraft) => void;
  onSubmit: () => void;
  scenario: DiningFeedbackScenario;
}

export function DiningFeedbackScreen({
  draft,
  onBack,
  onChange,
  onSubmit,
  scenario,
}: DiningFeedbackScreenProps) {
  const updateDishResponse = (
    dishId: string,
    nextPartial: Partial<DiningFeedbackDraft['dishResponses'][string]>,
  ) => {
    onChange({
      ...draft,
      dishResponses: {
        ...draft.dishResponses,
        [dishId]: {
          ...draft.dishResponses[dishId],
          ...nextPartial,
        },
      },
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--tb-color-bg-page)] animate-slideIn">
      <TopAppBar title="식후 피드백" showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pt-6 pb-[168px]">
          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <InfoPill>약 30초</InfoPill>
                  <InfoPill>다음 다이닝 반영</InfoPill>
                </div>
                <div>
                  <h1 className="text-[18px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                    이번 인상을 남기면
                    <br />
                    다음 다이닝이 더 잘 맞아집니다
                  </h1>
                  <p className={`mt-2 ${feedbackBodyClass}`}>
                    만족도 조사보다, 무엇이 잘 맞았고 어디를 더 다듬으면 좋을지 배우기 위한 짧은
                    반영 단계예요. 남겨주신 피드백은 다음 예약과 셰프용 캘리브레이션에 바로
                    연결됩니다.
                  </p>
                </div>
                <p className="text-[12px] font-medium text-[var(--tb-color-text-faint)]">
                  {scenario.courseName} · {scenario.restaurant}
                </p>
              </div>
              <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[var(--tb-radius-14)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
                <MessageSquareText size={ICON_TOKENS.size.lg} />
              </div>
            </div>
          </SectionCard>

          <PageSection title="짧은 전체 인상" titleSize="md">
            <SectionCard hoverEffect={false}>
              <div className="w-full">
                <p className={feedbackSectionLabelClass}>이번 식사는 전반적으로 어땠나요?</p>
                <div className="mt-3">
                  <QuickOptionGroup
                    value={draft.overallRating}
                    onChange={(overallRating) => onChange({ ...draft, overallRating })}
                    options={overallExperienceOptions}
                  />
                </div>
              </div>

              <div className="w-full">
                <p className={feedbackSectionLabelClass}>다음 예약도 이 방향으로 가고 싶나요?</p>
                <div className="mt-3">
                  <QuickOptionGroup
                    value={draft.returnIntent}
                    onChange={(returnIntent) => onChange({ ...draft, returnIntent })}
                    options={returnIntentOptions.map((option) => ({
                      label: option.label,
                      value: option.id,
                    }))}
                  />
                </div>
              </div>

              <div className="w-full">
                <p className={feedbackSectionLabelClass}>한 줄 메모</p>
                <p className={`mt-1 ${feedbackHintClass}`}>선택사항이에요. 가장 기억에 남은 한 가지면 충분합니다.</p>
                <textarea
                  value={draft.overallComment}
                  onChange={(event) =>
                    onChange({
                      ...draft,
                      overallComment: event.target.value,
                    })
                  }
                  className="mt-3 min-h-[92px] w-full resize-none rounded-[var(--tb-radius-14)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-4 py-3 text-[13px] text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
                  placeholder="예: 메인 이후의 무게감은 조금 빨리 쌓였고, 디저트는 마무리가 더 선명하면 좋겠어요."
                />
              </div>
            </SectionCard>
          </PageSection>

          <PageSection title="코스별 짧은 반영" titleSize="md">
            <p className="mb-3 text-[12px] leading-relaxed text-[var(--tb-color-text-faint)]">
              모든 코스를 길게 평가할 필요는 없어요. 각 코스에서 가장 가까운 인상만 골라주시면
              다음 다이닝을 더 잘 맞출 수 있습니다.
            </p>

            <div className="flex flex-col gap-3">
              {scenario.dishes.map((dish) => {
                const response = draft.dishResponses[dish.id];

                return (
                  <SectionCard
                    key={dish.id}
                    hoverEffect={false}
                    className="bg-[var(--tb-color-surface-muted)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <span className={feedbackLabelClass}>{dish.courseLabel}</span>
                        <div>
                          <h2 className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">
                            {dish.title}
                          </h2>
                          <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">
                            {dish.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-base)] px-4 py-3">
                      <p className={feedbackHintClass}>셰프가 의도한 방향</p>
                      <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                        {dish.chefIntent}
                      </p>
                    </div>

                    <div className="w-full">
                      <p className={feedbackSectionLabelClass}>가장 가까운 인상</p>
                      <div className="mt-3">
                        <ChoiceSelector
                          choices={dish.feedbackChoices}
                          selectedChoiceId={response.selectedChoiceId}
                          onSelect={(selectedChoiceId) =>
                            updateDishResponse(dish.id, {
                              selectedChoiceId,
                              rating: getChoiceMappedRating(dish, selectedChoiceId),
                            })
                          }
                        />
                      </div>
                    </div>

                    <p className="w-full text-[11px] leading-relaxed text-[var(--tb-color-text-faint)]">
                      선택한 인상은 다음 예약의 프로필 정교화와 셰프용 가이드에 함께 반영돼요.
                    </p>
                  </SectionCard>
                );
              })}
            </div>
          </PageSection>
        </div>
      </div>

      <FlowBottomCta
        actionLabel="다음 다이닝에 반영하기"
        helperText="저장 후 바로 어떤 점이 다음 다이닝에 반영되는지 확인할 수 있어요."
        onAction={onSubmit}
      />
    </div>
  );
}

interface DiningAiAnalysisScreenProps {
  draft: DiningFeedbackDraft;
  measurementSnapshot: TasteMeasurementSnapshot;
  onBack: () => void;
  onClose: () => void;
  scenario: DiningFeedbackScenario;
}

export function DiningAiAnalysisScreen({
  draft,
  measurementSnapshot,
  onBack,
  onClose,
  scenario,
}: DiningAiAnalysisScreenProps) {
  const summary = buildAnalysisSummary(scenario, draft, measurementSnapshot);

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--tb-color-bg-page)] animate-slideIn">
      <TopAppBar title="프로필 정교화" showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="tb-section-stack px-5 pt-6 pb-[168px]">
          <SectionCard
            hoverEffect={false}
            className="bg-[var(--tb-color-surface-muted)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <OutlineBadge>{summary.profileStage}</OutlineBadge>
                <div>
                  <h1 className="text-[18px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                    프로필이 업데이트됐습니다
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    다음 예약 추천에 반영할 수 있는 최신 프로필이 준비됐어요.
                  </p>
                </div>
              </div>
              <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[var(--tb-radius-14)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
                <CheckCircle2 size={ICON_TOKENS.size.lg} />
              </div>
            </div>

            <div className="w-full rounded-[var(--tb-radius-20)] bg-[var(--tb-color-surface-base)] px-4 py-4">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">{summary.summaryTitle}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">{summary.summary}</p>
            </div>
          </SectionCard>

          <PageSection title="프로필 변화 요약" titleSize="md">
            <div className="grid grid-cols-1 gap-3">
              {summary.changes.map((note, index) => {
                const Icon = index === 0 ? Sparkles : index === 1 ? ChefHat : MessageSquareText;
                const iconClass =
                  index === 0
                    ? 'bg-[var(--tb-taste-sweet-bg)] text-[var(--tb-taste-sweet-main)]'
                    : index === 1
                      ? 'bg-[var(--tb-taste-salty-bg)] text-[var(--tb-taste-salty-main)]'
                      : 'bg-[var(--tb-taste-umami-bg)] text-[var(--tb-taste-umami-main)]';

                return (
                  <SectionCard key={note.title} hoverEffect={false}>
                    <div className="flex items-start gap-3">
                      <CardIconBox className={iconClass}>
                        <Icon size={ICON_TOKENS.size.md} />
                      </CardIconBox>
                      <div className="flex flex-col gap-1">
                        <p className={feedbackHintClass}>{note.title}</p>
                        <p className="text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-tertiary)]">
                          {note.body}
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </PageSection>

          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-4">
              <div>
                <p className={feedbackHintClass}>Confidence</p>
                <h2 className="mt-2 text-[18px] font-bold text-[var(--tb-color-text-primary)]">
                  반복될수록 더 선명해지는 Building Profile 단계예요
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {summary.progressSteps.map((step, index) => {
                  const isCurrent = index === 1;

                  return (
                    <div
                      key={step.label}
                      className={cn(
                        'rounded-[16px] border px-3 py-3',
                        isCurrent
                          ? 'border-[var(--tb-color-text-secondary)] bg-[var(--tb-color-surface-muted)]'
                          : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)]',
                      )}
                    >
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        {step.label}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                        {step.caption}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                {summary.learningLoop}
              </p>
            </div>
          </SectionCard>

          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex items-start gap-3">
              <CardIconBox className="bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
                <ChefHat size={ICON_TOKENS.size.md} />
              </CardIconBox>
              <div className="flex flex-col gap-1">
                <p className={feedbackHintClass}>셰프용 현재 요약</p>
                <p className="text-[13px] font-normal leading-relaxed text-[var(--tb-color-text-tertiary)]">
                  {summary.chefReadySummary}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {summary.topAffectedTastes.map((taste) => (
                    <TasteChip key={taste} taste={taste} />
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <FlowBottomCta
        actionLabel="예약 상세로 돌아가기"
        helperText="다음 예약과 프로필 업데이트에 자동 반영됩니다."
        onAction={onClose}
      />
    </div>
  );
}
