import { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Using the closest available assets as placeholders
import personUsingTastickImage from '../assets/Image of a person using the Tastick.png';
import tasteCircleVideo from '../assets/video/Taste circle.mp4';

interface TasteMeasurementScreenProps {
    onComplete: () => void;
    onBack: () => void;
}

type MeasurementPhase = 'checklist' | 'intro' | 'prep' | 'active' | 'finished';
type TasteId = 'sweet' | 'sour' | 'bitter' | 'salty' | 'umami' | 'fat';

interface TasteConfig {
    id: TasteId;
    label: string;
    koreanLabel: string;
    descriptionText: string;
    colorMain: string;
    colorBg: string;
    colorPast: string;
    colorBase: string;
    angle: number;
}

const TASTE_CONFIGS: TasteConfig[] = [
    { id: 'sweet', label: '단맛', koreanLabel: '단맛', descriptionText: '첫 번째', colorMain: '#FF9500', colorBg: '#FFE7C8', colorPast: '#FFB340', colorBase: '#F3CD9A', angle: 330 },
    { id: 'sour', label: '신맛', koreanLabel: '신맛', descriptionText: '두 번째', colorMain: '#FFD600', colorBg: '#FFF5B8', colorPast: '#FFE040', colorBase: '#FBE88C', angle: 30 },
    { id: 'bitter', label: '쓴맛', koreanLabel: '쓴맛', descriptionText: '세 번째', colorMain: '#8CC600', colorBg: '#CCEFFF', colorPast: '#66C2FF', colorBase: '#9BE4F7', angle: 90 },
    { id: 'salty', label: '짠맛', koreanLabel: '짠맛', descriptionText: '네 번째', colorMain: '#5898FF', colorBg: '#CCE5FF', colorPast: '#4D94FF', colorBase: '#92C4F7', angle: 150 },
    { id: 'umami', label: '감칠맛', koreanLabel: '감칠맛', descriptionText: '다섯 번째', colorMain: '#AF52DE', colorBg: '#EED9FA', colorPast: '#C582E8', colorBase: '#D8B8E8', angle: 210 },
    { id: 'fat', label: '지방맛', koreanLabel: '지방맛', descriptionText: '여섯 번째', colorMain: '#8E8279', colorBg: '#ECE4D9', colorPast: '#B8A082', colorBase: '#DBCCBA', angle: 270 },
];

export default function TasteMeasurementScreen({ onComplete, onBack }: TasteMeasurementScreenProps) {
    const [phase, setPhase] = useState<MeasurementPhase>('checklist');
    const [tasteIndex, setTasteIndex] = useState(0);
    const [activeLevel, setActiveLevel] = useState(0);

    const currentTaste = TASTE_CONFIGS[tasteIndex];

    // Simulate Active Measurement Progress
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (phase === 'active' && activeLevel <= 10) {
            timer = setTimeout(() => {
                // If it hits 11, it means the user never pressed the button (didn't taste it).
                // For demo purposes, we automatically advance to the next step when it goes past 10.
                if (activeLevel === 10) {
                    handleUserReaction();
                } else {
                    setActiveLevel(prev => prev + 1);
                }
            }, 800); // Increments every 0.8 seconds to keep demo moving
        }
        return () => clearTimeout(timer);
    }, [phase, activeLevel]);

    const handleNextPhase = () => {
        switch (phase) {
            case 'checklist':
                setPhase('intro');
                break;
            case 'intro':
                setPhase('prep');
                break;
            case 'prep':
                setPhase('active');
                setActiveLevel(1); // Start measurement at level 1
                break;
            case 'active':
                handleUserReaction();
                break;
            case 'finished':
                onComplete();
                break;
        }
    };

    const handleUserReaction = () => {
        // User felt the taste, record level and move to next
        if (tasteIndex < TASTE_CONFIGS.length - 1) {
            setTasteIndex(prev => prev + 1);
            setPhase('prep');
        } else {
            // All tastes completed
            setPhase('finished');
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
        }
        else if (phase === 'finished') {
            setPhase('prep');
            setTasteIndex(TASTE_CONFIGS.length - 1);
        }
    };


    // Circular Progress Settings for Intro
    const radius = 120;
    const center = 150;

    return (
        <div className="flex flex-col w-full h-full bg-white relative font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-4 h-14 bg-white z-10">
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
                                <h1 className="text-[24px] font-bold leading-tight mb-3 tracking-tight">체크리스트</h1>
                                <p className="text-[#666666] text-[14px]">
                                    정확한 미각 측정을 위해, 아래 단계를 먼저 준비해주세요.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {[
                                    '입 안을 깨끗이 헹궈주세요',
                                    '30분 이내 음식 섭취 여부 확인',
                                    '조용하고 집중 가능한 상태인지 확인'
                                ].map((text, i) => (
                                    <div key={i} className="w-full bg-[#F5F5F5] rounded-[20px] p-3 flex items-center gap-3">
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
                                <h1 className="text-[24px] font-bold leading-tight mb-3 tracking-tight">
                                    이제, 당신의 미각을<br />만나볼 시간입니다.
                                </h1>
                                <p className="text-[#666666] text-[14px]">
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
                                <h1 className="text-[24px] font-bold leading-tight mb-3 tracking-tight" style={{ color: currentTaste.colorMain }}>
                                    <span className="text-black">{currentTaste.descriptionText}, {currentTaste.koreanLabel} 측정</span>
                                </h1>
                                <p className="text-[#666666] text-[14px]">
                                    지금부터 테이스틱이 10단계로 농도를 높여가며 용액을 분사합니다.<br />준비가 완료되면 테이스틱을 입에 물고 뒷면의 버튼을 눌러주세요.
                                </p>
                            </div>

                            <div className="flex-1 w-full flex items-center justify-center mb-6">
                                <div className="aspect-square w-full max-w-[320px] bg-[#f4f4f4] rounded-[24px] flex items-center justify-center relative overflow-hidden shadow-sm border border-[#F0F0F0]">
                                    {/* Image of person using the tastick */}
                                    <img src={personUsingTastickImage} alt="Teastick Preparation" className="w-full h-full object-cover" />
                                    
                                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-[12px] font-bold text-[#888]">
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
                                <h1 className="text-[24px] font-bold leading-tight mb-3 tracking-tight">
                                    <span style={{ color: currentTaste.colorMain }}>{currentTaste.koreanLabel}</span> 민감도를 측정 중입니다...
                                </h1>
                                <p className="text-[#666666] text-[14px]">
                                    {currentTaste.koreanLabel}이(가) 느껴지면 즉시 버튼을 눌러주세요.
                                </p>
                            </div>

                            <div className="flex-1 w-full flex items-center justify-center relative">
                                <div className="relative w-[280px] h-[280px]">
                                    {/* Base Dashed Circle */}
                                    <div className="absolute inset-4 rounded-full border-[1.5px] border-dashed" style={{ borderColor: currentTaste.colorBase }} />

                                    {/* 10 Step Nodes */}
                                    {Array.from({ length: 10 }).map((_, idx) => {
                                        const step = idx + 1;
                                        // Start from top (1) and go clockwise
                                        const angle = (360 / 10) * idx;
                                        const radian = (angle - 90) * (Math.PI / 180);
                                        const stepRadius = 115;
                                        const cx = 140 + stepRadius * Math.cos(radian);
                                        const cy = 140 + stepRadius * Math.sin(radian);

                                        const isActive = step === activeLevel;
                                        const isPast = step < activeLevel;

                                        return (
                                            <div
                                                key={step}
                                                className="absolute flex flex-col items-center justify-center"
                                                style={{
                                                    top: `${(cy / 280) * 100}%`,
                                                    left: `${(cx / 280) * 100}%`,
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                            >
                                                <span className={`text-[12px] font-medium mb-1 absolute -top-5 ${isActive ? 'font-bold' : 'text-[#999]'}`} style={{ color: isActive ? currentTaste.colorMain : undefined }}>
                                                    {step}
                                                </span>
                                                <div
                                                    className={`rounded-full border-2 border-white transition-all duration-500 ${isActive ? 'w-7 h-7 shadow-md z-10 scale-110' : 'w-5 h-5 scale-100'}`}
                                                    style={{ backgroundColor: isActive ? currentTaste.colorMain : (isPast ? currentTaste.colorPast : currentTaste.colorBg) }}
                                                />
                                            </div>
                                        );
                                    })}

                                    {/* Central subtle highlight if active */}
                                    <div
                                        className="absolute inset-10 rounded-full opacity-50 pointer-events-none transition-colors duration-500 text-transparent"
                                        style={{ background: `radial-gradient(circle, ${currentTaste.colorMain}1A 0%, ${currentTaste.colorMain}00 70%)` }}
                                    />
                                </div>
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
                            className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
                        >
                            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-6 shadow-2xl">
                                <Check size={48} color="white" strokeWidth={3} />
                            </div>
                            <h1 className="text-[28px] font-bold leading-tight mb-4 tracking-tight">
                                미각 측정이<br />완료되었습니다!
                            </h1>
                            <p className="text-[#666666] text-[15px] leading-relaxed">
                                고객님의 정밀 미각 데이터가 성공적으로<br />분석되었습니다.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Sticky Action */}
            <div className={`absolute bottom-0 left-0 right-0 w-full px-5 flex flex-col items-center justify-end min-h-[140px] z-20 bg-gradient-to-t from-white via-white to-transparent ${phase === 'finished' ? 'pb-10' : 'pb-10'}`}>
                <button
                    onClick={handleNextPhase}
                    className={`w-full h-[52px] rounded-[10px] font-medium text-[14px] flex items-center justify-center transition-transform active:scale-[0.98] ${
                        phase === 'active'
                            ? 'bg-[#F2F2F2] text-[#AEAEAE] active:scale-100 shadow-none' // Visual indicator it's meant to be pressed via device, but we allow click for demo
                            : 'bg-[#0f0f0f] text-white shadow-lg shadow-black/10'
                    }`}
                >
                    {phase === 'intro' ? '측정 시작' : (phase === 'finished' ? '결과 확인하기' : '계속하기')}
                </button>
            </div>
        </div>
    );
}
