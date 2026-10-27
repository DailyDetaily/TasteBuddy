import {
  ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

import OutlineBadge from '../components/system/OutlineBadge';
import FlowHeaderBlock from '../components/system/FlowHeaderBlock';
import PrimaryButton from '../components/system/PrimaryButton';
import StepIndicator from '../components/system/StepIndicator';
import SelectionCard from '../components/system/SelectionCard';
import StepBadge from '../components/system/StepBadge';
import StatusChip from '../components/system/StatusChip';
import { ICON_TOKENS } from '../constants/designTokens';
import { COLOR_TOKENS } from '../constants/uiColorTokens';
import {
  buildPreferenceIntakeProfile,
  createPreferenceIntakeResponsesFromProfile,
  getNextPreferenceMultiSelectValue,
  isPreferenceQuestionAnswered,
  PREFERENCE_INTAKE_QUESTIONS,
  type PreferenceIntakeProfile,
  type PreferenceIntakeResponses,
} from '../constants/preferenceIntakeData';
import { cn } from '../components/ui/utils';
import { createPreferenceIntakeSubmission } from '../lib/preferenceIntakeEvidence.mjs';
import type { PreferenceIntakeSubmission } from '../types/preferenceIntakeEvidence';

const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...props }: any) => (
  <Icon
    {...props}
    className={className}
    style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }}
  />
);

const ChevronLeft = wrapIcon(ChevronLeftIcon);

const APP_CHROME_ICON_SIZE = ICON_TOKENS.size.lg;
const APP_CHROME_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;
const CONTENT_BOTTOM_PADDING = 'calc(188px + var(--tb-safe-area-bottom))';
const HEADER_SURFACE_CLASS =
  'bg-[var(--tb-color-surface-overlay)] backdrop-blur-md';

interface PreferenceIntakeScreenProps {
  initialProfile?: PreferenceIntakeProfile | null;
  initialResponses?: PreferenceIntakeResponses;
  onDraft?: (responses:PreferenceIntakeResponses)=>Promise<unknown>;
  userID?: string;
  onBack: () => void;
  onComplete: (profile: PreferenceIntakeProfile) => void | Promise<void>;
}

