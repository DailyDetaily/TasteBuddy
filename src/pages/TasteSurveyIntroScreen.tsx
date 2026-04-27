import FlowIntroScreen from './FlowIntroScreen';

interface TasteSurveyIntroScreenProps {
  activeStepIndex?: number;
  actionLabel?: string;
  onBack?: () => void;
  onReuseContext?: () => void;
  onStart: () => void;
  reuseContextLabel?: string;
}

const SURVEY_STEPS = [
  {
    id: 1,
    title: '해석 참고 정보',
    desc: '연령대, 성별 관련 정보, 흡연 상태를 선택해 미각 응답을 더 안정적으로 읽을 준비를 합니다.',
  },
  {
    id: 2,
    title: '감각 반응 정리',
    desc: '열두 문항으로 작은 차이와 부담이 생기는 지점을 차분하게 확인합니다.',
  },
  {
    id: 3,
    title: '첫 미각 프로필 준비',
    desc: '응답은 예약 개인화와 셰프가 참고할 수 있는 표현으로 정리됩니다.',
  },
] as const;

export default function TasteSurveyIntroScreen({
  activeStepIndex = 0,
  actionLabel,
  onBack,
  onReuseContext,
  onStart,
  reuseContextLabel,
}: TasteSurveyIntroScreenProps) {
  return (
    <FlowIntroScreen
      activeStepIndex={activeStepIndex}
      actionLabel={actionLabel}
      defaultActionLabel="설문 시작"
      title={
        <>
          지금부터 고객님의 미각을
          <br />
          정밀하게 준비합니다.
        </>
      }
      subtitle="최근의 감각 반응을 바탕으로 첫 프로필을 차분하게 잡아볼게요."
      steps={SURVEY_STEPS}
      onBack={onBack}
      secondaryActionLabel={reuseContextLabel}
      onSecondaryAction={onReuseContext}
      onAction={onStart}
    />
  );
}
