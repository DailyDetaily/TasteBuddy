import FlowIntroScreen from './FlowIntroScreen';

interface TastickIntroScreenProps {
  /** 1-based active step (1 = first card active). Defaults to 1. */
  activeStep?: number;
  actionLabel?: string;
  onBack?: () => void;
  onAction: () => void;
}

const TASTICK_STEPS = [
  {
    id: 1,
    title: '미각 측정 기기 연결',
    desc: '셰프가 고객님의 입맛을 이해하기 위해 보내드린\n테이스틱을 연결합니다.',
  },
  {
    id: 2,
    title: '미각 측정 및 분석',
    desc: '고객님의 미각 반응을 기록하며, 셰프에게 전달될 데이터를 조율하고 있습니다.',
  },
  {
    id: 3,
    title: '미각 피드백 및 캘리브레이션',
    desc: '',
  },
] as const;

export default function TastickIntroScreen({
  activeStep = 1,
  actionLabel,
  onBack,
  onAction,
}: TastickIntroScreenProps) {
  return (
    <FlowIntroScreen
      activeStepIndex={activeStep - 1}
      actionLabel={actionLabel}
      defaultActionLabel="연결하기"
      title={
        <>
          지금부터 고객님의 미각을
          <br />
          정밀하게 측정합니다.
        </>
      }
      subtitle="매뉴얼에 따라 측정을 진행해주세요."
      steps={TASTICK_STEPS}
      onBack={onBack}
      onAction={onAction}
    />
  );
}
