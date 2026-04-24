import { useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check as CheckIcon,
  ChevronLeft as ChevronLeftIcon,
  X as XIcon
} from 'lucide-react';

import SectionCard from '../components/SectionCard';
import CalibrationQuestionHeader from '../components/measurement/CalibrationQuestionHeader';
import HexRadarChart from '../components/system/HexRadarChart';
import FlowHeaderBlock from '../components/system/FlowHeaderBlock';
import FlowStepCta from '../components/system/FlowStepCta';
import CardScrollList from '../components/system/CardScrollList';
import SectionTitle from '../components/system/SectionTitle';
import OutlineBadge from '../components/system/OutlineBadge';
import TasteChip from '../components/system/TasteChip';
import TasteTintCard from '../components/system/TasteTintCard';
import { ICON_TOKENS, MOTION_TOKENS, TASTE_TOKENS } from '../constants/designTokens';
import {
  QUICK_CALIBRATION_SLIDER_VALUES,
  QUICK_TASTE_CALIBRATION_QUESTIONS,
  createInitialQuickTasteCalibrationResponses,
  createQuickCalibrationResult,
  getQuickTasteCalibrationSelection,
  getStarterAxisDisplayLabel,
  type QuickCalibrationResult,
  type QuickCalibrationSliderValue,
  type QuickTasteCalibrationResponses,
} from '../constants/quickTasteCalibrationData';
import { getTasteMeasurementEntries } from '../constants/tasteMeasurementData';
import {
  getTasteColor,
  getTasteTintSoft,
  getTasteTintSoftBorder,
} from '../constants/tasteColors';

const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...props }: any) => (
  <Icon
    {...props}
    className={className}
    style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }}
  />
);

const Check = wrapIcon(CheckIcon);
const ChevronLeft = wrapIcon(ChevronLeftIcon);
const Dismiss = wrapIcon(XIcon);

interface QuickTasteCalibrationScreenProps {
  onBack: () => void;
  onComplete: (result: QuickCalibrationResult) => void;
}

type CalibrationPhase = 'intro' | 'questions' | 'result';

const APP_CHROME_ICON_SIZE = ICON_TOKENS.size.lg;
const APP_CHROME_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;
const CONTENT_BOTTOM_PADDING = 'calc(164px + var(--tb-safe-area-bottom))';
const QUESTION_CONTENT_BOTTOM_PADDING = 'calc(188px + var(--tb-safe-area-bottom))';
const SECTION_CARD_BORDER_CLASS = 'border border-[var(--tb-color-border-subtle)]';

function buildCenteredSliderBackground(
  value: QuickCalibrationSliderValue,
  taste: (typeof TASTE_TOKENS)[keyof typeof TASTE_TOKENS],
) {
  const trackColor = 'rgba(15, 15, 15, 0.08)';
  const fillColor = taste.palette.light;
  const center = 50;
  const progress = ((value + 3) / 6) * 100;

  if (progress === center) {
    return `linear-gradient(to right, ${trackColor} 0%, ${trackColor} 48%, ${fillColor} 48%, ${fillColor} 52%, ${trackColor} 52%, ${trackColor} 100%)`;
  }

  if (progress < center) {
    return `linear-gradient(to right, ${trackColor} 0%, ${progress}%, ${fillColor} ${progress}%, ${fillColor} ${center}%, ${trackColor} ${center}%, ${trackColor} 100%)`;
  }

  return `linear-gradient(to right, ${trackColor} 0%, ${center}%, ${fillColor} ${center}%, ${fillColor} ${progress}%, ${trackColor} ${progress}%, ${trackColor} 100%)`;
}

function getHeaderTitle(phase: CalibrationPhase, tasteLabel?: string) {
  if (phase === 'result') {
    return '미각 프로필';
  }

  if (phase === 'questions' && tasteLabel) {
    return `${tasteLabel} 측정`;
  }

  return '미각 측정';
}

interface CalibrationMetaChipProps {
  label: string;
  taste: string;
  value?: string;
}

