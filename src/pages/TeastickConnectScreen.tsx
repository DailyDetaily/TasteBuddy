import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import powerOnImage from '../assets/Power On Instructions.png';
import tastickConnectImage from '../assets/Tastick Connect.png';
import tbFeedbackVideo from '../assets/video/TB Feedback [Custom].mp4';
import PrimaryButton from '../components/system/PrimaryButton';
import { MOTION_TOKENS } from '../constants/designTokens';

interface TeastickConnectScreenProps {
    onConnect: () => void;
    onSkip: () => void;
    initialDrawerOpen?: boolean;
    initialDrawerStep?: DrawerStep;
    initialMainStep?: number;
}

type DrawerStep = 'power' | 'connecting' | 'connected';

const BACKGROUND_CARD_OPEN_SCALE = 0.9;
const BACKGROUND_CARD_OPEN_OFFSET = 40;
const BACKGROUND_CARD_OPEN_RADIUS = 24;
const BACKGROUND_CARD_SHADOW_Y = 20;
const BACKGROUND_CARD_SHADOW_BLUR = 60;
const BACKGROUND_CARD_SHADOW_OPACITY = 0.24;
const BACKGROUND_CARD_TRANSITION = [
    `transform ${MOTION_TOKENS.durationMs.slow}ms ${MOTION_TOKENS.easing.entrance}`,
    `border-radius ${MOTION_TOKENS.durationMs.slowest}ms ${MOTION_TOKENS.easing.entrance}`,
    `box-shadow ${MOTION_TOKENS.durationMs.slow}ms ${MOTION_TOKENS.easing.entrance}`,
].join(', ');

