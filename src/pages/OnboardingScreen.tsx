import { useEffect, useMemo, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';

import NativeOnboardingMotion from '../components/graphics/NativeOnboardingMotion';
import onboardingRender1 from '../assets/onboarding_render_1.png';
import onboardingRender2 from '../assets/onboarding_render_2.png';
import onboardingRender3 from '../assets/onboarding_render_3.png';
import onboardingRender4 from '../assets/onboarding_render_4.png';
import PrimaryButton from '../components/system/PrimaryButton';
import StepIndicator from '../components/system/StepIndicator';
import { MOTION_TOKENS } from '../constants/designTokens';

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingStep {
  description: string;
  imageSrc: string;
  mediaAlt: string;
  title: string;
  motionStyle?: 'analysis' | 'rotatingLayers' | 'feedbackRings';
}

const ONBOARDING_CONTENT_BOTTOM_PADDING = 'calc(156px + var(--tb-safe-area-bottom))';

function shouldPreferLightweightOnboardingMedia() {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [preferLightweightMedia, setPreferLightweightMedia] = useState(() =>
    shouldPreferLightweightOnboardingMedia(),
  );

  useEffect(() => {
    const updateMediaPreference = () => {
      setPreferLightweightMedia(shouldPreferLightweightOnboardingMedia());
    };

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    reducedMotionQuery.addEventListener('change', updateMediaPreference);

    return () => {
      reducedMotionQuery.removeEventListener('change', updateMediaPreference);
    };
  }, []);

  const onboardingSteps = useMemo(
    (): OnboardingStep[] => [
      {
        imageSrc: onboardingRender1,
        mediaAlt: 'Taste Buddy dining introduction',
        title: '더 잘 맞는 식사를\n시작해보세요',
        description:
          'Taste Buddy는 당신의 현재 입맛을 이해해,\n다양한 식당에서 더 잘 맞는 식사로 이어줍니다.',
      },
      {
        imageSrc: onboardingRender2,
        mediaAlt: 'Taste Buddy analysis preview',
        title: '가볍게 시작해\n현재 프로필을 만듭니다',
        description:
          '복잡한 설명보다, 지금의 미각 경향을 빠르게 정리해\n첫 예약부터 활용할 수 있는 프로필을 만듭니다.',
        motionStyle: 'analysis',
      },
      {
        imageSrc: onboardingRender3,
        mediaAlt: 'Taste Buddy restaurant guidance preview',
        title: '프로필은 식당과 식사 맥락에 맞춰\n실용적으로 전달됩니다',
        description:
          '당신의 프로필은 매장과 주방이 의도를 해치지 않으면서도\n더 잘 맞는 경험을 준비할 수 있도록 정리됩니다.',
        motionStyle: 'rotatingLayers',
      },
      {
        imageSrc: onboardingRender4,
        mediaAlt: 'Taste Buddy learning loop preview',
        title: '프로필은 식사와 피드백을 통해\n조금씩 더 정교해집니다',
        description:
          '예약, 식후 피드백, 다시 찾은 선택이 쌓일수록\n다음 다이닝은 더 자연스럽고 섬세하게 맞춰집니다.',
        motionStyle: 'feedbackRings',
      },
    ],
    [],
  );

  const totalSteps = onboardingSteps.length;
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

  const stepData = onboardingSteps[currentStep];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-focus)]">
      <div
        aria-hidden="true"
        className="shrink-0 bg-[var(--tb-color-surface-base)]"
        style={{ paddingTop: 'var(--tb-safe-area-top)' }}
      >
        <div className="min-h-[var(--tb-size-flow-top-bar-height)]" />
      </div>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <motion.div
          key={currentStep}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={onDragEnd}
          initial={preferLightweightMedia ? false : { opacity: 0, x: direction > 0 ? swipeDistance : -swipeDistance }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -swipeDistance : swipeDistance }}
          transition={preferLightweightMedia ? { duration: 0 } : onboardingSpring}
          className="absolute inset-0 px-5 pt-4"
          style={{ paddingBottom: ONBOARDING_CONTENT_BOTTOM_PADDING }}
        >
          <div className="flex h-full -translate-y-[4vh] select-none touch-none flex-col items-center justify-center">
            <div className="relative mb-8 flex h-[280px] w-full items-center justify-center">
              {stepData.motionStyle ? <NativeOnboardingMotion style={stepData.motionStyle} /> : (
                <img src={stepData.imageSrc} alt={stepData.mediaAlt} decoding="async" className="h-[280px] w-[280px] object-contain" />
              )}
            </div>

            <div className="flex min-h-[100px] flex-col items-center px-5 text-center">
              <h2 className="mb-2 whitespace-pre-line text-center text-[18px] font-bold leading-snug tracking-tight text-[var(--tb-color-text-primary)]">
                {stepData.title}
              </h2>
              <p className="whitespace-pre-line text-center text-[14px] leading-relaxed text-[var(--tb-color-text-tertiary)]">
                {stepData.description}
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
        <div className="w-full max-w-[var(--tb-layout-screen-max-width)]">
          <div className="tb-bottom-fade relative flex min-h-[calc(var(--tb-size-bottom-fade-min-height)+var(--tb-safe-area-bottom))] w-full flex-col items-center justify-end gap-0 px-5 pb-[max(12px,var(--tb-safe-area-bottom))]">
            <StepIndicator className="mb-8 self-center" currentIndex={currentStep} total={totalSteps} />
            <PrimaryButton onClick={handleNext}>
              {currentStep === totalSteps - 1 ? '시작하기' : '다음'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
