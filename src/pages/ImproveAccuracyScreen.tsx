import {
  Sparkles as SparklesIcon,
  Bluetooth as BluetoothIcon,
  ArrowRight as ArrowRightIcon
} from 'lucide-react';
const wrapIcon = (Icon: any) => ({ size, fontSize, className, style, ...p }: any) => <Icon {...p} className={className} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />;
const Sparkles = wrapIcon(SparklesIcon);
const Bluetooth = wrapIcon(BluetoothIcon);
const ArrowRight = wrapIcon(ArrowRightIcon);
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import TokenBox from '../components/system/TokenBox';
import FlowBottomCta from '../components/system/FlowBottomCta';
import OutlineBadge from '../components/system/OutlineBadge';
import { ICON_TOKENS } from '../constants/designTokens';

interface ImproveAccuracyScreenProps {
  onConnectDevice: () => void;
  onSkip: () => void;
  currentProfileStage?: 'Starter' | 'Building' | 'Refined';
}

const benefits = [
  {
    title: '더 세밀한 프로필',
    body: '테이스틱의 정밀 센서가 6가지 미각 축을 각각 세분화해 현재 프로필보다 훨씬 정교한 캘리브레이션을 제공합니다.',
    iconBg: 'var(--tb-taste-sweet-bg)',
    iconColor: 'var(--tb-taste-sweet-main)',
  },
  {
    title: '컨디션 변화까지 반영',
    body: '소프트웨어 캘리브레이션은 선호도만 파악하지만, 하드웨어 측정은 그날의 미각 컨디션까지 더 섬세하게 파악할 수 있어요.',
    iconBg: 'var(--tb-taste-salty-bg)',
    iconColor: 'var(--tb-taste-salty-main)',
  },
  {
    title: '셰프에게 더 정확한 가이드',
    body: '정밀 데이터를 기반으로 한 TCS 캘리브레이션은 셰프가 전달 강도를 더 자신 있게 조율할 수 있게 도와줍니다.',
    iconBg: 'var(--tb-taste-umami-bg)',
    iconColor: 'var(--tb-taste-umami-main)',
  },
];

const confidenceSteps = [
  { label: 'Starter', caption: '질문 기반', stage: 1 },
  { label: 'Building', caption: '피드백 학습', stage: 2 },
  { label: 'Refined', caption: '정밀 측정', stage: 3 },
] as const;

export default function ImproveAccuracyScreen({
  onConnectDevice,
  onSkip,
  currentProfileStage = 'Building',
}: ImproveAccuracyScreenProps) {
  const currentStageIndex = confidenceSteps.findIndex(
    (step) => step.label === currentProfileStage,
  );

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--tb-color-bg-page)] animate-slideIn">
      <TopAppBar title="프로필 정확도 향상" showBack onBack={onSkip} />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-3 px-5 pt-6 pb-[168px]">
          {/* Hero card */}
          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-3">
                <OutlineBadge>Optional Precision</OutlineBadge>
                <div>
                  <h1 className="text-[18px] font-bold leading-tight tracking-tight text-[var(--tb-color-text-primary)]">
                    더 정밀하게 프로필을
                    <br />
                    발전시킬 수 있어요
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    테이스틱을 연결하면 현재 프로필의 정확도를 한 단계 더 높일 수 있어요.
                    지금 프로필도 충분히 유용하고, 이 단계는 완전히 선택사항이에요.
                  </p>
                </div>
              </div>
              <TokenBox backgroundToken="surface-base" textToken="text-primary">
                <Sparkles size={ICON_TOKENS.size.lg} />
              </TokenBox>
            </div>
          </SectionCard>

          {/* Confidence Progression */}
          <SectionCard hoverEffect={false}>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">프로필 정확도 단계</p>
                <p className="mt-1 text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                  현재 {currentProfileStage} 단계예요
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {confidenceSteps.map((step, index) => {
                  const isCurrent = index === currentStageIndex;
                  const isPast = index < currentStageIndex;
                  const isNext = index > currentStageIndex;

                  return (
                    <div
                      key={step.label}
                      className={`rounded-[var(--tb-radius-14)] border px-3 py-3 transition-all ${
                        isCurrent
                          ? 'border-[var(--tb-color-text-primary)] bg-[var(--tb-color-surface-muted)]'
                          : isPast
                            ? 'border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] opacity-60'
                            : 'border-dashed border-[var(--tb-color-border-disabled)] bg-[var(--tb-color-surface-base)]'
                      }`}
                    >
                      <p className={`text-[12px] font-semibold ${
                        isCurrent
                          ? 'text-[var(--tb-color-text-primary)]'
                          : 'text-[var(--tb-color-text-hint)]'
                      }`}>
                        {step.label}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                        {step.caption}
                      </p>
                      {isNext && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <ArrowRight size={ICON_TOKENS.size.sm} className="text-[var(--tb-taste-sweet-main)]" />
                          <span className="text-[10px] font-medium text-[var(--tb-taste-sweet-main)]">
                            다음 목표
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Benefits */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
              정밀 측정의 장점
            </p>
            {benefits.map((benefit) => (
              <SectionCard key={benefit.title} hoverEffect={false}>
                <div className="flex items-start gap-3">
                  <TokenBox
                    style={{
                      backgroundColor: benefit.iconBg,
                      color: benefit.iconColor,
                    }}
                  >
                    <Sparkles size={ICON_TOKENS.size.md} />
                  </TokenBox>
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                      {benefit.title}
                    </p>
                    <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-body)]">
                      {benefit.body}
                    </p>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>

          {/* Reassurance */}
          <SectionCard hoverEffect={false} className="bg-[var(--tb-color-surface-muted)]">
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-faint)]">
                선택사항이에요
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                현재 프로필도 예약 개인화와 셰프용 캘리브레이션에 충분히 활용되고 있어요.
                정밀 측정은 더 정교한 경험을 원할 때 언제든 시작할 수 있는 프리미엄 옵션이에요.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>

      <FlowBottomCta
        actionLabel={
          <div className="flex items-center gap-2">
            <Bluetooth size={ICON_TOKENS.size.md} />
            <span>테이스틱 연결하기</span>
          </div>
        }
        onAction={onConnectDevice}
        secondaryAction={
          <button
            type="button"
            onClick={onSkip}
            className="py-2 text-[12px] font-semibold text-[var(--tb-color-text-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]"
          >
            지금은 괜찮아요, 나중에 할게요
          </button>
        }
        secondaryActionClassName="flex justify-center"
      />
    </div>
  );
}
