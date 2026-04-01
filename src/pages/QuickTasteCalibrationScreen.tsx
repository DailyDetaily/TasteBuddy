import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckmarkRegular, ChevronLeftRegular, MoreHorizontalRegular, SparkleRegular } from '@fluentui/react-icons';
const wrapIcon = (Icon: any) => ({ size, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size, width: size, height: size, ...style }} />;
const Check = wrapIcon(CheckmarkRegular);
const ChevronLeft = wrapIcon(ChevronLeftRegular);
const MoreHorizontal = wrapIcon(MoreHorizontalRegular);
const Sparkles = wrapIcon(SparkleRegular);

import tasteCircleVideo from '../assets/video/Taste circle.mp4';
import SectionCard from '../components/SectionCard';
import OutlineBadge from '../components/system/OutlineBadge';
import PrimaryButton from '../components/system/PrimaryButton';
import TasteChip from '../components/system/TasteChip';
import { MOTION_TOKENS, TASTE_TOKENS } from '../constants/designTokens';
import {
  QUICK_TASTE_CALIBRATION_QUESTIONS,
  createQuickTasteCalibrationSnapshot,
  getQuickTasteCalibrationSelections,
  getStarterProfileHighlights,
  type QuickTasteCalibrationResponses,
} from '../constants/quickTasteCalibrationData';
import {
  getTasteMeasurementEntries,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';

interface QuickTasteCalibrationScreenProps {
  onBack: () => void;
  onComplete: (snapshot: TasteMeasurementSnapshot) => void;
}

type CalibrationPhase = 'intro' | 'questions' | 'result';

function toTasteTint(hex: string, alpha = 0.1) {
  const normalized = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((offset) =>
    Number.parseInt(normalized.slice(offset, offset + 2), 16),
  );
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildStarterProfileNarrative(snapshot: TasteMeasurementSnapshot) {
  const entries = getTasteMeasurementEntries(snapshot);
  const { primary, softest } = getStarterProfileHighlights(entries);
  const [firstTaste, secondTaste] = primary;

  return {
    entries,
    headline: `${firstTaste.label}과 ${secondTaste.label}이 비교적 빠르게 드러나는 시작 프로필이에요.`,
    diningHint: `${softest.label}은 강하게 밀어붙이기보다 여유 있게 쌓이는 구성이 더 자연스럽게 느껴질 수 있어요.`,
    primary,
    softest,
  };
}

export default function QuickTasteCalibrationScreen({
  onBack,
  onComplete,
}: QuickTasteCalibrationScreenProps) {
  const [phase, setPhase] = useState<CalibrationPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuickTasteCalibrationResponses>({});

  const currentQuestion = QUICK_TASTE_CALIBRATION_QUESTIONS[questionIndex];
  const selectedOptionId = currentQuestion ? responses[currentQuestion.id] ?? null : null;
  const completedSnapshot = createQuickTasteCalibrationSnapshot(responses);
  const starterProfile = buildStarterProfileNarrative(completedSnapshot);
  const selections = getQuickTasteCalibrationSelections(responses);

  const handleContinue = () => {
    if (phase === 'intro') {
      setPhase('questions');
      return;
    }

    if (phase === 'questions') {
      if (!selectedOptionId) {
        return;
      }

      if (questionIndex < QUICK_TASTE_CALIBRATION_QUESTIONS.length - 1) {
        setQuestionIndex((previousIndex) => previousIndex + 1);
      } else {
        setPhase('result');
      }

      return;
    }

    onComplete(completedSnapshot);
  };

  const handleBack = () => {
    if (phase === 'intro') {
      onBack();
      return;
    }

    if (phase === 'questions') {
      if (questionIndex === 0) {
        setPhase('intro');
      } else {
        setQuestionIndex((previousIndex) => previousIndex - 1);
      }
      return;
    }

    setPhase('questions');
    setQuestionIndex(QUICK_TASTE_CALIBRATION_QUESTIONS.length - 1);
  };

  const buttonLabel =
    phase === 'intro'
      ? '보정 시작하기'
      : phase === 'questions'
        ? questionIndex === QUICK_TASTE_CALIBRATION_QUESTIONS.length - 1
          ? '현재 프로필 보기'
          : '선택하고 계속'
        : '현재 프로필 보기';

  return (
    <div
      className={`relative flex h-full w-full flex-col font-sans ${
        phase === 'result' ? 'bg-[var(--tb-color-bg-page)]' : 'bg-white'
      }`}
    >
      <header
        className={`z-10 flex h-14 items-center justify-between px-4 ${
          phase === 'result' ? 'bg-[var(--tb-color-bg-page)]' : 'bg-white'
        }`}
      >
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-black transition-opacity active:opacity-70"
        >
          {phase === 'intro' ? (
            <span className="px-1 text-[20px] font-light">✕</span>
          ) : (
            <ChevronLeft strokeWidth={1.5} size={28} />
          )}
        </button>
        <button className="p-2 -mr-2 text-black transition-opacity active:opacity-70">
          <MoreHorizontal strokeWidth={1.5} size={24} />
        </button>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="quick-calibration-intro"
              initial={{ opacity: 0, x: MOTION_TOKENS.distance.medium }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -MOTION_TOKENS.distance.medium }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col px-5 pt-8 pb-[160px]"
            >
              <div className="text-center">
                <OutlineBadge>Quick Taste Calibration</OutlineBadge>
                <h1 className="mt-4 whitespace-pre-line text-[26px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                  몇 가지 선택만으로{'\n'}현재 프로필을 시작합니다
                </h1>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-[var(--tb-color-text-body)]">
                  지금의 입맛 경향을 가볍게 보정해,{'\n'}첫 다이닝에 바로 활용할 수 있는 시작 프로필을 만듭니다.
                </p>
              </div>

              <div className="mt-10 flex flex-1 items-center justify-center">
                <div className="relative flex aspect-square w-full max-w-[320px] items-center justify-center overflow-hidden rounded-[32px] bg-[var(--tb-color-surface-muted)]">
                  <div className="pointer-events-none absolute inset-x-12 top-4 h-16 rounded-full bg-white/80 blur-3xl" />
                  <video
                    src={tasteCircleVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="relative h-full w-full object-contain"
                  />
                </div>
              </div>

              <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
                <div className="flex items-start gap-3">
                  <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[12px] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
                    <Sparkles size={16} strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                      1분 안에 끝나는 시작 단계예요
                    </p>
                    <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      정답을 맞추는 과정이 아니라, 지금 더 자연스럽게 맞는 방향을 찾는 가벼운
                      보정 단계입니다. 프로필은 예약과 식후 피드백을 통해 더 정교해집니다.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {phase === 'questions' && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: MOTION_TOKENS.distance.medium }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -MOTION_TOKENS.distance.medium }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col overflow-y-auto px-5 pt-6 pb-[170px] no-scrollbar"
            >
              <div className="flex items-center justify-between">
                <OutlineBadge>Quick Taste Calibration</OutlineBadge>
                <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                  {questionIndex + 1} / {QUICK_TASTE_CALIBRATION_QUESTIONS.length}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-[12px] font-semibold tracking-[0.12em] text-[var(--tb-color-text-muted)] uppercase">
                  {currentQuestion.eyebrow}
                </p>
                <h1 className="mt-3 whitespace-pre-line text-[18px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                  {currentQuestion.title}
                </h1>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-[var(--tb-color-text-body)]">
                  {currentQuestion.description}
                </p>
              </div>

              <SectionCard hoverEffect={false} className="mt-5 bg-[var(--tb-color-surface-muted)]">
                <div className="flex items-start gap-3">
                  <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)]">
                    <Sparkles size={14} strokeWidth={1.8} />
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    {currentQuestion.calibrationHint}
                  </p>
                </div>
              </SectionCard>

              <div className="mt-5 flex flex-col gap-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setResponses((currentResponses) => ({
                          ...currentResponses,
                          [currentQuestion.id]: option.id,
                        }))
                      }
                      className={`rounded-[20px] border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-surface-base)] shadow-[var(--tb-shadow-soft)]'
                          : 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 flex size-[18px] shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-text-primary)]'
                              : 'border-[var(--tb-color-border-disabled)] bg-transparent'
                          }`}
                        >
                          {isSelected ? (
                            <Check size={12} strokeWidth={3} className="text-white" />
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">
                            {option.label}
                          </p>
                          <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === 'result' && (
            <motion.div
              key="quick-calibration-result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 overflow-y-auto px-5 pt-8 pb-[170px] no-scrollbar"
            >
              <div className="mx-auto flex size-[88px] items-center justify-center rounded-full bg-[var(--tb-color-text-primary)] shadow-[var(--tb-shadow-strong)]">
                <Check size={42} strokeWidth={3} className="text-white" />
              </div>

              <div className="mt-6 text-center">
                <OutlineBadge>Starter Profile</OutlineBadge>
                <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                  현재 프로필이 준비됐어요
                </h1>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-[var(--tb-color-text-body)]">
                  지금의 응답을 바탕으로 만든 시작 프로필입니다.{'\n'}예약과 식후 피드백이 쌓일수록
                  더 잘 맞는 다이닝으로 정교해집니다.
                </p>
              </div>

              <SectionCard hoverEffect={false} className="mt-6 bg-[var(--tb-color-surface-base)]">
                <div className="flex flex-col gap-4">
                  <div>
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                        현재 프로필 해석
                      </p>
                      <h2 className="mt-2 text-[20px] font-bold leading-tight text-[var(--tb-color-text-primary)]">
                        {starterProfile.headline}
                      </h2>
                    </div>
                  </div>

                  <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    {starterProfile.diningHint}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {starterProfile.primary.map((entry) => (
                      <TasteChip
                        key={entry.id}
                        taste={entry.label}
                        value="현재 반응이 빠른 포인트"
                        className="border bg-none"
                        style={{
                          backgroundColor: toTasteTint(TASTE_TOKENS[entry.id].palette.main),
                          borderColor: toTasteTint(TASTE_TOKENS[entry.id].palette.main, 0.22),
                        }}
                      />
                    ))}
                    <TasteChip
                      taste={starterProfile.softest.label}
                      value="천천히 이어지는 포인트"
                      className="border bg-none"
                      style={{
                        backgroundColor: toTasteTint(
                          TASTE_TOKENS[starterProfile.softest.id].palette.main,
                        ),
                        borderColor: toTasteTint(
                          TASTE_TOKENS[starterProfile.softest.id].palette.main,
                          0.22,
                        ),
                      }}
                    />
                  </div>
                </div>
              </SectionCard>

              <div className="mt-6">
                <h2 className="mb-3 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                  이번 보정에 반영된 단서
                </h2>
                <div className="flex flex-col gap-3">
                  {selections.map(({ option, question }) => (
                    <SectionCard key={question.id} hoverEffect={false}>
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--tb-color-text-muted)] uppercase">
                          {question.eyebrow}
                        </p>
                        <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">
                          {option.label}
                        </p>
                        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          {option.profileNote}
                        </p>
                      </div>
                    </SectionCard>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h2 className="mb-3 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                  현재 프로필 포인트
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {starterProfile.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[20px] p-3"
                      style={{ backgroundColor: TASTE_TOKENS[entry.id].palette.bg }}
                    >
                      <p
                        className="text-[12px] font-semibold"
                        style={{ color: TASTE_TOKENS[entry.id].palette.dark }}
                      >
                        {entry.label}
                      </p>
                      <p
                        className="mt-2 text-[18px] font-bold"
                        style={{ color: TASTE_TOKENS[entry.id].palette.dark }}
                      >
                        {entry.valueMm >= entry.averageMm + 0.5
                          ? '반응 빠름'
                          : entry.valueMm <= entry.averageMm - 0.5
                            ? '부드럽게 반응'
                            : '균형적'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="tb-bottom-fade absolute bottom-0 left-0 right-0 z-20 flex min-h-[140px] w-full flex-col items-center justify-end px-5 pb-10">
        {phase === 'questions' ? (
          <div className="mb-4 flex items-center gap-[6px]">
            {QUICK_TASTE_CALIBRATION_QUESTIONS.map((question, index) => (
              <div
                key={question.id}
                className={`h-[6px] rounded-full transition-all duration-300 ${
                  index === questionIndex
                    ? 'w-[16px] bg-[var(--tb-color-text-primary)]'
                    : 'w-[6px] bg-[var(--tb-color-border-strong)]'
                }`}
              />
            ))}
          </div>
        ) : null}

        <PrimaryButton
          onClick={handleContinue}
          disabled={phase === 'questions' && !selectedOptionId}
        >
          {buttonLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}
