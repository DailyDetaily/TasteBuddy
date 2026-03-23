import { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';

import tbAnalysisVideo from '../assets/video/TB Analysis.mp4';
import tbDetailMatrixVideo from '../assets/video/TB Detail Matrix.mp4';
import tbMainVideo from '../assets/video/TB Main.mp4';
import onboardingRender1 from '../assets/onboarding_render_1.png';
import PrimaryButton from '../components/system/PrimaryButton';
import { MOTION_TOKENS } from '../constants/designTokens';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    graphic: (
      <img
        src={onboardingRender1}
        alt="Taste Buddy dining introduction"
        className="h-full w-auto object-contain"
      />
    ),
    title: '더 잘 맞는 다이닝을\n시작해보세요',
    description: 'Taste Buddy는 당신의 현재 입맛을 이해해,\n더 잘 맞는 다이닝 경험으로 이어줍니다.',
  },
  {
    graphic: (
      <video
        src={tbAnalysisVideo}
        className="h-full w-auto max-h-[280px] object-contain"
        autoPlay
        loop
        muted
        playsInline
      />
    ),
    title: '가볍게 시작해\n현재 프로필을 만듭니다',
    description: '복잡한 설명보다, 지금의 미각 경향을 빠르게 정리해\n첫 예약부터 활용할 수 있는 프로필을 만듭니다.',
  },
  {
    graphic: (
      <video
        src={tbDetailMatrixVideo}
        className="h-full w-auto max-h-[280px] object-contain"
        autoPlay
        loop
        muted
        playsInline
      />
    ),
    title: '프로필은 예약과 다이닝에 맞춰\n실용적으로 전달됩니다',
    description:
      '당신의 프로필은 셰프가 의도를 해치지 않으면서도\n더 잘 맞는 경험을 준비할 수 있도록 정리됩니다.',
  },
  {
    graphic: (
      <video
        src={tbMainVideo}
        className="h-full w-auto max-h-[280px] object-contain"
        autoPlay
        loop
        muted
        playsInline
      />
    ),
    title: '프로필은 식사와 피드백을 통해\n조금씩 더 정교해집니다',
    description:
      '예약, 식후 피드백, 다시 찾은 선택이 쌓일수록\n다음 다이닝은 더 자연스럽고 섬세하게 맞춰집니다.',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalSteps = ONBOARDING_STEPS.length;
  const swipeDistance = MOTION_TOKENS.distance.onboardingSwipe;
  const onboardingSpring = {
    type: 'spring' as const,
    damping: MOTION_TOKENS.spring.screenDamping,
    stiffness: MOTION_TOKENS.spring.screenStiffness,
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep((previousStep) => previousStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((previousStep) => previousStep - 1);
    }
  };

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;

    if (info.offset.x < -swipeThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold) {
      handlePrev();
    }
  };

  const stepData = ONBOARDING_STEPS[currentStep];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      <motion.div
        key={currentStep}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={onDragEnd}
        initial={{ opacity: 0, x: direction > 0 ? swipeDistance : -swipeDistance }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction > 0 ? -swipeDistance : swipeDistance }}
        transition={onboardingSpring}
        className="flex flex-1 -translate-y-[4vh] select-none touch-none flex-col items-center justify-center"
      >
        <div className="relative mb-8 flex h-[280px] w-full items-center justify-center">
          {stepData.graphic}
        </div>

        <div className="flex min-h-[100px] flex-col items-center px-5 text-center">
          <h2 className="mb-2 whitespace-pre-line text-center text-[22px] font-bold leading-snug tracking-tight text-[var(--tb-color-text-primary)]">
            {stepData.title}
          </h2>
          <p className="whitespace-pre-line text-center text-[14px] leading-relaxed text-[var(--tb-color-text-tertiary)]">
            {stepData.description}
          </p>
        </div>
      </motion.div>

      <div className="tb-bottom-fade relative z-20 flex min-h-[140px] w-full flex-col items-center justify-end px-5 pb-10">
        <div className="mb-8 flex items-center gap-[6px]">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-[6px] rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-[16px] bg-[var(--tb-color-text-primary)]'
                  : 'w-[6px] bg-[var(--tb-color-border-strong)]'
              }`}
            />
          ))}
        </div>

        <PrimaryButton onClick={handleNext}>
          {currentStep === totalSteps - 1 ? '시작하기' : '다음'}
        </PrimaryButton>
      </div>
    </div>
  );
}
