import { Sparkles, ChefHat, MessageSquareText } from 'lucide-react';

import SectionCard from '../SectionCard';
import TopAppBar from '../TopAppBar';
import OutlineBadge from '../system/OutlineBadge';
import PrimaryButton from '../system/PrimaryButton';
import SectionTitle from '../system/SectionTitle';
import TasteChip from '../system/TasteChip';
import {
  type DiningDishMetadata,
  type DiningFeedbackChoice,
  type DiningFeedbackDraft,
  type DiningFeedbackScenario,
} from '../../constants/diningFeedbackData';
import {
  formatMeasurementValue,
  getAverageMeasurementMm,
  getStrongestTasteMeasurement,
  getTasteProfileBadge,
  getWeakestTasteMeasurement,
  type TasteMeasurementSnapshot,
} from '../../constants/tasteMeasurementData';
import { cn } from '../ui/utils';

const returnIntentOptions = [
  { id: 'yes', label: '다시 먹고 싶어요' },
  { id: 'maybe', label: '부분 조정 후 다시' },
  { id: 'no', label: '다른 방향이 좋아요' },
] as const;

const feedbackLabelClass = 'self-start text-left text-[14px] font-semibold text-[var(--tb-color-text-subtle)]';
const feedbackSectionLabelClass = 'text-[12px] font-semibold text-[var(--tb-color-text-muted)]';
const feedbackBodyClass = 'text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]';
const feedbackHintClass = 'text-[12px] font-medium text-[var(--tb-color-text-faint)]';

function MetaPill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'subtle';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium',
        tone === 'default'
          ? 'bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-subtle)]'
          : 'bg-[var(--tb-color-surface-overlay)] text-[var(--tb-color-text-muted)]',
      )}
    >
      {children}
    </span>
  );
}

function RatingSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (nextValue: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((score) => {
        const isActive = score <= value;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={cn(
              'flex size-[28px] items-center justify-center rounded-full border text-[11px] font-semibold transition-colors',
              isActive
                ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
                : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-faint)]',
            )}
          >
            {score}
          </button>
        );
      })}
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
                <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">{choice.label}</span>
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

function getSelectedChoice(
  dish: DiningDishMetadata,
  draft: DiningFeedbackDraft,
) {
  const selectedChoiceId = draft.dishResponses[dish.id]?.selectedChoiceId;
  return dish.feedbackChoices.find((choice) => choice.id === selectedChoiceId) ?? dish.feedbackChoices[0];
}

