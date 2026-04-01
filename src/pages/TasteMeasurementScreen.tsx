import { useEffect, useRef, useState } from 'react';
import { ChevronLeftRegular, MoreHorizontalRegular, CheckmarkRegular } from '@fluentui/react-icons';
const wrapIcon = (Icon: any) => ({ size, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size, width: size, height: size, ...style }} />;
const ChevronLeft = wrapIcon(ChevronLeftRegular);
const MoreHorizontal = wrapIcon(MoreHorizontalRegular);
const Check = wrapIcon(CheckmarkRegular);
import { motion, AnimatePresence } from 'framer-motion';

// Using the closest available assets as placeholders
import personUsingTastickImage from '../assets/Image of a person using the Tastick.png';
import tasteCircleVideo from '../assets/video/Taste circle.mp4';
import TbCoreLoop from '../components/graphics/TbCoreLoop';
import TasteCircularLoop from '../components/graphics/TasteCircularLoop';
import { TASTE_CIRCULAR_LOOP_STEP_ADVANCE_MS } from '../components/graphics/tasteCircularLoopMotion';
import PrimaryButton from '../components/system/PrimaryButton';
import {
    createInitialTasteMeasurementResults,
    createTasteMeasurementSnapshot,
    formatMeasurementDate,
    formatMeasurementValue,
    getAverageMeasurementMm,
    getStrongestTasteMeasurement,
    getTasteMeasurementEntries,
    getTasteProfileBadge,
    getWeakestTasteMeasurement,
    type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { TASTE_IDS, TASTE_TOKENS } from '../constants/designTokens';

interface TasteMeasurementScreenProps {
    onComplete: (snapshot: TasteMeasurementSnapshot) => void;
    onBack: () => void;
}

type MeasurementPhase = 'checklist' | 'intro' | 'prep' | 'active' | 'finished';

function roundMeasurementValue(value: number) {
    return Number(value.toFixed(2));
}

function hexToRgb(hex: string) {
    const normalized = hex.replace('#', '');

    return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}

function rgbToHex(rgb: number[]) {
    return `#${rgb
        .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
        .join('')}`;
}

function mixHex(colorA: string, colorB: string, ratio: number) {
    const left = hexToRgb(colorA);
    const right = hexToRgb(colorB);

    return rgbToHex(left.map((channel, index) => channel + (right[index] - channel) * ratio));
}

function getRelativeLuminance(hex: string) {
    const [r, g, b] = hexToRgb(hex).map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(backgroundColor: string, foregroundColor: string) {
    const backgroundLuminance = getRelativeLuminance(backgroundColor);
    const foregroundLuminance = getRelativeLuminance(foregroundColor);
    const lighter = Math.max(backgroundLuminance, foregroundLuminance);
    const darker = Math.min(backgroundLuminance, foregroundLuminance);

    return (lighter + 0.05) / (darker + 0.05);
}

function getAccessibleTasteLabelColor(backgroundColor: string, baseColor: string) {
    if (getContrastRatio(backgroundColor, baseColor) >= 3) {
        return baseColor;
    }

    for (let ratio = 0.05; ratio <= 1; ratio += 0.05) {
        const candidate = mixHex(baseColor, '#0F0F0F', ratio);
        if (getContrastRatio(backgroundColor, candidate) >= 3) {
            return candidate;
        }
    }

    return '#0F0F0F';
}

export default function TasteMeasurementScreen({ onComplete, onBack }: TasteMeasurementScreenProps) {
    const [phase, setPhase] = useState<MeasurementPhase>('checklist');
    const [tasteIndex, setTasteIndex] = useState(0);
    const [activeLevel, setActiveLevel] = useState(0);
    const [measurementResults, setMeasurementResults] = useState(
        createInitialTasteMeasurementResults,
    );
    const [completedSnapshot, setCompletedSnapshot] = useState<TasteMeasurementSnapshot | null>(null);
    const measurementStartedAtRef = useRef<number | null>(null);

    const currentTasteId = TASTE_IDS[tasteIndex];
    const currentTaste = TASTE_TOKENS[currentTasteId];
    const currentTasteLoop = currentTaste.measurement.loop;
    const displaySnapshot = completedSnapshot ?? createTasteMeasurementSnapshot(measurementResults);
    const completedEntries = getTasteMeasurementEntries(displaySnapshot);
    const averageMeasurement = getAverageMeasurementMm(displaySnapshot);
    const strongestTaste = getStrongestTasteMeasurement(displaySnapshot);
    const weakestTaste = getWeakestTasteMeasurement(displaySnapshot);
    const tasteProfileBadge = getTasteProfileBadge(averageMeasurement);

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
            <header className="flex items-center justify-between px-4 h-14 bg-[var(--tb-color-bg-page)] z-10">
                <button onClick={handleBack} className="p-2 -ml-2 text-black active:opacity-70 transition-opacity">
                    {phase === 'checklist' ? <span className="text-[20px] font-light px-1">✕</span> : <ChevronLeft strokeWidth={1.5} size={28} />}
                </button>
                <button className="p-2 -mr-2 text-black active:opacity-70 transition-opacity">
                    <MoreHorizontal strokeWidth={1.5} size={24} />
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
                            <div className="mt-8 mb-12 text-center">
                                <h1 className="text-[18px] font-bold leading-tight mb-3 tracking-tight">체크리스트</h1>
                                <p className="text-[var(--tb-color-text-body)] text-[14px]">
                                    정확한 미각 측정을 위해, 아래 단계를 먼저 준비해주세요.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {[
                                    '입 안을 깨끗이 헹궈주세요',
                                    '30분 이내 음식 섭취 여부 확인',
                                    '조용하고 집중 가능한 상태인지 확인'
                                ].map((text, i) => (
                                    <div key={i} className="w-full bg-[var(--tb-color-surface-muted)] rounded-[20px] p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-[8px] bg-black flex items-center justify-center shrink-0">
                                            <Check size={16} color="white" strokeWidth={3} />
                                        </div>
                                        <span className="text-[15px] font-bold text-black">{text}</span>
                                    </div>
                                ))}
                            </div>
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
                            <div className="mt-8 mb-16 text-center">
                                <h1 className="text-[18px] font-bold leading-tight mb-3 tracking-tight">
                                    이제, 당신의 미각을<br />만나볼 시간입니다.
                                </h1>
                                <p className="text-[var(--tb-color-text-body)] text-[14px]">
                                    총 6가지 기본 맛에 대한 민감도를 측정합니다.<br />약 3분 정도 소요되니, 잠시 집중해주세요.
                                </p>
                            </div>

                            <div className="flex-1 w-full flex items-center justify-center relative">
                                <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                                    <video 
                                        src={tasteCircleVideo}
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
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
                            <div className="mt-8 mb-10 text-center">
                                <h1 className="text-[18px] font-bold leading-tight mb-3 tracking-tight" style={{ color: currentTaste.measurement.accent }}>
                                    <span className="text-black">{currentTaste.measurement.ordinal}, {currentTaste.label} 측정</span>
                                </h1>
                                <p className="text-[var(--tb-color-text-body)] text-[14px]">
                                    지금부터 테이스틱이 10단계로 농도를 높여가며 용액을 분사합니다.<br />준비가 완료되면 테이스틱을 입에 물고 뒷면의 버튼을 눌러주세요.
                                </p>
                            </div>

                            <div className="flex-1 w-full flex items-center justify-center mb-6">
                                <div className="aspect-square w-full max-w-[440px] bg-[var(--tb-color-bg-page)] rounded-[var(--tb-radius-20)] flex items-center justify-center relative overflow-hidden shadow-sm border border-[var(--tb-color-border-card)]">
                                    {/* Image of person using the tastick */}
                                    <img
                                        src={personUsingTastickImage}
                                        alt="Teastick Preparation"
                                        className="absolute inset-0 h-full w-full origin-bottom translate-y-[12%] scale-[1.9] object-cover object-center will-change-transform"
                                    />
                                    
                                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-[12px] font-bold text-[var(--tb-color-text-hint)]">
                                        {tasteIndex + 1} / 6
                                    </div>
                                </div>
                            </div>
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
                            <div className="mt-8 mb-[10vh] text-center">
                                <h1 className="text-[18px] font-bold leading-tight mb-3 tracking-tight">
                                    <span style={{ color: currentTaste.measurement.accent }}>{currentTaste.label}</span> 민감도를 측정 중입니다...
                                </h1>
                                <p className="text-[var(--tb-color-text-body)] text-[14px]">
                                    {currentTaste.label}이(가) 느껴지면 즉시 버튼을 눌러주세요.
                                </p>
                            </div>

                            <div className="flex-1 w-full flex items-center justify-center relative">
                                {currentTasteId === 'sweet' ? (
                                    <TbCoreLoop activeLevel={activeLevel} />
                                ) : (
                                    <TasteCircularLoop
                                        activeLevel={activeLevel}
                                        ariaLabel={`${currentTaste.label} core loop`}
                                        {...currentTasteLoop}
                                    />
                                )}
                            </div>
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
                            <div className="mx-auto w-24 h-24 bg-black rounded-full flex items-center justify-center mb-6 shadow-2xl">
                                <Check size={48} color="white" strokeWidth={3} />
                            </div>
                            <div className="text-center mb-8">
                                <h1 className="text-[28px] font-bold leading-tight mb-3 tracking-tight">
                                    미각 측정이<br />완료되었어요
                                </h1>
                                <p className="text-[var(--tb-color-text-body)] text-[15px] leading-relaxed">
                                    방금 측정한 결과를 바탕으로 미각 프로필을 업데이트했어요.<br />
                                    프로필에서 이번 측정값과 세부 분석을 바로 확인할 수 있습니다.
                                </p>
                            </div>

                            <div className="rounded-[20px] bg-[var(--tb-color-bg-page)] p-3 flex flex-col gap-3 mb-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">이번 측정 요약</p>
                                        <h2 className="text-[24px] font-bold text-[var(--tb-color-text-primary)] mt-1">
                                            평균 {formatMeasurementValue(averageMeasurement)}
                                        </h2>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-[var(--tb-color-text-primary)] border border-[var(--tb-color-border-subtle)]">
                                        {tasteProfileBadge}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-[8px] bg-white p-3">
                                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)] mb-2">가장 민감한 맛</p>
                                        <p
                                            className="text-[18px] font-bold"
                                            style={{ color: TASTE_TOKENS[strongestTaste.id].measurement.accent }}
                                        >
                                            {strongestTaste.label}
                                        </p>
                                        <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)] mt-1">
                                            {formatMeasurementValue(strongestTaste.valueMm)}
                                        </p>
                                    </div>
                                    <div className="rounded-[8px] bg-white p-3">
                                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)] mb-2">가장 둔감한 맛</p>
                                        <p
                                            className="text-[18px] font-bold"
                                            style={{ color: TASTE_TOKENS[weakestTaste.id].measurement.accent }}
                                        >
                                            {weakestTaste.label}
                                        </p>
                                        <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)] mt-1">
                                            {formatMeasurementValue(weakestTaste.valueMm)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 rounded-[8px] bg-white px-3 py-3">
                                    <div>
                                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">프로필 반영 시점</p>
                                        <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)] mt-1">
                                            {formatMeasurementDate(displaySnapshot.measuredAt)}
                                        </p>
                                    </div>
                                    <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                                        6개 맛 측정 완료
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h2 className="text-[16px] font-bold text-[var(--tb-color-text-primary)] mb-3">세부 측정값</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {completedEntries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="rounded-[20px] p-3"
                                            style={{
                                                backgroundColor: TASTE_TOKENS[entry.id].palette.bg,
                                            }}
                                        >
                                            {(() => {
                                                const labelColor = getAccessibleTasteLabelColor(
                                                    TASTE_TOKENS[entry.id].palette.bg,
                                                    TASTE_TOKENS[entry.id].palette.dark,
                                                );

                                                return (
                                                    <>
                                            <p
                                                className="text-[12px] font-semibold"
                                                style={{ color: labelColor }}
                                            >
                                                {entry.label}
                                            </p>
                                            <p
                                                className="text-[20px] font-bold mt-2"
                                                style={{ color: TASTE_TOKENS[entry.id].palette.dark }}
                                            >
                                                {entry.valueMm.toFixed(2)}
                                            </p>
                                            <p className="text-[12px] font-medium text-[var(--tb-color-text-subtle)] mt-1">
                                                기준 평균 {formatMeasurementValue(entry.averageMm)}
                                            </p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Sticky Action */}
            <div className={`tb-bottom-fade absolute bottom-0 left-0 right-0 w-full px-5 flex flex-col items-center justify-end min-h-[140px] z-20 ${phase === 'finished' ? 'pb-10' : 'pb-10'}`}>
                <PrimaryButton
                    onClick={handleNextPhase}
                >
                    {phase === 'intro'
                        ? '측정 시작'
                        : phase === 'finished'
                            ? '미각 프로필 보기'
                            : phase === 'active'
                                ? activeLevel >= 10
                                    ? '다음으로'
                                    : '느껴졌어요'
                                : '계속하기'}
                </PrimaryButton>
            </div>
        </div>
    );
}
