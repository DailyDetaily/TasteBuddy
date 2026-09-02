import FlowHeaderBlock from '../system/FlowHeaderBlock';
import OutlineBadge from '../system/OutlineBadge';
import StepBadge from '../system/StepBadge';

interface CalibrationQuestionHeaderProps {
  description: string;
  questionIndex: number;
  tasteLabel?: string;
  title: string;
  totalQuestions: number;
}

export default function CalibrationQuestionHeader({
  description,
  questionIndex,
  tasteLabel,
  title,
  totalQuestions,
}: CalibrationQuestionHeaderProps) {
  return (
    <FlowHeaderBlock
      description={description}
      title={title}
      titleClassName="whitespace-pre-line leading-tight"
      topLeft={
        tasteLabel ? (
          <OutlineBadge aria-label={`현재 측정 중인 미각 ${tasteLabel}`}>
            {tasteLabel}
          </OutlineBadge>
        ) : null
      }
      topRight={
        <StepBadge currentIndex={questionIndex} total={totalQuestions} />
      }
    />
  );
}
