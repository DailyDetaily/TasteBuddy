import { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Using the closest available assets as placeholders
import personUsingTastickImage from '../assets/Image of a person using the Tastick.png';
import tasteCircleVideo from '../assets/video/Taste circle.mp4';
import TbCoreLoop from '../components/graphics/TbCoreLoop';
import TasteCircularLoop from '../components/graphics/TasteCircularLoop';
import { TASTE_CIRCULAR_LOOP_STEP_ADVANCE_MS } from '../components/graphics/tasteCircularLoopMotion';

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

const TASTE_LOOP_STYLES: Record<Exclude<TasteId, 'sweet'>, {
    nodeColors: readonly string[];
    ringBaseColor: string;
    ringBaseColorSoft: string;
    ringGuideBaseColor: string;
    glowTransparentColor: string;
}> = {
    sour: {
        nodeColors: ['#FFF7CC', '#FFF4B8', '#FFF1A3', '#FFEE8F', '#FFEB7A', '#FFE866', '#FFE552', '#FFE23D', '#FFDF29', '#FFD600'],
        ringBaseColor: '#FFF7CC',
        ringBaseColorSoft: '#FFF7CC1A',
        ringGuideBaseColor: '#FFD600',
        glowTransparentColor: '#FFF7CC08',
    },
    bitter: {
        nodeColors: ['#EAF4CC', '#E1EFC0', '#D8EAB4', '#CFE5A8', '#C5DF9C', '#BCDA90', '#B3D584', '#AAD078', '#A0CB6C', '#95C900'],
        ringBaseColor: '#EAF4CC',
        ringBaseColorSoft: '#EAF4CC1A',
        ringGuideBaseColor: '#95C900',
        glowTransparentColor: '#EAF4CC08',
    },
    salty: {
        nodeColors: ['#E3EBFF', '#D6E2FF', '#C9D9FF', '#BCD0FF', '#AFC7FF', '#A2BEFF', '#95B5FF', '#88ACFF', '#7BA3FF', '#7299FF'],
        ringBaseColor: '#E3EBFF',
        ringBaseColorSoft: '#E3EBFF1A',
        ringGuideBaseColor: '#7299FF',
        glowTransparentColor: '#E3EBFF08',
    },
    umami: {
        nodeColors: ['#F0E3F0', '#E7D7E8', '#DECAE0', '#D5BED8', '#CCB1D0', '#C3A5C8', '#BA98C0', '#B18CB8', '#A87FB0', '#B372B4'],
        ringBaseColor: '#F0E3F0',
        ringBaseColorSoft: '#F0E3F01A',
        ringGuideBaseColor: '#B372B4',
        glowTransparentColor: '#F0E3F008',
    },
    fat: {
        nodeColors: ['#EAE7E4', '#E2DEDA', '#DAD5D0', '#D2CCC6', '#CAC3BC', '#C2BAB2', '#BAB1A8', '#B2A89E', '#AA9F94', '#95867A'],
        ringBaseColor: '#EAE7E4',
        ringBaseColorSoft: '#EAE7E41A',
        ringGuideBaseColor: '#95867A',
        glowTransparentColor: '#EAE7E408',
    },
};

export default function TasteMeasurementScreen({ onComplete, onBack }: TasteMeasurementScreenProps) {
    const [phase, setPhase] = useState<MeasurementPhase>('checklist');
    const [tasteIndex, setTasteIndex] = useState(0);
    const [activeLevel, setActiveLevel] = useState(0);

    const currentTaste = TASTE_CONFIGS[tasteIndex];

    // Simulate Active Measurement Progress
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (phase === 'active' && activeLevel < 10) {
            timer = setTimeout(() => {
                setActiveLevel(prev => prev + 1);
            }, TASTE_CIRCULAR_LOOP_STEP_ADVANCE_MS); // One level now holds for two pulse cycles
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
                if (activeLevel >= 10) {
                    handleUserReaction();
                }
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
                                {currentTaste.id === 'sweet' ? (
                                    <TbCoreLoop activeLevel={activeLevel} />
                                ) : (
                                    <TasteCircularLoop
                                        activeLevel={activeLevel}
                                        ariaLabel={`${currentTaste.koreanLabel} core loop`}
                                        {...TASTE_LOOP_STYLES[currentTaste.id as Exclude<TasteId, 'sweet'>]}
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
                        phase === 'active' && activeLevel < 10
                            ? 'bg-[#F2F2F2] text-[#AEAEAE] active:scale-100 shadow-none' // Visual indicator it's meant to be pressed via device, but we allow click for demo
                            : 'bg-[#0f0f0f] text-white shadow-lg shadow-black/10'
                    }`}
                >
                    {phase === 'intro'
                        ? '측정 시작'
                        : phase === 'finished'
                            ? '결과 확인하기'
                            : phase === 'active' && activeLevel >= 10
                                ? '다음으로'
                                : '계속하기'}
                </button>
            </div>
        </div>
    );
}