function buildAnalysisSummary(
  scenario: DiningFeedbackScenario,
  draft: DiningFeedbackDraft,
  measurementSnapshot: TasteMeasurementSnapshot,
) {
  const strongestTaste = getStrongestTasteMeasurement(measurementSnapshot);
  const weakestTaste = getWeakestTasteMeasurement(measurementSnapshot);
  const mostFrictionDish = scenario.dishes
    .map((dish) => ({
      dish,
      response: draft.dishResponses[dish.id],
    }))
    .sort((left, right) => left.response.rating - right.response.rating)[0];
  const mostFrictionChoice = getSelectedChoice(mostFrictionDish.dish, draft);

  return {
    profileBadge: getTasteProfileBadge(getAverageMeasurementMm(measurementSnapshot)),
    strongestTaste,
    summary:
      `${strongestTaste.label} 민감도가 높은 편이라 ${mostFrictionDish.dish.title}에서 겹친 맛이 더 크게 느껴졌고, ` +
      `${weakestTaste.label} 민감도가 상대적으로 낮아 코스 후반의 깊은 감칠맛은 짧게 인지되었을 가능성이 높아요.`,
    summaryTitle:
      draft.overallRating >= 4
        ? '전반적으로 잘 맞았지만 후반 코스의 미세 조정 여지가 보여요'
        : '메인 이후의 무게감과 디저트의 당도에서 뚜렷한 마찰이 있었어요',
    weakestTaste,
    mostFrictionChoice,
    mostFrictionDish: mostFrictionDish.dish,
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
    <div className="relative flex h-full w-full flex-col bg-white animate-slideIn">
      <TopAppBar title="식후 피드백" showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-6 px-5 pt-6 pb-[160px]">
          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className={feedbackLabelClass}>
                  {scenario.courseName}
                </span>
                <div>
                  <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                    이번 다이닝이<br />어떻게 느껴졌는지 알려주세요
                  </h1>
                  <p className={`mt-2 ${feedbackBodyClass}`}>
                    {scenario.postDiningPrompt}
                  </p>
                </div>
              </div>
              <div className="flex size-[48px] shrink-0 items-center justify-center rounded-[var(--tb-radius-14)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
                <MessageSquareText size={22} />
              </div>
            </div>
          </SectionCard>

          <div>
            <SectionTitle className="mb-3">전체 경험</SectionTitle>
            <SectionCard hoverEffect={false}>
              <div className="w-full">
                <p className={feedbackSectionLabelClass}>전체 만족도</p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <RatingSelector
                    value={draft.overallRating}
                    onChange={(overallRating) => onChange({ ...draft, overallRating })}
                  />
                  <span className={feedbackHintClass}>
                    1 아쉬움 · 5 만족
                  </span>
                </div>
              </div>

              <div className="w-full">
                <p className={feedbackSectionLabelClass}>다시 먹고 싶은가요?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {returnIntentOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...draft,
                          returnIntent: option.id,
                        })
                      }
                      className={cn(
                        'rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors',
                        draft.returnIntent === option.id
                          ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
                          : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-subtle)]',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full">
                <p className={feedbackSectionLabelClass}>한 줄 메모</p>
                <textarea
                  value={draft.overallComment}
                  onChange={(event) =>
                    onChange({
                      ...draft,
                      overallComment: event.target.value,
                    })
                  }
                  className="mt-3 min-h-[100px] w-full resize-none rounded-[var(--tb-radius-14)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-4 py-3 text-[13px] text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-disabled)]"
                  placeholder="예: 메인 이후의 무게감이 조금 빠르게 쌓였고, 디저트는 당도가 먼저 느껴졌어요."
                />
              </div>
            </SectionCard>
          </div>

          <div>
            <SectionTitle className="mb-3">코스별 인상</SectionTitle>
            <div className="flex flex-col gap-4">
              {scenario.dishes.map((dish) => {
                const response = draft.dishResponses[dish.id];

                return (
                  <SectionCard key={dish.id} hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <span className={feedbackLabelClass}>{dish.courseLabel}</span>
                        <div>
                          <h2 className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">{dish.title}</h2>
                          <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">{dish.subtitle}</p>
                        </div>
                      </div>
                    </div>

                    <p className="w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-base)] px-4 py-3 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      {dish.chefIntent}
                    </p>

                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex flex-wrap gap-2">
                        {dish.ingredients.map((ingredient) => (
                          <MetaPill key={ingredient}>{ingredient}</MetaPill>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dish.techniques.map((technique) => (
                          <MetaPill key={technique} tone="subtle">
                            {technique}
                          </MetaPill>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dish.flavorNotes.map((note) => (
                          <MetaPill key={note} tone="subtle">
                            {note}
                          </MetaPill>
                        ))}
                      </div>
                    </div>

                    <div className="w-full">
                      <p className={feedbackSectionLabelClass}>코스 만족도</p>
                      <div className="mt-3">
                        <RatingSelector
                          value={response.rating}
                          onChange={(rating) => updateDishResponse(dish.id, { rating })}
                        />
                      </div>
                    </div>

                    <div className="w-full">
                      <p className={feedbackSectionLabelClass}>가장 가까운 인상</p>
                      <div className="mt-3">
                        <ChoiceSelector
                          choices={dish.feedbackChoices}
                          selectedChoiceId={response.selectedChoiceId}
                          onSelect={(selectedChoiceId) =>
                            updateDishResponse(dish.id, { selectedChoiceId })
                          }
                        />
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="tb-bottom-fade absolute bottom-0 left-0 right-0 z-20 flex min-h-[140px] w-full flex-col items-center justify-end px-5 pb-10">
        <PrimaryButton onClick={onSubmit}>AI 해석 보기</PrimaryButton>
      </div>
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
    <div className="relative flex h-full w-full flex-col bg-white animate-slideIn">
      <TopAppBar title="AI 해석 결과" showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-6 px-5 pt-6 pb-[160px]">
          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <OutlineBadge className="border-white/20 text-white">{summary.profileBadge}</OutlineBadge>
                <div>
                  <h1 className="text-[24px] font-bold leading-tight tracking-tight">
                    AI가 이번 코스를<br />이렇게 읽었어요
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/72">
                    {summary.summaryTitle}
                  </p>
                </div>
              </div>
              <div className="flex size-[48px] shrink-0 items-center justify-center rounded-[var(--tb-radius-14)] bg-white/10 text-white">
                <Sparkles size={22} />
              </div>
            </div>
            <p className="w-full rounded-[var(--tb-radius-20)] bg-white/8 px-4 py-4 text-[13px] leading-relaxed text-white/80">
              {summary.summary}
            </p>
          </SectionCard>

          <div className="grid grid-cols-1 gap-3">
            <SectionCard hoverEffect={false}>
              <div className="flex items-start gap-3">
                <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[var(--tb-radius-14)] bg-[var(--tb-taste-sweet-bg)] text-[var(--tb-taste-sweet-main)]">
                  <Sparkles size={18} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className={feedbackHintClass}>프로필 충돌 지점</p>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    {summary.strongestTaste.label} 민감도가 높아 {summary.mostFrictionDish.title}에서 선택한
                    인상이 더 크게 증폭됐어요.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard hoverEffect={false}>
              <div className="flex items-start gap-3">
                <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[var(--tb-radius-14)] bg-[var(--tb-taste-salty-bg)] text-[var(--tb-taste-salty-main)]">
                  <ChefHat size={18} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className={feedbackHintClass}>재료 궁합 해석</p>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    {summary.mostFrictionChoice.reason}
                  </p>
                  <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    {summary.mostFrictionChoice.ingredientPairing}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard hoverEffect={false}>
              <div className="flex items-start gap-3">
                <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[var(--tb-radius-14)] bg-[var(--tb-taste-umami-bg)] text-[var(--tb-taste-umami-main)]">
                  <MessageSquareText size={18} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className={feedbackHintClass}>다음 보정 제안</p>
                  <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    {summary.mostFrictionChoice.recommendation}
                  </p>
                  <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    약한 축인 {summary.weakestTaste.label}은 더 명확하게, 강한 축인 {summary.strongestTaste.label}
                    은 겹치지 않게 분리하는 방향이 유효합니다.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div>
            <SectionTitle className="mb-3">코스별 상세 해석</SectionTitle>
            <div className="flex flex-col gap-4">
              {scenario.dishes.map((dish) => {
                const response = draft.dishResponses[dish.id];
                const selectedChoice = getSelectedChoice(dish, draft);

                return (
                  <SectionCard key={dish.id} hoverEffect={false}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <OutlineBadge>{dish.courseLabel}</OutlineBadge>
                        <div>
                          <h2 className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">{dish.title}</h2>
                          <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">{dish.subtitle}</p>
                        </div>
                      </div>
                      <div className="rounded-full bg-[var(--tb-color-surface-muted)] px-3 py-2 text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        만족도 {response.rating}/5
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedChoice.affectedTastes.map((taste) => (
                        <TasteChip key={taste} taste={taste} />
                      ))}
                    </div>

                    <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 py-4">
                      <p className={feedbackHintClass}>당신이 남긴 인상</p>
                      <p className="mt-2 text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{selectedChoice.label}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-base)] px-4 py-4">
                        <p className={feedbackHintClass}>왜 그렇게 느껴졌는지</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">{selectedChoice.reason}</p>
                      </div>
                      <div className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-base)] px-4 py-4">
                        <p className={feedbackHintClass}>레시피 조정 제안</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                          {selectedChoice.recommendation}
                        </p>
                        <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          재료 궁합 힌트: {selectedChoice.ingredientPairing}
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </div>

          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex items-start gap-3">
              <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[var(--tb-radius-14)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
                <ChefHat size={18} />
              </div>
              <div className="flex flex-col gap-1">
                <p className={feedbackHintClass}>셰프에게 전달될 한 줄 요약</p>
                <p className="text-[14px] font-semibold leading-relaxed text-[var(--tb-color-text-primary)]">
                  코스 후반은 무게감을 조금 덜어내고, 발효 감칠맛은 더 길게, 디저트는 산미를 보강하는 방향이 가장 잘 맞습니다.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="tb-bottom-fade absolute bottom-0 left-0 right-0 z-20 flex min-h-[140px] w-full flex-col items-center justify-end px-5 pb-10 gap-2">
        <PrimaryButton onClick={onClose}>예약 상세로 돌아가기</PrimaryButton>
      </div>
    </div>
  );
}
