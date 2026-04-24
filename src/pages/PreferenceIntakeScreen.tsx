import {
  ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

import OutlineBadge from '../components/system/OutlineBadge';
import FlowHeaderBlock from '../components/system/FlowHeaderBlock';
import FlowStepCta from '../components/system/FlowStepCta';
import SelectionCard from '../components/system/SelectionCard';
import StepBadge from '../components/system/StepBadge';
import { MOTION_TOKENS, ICON_TOKENS } from '../constants/designTokens';
import {
  buildPreferenceIntakeProfile,
  createPreferenceIntakeResponsesFromProfile,
  getNextPreferenceMultiSelectValue,
  isPreferenceQuestionAnswered,
  PREFERENCE_INTAKE_QUESTIONS,
  type PreferenceIntakeProfile,
  type PreferenceIntakeQuestion,
  type PreferenceIntakeResponses,
} from '../constants/preferenceIntakeData';
import { cn } from '../components/ui/utils';

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
  'bg-white/88 supports-[backdrop-filter:blur(0px)]:bg-white/78 border-b border-[var(--tb-color-border-subtle)] backdrop-blur-md';

interface PreferenceIntakeScreenProps {
  initialProfile?: PreferenceIntakeProfile | null;
  onBack: () => void;
  onComplete: (profile: PreferenceIntakeProfile) => void;
}

function getSelectionCount(question: PreferenceIntakeQuestion, responses: PreferenceIntakeResponses) {
  const currentValue = responses[question.id];

  return Array.isArray(currentValue)
    ? currentValue.length
    : typeof currentValue === 'string' && currentValue.length > 0
      ? 1
      : 0;
}

export default function PreferenceIntakeScreen({
  initialProfile = null,
  onBack,
  onComplete,
}: PreferenceIntakeScreenProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [responses, setResponses] = useState<PreferenceIntakeResponses>(() =>
    createPreferenceIntakeResponsesFromProfile(initialProfile),
  );

  const currentQuestion = PREFERENCE_INTAKE_QUESTIONS[questionIndex];
  const currentValue = responses[currentQuestion.id];
  const isLastQuestion = questionIndex === PREFERENCE_INTAKE_QUESTIONS.length - 1;
  const canContinue = isPreferenceQuestionAnswered(currentQuestion, responses);
  const selectionCount = getSelectionCount(currentQuestion, responses);

  const helperText = useMemo(() => {
    if (!canContinue && currentQuestion.minSelections && selectionCount < currentQuestion.minSelections) {
      return `최소 ${currentQuestion.minSelections}개를 골라주세요`;
    }

    if (currentQuestion.selectionMode === 'multiple' && currentQuestion.maxSelections) {
      return `${selectionCount}/${currentQuestion.maxSelections} 선택`;
    }

    return '이 답변은 나중에 프로필에서 다시 바꿀 수 있어요';
  }, [canContinue, currentQuestion, selectionCount]);

  const handleBack = () => {
    if (questionIndex === 0) {
      onBack();
      return;
    }

    setDirection(-1);
    setQuestionIndex((currentIndex) => currentIndex - 1);
  };

  const handleNext = () => {
    if (!canContinue) {
      return;
    }

    if (isLastQuestion) {
      onComplete(buildPreferenceIntakeProfile(responses));
      return;
    }

    setDirection(1);
    setQuestionIndex((currentIndex) => currentIndex + 1);
  };

  const handleOptionSelect = (optionId: string) => {
    setResponses((currentResponses) => {
      if (currentQuestion.selectionMode === 'single') {
        return {
          ...currentResponses,
          [currentQuestion.id]: optionId,
        } as PreferenceIntakeResponses;
      }

      const nextValue = getNextPreferenceMultiSelectValue(
        currentQuestion,
        Array.isArray(currentResponses[currentQuestion.id])
          ? (currentResponses[currentQuestion.id] as string[])
          : [],
        optionId,
      );

      return {
        ...currentResponses,
        [currentQuestion.id]: nextValue,
      } as PreferenceIntakeResponses;
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white font-sans">
      <header className="z-30 flex w-full shrink-0 justify-center">
        <div
          className={cn(
            'w-full max-w-[var(--tb-layout-screen-max-width)]',
            HEADER_SURFACE_CLASS,
          )}
          style={{ paddingTop: 'var(--tb-safe-area-top)' }}
        >
          <div className="relative flex min-h-[var(--tb-size-top-app-bar-height)] items-center justify-between px-5">
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-[var(--tb-color-text-primary)]">
              사전 조사
            </span>
            <button
              type="button"
              onClick={handleBack}
              aria-label={questionIndex === 0 ? '서비스 설명으로 돌아가기' : '이전 질문으로 돌아가기'}
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-opacity active:opacity-70"
              style={{
                width: APP_CHROME_ICON_BUTTON_SIZE,
                height: APP_CHROME_ICON_BUTTON_SIZE,
              }}
            >
              <ChevronLeft strokeWidth={1.5} size={APP_CHROME_ICON_SIZE} />
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
            initial={{ opacity: 0, x: direction > 0 ? MOTION_TOKENS.distance.medium : -MOTION_TOKENS.distance.medium }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -MOTION_TOKENS.distance.medium : MOTION_TOKENS.distance.medium }}
            transition={{ duration: 0.28 }}
            className="absolute inset-0 overflow-y-auto px-5 pt-4 no-scrollbar"
            style={{ paddingBottom: CONTENT_BOTTOM_PADDING }}
          >
            <div className="tb-section-stack">
              <FlowHeaderBlock
                description={currentQuestion.description}
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

              <div
                className={cn(
                  currentQuestion.gridColumns === 2
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
                    : 'tb-card-stack',
                )}
              >
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
                      onClick={() => handleOptionSelect(option.id)}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <FlowStepCta
        actionDisabled={!canContinue}
        actionLabel={isLastQuestion ? '미각 질문으로 이어가기' : '다음 질문'}
        currentIndex={questionIndex}
        helperText={helperText}
        onAction={handleNext}
        total={PREFERENCE_INTAKE_QUESTIONS.length}
      />
    </div>
  );
}
