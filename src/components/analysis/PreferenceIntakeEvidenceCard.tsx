import SectionCard from '../SectionCard';
import { buildPreferenceIntakeEvidence } from '../../lib/preferenceIntakeEvidence.mjs';
import type { PreferenceIntakeProfile } from '../../constants/preferenceIntakeData';

export default function PreferenceIntakeEvidenceCard({ profile, userID = 'local-owner', onEdit }: {
  profile?: PreferenceIntakeProfile | null; userID?: string; onEdit?: () => void;
}) {
  const evidence = buildPreferenceIntakeEvidence(profile?.submissions ?? [], { userID });
  return <SectionCard>
    <div className="flex w-full flex-col gap-3">
      <p className="text-[16px] font-bold">{evidence.submissionID ? '직접 알려준 식사 선호' : '식사 선호를 알려주세요'}</p>
      {evidence.recordedAt && <p className="text-[12px] text-[var(--tb-color-text-hint)]">{new Date(evidence.recordedAt).toLocaleDateString('ko-KR')} · 응답 {evidence.answeredQuestionCount}개</p>}
      {!evidence.submissionID && <p className="text-[13px] text-[var(--tb-color-text-secondary)]">{profile
        ? '기존 선택은 보관 중이에요. 다시 저장하면 질문과 응답 시점을 함께 남겨요.' : '피해야 할 재료와 편안하게 즐기는 음식부터 입맛을 알아가요.'}</p>}
      {evidence.records.map(record => <details key={record.id}>
        <summary className="min-h-11 cursor-pointer py-1 text-[13px]">
          <span className="font-medium">{record.label}</span><span className="mt-1 block text-[var(--tb-color-text-secondary)]">{record.summary}</span>
        </summary>
        <div className="flex flex-col gap-1 py-2 text-[12px] text-[var(--tb-color-text-secondary)]">
          <p>{record.questionText}</p><p>{record.questionDescription}</p>
          {record.selectedOptions.map(option => <p key={option.id}>{option.label} · {option.description}</p>)}
        </div>
      </details>)}
      <p className="text-[12px] text-[var(--tb-color-text-hint)]">직접 알려준 선호는 실제 식사에서 확인한 반응과 구분해요.</p>
      {evidence.records.some(row => row.kind === 'sharing_preference' && row.state !== 'unanswered') && <p className="text-[12px] text-[var(--tb-color-text-hint)]">공유 선호를 저장해도 정보가 전송되지는 않아요.</p>}
      {evidence.excludedSubmissions.length > 0 && <p className="text-[12px] text-[var(--tb-color-text-hint)]">일부 응답의 출처를 확인하지 못했어요. 선호를 다시 확인해 주세요.</p>}
      {onEdit && <button type="button" onClick={onEdit} className="min-h-11 text-left text-[14px] font-semibold">{evidence.submissionID ? '선호 수정하기' : '선호 기록하기'}</button>}
    </div>
  </SectionCard>;
}