export default function PreferenceIntakeScreen({
  initialProfile = null,
  userID = 'local-owner',
  initialResponses, onDraft,
  onBack,
  onComplete,
}: PreferenceIntakeScreenProps) {
  const [saving,setSaving]=useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const [responses, setResponses] = useState<PreferenceIntakeResponses>(() =>
    initialResponses ?? createPreferenceIntakeResponsesFromProfile(initialProfile, userID),
  );

  const currentQuestion = PREFERENCE_INTAKE_QUESTIONS[questionIndex];
  const currentValue = responses[currentQuestion.id];
  const isLastQuestion = questionIndex === PREFERENCE_INTAKE_QUESTIONS.length - 1;
  const canContinue = isPreferenceQuestionAnswered(currentQuestion, responses);
  const selectionCount = Array.isArray(currentValue) ? currentValue.length : currentValue ? 1 : 0;
  const helperText = !canContinue && currentQuestion.minSelections != null && selectionCount < currentQuestion.minSelections
    ? `최소 ${currentQuestion.minSelections}개를 골라주세요`
    : currentQuestion.selectionMode === 'multiple' && currentQuestion.maxSelections != null
      ? `${selectionCount}/${currentQuestion.maxSelections} 선택`
      : '나의 입맛 화면에서 다시 바꿀 수 있어요';
  const handleBack = () => {
    if (questionIndex === 0) {
      onBack();
      return;
    }

    setQuestionIndex((currentIndex) => currentIndex - 1);
  };

  const handleNext = async () => {
    if (!canContinue || saving) {
      return;
    }

    if (isLastQuestion) {
      setSaving(true);
      try {
        if (!PREFERENCE_INTAKE_QUESTIONS.every(question => isPreferenceQuestionAnswered(question, responses))) throw new Error('INCOMPLETE_PREFERENCE_INTAKE');
        const submission = createPreferenceIntakeSubmission(responses, { userID }) as PreferenceIntakeSubmission;
        await onComplete({ ...buildPreferenceIntakeProfile(responses), submissions: [...(initialProfile?.submissions ?? []), submission] });
        setSaveError(null);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : '응답을 저장하지 못했어요. 선택은 유지되어 있어요.');
      } finally {setSaving(false);}
      return;
    }

    setQuestionIndex((currentIndex) => currentIndex + 1);
  };

  const handleOptionSelect = (optionId: string) => {
    if(saving)return;
    const next = currentQuestion.selectionMode === 'single'
      ? {...responses,[currentQuestion.id]:optionId}
      : {...responses,[currentQuestion.id]:getNextPreferenceMultiSelectValue(currentQuestion,Array.isArray(responses[currentQuestion.id])?responses[currentQuestion.id] as string[]:[],optionId)};
    setResponses(next as PreferenceIntakeResponses);
    if(onDraft)void onDraft(next as PreferenceIntakeResponses).catch(e=>setSaveError(e instanceof Error?e.message:'초안을 저장하지 못했어요.'));

  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-surface-base)] font-sans">
      <header className="z-30 flex w-full shrink-0 justify-center">
        <div
          className={cn(
            'w-full max-w-[var(--tb-layout-screen-max-width)]',
            HEADER_SURFACE_CLASS,
          )}
          style={{ paddingTop: 'var(--tb-safe-area-top)' }}
        >
          <div className="relative flex min-h-[var(--tb-size-flow-top-bar-height)] items-center justify-between px-5">
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-[var(--tb-color-text-primary)]">
              식사 선호
            </span>
            <button
              type="button"
              onClick={handleBack} disabled={saving}
              aria-label={questionIndex === 0 ? '서비스 설명으로 돌아가기' : '이전 질문으로 돌아가기'}
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-opacity active:opacity-70"
              style={{
                width: APP_CHROME_ICON_BUTTON_SIZE,
                height: APP_CHROME_ICON_BUTTON_SIZE,
              }}
            >
              <ChevronLeft strokeWidth={1.8} size={APP_CHROME_ICON_SIZE} />
            </button>
            <div
              aria-hidden="true"
              style={{
                width: APP_CHROME_ICON_BUTTON_SIZE,
                height: APP_CHROME_ICON_BUTTON_SIZE,
              }}
            />
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28 }}
            className="absolute inset-0 overflow-y-auto px-5 pt-2 no-scrollbar"
            style={{ paddingBottom: CONTENT_BOTTOM_PADDING }}
          >
            <div className="tb-section-stack">
              <FlowHeaderBlock
                description={currentQuestion.description}
                descriptionClassName="leading-[1.2]"
                title={currentQuestion.title}
                titleClassName="leading-tight"
                topLeft={<OutlineBadge>{currentQuestion.eyebrow}</OutlineBadge>}
                topRight={
                  <StepBadge
                    currentIndex={questionIndex}
                    total={PREFERENCE_INTAKE_QUESTIONS.length}
                  />
                }
              />
              {saveError && <p role="alert" className="text-[13px] text-[var(--tb-color-text-body)]">{saveError}</p>}

              <div className="tb-card-stack">
                {currentQuestion.options.map((option) => {
                  const isSelected = Array.isArray(currentValue)
                    ? currentValue.includes(option.id)
                    : currentValue === option.id;

                  return (
                    <SelectionCard
                      key={option.id}
                      description={option.description}
                      indicator="checkbox"
                      selected={isSelected}
                      title={option.label}
                      className="p-[15px] [&>span:nth-child(2)>span]:leading-[1.2]"
                      disabled={saving}
                      trailing={isSelected ? <StatusChip backgroundColor={COLOR_TOKENS.state.successSoft} color={COLOR_TOKENS.state.success}>선택됨</StatusChip> : undefined}
                      onClick={() => handleOptionSelect(option.id)}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
        <div className="w-full max-w-[var(--tb-layout-screen-max-width)]">
          <div className="tb-bottom-fade relative flex min-h-[calc(var(--tb-size-bottom-fade-min-height)+var(--tb-safe-area-bottom))] w-full flex-col items-center justify-end gap-0 px-5 pb-[max(12px,var(--tb-safe-area-bottom))]">
            <StepIndicator
              className="mb-[6px] self-center"
              currentIndex={questionIndex}
              total={PREFERENCE_INTAKE_QUESTIONS.length}
            />
            <p aria-live="polite" className="mb-2 text-center text-[11px] font-medium leading-[14px] text-[var(--tb-color-text-faint)]">{helperText}</p>
            <PrimaryButton disabled={!canContinue || saving} onClick={handleNext}>
              {saving ? '저장 중…' : isLastQuestion ? '선호 저장' : '다음 질문'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
