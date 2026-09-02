import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft as ChevronLeftIcon,
  MoreHorizontal as MoreHorizontalIcon,
  X as XIcon
} from 'lucide-react';
const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />;
const ChevronLeft = wrapIcon(ChevronLeftIcon);
const MoreHorizontal = wrapIcon(MoreHorizontalIcon);
const X = wrapIcon(XIcon);
import { AnimatePresence, motion } from 'framer-motion';

import { TASTE_CIRCULAR_LOOP_STEP_ADVANCE_MS } from '../components/graphics/tasteCircularLoopMotion';
import TasteMeasurementActivePanel from '../components/measurement/TasteMeasurementActivePanel';
import TasteMeasurementChecklistPanel from '../components/measurement/TasteMeasurementChecklistPanel';
import TasteMeasurementCompletedPanel from '../components/measurement/TasteMeasurementCompletedPanel';
import TasteMeasurementIntroPanel from '../components/measurement/TasteMeasurementIntroPanel';
import TasteMeasurementPreparationPanel from '../components/measurement/TasteMeasurementPreparationPanel';
import FlowStepCta from '../components/system/FlowStepCta';
import {
    DEFAULT_TASTE_MEASUREMENT_RESULTS,
    createInitialTasteMeasurementResults,
    createTasteMeasurementSnapshot,
    type TasteMeasurementResults,
    type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { ICON_TOKENS, TASTE_IDS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';

const FLOW_APP_BAR_ICON_SIZE = ICON_TOKENS.size.lg;
const FLOW_APP_BAR_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;
const FLOW_APP_BAR_ICON_STROKE = ICON_TOKENS.strokeWidth.regular;

interface TasteMeasurementScreenProps {
    onComplete: (snapshot: TasteMeasurementSnapshot) => void;
    onBack: () => void;
    initialActiveLevel?: number;
    initialMeasurementResults?: TasteMeasurementResults;
    initialPhase?: MeasurementPhase;
    initialTasteIndex?: number;
}

type MeasurementPhase = 'checklist' | 'intro' | 'prep' | 'active' | 'finished';

function roundMeasurementValue(value: number) {
    return Number(value.toFixed(2));
}

export default function TasteMeasurementScreen({
    initialActiveLevel = 0,
    initialMeasurementResults,
    initialPhase = 'checklist',
    initialTasteIndex = 0,
    onComplete,
    onBack,
}: TasteMeasurementScreenProps) {
    const [phase, setPhase] = useState<MeasurementPhase>(initialPhase);
    const [tasteIndex, setTasteIndex] = useState(initialTasteIndex);
    const [activeLevel, setActiveLevel] = useState(initialActiveLevel);
    const [measurementResults, setMeasurementResults] = useState(() =>
        initialMeasurementResults
            ? { ...initialMeasurementResults }
            : createInitialTasteMeasurementResults(),
    );
    const [completedSnapshot, setCompletedSnapshot] = useState<TasteMeasurementSnapshot | null>(() =>
        initialPhase === 'finished'
            ? createTasteMeasurementSnapshot(
                initialMeasurementResults ?? DEFAULT_TASTE_MEASUREMENT_RESULTS,
                '2026-03-08T15:20:00+09:00',
            )
            : null,
    );
    const measurementStartedAtRef = useRef<number | null>(null);

    const currentTasteId = TASTE_IDS[tasteIndex] as TasteId;
    const currentTaste = TASTE_TOKENS[currentTasteId];
    const displaySnapshot = completedSnapshot ?? createTasteMeasurementSnapshot(measurementResults);
    const measurementStepCount = TASTE_IDS.length;
    const measurementStepIndex =
        phase === 'finished'
            ? measurementStepCount - 1
            : Math.min(tasteIndex, measurementStepCount - 1);
    const actionLabel =
        phase === 'intro'
            ? '측정 시작'
            : phase === 'finished'
                ? '미각 프로필 보기'
                : phase === 'active'
                    ? activeLevel >= 10
                        ? '다음으로'
                        : '느껴졌어요'
                    : '계속하기';

    // Simulate Active Measurement Progress
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (phase === 'active' && activeLevel < 10) {
            timer = setTimeout(() => {
                setActiveLevel(prev => prev + 1);
            }, TASTE_CIRCULAR_LOOP_STEP_ADVANCE_MS);
        }
        return () => clearTimeout(timer);
    }, [phase, activeLevel]);

    const getCurrentMeasuredValue = () => {
        if (measurementStartedAtRef.current === null) {
            return activeLevel > 0 ? roundMeasurementValue(activeLevel) : 1;
        }

        const elapsedMs = Date.now() - measurementStartedAtRef.current;
        const measuredValue = 1 + elapsedMs / TASTE_CIRCULAR_LOOP_STEP_ADVANCE_MS;

        return roundMeasurementValue(Math.min(10, Math.max(1, measuredValue)));
    };

    const saveCurrentMeasurement = () => {
        const measuredValue = getCurrentMeasuredValue();
        const nextResults = {
            ...measurementResults,
            [currentTasteId]: measuredValue,
        };

        setMeasurementResults(nextResults);
        setActiveLevel(0);
        measurementStartedAtRef.current = null;

        if (tasteIndex < TASTE_IDS.length - 1) {
            setTasteIndex(prev => prev + 1);
            setPhase('prep');
            return;
        }

        setCompletedSnapshot(createTasteMeasurementSnapshot(nextResults));
        setPhase('finished');
    };

    const handleNextPhase = () => {
        switch (phase) {
            case 'checklist':
                setPhase('intro');
                break;
            case 'intro':
                setPhase('prep');
                break;
            case 'prep':
                setCompletedSnapshot(null);
                setPhase('active');
                setActiveLevel(1); // Start measurement at level 1
                measurementStartedAtRef.current = Date.now();
                break;
            case 'active':
                saveCurrentMeasurement();
                break;
            case 'finished':
                onComplete(displaySnapshot);
                break;
        }
    };

    const handleBack = () => {
        if (phase === 'checklist') onBack();
        else if (phase === 'intro') setPhase('checklist');
        else if (phase === 'prep') {
            if (tasteIndex === 0) setPhase('intro');
            else {
                setTasteIndex(prev => prev - 1);
                // Return to prep of previous taste, we don't go back into active measurement
            }
        }
        else if (phase === 'active') {
            setPhase('prep');
            setActiveLevel(0);
            measurementStartedAtRef.current = null;
        }
        else if (phase === 'finished') {
            setPhase('prep');
            setTasteIndex(TASTE_IDS.length - 1);
            setCompletedSnapshot(null);
        }
    };

    return (
        <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)] relative font-sans">
            {/* Header */}
            <header className="z-10 flex min-h-[var(--tb-size-top-app-bar-height)] items-center justify-between bg-[var(--tb-color-bg-page)] px-[20px] py-[12px]">
                <button
                    type="button"
                    aria-label={phase === 'checklist' ? '측정 종료' : '이전 단계'}
                    onClick={handleBack}
                    className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] active:opacity-70"
                    style={{
                        width: FLOW_APP_BAR_ICON_BUTTON_SIZE,
                        height: FLOW_APP_BAR_ICON_BUTTON_SIZE,
                    }}
                >
                    {phase === 'checklist' ? (
                        <X strokeWidth={FLOW_APP_BAR_ICON_STROKE} size={FLOW_APP_BAR_ICON_SIZE} />
                    ) : (
                        <ChevronLeft strokeWidth={FLOW_APP_BAR_ICON_STROKE} size={FLOW_APP_BAR_ICON_SIZE} />
                    )}
                </button>
                <button
                    type="button"
                    aria-label="옵션 더보기"
                    className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] active:opacity-70"
                    style={{
                        width: FLOW_APP_BAR_ICON_BUTTON_SIZE,
                        height: FLOW_APP_BAR_ICON_BUTTON_SIZE,
                    }}
                >
                    <MoreHorizontal strokeWidth={FLOW_APP_BAR_ICON_STROKE} size={FLOW_APP_BAR_ICON_SIZE} />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col">
                <AnimatePresence mode="wait">
                    {/* --- PHASE 1: CHECKLIST --- */}
                    {phase === 'checklist' && (
                        <motion.div
                            key="checklist"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex flex-col px-5"
                        >
                            <TasteMeasurementChecklistPanel />
                        </motion.div>
                    )}

                    {/* --- PHASE 2: INTRO --- */}
                    {phase === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex flex-col px-5"
                        >
                            <TasteMeasurementIntroPanel />
                        </motion.div>
                    )}

                    {/* --- PHASE 3: PREPARATION --- */}
                    {phase === 'prep' && (
                        <motion.div
                            key={`prep-${tasteIndex}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex flex-col px-5"
                        >
                            <TasteMeasurementPreparationPanel
                                currentTaste={currentTaste}
                                stepIndex={tasteIndex}
                                totalSteps={measurementStepCount}
                            />
                        </motion.div>
                    )}

                    {/* --- PHASE 4: ACTIVE MEASUREMENT --- */}
                    {phase === 'active' && (
                        <motion.div
                            key={`active-${tasteIndex}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex flex-col px-5"
                        >
                            <TasteMeasurementActivePanel
                                activeLevel={activeLevel}
                                currentTaste={currentTaste}
                                currentTasteId={currentTasteId}
                            />
                        </motion.div>
                    )}

                    {/* --- PHASE 5: FINISHED ALL TASTES --- */}
                    {phase === 'finished' && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 flex flex-col px-5 pt-8 pb-[160px] overflow-y-auto no-scrollbar"
                        >
                            <TasteMeasurementCompletedPanel snapshot={displaySnapshot} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

                <FlowStepCta
                    actionLabel={actionLabel}
                    currentIndex={measurementStepIndex}
                    indicatorActiveColor={currentTaste.palette.main}
                    onAction={handleNextPhase}
                    total={measurementStepCount}
                />
        </div>
    );
}