function CalibrationMetaChip({
  label,
  taste,
  value,
}: CalibrationMetaChipProps) {
  const accentColor = getTasteColor(taste);
  const backgroundColor = getTasteTintSoft(taste);
  const borderColor = getTasteTintSoftBorder(taste);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium"
      style={{ backgroundColor, borderColor }}
    >
      <span style={{ color: value ? 'var(--tb-color-text-primary)' : accentColor }}>
        {label}
      </span>
      {value ? (
        <span className="font-semibold" style={{ color: accentColor }}>
          {value}
        </span>
      ) : null}
    </span>
  );
}

export default function QuickTasteCalibrationScreen({
  onBack,
  onComplete,
}: QuickTasteCalibrationScreenProps) {
  const [phase, setPhase] = useState<CalibrationPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuickTasteCalibrationResponses>(
    createInitialQuickTasteCalibrationResponses(),
  );

  const currentQuestion = QUICK_TASTE_CALIBRATION_QUESTIONS[questionIndex] ?? null;
  const currentSelection = currentQuestion
    ? getQuickTasteCalibrationSelection(responses, currentQuestion.id)
    : null;
  const currentTaste = currentQuestion ? TASTE_TOKENS[currentQuestion.tasteId] : null;
  const currentValue = currentSelection?.sliderValue ?? 0;
  const completedResult = createQuickCalibrationResult(responses);
  const starterGuidance = completedResult.starterGuidance;
  const resultTasteEntries = getTasteMeasurementEntries(completedResult.snapshot);
  const resultSummaryLines = [
    `${starterGuidance.topLabels[0] ?? '첫 번째 축'}은 기준점에 가깝게 편안한 편이에요.`,
    `${starterGuidance.topLabels[1] ?? '두 번째 축'}도 기준점에 가깝게 편안한 축으로 읽혀요.`,
    `조심할 축은 ${starterGuidance.cautionLabel}이고, 강도를 과하게 밀지 않는 편이 좋아요.`,
  ];
  const topAxisEntries = starterGuidance.topAxes.map((tasteId) => ({
    id: tasteId,
    label: TASTE_TOKENS[tasteId].label,
    score: completedResult.absoluteScores[tasteId],
    value: completedResult.snapshot.results[tasteId] ?? 5.0,
  }));

  const handleContinue = () => {
    if (phase === 'intro') {
      setPhase('questions');
      return;
    }

    if (phase === 'questions') {
      if (questionIndex < QUICK_TASTE_CALIBRATION_QUESTIONS.length - 1) {
        setQuestionIndex((previousIndex) => previousIndex + 1);
      } else {
        setPhase('result');
      }

      return;
    }

    onComplete(completedResult);
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

  const handleSliderChange = (value: number) => {
    if (!currentQuestion) {
      return;
    }

    setResponses((currentResponses) => ({
      ...currentResponses,
      [currentQuestion.id]: value as QuickCalibrationSliderValue,
    }));
  };

  const buttonLabel =
    phase === 'intro'
      ? '측정 시작'
      : phase === 'questions'
        ? questionIndex === QUICK_TASTE_CALIBRATION_QUESTIONS.length - 1
          ? 'Taste Profile 보기'
          : '다음 질문'
        : '프로필 저장하고 시작하기';

  const fallbackTaste = currentTaste ?? TASTE_TOKENS.salty;
  const currentAccent = fallbackTaste.palette.main;
  const sliderBackground = buildCenteredSliderBackground(currentValue, fallbackTaste);
  const sliderStyle = {
    '--tb-slider-color': currentAccent,
  } as CSSProperties;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-focus)] font-sans">
      <header className="z-30 flex w-full shrink-0 justify-center">
        <div
          className="w-full max-w-[1440px] border-b border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-overlay)] backdrop-blur-md"
          style={{ paddingTop: 'var(--tb-safe-area-top)' }}
        >
          <div className="relative flex min-h-[var(--tb-size-top-app-bar-height)] items-center justify-between px-5">
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-[var(--tb-color-text-primary)]">
              {getHeaderTitle(phase, currentTaste?.label)}
            </span>
            <button
              onClick={handleBack}
              aria-label={phase === 'intro' ? '빠른 미각 보정 닫기' : '이전 단계로 돌아가기'}
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-opacity active:opacity-70"
              style={{
                width: APP_CHROME_ICON_BUTTON_SIZE,
                height: APP_CHROME_ICON_BUTTON_SIZE,
              }}
            >
              {phase === 'intro' ? (
                <Dismiss size={APP_CHROME_ICON_SIZE} />
              ) : (
                <ChevronLeft strokeWidth={1.5} size={APP_CHROME_ICON_SIZE} />
              )}
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
          {phase === 'intro' && (
            <motion.div
              key="quick-calibration-intro"
              initial={{ opacity: 0, x: MOTION_TOKENS.distance.medium }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -MOTION_TOKENS.distance.medium }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto px-5 pt-4 no-scrollbar"
              style={{ paddingBottom: CONTENT_BOTTOM_PADDING }}
            >
              <div className="tb-section-stack">
                <FlowHeaderBlock
                  description={
                    <>
                      숫자 대신 모두가 아는 기준 음식만 떠올리면 됩니다.{'\n'}
                      첫 예약부터 바로 쓰는 스타터 프로필을 1분 안에 만들 수 있어요.
                    </>
                  }
                  descriptionClassName="whitespace-pre-line"
                  title={
                    <>
                      익숙한 음식 6개로{'\n'}내 미각의 영점을 먼저 맞춰요
                    </>
                  }
                  titleClassName="whitespace-pre-line leading-tight"
                  topLeft={<OutlineBadge>Digital Anchoring</OutlineBadge>}
                  topRight={<OutlineBadge>보통 1분 이내</OutlineBadge>}
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {QUICK_TASTE_CALIBRATION_QUESTIONS.map((question, index) => {
                    const taste = TASTE_TOKENS[question.tasteId];

                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                        className="flex items-center gap-3 rounded-[var(--tb-radius-20)] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-card)] p-3"
                      >
                        <div
                          className="flex size-[36px] shrink-0 items-center justify-center rounded-[var(--tb-radius-8)]"
                          style={{
                            backgroundColor: taste.palette.tintSurface,
                            color: taste.palette.main,
                          }}
                        >
                          <span className="text-[13px] font-bold">0{index + 1}</span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span
                            className="mb-[2px] text-[11px] font-semibold tracking-[0.02em]"
                            style={{ color: taste.palette.main }}
                          >
                            {taste.label}
                          </span>
                          <span className="truncate text-[14px] font-semibold leading-snug text-[var(--tb-color-text-primary)]">
                            {question.anchorName}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'questions' && currentQuestion && currentSelection && currentTaste && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: MOTION_TOKENS.distance.medium }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -MOTION_TOKENS.distance.medium }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto px-5 pt-4 no-scrollbar"
              style={{ paddingBottom: QUESTION_CONTENT_BOTTOM_PADDING }}
            >
              <div className="tb-card-stack">
                <div className="tb-card-stack">
                  <CalibrationQuestionHeader
                    description={currentQuestion.description}
                    questionIndex={questionIndex}
                    tasteLabel={currentTaste.label}
                    title={currentQuestion.title}
                    totalQuestions={QUICK_TASTE_CALIBRATION_QUESTIONS.length}
                  />



                  <SectionCard
                    hoverEffect={false}
                    className={`overflow-visible ${SECTION_CARD_BORDER_CLASS}`}
                    style={{
                      backgroundColor: 'var(--tb-color-surface-base)',
                    } as CSSProperties}
                  >
                    <div className="flex w-full flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                          현재 선택
                        </p>
                        <p
                          className="mt-2 text-[16px] font-bold leading-[1.2] tracking-[var(--tb-letter-spacing-tight)]"
                          style={{ color: currentTaste.palette.main }}
                        >
                          {currentSelection.responseLabel}
                        </p>
                      </div>
                      <CalibrationMetaChip
                        label="절대 좌표"
                        taste={currentTaste.label}
                        value={`${completedResult.absoluteScores[currentQuestion.id]} / 100`}
                      />
                    </div>

                    <div className="mt-6 w-full">
                      <div className="relative w-full" style={sliderStyle}>
                        <div
                          className="pointer-events-none absolute inset-x-0 top-1/2 h-[12px] -translate-y-1/2 rounded-full"
                          style={{ background: sliderBackground }}
                        />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28px] w-px -translate-x-1/2 -translate-y-1/2 bg-[var(--tb-color-bg-focus)] shadow-[0_0_0_1px_rgba(15,15,15,0.08)]" />
                        <input
                          type="range"
                          min={-3}
                          max={3}
                          step={1}
                          value={currentValue}
                          aria-label={`${currentQuestion.anchorName} 기준 보정 슬라이더`}
                          aria-valuetext={currentSelection.responseLabel}
                          className="tb-anchored-slider relative z-10"
                          onChange={(event) => handleSliderChange(Number(event.target.value))}
                          style={sliderStyle}
                        />
                      </div>

                      <div className="mt-4 flex justify-center">
                        <CalibrationMetaChip
                          label="기준점"
                          taste={currentTaste.label}
                        />
                      </div>

                      <div className="mt-4 grid w-full grid-cols-3 gap-3 text-left sm:text-center">
                        <div>
                          <p className="text-[12px] font-semibold text-[var(--tb-color-text-secondary)]">
                            {currentQuestion.scaleLeftLabel}
                          </p>
                          <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">
                            기준점보다 덜 맞음
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] font-semibold text-[var(--tb-color-text-secondary)]">
                            {currentQuestion.scaleCenterLabel}
                          </p>
                          <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">
                            가장 편안한 중심
                          </p>
                        </div>
                        <div className="text-right sm:text-center">
                          <p className="text-[12px] font-semibold text-[var(--tb-color-text-secondary)]">
                            {currentQuestion.scaleRightLabel}
                          </p>
                          <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">
                            기준점보다 더 필요함
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid w-full grid-cols-7 gap-2">
                        {QUICK_CALIBRATION_SLIDER_VALUES.map((sliderValue) => {
                          const isActive = sliderValue === currentValue;

                          return (
                            <div key={sliderValue} className="flex flex-col items-center gap-2">
                              <div
                                className="h-1.5 w-full rounded-full"
                                style={{
                                  backgroundColor: isActive
                                    ? currentTaste.palette.main
                                    : 'rgba(15, 15, 15, 0.08)',
                                }}
                              />
                              <span
                                className="text-[11px] font-semibold"
                                style={{
                                  color: isActive
                                    ? currentTaste.palette.dark
                                    : 'var(--tb-color-text-muted)',
                                }}
                              >
                                {sliderValue > 0 ? `+${sliderValue}` : sliderValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <p
                        className="mt-5 text-[13px] leading-relaxed"
                        style={{ color: currentTaste.palette.dark }}
                      >
                        {currentSelection.responseNote}
                      </p>
                    </div>
                  </SectionCard>
                </div>

                <div className="tb-card-stack">
                  <SectionCard hoverEffect={false} className={SECTION_CARD_BORDER_CLASS}>
                    <div className="w-full">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                        This Axis
                      </p>
                      <SectionTitle size="md" className="mt-1">
                        {currentTaste.label} 시작 좌표
                      </SectionTitle>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p
                            className="text-[18px] font-bold leading-[1.2] tracking-[var(--tb-letter-spacing-tight)]"
                            style={{ color: currentTaste.palette.main }}
                          >
                            {completedResult.absoluteScores[currentQuestion.id]}
                          </p>
                          <div className="mt-2">
                            <CalibrationMetaChip
                              label="절대 좌표"
                              taste={currentTaste.label}
                              value="0~100"
                            />
                          </div>
                        </div>
                        <div
                          className="rounded-[18px] px-3 py-2 text-[12px] font-semibold"
                          style={{
                            backgroundColor: currentTaste.palette.bg,
                            color: currentTaste.palette.dark,
                          }}
                        >
                          {getStarterAxisDisplayLabel(
                            (completedResult.absoluteScores[currentQuestion.id] ?? 50) / 10,
                          )}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>
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
              className="absolute inset-0 overflow-y-auto px-5 pt-4 no-scrollbar"
              style={{ paddingBottom: QUESTION_CONTENT_BOTTOM_PADDING }}
            >
              <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-4 pb-8">
                <FlowHeaderBlock
                  description={
                    <>
                      대중적인 기준 음식 6개로 아주 빠르게 잡은 첫 좌표예요.{'\n'}
                      피드백이 쌓일수록 이 프로필은 더 정교하게 다듬어집니다.
                    </>
                  }
                  descriptionClassName="whitespace-pre-line"
                  topLeft={<OutlineBadge>Starter Profile</OutlineBadge>}
                  title={
                    <span className="inline-flex items-center gap-2">
                      <span>첫 번째 미각 프로필이 준비됐어요</span>
                      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--tb-color-text-primary)] shadow-[var(--tb-shadow-strong)]">
                        <Check size={ICON_TOKENS.size.xs} strokeWidth={ICON_TOKENS.strokeWidth.emphasis} className="text-white" />
                      </span>
                    </span>
                  }
                  titleClassName="leading-tight"
                />

                <div className="grid w-full gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-center">
                  <div className="mx-auto w-full max-w-[420px]">
                    <HexRadarChart
                      className="max-w-[420px]"
                      myTasteData={resultTasteEntries}
                      shouldAnimate
                    />
                  </div>

                  <div className="flex w-full flex-col gap-4">
                    <div className="rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-4">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                        Starter Reading
                      </p>
                      <SectionTitle size="md" className="mt-2 leading-tight">
                        {starterGuidance.surfaceLabel}
                      </SectionTitle>
                      <div className="mt-3 flex flex-col gap-2">
                        {resultSummaryLines.map((line) => (
                          <p
                            key={line}
                            className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]"
                          >
                            {line}
                          </p>
                        ))}
                      </div>

                      <div className="mt-4 rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-3">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                          먼저 살아나는 축
                        </p>
                        <SectionTitle size="lg" className="mt-2 leading-tight">
                          {starterGuidance.topLabels.join('과 ')} 쪽이 먼저 반응해요
                        </SectionTitle>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {topAxisEntries.map((entry) => (
                            <TasteChip
                              key={entry.id}
                              taste={entry.label}
                              value={`${entry.score}`}
                              className="border"
                              style={{
                                backgroundColor: TASTE_TOKENS[entry.id].palette.bg,
                                borderColor: TASTE_TOKENS[entry.id].palette.light,
                              }}
                            />
                          ))}
                          <TasteChip
                            taste={starterGuidance.cautionLabel}
                            value="조심할 포인트"
                            className="border"
                            style={{
                              backgroundColor: TASTE_TOKENS[starterGuidance.cautionAxis].palette.bg,
                              borderColor: TASTE_TOKENS[starterGuidance.cautionAxis].palette.light,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tb-card-stack">
                  <SectionTitle as="h2" size="md">
                    세부 분석
                  </SectionTitle>
                  <CardScrollList>
                    {resultTasteEntries.map((entry) => {
                      const taste = TASTE_TOKENS[entry.id];

                      return (
                        <TasteTintCard
                          key={entry.id}
                          leading={
                            <span
                              className="text-[16px] font-bold"
                              style={{ color: taste.palette.dark }}
                            >
                              {entry.label.slice(0, 1)}
                            </span>
                          }
                          leadingClassName="bg-white/80"
                          description={getStarterAxisDisplayLabel(entry.score / 10)}
                          detail={`현재 반응 ${entry.score}점`}
                          tasteId={entry.id}
                          title={entry.label}
                        />
                      );
                    })}
                  </CardScrollList>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FlowStepCta
        actionLabel={buttonLabel}
        currentIndex={questionIndex}
        indicatorActiveColor={(currentTaste ?? TASTE_TOKENS.salty).palette.main}
        fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-focus)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
        onAction={handleContinue}
        showIndicator={phase === 'questions'}
        total={QUICK_TASTE_CALIBRATION_QUESTIONS.length}
      />
    </div>
  );
}
