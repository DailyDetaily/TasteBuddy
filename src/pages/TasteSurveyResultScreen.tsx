import FlowBottomCta from '../components/system/FlowBottomCta';
import FlowHeaderBlock from '../components/system/FlowHeaderBlock';
import OutlineBadge from '../components/system/OutlineBadge';
import TasteSurveyEvidencePanel from '../components/measurement/TasteSurveyEvidencePanel';
import type { TasteSurveyCompatibleResult } from '../types/tasteSurvey';

interface TasteSurveyResultScreenProps {
  compatibleResult?: TasteSurveyCompatibleResult | null;
  onComplete?: () => void;
}

export default function TasteSurveyResultScreen({ compatibleResult = null, onComplete }: TasteSurveyResultScreenProps) {
  const submission = compatibleResult?.snapshot.surveySubmission;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--tb-color-bg-focus)] font-sans">
      <main className="flex-1 overflow-y-auto px-5 pt-[calc(var(--tb-safe-area-top)+16px)] no-scrollbar">
        <div className="tb-section-stack pb-[calc(156px+var(--tb-safe-area-bottom))]">
          <FlowHeaderBlock
            title="기억한 맛을 정리했어요"
            description="기준 음식에서 느낀 강도를 그대로 남겼어요. 좋아하는 정도는 식사 기록에서 따로 살펴봐요."
            topLeft={<OutlineBadge>기준 음식 회상</OutlineBadge>}
          />
          {submission ? <TasteSurveyEvidencePanel submission={submission} /> : (
            <p className="text-[13px] text-[var(--tb-color-text-muted)]">아직 저장된 설문 응답이 없어요.</p>
          )}
        </div>
      </main>
      {onComplete ? <FlowBottomCta
        actionLabel="설문 결과 저장하고 시작하기"
        fadeClassName="bg-[linear-gradient(to_top,var(--tb-color-bg-focus)_0%,var(--tb-color-surface-overlay)_55%,transparent_100%)]"
        onAction={onComplete}
      /> : null}
    </div>
  );
}
