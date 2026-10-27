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
    desc: '생년월일, 성별 관련 정보, 흡연 상태를 선택해 미각 응답을 더 안정적으로 읽을 준비를 합니다.',
  },
  {
    id: 2,
    title: '감각 반응 정리',
    desc: '여섯 가지 기준 음식을 떠올리며 맛이 얼마나 강하게 느껴졌는지 기록합니다.',
  },
  {
    id: 3,
    title: '설문 응답 정리',
    desc: '지금 남긴 응답을 설문 범위의 참고 결과로 정리합니다.',
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
          최근에 느낀 감각을
          <br />
          차분하게 기록해요.
        </>
      }
      subtitle="최근 3개월의 경험을 떠올려 주세요. 먹어본 적 없거나 기억나지 않으면 따로 표시할 수 있어요."
      steps={SURVEY_STEPS}
      onBack={onBack}
      secondaryActionLabel={reuseContextLabel}
      onSecondaryAction={onReuseContext}
      onAction={onStart}
    />
  );
}
