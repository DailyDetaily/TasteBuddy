import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft as ChevronLeftIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Check as CheckIcon
} from 'lucide-react';
const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />;
const ChevronLeft = wrapIcon(ChevronLeftIcon);
const MoreHorizontal = wrapIcon(MoreHorizontalIcon);
const Check = wrapIcon(CheckIcon);
import { motion, AnimatePresence } from 'framer-motion';
import powerOnImage from '../assets/Power On Instructions.png';
import tastickConnectImage from '../assets/Tastick Connect.png';
import tbFeedbackVideo from '../assets/video/TB Feedback [Custom].mp4';
import BottomSheetShell, {
    BottomSheetCloseButton,
    BottomSheetIconButton,
} from '../components/system/BottomSheetShell';
import FlowStepCta from '../components/system/FlowStepCta';
import PrimaryButton from '../components/system/PrimaryButton';
import { ICON_TOKENS, MOTION_TOKENS } from '../constants/designTokens';

interface TeastickConnectScreenProps {
    onConnect: () => void;
    onSkip: () => void;
    disableAutoAdvance?: boolean;
    initialDrawerOpen?: boolean;
    initialDrawerStep?: DrawerStep;
    initialMainStep?: number;
}

type DrawerStep = 'power' | 'connecting' | 'connected';

const BACKGROUND_CARD_OPEN_SCALE = 0.9;
const BACKGROUND_CARD_OPEN_OFFSET = 30;
const BACKGROUND_CARD_OPEN_RADIUS = 24;
const BACKGROUND_CARD_SHADOW_Y = 20;
const BACKGROUND_CARD_SHADOW_BLUR = 60;
const BACKGROUND_CARD_SHADOW_OPACITY = 0.24;
const FLOW_APP_BAR_ICON_SIZE = ICON_TOKENS.size.lg;
const FLOW_APP_BAR_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;
const FLOW_APP_BAR_ICON_STROKE = ICON_TOKENS.strokeWidth.regular;
const BACKGROUND_CARD_TRANSITION = [
    `transform ${MOTION_TOKENS.durationMs.slow}ms ${MOTION_TOKENS.easing.entrance}`,
    `border-radius ${MOTION_TOKENS.durationMs.slowest}ms ${MOTION_TOKENS.easing.entrance}`,
    `box-shadow ${MOTION_TOKENS.durationMs.slow}ms ${MOTION_TOKENS.easing.entrance}`,
].join(', ');

export default function TeastickConnectScreen({
    disableAutoAdvance = false,
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
        if (!disableAutoAdvance && isDrawerOpen && drawerStep === 'connecting') {
            const randomTime = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;
            timer = setTimeout(() => {
                setDrawerStep('connected');
            }, randomTime);
        }
        return () => clearTimeout(timer);
    }, [disableAutoAdvance, isDrawerOpen, drawerStep]);

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
                <header className="z-10 flex min-h-[var(--tb-size-top-app-bar-height)] items-center justify-between bg-[var(--tb-color-bg-page)] px-[20px] py-[12px]">
                    <button
                        type="button"
                        aria-label="건너뛰기"
                        onClick={onSkip}
                        className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] active:opacity-70"
                        style={{
                            width: FLOW_APP_BAR_ICON_BUTTON_SIZE,
                            height: FLOW_APP_BAR_ICON_BUTTON_SIZE,
                        }}
                    >
                        <ChevronLeft strokeWidth={FLOW_APP_BAR_ICON_STROKE} size={FLOW_APP_BAR_ICON_SIZE} />
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
                                            {isCompleted ? <Check size={ICON_TOKENS.size.sm} strokeWidth={3} /> : <span className="text-[13px] font-bold">{step.id}</span>}
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

                <FlowStepCta
                    actionLabel={mainStep === 1 ? '연결하기' : '계속하기'}
                    currentIndex={Math.max(0, Math.min(mainStep - 1, 2))}
                    onAction={mainStep === 1 ? handleStartConnection : onConnect}
                    total={3}
                />
            </div>

            <BottomSheetShell
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onDrag={(_, percentageDragged) => {
                    applyBackgroundCardProgress(1 - percentageDragged, true);
                }}
                onRelease={(_, open) => {
                    applyBackgroundCardProgress(open ? 1 : 0);
                }}
                headerStart={<BottomSheetCloseButton />}
                headerEnd={
                    <BottomSheetIconButton ariaLabel="옵션 더보기" icon={MoreHorizontal} />
                }
                bodyClassName="relative"
                footer={
                    <div className="flex flex-col items-center justify-end">
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
                }
            >
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
                            <h2 className="mb-2 text-[18px] font-bold text-[var(--tb-color-text-primary)]">테이스틱의 전원을 켭니다</h2>
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
                            <h2 className="mb-2 text-[18px] font-bold text-[var(--tb-color-text-primary)]">기기를 연결중입니다</h2>
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
                            <h2 className="mb-2 text-[18px] font-bold text-[var(--tb-color-text-primary)]">테이스틱 연결 완료</h2>
                            <p className="text-[14px] text-[var(--tb-color-text-body)]">테이스틱을 통해 미각 분석을 시작해보세요.</p>

                            <div className="flex-1 w-full bg-white rounded-[24px] mt-10 mb-6 flex items-center justify-center relative overflow-hidden">
                                <img src={tastickConnectImage} alt="Teastick device connected" className="w-[85%] h-[85%] object-contain" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </BottomSheetShell>
        </div>
    );
}
