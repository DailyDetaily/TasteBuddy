import { useId, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckmarkRegular,
  ChevronLeftRegular,
  DismissRegular,
} from '@fluentui/react-icons';

import SectionCard from '../components/SectionCard';
import QuickCalibrationHintCard from '../components/system/QuickCalibrationHintCard';
import SectionTitle from '../components/system/SectionTitle';
import OutlineBadge from '../components/system/OutlineBadge';
import PrimaryButton from '../components/system/PrimaryButton';
import TasteChip from '../components/system/TasteChip';
import { ICON_TOKENS, MOTION_TOKENS, TASTE_IDS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import {
  QUICK_CALIBRATION_SLIDER_VALUES,
  QUICK_TASTE_CALIBRATION_QUESTIONS,
  createInitialQuickTasteCalibrationResponses,
  createQuickCalibrationResult,
  getQuickTasteCalibrationSelection,
  getQuickTasteCalibrationSelections,
  getStarterAxisDisplayLabel,
  type QuickCalibrationResult,
  type QuickCalibrationSliderValue,
  type QuickTasteCalibrationResponses,
} from '../constants/quickTasteCalibrationData';

const wrapIcon = (Icon: any) => ({ size, className, style, ...props }: any) => (
  <Icon
    {...props}
    className={className}
    style={{ fontSize: size, width: size, height: size, ...style }}
  />
);

const Check = wrapIcon(CheckmarkRegular);
const ChevronLeft = wrapIcon(ChevronLeftRegular);
const Dismiss = wrapIcon(DismissRegular);

interface QuickTasteCalibrationScreenProps {
  onBack: () => void;
  onComplete: (result: QuickCalibrationResult) => void;
}

type CalibrationPhase = 'intro' | 'questions' | 'result';

const APP_CHROME_ICON_SIZE = ICON_TOKENS.size.lg;
const APP_CHROME_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;
const CONTENT_BOTTOM_PADDING = 'calc(164px + var(--tb-safe-area-bottom))';
const QUESTION_CONTENT_BOTTOM_PADDING = 'calc(188px + var(--tb-safe-area-bottom))';
const RADAR_SIZE = 320;
const RADAR_CENTER = 160;
const RADAR_MAX_RADIUS = 102;

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

function polarPoint(radius: number, index: number) {
  const angle = (-90 + index * (360 / TASTE_IDS.length)) * (Math.PI / 180);
  return [
    RADAR_CENTER + Math.cos(angle) * radius,
    RADAR_CENTER + Math.sin(angle) * radius,
  ] as const;
}

function buildClosedPath(points: ReadonlyArray<readonly [number, number]>) {
  if (points.length === 0) {
    return '';
  }

  return points.reduce((command, [x, y], index) => {
    if (index === 0) {
      return `M ${x} ${y}`;
    }

    return `${command} L ${x} ${y}`;
  }, '') + ' Z';
}

function TasteDnaRadar({
  absoluteScores,
  topAxes,
}: {
  absoluteScores: QuickCalibrationResult['absoluteScores'];
  topAxes: TasteId[];
}) {
  const gradientId = useId().replace(/:/g, '');
  const polygonPoints = TASTE_IDS.map((tasteId, index) => {
    const radius = (absoluteScores[tasteId] / 100) * RADAR_MAX_RADIUS;
    return polarPoint(radius, index);
  });
  const polygonPath = buildClosedPath(polygonPoints);
  const labelPoints = TASTE_IDS.map((_, index) => polarPoint(RADAR_MAX_RADIUS + 26, index));
  const outerPoints = TASTE_IDS.map((_, index) => polarPoint(RADAR_MAX_RADIUS, index));

  return (
    <div className="relative flex w-full items-center justify-center">
      <svg
        width={RADAR_SIZE}
        height={RADAR_SIZE}
        viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
        className="w-full max-w-[320px]"
      >
        <defs>
          <linearGradient id={`${gradientId}-fill`} x1="40" y1="40" x2="280" y2="280">
            <stop
              offset="0%"
              stopColor={TASTE_TOKENS[topAxes[0] ?? 'sweet'].palette.main}
              stopOpacity="0.44"
            />
            <stop
              offset="100%"
              stopColor={TASTE_TOKENS[topAxes[1] ?? topAxes[0] ?? 'umami'].palette.main}
              stopOpacity="0.2"
            />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            points={TASTE_IDS.map((_, index) => polarPoint(RADAR_MAX_RADIUS * level, index).join(',')).join(' ')}
            fill="none"
            stroke="rgba(15, 15, 15, 0.08)"
            strokeWidth="1"
          />
        ))}

        {outerPoints.map(([x, y], index) => (
          <line
            key={`axis-${TASTE_IDS[index]}`}
            x1={RADAR_CENTER}
            y1={RADAR_CENTER}
            x2={x}
            y2={y}
            stroke="rgba(15, 15, 15, 0.07)"
            strokeWidth="1"
          />
        ))}

        <motion.path
          d={polygonPath}
          fill={`url(#${gradientId}-fill)`}
          stroke="rgba(15, 15, 15, 0.78)"
          strokeWidth="1.6"
          initial={{ opacity: 0, pathLength: 0, scale: 0.94 }}
          animate={{ opacity: 1, pathLength: 1, scale: 1 }}
          transition={{
            duration: 0.72,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: `${RADAR_CENTER}px ${RADAR_CENTER}px` }}
        />

        {polygonPoints.map(([x, y], index) => {
          const tasteId = TASTE_IDS[index];
          const color = TASTE_TOKENS[tasteId].palette.main;

          return (
            <motion.circle
              key={tasteId}
              cx={x}
              cy={y}
              r="5.5"
              fill="#FFFFFF"
              stroke={color}
              strokeWidth="3"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.16 + index * 0.04,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          );
        })}

        <circle
          cx={RADAR_CENTER}
          cy={RADAR_CENTER}
          r="4"
          fill="rgba(15, 15, 15, 0.8)"
        />

        {labelPoints.map(([x, y], index) => {
          const tasteId = TASTE_IDS[index];
          const isHighlighted = topAxes.includes(tasteId);
          const color = TASTE_TOKENS[tasteId].palette.main;

          return (
            <text
              key={`label-${tasteId}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight={isHighlighted ? '700' : '600'}
              fill={isHighlighted ? color : 'rgba(15, 15, 15, 0.56)'}
            >
              {TASTE_TOKENS[tasteId].label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function TasteAxisMeter({
  absoluteScore,
  tasteId,
}: {
  absoluteScore: number;
  tasteId: TasteId;
}) {
  const taste = TASTE_TOKENS[tasteId];

  return (
    <div className="flex flex-col gap-2 rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-white/84 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: taste.palette.main }}
          />
          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
            {taste.label}
          </p>
        </div>
        <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
          {getStarterAxisDisplayLabel(absoluteScore / 10)}
        </span>
      </div>
      <div className="h-[10px] overflow-hidden rounded-full bg-[rgba(15,15,15,0.07)]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-[var(--tb-motion-ease-entrance)]"
          style={{
            width: `${absoluteScore}%`,
            background: taste.palette.gradient,
          }}
        />
      </div>
      <p className="text-[12px] text-[var(--tb-color-text-muted)]">
        절대 좌표 {absoluteScore}
      </p>
    </div>
  );
}

function CalibrationQuestionHeader({
  currentQuestion,
  currentTaste,
  questionIndex,
}: {
  currentQuestion: NonNullable<typeof QUICK_TASTE_CALIBRATION_QUESTIONS[number]>;
  currentTaste: (typeof TASTE_TOKENS)[TasteId];
  questionIndex: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <SectionTitle as="h1" size="lg" className="whitespace-pre-line leading-tight">
          {currentQuestion.title}
        </SectionTitle>
        <span className="mt-1 shrink-0 text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
          {questionIndex + 1} / {QUICK_TASTE_CALIBRATION_QUESTIONS.length}
        </span>
      </div>
      <p className="max-w-[620px] text-[14px] leading-relaxed text-[var(--tb-color-text-body)]">
        {currentQuestion.description}
      </p>
    </div>
  );
}

function getHeaderTitle(phase: CalibrationPhase, tasteLabel?: string) {
  if (phase === 'result') {
    return 'Taste DNA';
  }

  if (phase === 'questions' && tasteLabel) {
    return `${tasteLabel} 측정`;
  }

  return '빠른 미각 보정';
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
  const selections = getQuickTasteCalibrationSelections(responses);
  const starterGuidance = completedResult.starterGuidance;
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
      ? '영점 맞추기 시작'
      : phase === 'questions'
        ? questionIndex === QUICK_TASTE_CALIBRATION_QUESTIONS.length - 1
          ? 'Taste DNA 보기'
          : '다음 질문'
        : '프로필 저장하고 시작하기';

  const headerSurfaceClass = 'bg-[var(--tb-color-bg-page)]/88 supports-[backdrop-filter:blur(0px)]:bg-[var(--tb-color-bg-page)]/78';
  const fallbackTaste = currentTaste ?? TASTE_TOKENS.salty;
  const currentAccent = fallbackTaste.palette.main;
  const sliderBackground = buildCenteredSliderBackground(currentValue, fallbackTaste);
  const sliderStyle = {
    '--tb-slider-color': currentAccent,
  } as CSSProperties;
  const resultTaste = TASTE_TOKENS[starterGuidance.topAxes[0] ?? 'sweet'];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-page)] font-sans">
      <header className="z-30 flex w-full shrink-0 justify-center">
        <div
          className={`w-full max-w-[1440px] border-b border-[var(--tb-color-border-subtle)] backdrop-blur-md ${headerSurfaceClass}`}
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
              <div className="relative mx-auto flex w-full max-w-[980px] flex-col gap-3 pb-8">
                <SectionCard
                  hoverEffect={false}
                  className="bg-[var(--tb-color-surface-muted)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-3">
                      <OutlineBadge>Digital Anchoring</OutlineBadge>
                      <div className="flex flex-col gap-2">
                        <SectionTitle as="h1" size="lg" className="whitespace-pre-line leading-tight">
                          익숙한 음식 6개로{'\n'}내 미각의 영점을 먼저 맞춰요
                        </SectionTitle>
                        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          숫자 대신 모두가 아는 기준 음식만 떠올리면 됩니다. 첫 예약부터 바로
                          쓰는 스타터 프로필을 1분 안에 만들 수 있어요.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-full border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-base)] px-3 py-1.5 text-[12px] font-semibold text-[var(--tb-color-text-secondary)]">
                      보통 1분 이내
                    </div>
                  </div>
                </SectionCard>

                <SectionCard hoverEffect={false}>
                  <div className="flex w-full flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                        6 Tastes, 6 Anchors
                      </p>
                      <p className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                        한 화면에 한 질문씩, 기준 음식 하나만 떠올리면 됩니다
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {QUICK_TASTE_CALIBRATION_QUESTIONS.map((question) => {
                        const taste = TASTE_TOKENS[question.tasteId];

                        return (
                          <SectionCard
                            key={question.id}
                            hoverEffect={false}
                            className="border"
                            style={{
                              backgroundColor: taste.palette.bg,
                              borderColor: taste.palette.light,
                            } as CSSProperties}
                          >
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--tb-color-text-muted)] uppercase">
                              {question.eyebrow}
                            </p>
                            <p
                              className="text-[13px] font-semibold"
                              style={{ color: taste.palette.dark }}
                            >
                              {taste.label}
                            </p>
                            <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                              {question.anchorName}
                            </p>
                            <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                              {question.anchorDetail}
                            </p>
                          </SectionCard>
                        );
                      })}
                    </div>
                  </div>
                </SectionCard>

                <QuickCalibrationHintCard
                  className="w-full text-left"
                  title="문진표처럼 느껴지지 않게"
                  description="기준 음식이 지금 내 입에 어떻게 읽히는지만 고르면 첫 Taste DNA가 바로 만들어집니다."
                />
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
              <div className="relative mx-auto flex w-full max-w-[1120px] flex-col gap-4 pb-8">
                <div className="flex w-full flex-col gap-4">
                  <CalibrationQuestionHeader
                    currentQuestion={currentQuestion}
                    currentTaste={currentTaste}
                    questionIndex={questionIndex}
                  />



                  <SectionCard
                    hoverEffect={false}
                    className="overflow-visible"
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
                      <div
                        className="rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                        style={{
                          backgroundColor: currentTaste.palette.bg,
                          borderColor: currentTaste.palette.light,
                          color: currentTaste.palette.dark,
                        }}
                      >
                        절대 좌표 {completedResult.absoluteScores[currentQuestion.id]} / 100
                      </div>
                    </div>

                    <div className="mt-6 w-full">
                      <div className="relative w-full" style={sliderStyle}>
                        <div
                          className="pointer-events-none absolute inset-x-0 top-1/2 h-[12px] -translate-y-1/2 rounded-full"
                          style={{ background: sliderBackground }}
                        />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28px] w-px -translate-x-1/2 -translate-y-1/2 bg-white shadow-[0_0_0_1px_rgba(15,15,15,0.08)]" />
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

                      <div className="mt-5 grid w-full grid-cols-3 gap-3 text-left sm:text-center">
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
                            기준점에 가까움
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

                <div className="flex flex-col gap-3">
                  <SectionCard hoverEffect={false}>
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
                            style={{ color: currentTaste.palette.dark }}
                          >
                            {completedResult.absoluteScores[currentQuestion.id]}
                          </p>
                          <p className="text-[12px] text-[var(--tb-color-text-muted)]">
                            0~100 절대 좌표
                          </p>
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

                  <QuickCalibrationHintCard
                    title="이 답변은 이렇게 반영돼요"
                    description={currentQuestion.calibrationHint}
                  />
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
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute left-1/2 top-[12%] h-[280px] w-[280px] -translate-x-1/2 rounded-full blur-3xl"
                  style={{ backgroundColor: resultTaste.palette.light }}
                />
                <div className="absolute right-[-70px] top-[26%] h-[220px] w-[220px] rounded-full bg-[rgba(114,153,255,0.12)] blur-3xl" />
              </div>

              <div className="relative mx-auto flex w-full max-w-[1120px] flex-col gap-4 pb-8">
                <div className="flex flex-col items-center text-center">
                  <div className="mx-auto flex size-[72px] items-center justify-center rounded-full bg-[var(--tb-color-text-primary)] shadow-[var(--tb-shadow-strong)]">
                    <Check size={ICON_TOKENS.size.lg} strokeWidth={3} className="text-white" />
                  </div>
                  <OutlineBadge className="mt-5">Starter Taste DNA</OutlineBadge>
                  <SectionTitle as="h1" size="lg" className="mt-4 leading-tight">
                    첫 번째 미각 프로필이 준비됐어요
                  </SectionTitle>
                  <p className="mt-3 max-w-[680px] whitespace-pre-line text-[14px] leading-relaxed text-[var(--tb-color-text-body)]">
                    대중적인 기준 음식 6개로 아주 빠르게 잡은 첫 좌표예요.{'\n'}
                    실제 다이닝과 피드백이 쌓일수록 이 프로필은 더 정교하게 다듬어집니다.
                  </p>
                </div>

                <SectionCard
                  hoverEffect={false}
                  className="border border-[var(--tb-color-border-subtle)]"
                >
                  <div className="grid w-full gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
                    <div className="mx-auto w-full max-w-[340px]">
                      <TasteDnaRadar
                        absoluteScores={completedResult.absoluteScores}
                        topAxes={starterGuidance.topAxes}
                      />
                    </div>

                    <div className="flex w-full flex-col gap-4">
                      <QuickCalibrationHintCard
                        size="md"
                        title={starterGuidance.surfaceLabel}
                        description={starterGuidance.summaryLine}
                      />

                      <div className="rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] p-3">
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

                      <div className="grid gap-3 md:grid-cols-3">
                        {starterGuidance.evidence.slice(0, 3).map((evidence) => (
                          <div
                            key={evidence}
                            className="rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-white/80 p-3"
                          >
                            <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                              {evidence}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <div className="grid gap-3 lg:grid-cols-2">
                  <SectionCard hoverEffect={false}>
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                            Axis Overview
                          </p>
                          <SectionTitle size="lg" className="mt-1">
                            6축 절대 좌표
                          </SectionTitle>
                        </div>
                        <div
                          className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{
                            backgroundColor: resultTaste.palette.bg,
                            color: TASTE_TOKENS[starterGuidance.topAxes[0] ?? 'sweet'].palette.dark,
                          }}
                        >
                          {starterGuidance.goalPhrase}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        {TASTE_IDS.map((tasteId) => (
                          <TasteAxisMeter
                            key={tasteId}
                            tasteId={tasteId}
                            absoluteScore={completedResult.absoluteScores[tasteId]}
                          />
                        ))}
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard hoverEffect={false}>
                    <div className="w-full">
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                        Anchor Responses
                      </p>
                      <SectionTitle size="lg" className="mt-1">
                        기준 음식별 응답
                      </SectionTitle>

                      <div className="mt-5 grid gap-3">
                        {selections.map((selection) => {
                          const taste = TASTE_TOKENS[selection.question.tasteId];

                          return (
                            <div
                              key={selection.question.id}
                              className="rounded-[20px] border p-3"
                              style={{
                                backgroundColor: taste.palette.bg,
                                borderColor: taste.palette.light,
                              }}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--tb-color-text-muted)] uppercase">
                                    {selection.question.eyebrow}
                                  </p>
                                  <p className="mt-2 text-[15px] font-bold text-[var(--tb-color-text-primary)]">
                                    {selection.question.anchorName}
                                  </p>
                                </div>
                                <div
                                  className="rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                                  style={{
                                    backgroundColor: taste.palette.bg,
                                    borderColor: taste.palette.light,
                                    color: taste.palette.dark,
                                  }}
                                >
                                  {selection.responseLabel}
                                </div>
                              </div>
                              <p className="mt-3 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                                {selection.responseNote}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center">
        <div className="w-full max-w-[1440px]">
          <div
            className="relative flex min-h-[140px] w-full flex-col items-center justify-end px-5"
            style={{
              background:
                'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.96) 54%, rgba(255, 255, 255, 0) 100%)',
              paddingBottom: 'var(--tb-safe-area-bottom)',
            }}
          >
            {phase === 'questions' ? (
              <div className="mb-8 flex items-center gap-[8px]">
                {QUICK_TASTE_CALIBRATION_QUESTIONS.map((question, index) => {
                  const isCurrent = index === questionIndex;
                  const taste = TASTE_TOKENS[question.tasteId];

                  return (
                    <div
                      key={question.id}
                      className="h-[6px] rounded-full transition-all duration-300"
                      style={{
                        width: isCurrent ? '26px' : '10px',
                        backgroundColor: isCurrent
                          ? taste.palette.main
                          : 'rgba(15, 15, 15, 0.12)',
                      }}
                    />
                  );
                })}
              </div>
            ) : null}
            <PrimaryButton className="mb-10" onClick={handleContinue}>
              {buttonLabel}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
