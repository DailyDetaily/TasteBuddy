import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import tbAnalysisVideo from '../assets/video/TB Analysis.mp4';
import tbDetailMatrixVideo from '../assets/video/TB Detail Matrix.mp4';
import tbMainVideo from '../assets/video/TB Main.mp4';
import onboardingRender1 from '../assets/onboarding_render_1.png';
import onboardingRender3 from '../assets/onboarding_render_3.png';
import onboardingRender4 from '../assets/onboarding_render_4.png';

interface OnboardingScreenProps {
    onComplete: () => void;
}

const ONBOARDING_STEPS = [
    {
        graphic: <img src={onboardingRender1} alt="Device Front and Back" className="h-full w-auto object-contain" />,
        title: 'Welcome to TasteBuddy',
        description: '새로운 차원의 미식을 경험하세요.',
    },
    {
        graphic: (
            <video
                src={tbAnalysisVideo}
                className="h-full w-auto object-contain max-h-[280px]"
                autoPlay
                loop
                muted
                playsInline
            />
        ),
        title: '미각 분석 및 프로파일링',
        description: '테이스트버디는 당신의 미각을 데이터화하고 이해합니다.',
    },
    {
        graphic: (
            <video
                src={tbDetailMatrixVideo}
                className="h-full w-auto object-contain max-h-[280px]"
                autoPlay
                loop
                muted
                playsInline
            />
        ),
        title: '미각 보정 및 매칭',
        description: '당신의 미각 데이터를 바탕으로\n셰프와 동일한 맛을 경험할 수 있도록 레시피를 조율합니다.',
    },
    {
        graphic: (
            <video
                src={tbMainVideo}
                className="h-full w-auto object-contain max-h-[280px]"
                autoPlay
                loop
                muted
                playsInline
            />
        ),
        title: '당신의 입맛은\n생각보다 예민합니다',
        description: '당신만의 미묘한 차이를 테이스트버디가 분석합니다.\n지금, 나만의 미각 프로필을 만나보세요.',
    }
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
    const totalSteps = ONBOARDING_STEPS.length;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const onDragEnd = (_e: any, info: any) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            handleNext();
        } else if (info.offset.x > swipeThreshold) {
            handlePrev();
        }
    };

    const stepData = ONBOARDING_STEPS[currentStep];

    return (
        <div className="flex flex-col w-full h-full bg-white relative overflow-hidden">
            {/* 콘텐츠 영역 */}
            <motion.div
                key={currentStep}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={onDragEnd}
                initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="flex-1 flex flex-col items-center justify-center -translate-y-[4vh] select-none touch-none"
            >
                {/* Graphic Container */}
                <div className="w-full flex items-center justify-center h-[280px] mb-8 relative">
                    {stepData.graphic}
                </div>

                {/* Texts Container */}
                <div className="text-center flex flex-col items-center px-5 min-h-[100px]">
                    <h2 className="text-[22px] font-bold tracking-tight text-[#0f0f0f] mb-2 whitespace-pre-line text-center leading-snug">
                        {stepData.title}
                    </h2>
                    <p className="text-[14px] text-[#535353] whitespace-pre-line text-center leading-relaxed">
                        {stepData.description}
                    </p>
                </div>
            </motion.div>

            {/* 하단 네비게이션 영역 */}
            <div className="w-full px-5 flex flex-col items-center justify-end pb-10 min-h-[140px] relative z-20 bg-gradient-to-t from-white via-white to-transparent">
                {/* 인디케이터 */}
                <div className="flex items-center gap-[6px] mb-8">
                    {ONBOARDING_STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-[6px] rounded-full transition-all duration-300 ${idx === currentStep ? 'w-[16px] bg-[#0f0f0f]' : 'w-[6px] bg-[#E5E5E5]'
                                }`}
                        />
                    ))}
                </div>

                {/* 버튼 */}
                <button
                    onClick={handleNext}
                    className="w-full h-[52px] rounded-[10px] bg-[#0f0f0f] text-white font-medium text-[14px] flex items-center justify-center transition-transform active:scale-[0.98]"
                >
                    {currentStep === totalSteps - 1 ? '시작하기' : '다음'}
                </button>
            </div>

            <style>{`
        @keyframes fade-up {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes scale-in {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
