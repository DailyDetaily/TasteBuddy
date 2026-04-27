import { useState, useEffect, useRef } from 'react';
import {
    MoreHorizontal as MoreHorizontalIcon,
} from 'lucide-react';
const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />;
const MoreHorizontal = wrapIcon(MoreHorizontalIcon);
import { motion, AnimatePresence } from 'framer-motion';
import powerOnImage from '../assets/Power On Instructions.png';
import tastickConnectImage from '../assets/Tastick Connect.png';
import tbFeedbackVideo from '../assets/video/TB Feedback [Custom].mp4';
import BottomSheetShell, {
    BottomSheetCloseButton,
    BottomSheetIconButton,
} from '../components/system/BottomSheetShell';
import PrimaryButton from '../components/system/PrimaryButton';
import TastickIntroScreen from './TastickIntroScreen';
import { MOTION_TOKENS } from '../constants/designTokens';

interface TastickConnectScreenProps {
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
const BACKGROUND_CARD_TRANSITION = [
    `transform ${MOTION_TOKENS.durationMs.slow}ms ${MOTION_TOKENS.easing.entrance}`,
    `border-radius ${MOTION_TOKENS.durationMs.slowest}ms ${MOTION_TOKENS.easing.entrance}`,
    `box-shadow ${MOTION_TOKENS.durationMs.slow}ms ${MOTION_TOKENS.easing.entrance}`,
].join(', ');

export default function TastickConnectScreen({
    disableAutoAdvance = false,
    initialDrawerOpen = false,
    initialDrawerStep = 'power',
    initialMainStep = 1,
    onConnect,
    onSkip,
}: TastickConnectScreenProps) {
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

    return (
        <div
            className={`relative flex h-full w-full font-sans transition-colors duration-500 ease-in-out ${isDrawerOpen ? 'bg-black' : 'bg-[var(--tb-color-bg-page)]'}`}
            style={{ transitionDuration: `${MOTION_TOKENS.durationMs.medium}ms` }}
        >
            <div
                ref={backgroundCardRef}
                className="relative flex h-full w-full origin-top flex-col overflow-hidden bg-[var(--tb-color-bg-page)] will-change-transform"
            >
                <TastickIntroScreen
                    activeStep={mainStep}
                    actionLabel={mainStep === 1 ? '연결하기' : '계속하기'}
                    onBack={onSkip}
                    onAction={mainStep === 1 ? handleStartConnection : onConnect}
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
                                <img src={tastickConnectImage} alt="Tastick device connected" className="w-[85%] h-[85%] object-contain" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </BottomSheetShell>
        </div>
    );
}
