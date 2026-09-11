import SectionCard from '../SectionCard';
import OutlineBadge from '../system/OutlineBadge';
import { TASTE_TOKENS } from '../../constants/designTokens';
import { normalizeTasteSurveyResponses, tasteSurveyResponseLabel } from '../../lib/tasteSurveyEvidence';
import type { TasteSurveySubmission } from '../../types/tasteSurvey';

export default function TasteSurveyEvidencePanel({ submission }: { submission: TasteSurveySubmission }) {
  const responses = new Map(normalizeTasteSurveyResponses(submission.responses, submission.items)
    .map((response) => [response.itemId, response]));
  const answeredCount = [...responses.values()].filter((response) => !response.uncertain && response.selectedValue !== null).length;
  return <SectionCard hoverEffect={false}>
    <div className="flex w-full flex-col gap-4">
      <div><OutlineBadge>기준 음식 회상</OutlineBadge></div>
      <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
        {answeredCount > 0 ? `${answeredCount}가지 기준 음식에서 기억한 맛의 강도를 남겼어요.` : '아직 강도를 답한 기준 음식이 없어요.'}
        {' '}음식마다 기준이 달라 맛 사이의 민감도 순위나 좋아하는 정도로 해석하지 않아요.
      </p>
      <div className="divide-y divide-[var(--tb-color-border-subtle)]">
        {submission.items.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 py-3" data-testid={`survey-evidence-${item.tasteId}`}>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: TASTE_TOKENS[item.tasteId].palette.dark }}>{TASTE_TOKENS[item.tasteId].label}</p>
            <p className="mt-1 text-[12px] text-[var(--tb-color-text-muted)]">{item.anchor.label}</p>
          </div>
          <p className="max-w-[144px] text-right text-[12px] font-medium text-[var(--tb-color-text-primary)]">
            {tasteSurveyResponseLabel(responses.get(item.id), submission.scale)}
          </p>
        </div>)}
      </div>
      <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">우유의 지방맛은 예비 단서예요. 부드러움·고소한 향·느끼함과 구분해 살펴봐요.</p>
      <details className="text-[12px] text-[var(--tb-color-text-subtle)]">
        <summary className="cursor-pointer py-2 font-medium">기준 음식과 조건 보기</summary>
        <div className="mt-2 flex flex-col gap-3">
          {submission.items.map((item) => <div key={item.id}>
            <p className="font-semibold">{item.anchor.label}</p>
            <p className="mt-1 leading-relaxed">{item.anchor.description}</p>
          </div>)}
        </div>
      </details>
    </div>
  </SectionCard>;
}