export default function TeastickConnectScreen({
    initialDrawerOpen = false,
    initialDrawerStep = 'power',
    initialMainStep = 1,
    onConnect,
    onSkip,
}: TeastickConnectScreenProps) {
    const [mainStep, setMainStep] = useState(initialMainStep);
    const [isDrawerOpen, setIsDrawerOpen] = useState(initialDrawerOpen);
    const [drawerStep, setDrawerStep] = useState<DrawerStep>(initialDrawerStep);
    const backgroundCardRef = useRef<HTMLDivElement>(null);

    const applyBackgroundCardProgress = (progress: number, immediate = false) => {
        const backgroundCard = backgroundCardRef.current;

        if (!backgroundCard) return;

        const clampedProgress = Math.min(Math.max(progress, 0), 1);
        const scale = 1 - (1 - BACKGROUND_CARD_OPEN_SCALE) * clampedProgress;
        const translateY = BACKGROUND_CARD_OPEN_OFFSET * clampedProgress;
        const borderRadius = BACKGROUND_CARD_OPEN_RADIUS * clampedProgress;
        const shadowOffsetY = BACKGROUND_CARD_SHADOW_Y * clampedProgress;
        const shadowBlur = BACKGROUND_CARD_SHADOW_BLUR * clampedProgress;
        const shadowOpacity = BACKGROUND_CARD_SHADOW_OPACITY * clampedProgress;

        backgroundCard.style.transition = immediate ? 'none' : BACKGROUND_CARD_TRANSITION;
        backgroundCard.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
        backgroundCard.style.borderRadius = `${borderRadius}px`;
        backgroundCard.style.boxShadow = clampedProgress > 0
            ? `0 ${shadowOffsetY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity})`
            : 'none';
    };

    // Drawer connection sequence simulation
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isDrawerOpen && drawerStep === 'connecting') {
            const randomTime = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;
            timer = setTimeout(() => {
                setDrawerStep('connected');
            }, randomTime);
        }
        return () => clearTimeout(timer);
    }, [isDrawerOpen, drawerStep]);

    useEffect(() => {
        applyBackgroundCardProgress(isDrawerOpen ? 1 : 0);
    }, [isDrawerOpen]);

    const handleStartConnection = () => {
        setIsDrawerOpen(true);
        setDrawerStep('power');
    };

    const handleDrawerNext = () => {
        if (drawerStep === 'power') {
            setDrawerStep('connecting');
        } else if (drawerStep === 'connected') {
            setIsDrawerOpen(false);
            // After successful connection, move main step to 2
            setTimeout(() => setMainStep(2), MOTION_TOKENS.durationMs.normal);
        }
    };

    const steps = [
        { id: 1, title: '미각 측정 기기 연결', desc: '셰프가 고객님의 입맛을 이해하기 위해 보내드린\n테이스틱을 연결합니다.' },
        { id: 2, title: '미각 측정 및 분석', desc: '고객님의 미각 반응을 기록하며, 셰프에게 전달될 데이터를 조율하고 있습니다.' },
        { id: 3, title: '미각 피드백 및 캘리브레이션', desc: '' },
    ];

    return (
        <div
            className={`relative flex h-full w-full font-sans transition-colors duration-500 ease-in-out ${isDrawerOpen ? 'bg-black' : 'bg-[var(--tb-color-bg-page)]'}`}
            style={{ transitionDuration: `${MOTION_TOKENS.durationMs.medium}ms` }}
        >
            <div
                ref={backgroundCardRef}
                className="relative flex h-full w-full origin-top flex-col overflow-hidden bg-[var(--tb-color-bg-page)] will-change-transform"
            >
                {/* Header */}
                <header className="flex items-center justify-between px-4 h-14 bg-[var(--tb-color-bg-page)] z-10">
                    <button onClick={onSkip} className="p-2 -ml-2 text-black active:opacity-70 transition-opacity">
                        <ChevronLeft strokeWidth={1.5} size={28} />
                    </button>
                    <button className="p-2 -mr-2 text-black active:opacity-70 transition-opacity">
                        <MoreHorizontal strokeWidth={1.5} size={24} />
                    </button>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-5 pb-24">
                    <div className="mt-6 mb-12 text-center">
                        <h1 className="text-[18px] font-bold leading-tight mb-3 tracking-tight">
                            지금부터 고객님의 미각을<br />정밀하게 측정합니다.
                        </h1>
                        <p className="text-[14px] text-[var(--tb-color-text-body)]">
                            매뉴얼에 따라 측정을 진행해주세요.
                        </p>
                    </div>

                    {/* Steps List */}
                    <div className="flex flex-col gap-3">
                        {steps.map((step) => {
                            const isCompleted = mainStep > step.id;
                            const isActive = mainStep === step.id;

                            let bgColor = 'bg-[var(--tb-color-surface-muted)]';
                            if (isActive) bgColor = 'border border-[var(--tb-color-border-strong)] bg-[var(--tb-color-surface-elevated)]';
                            else if (isCompleted) bgColor = 'bg-[var(--tb-color-surface-muted)] opacity-80';

                            return (
                                <div key={step.id} className={`w-full rounded-[20px] p-3 ${bgColor} transition-all duration-300`}>
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[8px] ${isCompleted || isActive ? 'bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]' : 'bg-[var(--tb-color-text-disabled)] text-[var(--tb-color-text-inverse)]'}`}
                                        >
                                            {isCompleted ? <Check size={14} strokeWidth={3} /> : <span className="text-[13px] font-bold">{step.id}</span>}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-[14px] font-bold tracking-tight ${(isActive) ? 'text-[var(--tb-color-text-primary)]' : 'text-[var(--tb-color-text-tertiary)]'}`}>
                                                {step.title}
                                            </h3>
                                            {isActive && step.desc && (
                                                <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--tb-color-text-body)]">
                                                    {step.desc}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Bottom Sticky Action */}
                <div className="tb-bottom-fade absolute bottom-0 left-0 right-0 w-full px-5 flex flex-col items-center justify-end pb-10 min-h-[140px] z-20">
                    <PrimaryButton onClick={mainStep === 1 ? handleStartConnection : onConnect}>
                        {mainStep === 1 ? '연결하기' : '계속하기'}
                    </PrimaryButton>
                </div>
            </div>

            {/* Connection Drawer */}
            <Drawer.Root
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onDrag={(_, percentageDragged) => {
                    applyBackgroundCardProgress(1 - percentageDragged, true);
                }}
                onRelease={(_, open) => {
                    applyBackgroundCardProgress(open ? 1 : 0);
                }}
            >
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.6)]" />
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-[1440px] mx-auto bg-white flex flex-col rounded-t-[24px] z-50 h-[95vh] outline-none">
                        {/* Drawer Handle */}
                        <div className="w-full flex justify-center pt-3 pb-2">
                            <div className="h-1.5 w-10 rounded-full bg-[var(--tb-color-border-strong)]" />
                        </div>

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-4 pb-4">
                            <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-black">
                                <span className="text-[20px] font-light">✕</span>
                            </button>
                            <button className="p-2 text-black">
                                <MoreHorizontal strokeWidth={1.5} size={24} />
                            </button>
                        </div>

                        {/* Drawer Content Area */}
                        <div className="flex-1 flex flex-col relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                {drawerStep === 'power' && (
                                    <motion.div
                                        key="power"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: MOTION_TOKENS.durationMs.normal / 1000 }}
                                        className="absolute inset-0 flex flex-col items-center px-5 pt-10"
                                    >
                                        <h2 className="mb-2 text-[22px] font-bold text-[var(--tb-color-text-primary)]">테이스틱의 전원을 켭니다</h2>
                                        <p className="text-[14px] text-[var(--tb-color-text-body)]">밑면의 버튼을 2초간 길게 누르세요.</p>
                                        <div className="flex-1 w-full bg-white rounded-[24px] mt-10 mb-6 flex items-center justify-center relative overflow-hidden">
                                            <img src={powerOnImage} alt="Power On Instructions" className="w-[85%] h-[85%] object-contain" />
                                        </div>
                                    </motion.div>
                                )}

                                {drawerStep === 'connecting' && (
                                    <motion.div
                                        key="connecting"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: MOTION_TOKENS.durationMs.normal / 1000 }}
                                        className="absolute inset-0 flex flex-col items-center px-5 pt-10"
                                    >
                                        <h2 className="mb-2 text-[22px] font-bold text-[var(--tb-color-text-primary)]">기기를 연결중입니다</h2>
                                        <p className="text-[14px] text-[var(--tb-color-text-body)]">연결이 완료되면 녹색 점등이 반짝입니다.</p>

                                        <div className="flex-1 w-full bg-white rounded-[24px] mt-10 mb-6 flex items-center justify-center relative overflow-hidden">
                                            <video
                                                src={tbFeedbackVideo}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {drawerStep === 'connected' && (
                                    <motion.div
                                        key="connected"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: MOTION_TOKENS.durationMs.normal / 1000 }}
                                        className="absolute inset-0 flex flex-col items-center px-5 pt-10"
                                    >
                                        <h2 className="mb-2 text-[22px] font-bold text-[var(--tb-color-text-primary)]">테이스틱 연결 완료</h2>
                                        <p className="text-[14px] text-[var(--tb-color-text-body)]">테이스틱을 통해 미각 분석을 시작해보세요.</p>

                                        <div className="flex-1 w-full bg-white rounded-[24px] mt-10 mb-6 flex items-center justify-center relative overflow-hidden">
                                            <img src={tastickConnectImage} alt="Teastick device connected" className="w-[85%] h-[85%] object-contain" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Drawer Bottom Button */}
                        <div className="w-full px-5 flex flex-col items-center justify-end pb-10 pt-4">
                            <PrimaryButton
                                onClick={drawerStep === 'connecting' ? undefined : handleDrawerNext}
                                disabled={drawerStep === 'connecting'}
                                className={drawerStep === 'connecting'
                                        ? 'cursor-none'
                                        : ''
                                    }
                            >
                                {drawerStep === 'power' ? '연결하기' : (drawerStep === 'connecting' ? '연결 중...' : '계속하기')}
                            </PrimaryButton>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </div>
    );
}
