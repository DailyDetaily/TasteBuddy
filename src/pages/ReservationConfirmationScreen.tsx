import { useState, useEffect } from 'react';
import {
  CircleCheck as CircleCheckIcon,
  ChefHat as ChefHatIcon,
  Send as SendIcon,
  CalendarCheck as CalendarCheckIcon
} from 'lucide-react';
const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />;
const CheckCircle2 = wrapIcon(CircleCheckIcon);
const ChefHat = wrapIcon(ChefHatIcon);
const Send = wrapIcon(SendIcon);
const CalendarCheck = wrapIcon(CalendarCheckIcon);
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import TokenBox from '../components/system/TokenBox';
import FlowBottomCta from '../components/system/FlowBottomCta';
import { ICON_TOKENS } from '../constants/designTokens';

interface ReservationConfirmationScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

const confirmationSteps = [
  {
    id: 'confirm',
    icon: CalendarCheck,
    title: '예약이 확정되었어요',
    body: '선택하신 레스토랑과 일정이 확인되었습니다.',
    iconBg: 'var(--tb-color-success-soft)',
    iconColor: 'var(--tb-color-success)',
  },
  {
    id: 'transfer',
    icon: Send,
    title: '프로필 데이터를 전달 중이에요',
    body: '현재 미각 프로필이 레스토랑에 안전하게 전달됩니다. 셰프가 참고할 수 있는 캘리브레이션 가이드로 정리돼요.',
    iconBg: 'var(--tb-taste-salty-bg)',
    iconColor: 'var(--tb-taste-salty-main)',
  },
  {
    id: 'chef',
    icon: ChefHat,
    title: '셰프 TCS 준비가 시작됩니다',
    body: '전달된 프로필을 바탕으로 셰프가 코스의 전달 강도와 마무리 방향을 조율할 수 있게 됩니다. 레시피를 바꾸는 것이 아니라, 의도한 경험이 더 자연스럽게 전달되도록 돕는 과정이에요.',
    iconBg: 'var(--tb-taste-sweet-bg)',
    iconColor: 'var(--tb-taste-sweet-main)',
  },
];

export default function ReservationConfirmationScreen({
  onComplete,
  onBack,
}: ReservationConfirmationScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentStep < confirmationSteps.length) {
      const timer = setTimeout(() => {
        if (currentStep < confirmationSteps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          setIsComplete(true);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
      <TopAppBar title="예약 확정" showBack onBack={onBack} />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-3 px-5 pt-6 pb-[168px]">
          {/* Success top card */}
          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex flex-col items-center gap-4 py-4">
              <div
                className="flex size-[64px] items-center justify-center rounded-full transition-all duration-500"
                style={{
                  backgroundColor: isComplete ? 'var(--tb-color-success-soft)' : 'var(--tb-color-surface-base)',
                  color: isComplete ? 'var(--tb-color-success)' : 'var(--tb-color-text-hint)',
                }}
              >
                <CheckCircle2 size={ICON_TOKENS.size.lg} className="transition-transform duration-500" style={{
                  transform: isComplete ? 'scale(1)' : 'scale(0.8)',
                }} />
              </div>
              <div className="text-center">
                <h1 className="text-[18px] font-bold text-[var(--tb-color-text-primary)]">
                  {isComplete ? '모든 준비가 시작됐어요' : '예약을 확정하고 있어요'}
                </h1>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {isComplete
                    ? '미각 프로필이 셰프에게 전달되었고, 맞춤 준비가 시작되었어요.'
                    : '잠시만 기다려 주세요. 프로필 데이터를 안전하게 처리 중이에요.'}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Steps */}
          <div className="flex flex-col gap-3">
            {confirmationSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep && !isComplete;

              return (
                <div
                  key={step.id}
                  className={`transition-all duration-500 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  <SectionCard hoverEffect={false}>
                    <div className="flex items-start gap-3">
                      <TokenBox
                        className={`transition-all duration-500 ${
                          isCurrent ? 'animate-pulse' : ''
                        }`}
                        style={{
                          backgroundColor: step.iconBg,
                          color: step.iconColor,
                        }}
                      >
                        <Icon size={ICON_TOKENS.size.md} />
                      </TokenBox>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                            {step.title}
                          </span>
                          {isActive && !isCurrent && (
                            <CheckCircle2 size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-success)]" />
                          )}
                        </div>
                        <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-body)]">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              );
            })}
          </div>

          {/* Next dining explanation */}
          {isComplete && (
            <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)] animate-fadeIn">
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                  다음 단계
                </p>
                <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  셰프가 전달받은 프로필을 검토하고 TCS 전략을 정리하면 알림으로 안내해 드릴게요.
                  예약 상세에서 진행 상황을 확인할 수 있습니다.
                </p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {isComplete && (
        <FlowBottomCta
          actionLabel="예약 상세 보기"
          className="animate-fadeIn"
          helperText="프로필 기반 개인화 과정은 예약 상세에서 계속 확인할 수 있어요."
          onAction={onComplete}
        />
      )}
    </div>
  );
}
