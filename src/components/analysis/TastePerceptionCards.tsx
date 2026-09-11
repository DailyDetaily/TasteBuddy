import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SectionCard from '../SectionCard';
import { DrawerTitle } from '../ui/drawer';
import PageSection from '../system/PageSection';
import HexRadarChart from '../system/HexRadarChart';
import TasteInsightSummaryCard, { TasteChangeEmptySummary } from '../system/TasteInsightSummaryCard';
import BottomSheetShell, { BottomSheetCloseButton } from '../system/BottomSheetShell';
import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../../constants/designTokens';
import type { TasteMeasurementSnapshot } from '../../constants/tasteMeasurementData';
import type { TasteSurveySubmission } from '../../types/tasteSurvey';
import type { DiningPageExternalFeedbackSubmission } from '../../pages/DiningPage';
import { hydrateRecentMeasurementSnapshots, hydrateReservationPageData } from '../../lib/tasteBuddySupabase';
import { tasteSurveyResponseLabel } from '../../lib/tasteSurveyEvidence';
import { buildTastePerception, buildSurveyPerception, buildTasteChangeSeries, INTENSITY_LABELS, PERCEPTION_TARGET_LABELS, PERCEPTION_PHASE_LABELS } from '../../lib/tastePerception.mjs';
import type { TasteChangeSeries } from '../../pages/TasteChangePage';
import { buildDiningPerceptionRecords } from '../../lib/tastePerceptionDining';

const NO_SUBMISSIONS: readonly DiningPageExternalFeedbackSubmission[] = [];
const NO_HISTORY: readonly TasteSurveySubmission[] = [];
const condition = (row: any) => [row.restaurantName, row.foodName, PERCEPTION_TARGET_LABELS[row.target] ?? '부위 확인 중', PERCEPTION_PHASE_LABELS[row.phase] ?? '시점 확인 중'].filter(Boolean).join(' · ');
const dates = (period: any) => period.start != null && period.end != null
  ? `${new Date(period.start).toLocaleDateString('ko-KR')}–${new Date(period.end).toLocaleDateString('ko-KR')}` : '시점 확인 중';
const responseLabel = (point: any, submission = point.submission) => submission && point.item
  ? tasteSurveyResponseLabel(submission.responses.find((row: any) => row.itemId === point.item.id), submission.scale) : '미응답';

export default function TastePerceptionCards({ measurementSnapshot, surveyHistory = NO_HISTORY, feedbackSubmissions = NO_SUBMISSIONS, isActive = true, onOpenTasteChange }: {
  measurementSnapshot: TasteMeasurementSnapshot;
  surveyHistory?: readonly TasteSurveySubmission[];
  feedbackSubmissions?: readonly DiningPageExternalFeedbackSubmission[];
  isActive?: boolean;
  onOpenTasteChange?: (series: TasteChangeSeries[]) => void;
}) {
  const [remoteDining, setRemoteDining] = useState<Awaited<ReturnType<typeof hydrateReservationPageData>> | null>(null);
  const [remoteMeasurements, setRemoteMeasurements] = useState<TasteMeasurementSnapshot[]>([]);
  const [showMeals, setShowMeals] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [detail, setDetail] = useState<{ kind: 'meal' | 'survey' | 'conditions'; axis?: TasteId } | null>(null);
  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    Promise.allSettled([hydrateReservationPageData({ seedIfEmpty: false }), hydrateRecentMeasurementSnapshots(7)]).then(([dining, measurements]) => {
      if (cancelled) return;
      if (dining.status === 'fulfilled') setRemoteDining(dining.value);
      if (measurements.status === 'fulfilled') setRemoteMeasurements(measurements.value);
    });
    return () => { cancelled = true; };
  }, [isActive, measurementSnapshot.measuredAt]);
  const dining = useMemo(() => buildDiningPerceptionRecords(feedbackSubmissions, remoteDining), [feedbackSubmissions, remoteDining]);
  const model = useMemo(() => buildTastePerception(dining.records), [dining]);
  const survey = useMemo(() => buildSurveyPerception([
    ...remoteMeasurements.map(snapshot => snapshot.surveySubmission), ...surveyHistory, measurementSnapshot.surveySubmission,
  ]), [remoteMeasurements, surveyHistory, measurementSnapshot]);
  const currentFor = (axis: TasteId) => model.axes.find((row: any) => row.axis === axis)?.current;
  const currentPatterns = TASTE_IDS.map(currentFor).filter(Boolean);
  const valuesFor = (previous: boolean) => TASTE_IDS.map(axis => {
    const pattern = currentFor(axis), point = survey.points.find((row: any) => row.axis === axis);
    const level = previous ? pattern?.previousLevel : pattern?.currentLevel;
    return showMeals ? level == null ? null : level + 1 : (previous ? point?.previous?.value : point?.value) ?? null;
  });
  const values = valuesFor(showPrevious), referenceValues = showPrevious ? [] : valuesFor(true);
  const hasPrevious = showMeals ? currentPatterns.some((row: any) => row.previous.mealIDs.length > 0) : survey.points.some((point: any) => point.previous);
  const count = showMeals ? new Set(currentPatterns.flatMap((row: any) => (showPrevious ? row.previous : row.recent).mealIDs)).size : values.filter(value => value !== null).length;
  const timestamps = (showMeals ? currentPatterns.flatMap((row: any) => {
    const period = showPrevious ? row.previous : row.recent; return [period.start, period.end];
  }) : survey.points.map((point: any) => Date.parse((showPrevious ? point.previous?.submission : point.submission)?.recordedAt)))
    .filter((value: any) => value != null && Number.isFinite(value));
  const dateLabel = (value: number) => new Date(value).toLocaleDateString('ko-KR');
  const start = Math.min(...timestamps), end = Math.max(...timestamps);
  const periodLabel = timestamps.length ? dateLabel(start) === dateLabel(end) ? dateLabel(start) : `${dateLabel(start)} – ${dateLabel(end)}` : showPrevious ? '이전 기록' : '최근 기록';
  const hasReference = referenceValues.some(value => value !== null);
  const hasComparison = model.patterns.some((row: any) => row.currentLevel != null && row.previousLevel != null)
    || survey.points.some((row: any) => row.value != null && row.previous?.value != null);
  const firstChange = model.changes[0];
  const patterns = detail?.kind === 'meal' ? (detail.axis ? [currentFor(detail.axis)].filter(Boolean) : currentPatterns)
    : detail?.kind === 'conditions' ? [...new Map(model.contrasts.flatMap((row: any) => [row.first, row.second]).map((row: any) => [row.id, row])).values()] : [];
  const points = detail?.kind === 'survey' ? survey.points.filter((point: any) => !detail.axis || point.axis === detail.axis)
    : [];
  const openChanges = () => onOpenTasteChange?.(buildTasteChangeSeries(model, survey).map((series: any) => ({ ...series,
    points: series.points.map((point: any) => {
      const ids = new Set(dining.records.filter(row => point.evidenceIDs.includes(row.observationId)).map(row => row.sourceRecordID));
      return { ...point, sources: dining.sources.filter(source => ids.has(source.id)) };
    }),
  })));
  return <PageSection title="맛을 느끼는 경향">
    <div data-testid="taste-perception-radar">
      <SectionCard hoverEffect={false}>
        <div className="flex w-full items-center justify-between gap-1">
          <button type="button" className="flex size-11 shrink-0 items-center justify-center disabled:text-[var(--tb-color-text-disabled)]" aria-label="이전 기간 보기" disabled={showPrevious || !hasPrevious} onClick={() => setShowPrevious(true)}><ChevronLeft size={20} strokeWidth={1.5} /></button>
          <select aria-label="기록 출처 선택" value={showMeals ? 'meal' : 'survey'} onChange={event => { setShowMeals(event.target.value === 'meal'); setShowPrevious(false); }}
            className="min-h-11 min-w-0 appearance-none bg-transparent text-center text-[14px] font-semibold">
            <option value="survey">{showMeals ? '기준 음식 회상' : periodLabel}</option>
            <option value="meal">{showMeals ? periodLabel : '식사 기록'}</option>
          </select>
          <button type="button" className="flex size-11 shrink-0 items-center justify-center disabled:text-[var(--tb-color-text-disabled)]" aria-label="다음 기간 보기" disabled={!showPrevious} onClick={() => setShowPrevious(false)}><ChevronRight size={20} strokeWidth={1.5} /></button>
        </div>
        <div className="w-full" role="img" aria-label={TASTE_IDS.map((axis, index) => `${TASTE_TOKENS[axis].label} ${values[index] == null ? '기록 없음' : showMeals ? INTENSITY_LABELS[values[index]! - 1] : `${values[index]}단계`}`).join(', ')}>
          <HexRadarChart reportedValues={values} referenceValues={referenceValues} maximum={showMeals ? 3 : 4} />
        </div>
        <div className="mt-2 flex w-full items-end justify-center gap-1">
          <button type="button" className="flex min-h-11 flex-col items-center justify-end gap-1" onClick={() => setDetail({ kind: showMeals ? 'meal' : 'survey' })} aria-label="나의 반응, 적용 조건과 원본 기록 보기">
            <span className="text-[10px] text-[var(--tb-color-text-hint)]">나의 반응</span>
            <span className="flex h-6 items-center rounded-md bg-[var(--tb-color-text-primary)] px-2.5 text-[12px] font-bold text-white">{count ? showMeals ? `식사 ${count}회` : `회상 ${count}개` : '기록 없음'}</span>
          </button>
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-md bg-[var(--tb-color-text-disabled)] text-[10px] font-bold text-white">→</span>
          <button type="button" className="flex min-h-11 flex-col items-center justify-end gap-1" disabled={!hasReference} onClick={() => setDetail({ kind: showMeals ? 'meal' : 'survey' })} aria-label="기준 반응, 이전 기록 보기">
            <span className="text-[10px] text-[var(--tb-color-text-hint)]">기준 반응</span>
            <span className="flex h-6 items-center rounded-md bg-[var(--tb-color-text-primary)] px-2.5 text-[12px] font-bold text-white">{hasReference ? '이전 기록' : '아직 없음'}</span>
          </button>
        </div>
      </SectionCard>
    </div>
    <div data-testid="taste-perception-change">
      <TasteInsightSummaryCard details={[]} keywords={[]} sectionLabel="미각변화" actionLabel="기록 비교"
        title={firstChange ? `${TASTE_TOKENS[firstChange.axis as TasteId].label}을 느낀 강도가 달라졌어요` : survey.changes.length ? '기준 음식에서 기억한 강도가 달라졌어요' : '아직 변화없음'}
        onClick={openChanges}>
        {!hasComparison && <TasteChangeEmptySummary />}
        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-secondary)]">{firstChange
          ? `${condition(firstChange)} · 이전 ${firstChange.previous.mealIDs.length}번과 최근 ${firstChange.recent.mealIDs.length}번의 식사`
          : survey.changes.length ? '같은 음식·조건·척도로 남긴 이전·최근 회상 응답을 비교했어요.'
          : hasComparison ? '비교한 기록에서는 같은 강도로 남겼어요.' : '비교할 기록이 더 필요해요.'}</p>
      </TasteInsightSummaryCard>
    </div>
    <TasteInsightSummaryCard details={[]} keywords={[]} sectionLabel="특이사항" actionLabel="조건과 근거"
      title={model.contrasts.length ? '같은 음식도 조건에 따라 다르게 느꼈어요' : '조건별 차이는 확인 중'} onClick={() => setDetail({ kind: 'conditions' })}>
      <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-secondary)]">{model.contrasts[0]
        ? `${condition(model.contrasts[0].first)} · ${condition(model.contrasts[0].second)} — 근거 ${model.contrasts[0].mealIDs.length}번의 식사`
        : '같은 음식의 부위나 시점을 다르게 남긴 반복 기록을 살펴봐요.'}</p>
    </TasteInsightSummaryCard>
    <BottomSheetShell open={detail !== null} onOpenChange={open => { if (!open) setDetail(null); }} headerStart={<BottomSheetCloseButton />} headerCenter={<DrawerTitle className="whitespace-nowrap text-[15px]">강도 기록과 적용 조건</DrawerTitle>}>
      <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-8 text-[13px] leading-relaxed">
        {!patterns.length && !points.length && <p>비교할 기록이 더 필요해요. 음식·부위·시점과 직접 느낀 강도를 함께 남겨주세요.</p>}
        {patterns.map((pattern: any) => {
          const ids = new Set([...pattern.recent.evidenceIDs, ...pattern.previous.evidenceIDs]);
          const sourceIDs = new Set(dining.records.filter(row => ids.has(row.observationId)).map(row => row.sourceRecordID));
          return <SectionCard key={pattern.id}>
            <p className="font-semibold">{TASTE_TOKENS[pattern.axis as TasteId].label} · {condition(pattern)}</p>
            <p className="mt-2">최근 {pattern.recent.mealIDs.length}번의 식사 · {dates(pattern.recent)}</p>
            <p>{pattern.currentLevel == null ? '확인 중' : `${INTENSITY_LABELS[pattern.currentLevel]} 느낀 경향`}</p>
            <p>{pattern.counts.map((count: number, index: number) => count ? `${INTENSITY_LABELS[index]} ${count}번` : '').filter(Boolean).join(' · ')}</p>
            {pattern.previousLevel != null && <p>이전 {pattern.previous.mealIDs.length}번 · {dates(pattern.previous)} · {INTENSITY_LABELS[pattern.previousLevel]}</p>}
            {pattern.conflictCount > 0 && <p>같은 식사에서 강도 응답이 나뉜 기록 {pattern.conflictCount}개</p>}
            <p className="mt-2 text-[12px] text-[var(--tb-color-text-hint)]">기록된 음식·부위·시점 안에서만 비교해요. 조리 상태와 온도 등 기록하지 않은 조건이나 변화의 원인은 알 수 없어요.</p>
            {dining.sources.filter(source => sourceIDs.has(source.id)).map(source => <details key={source.id} className="mt-3 border-t border-[var(--tb-color-border-default)] pt-2">
              <summary className="min-h-[44px] cursor-pointer py-2 font-medium">{source.foodName} · {source.observedAt.slice(0, 10)} 원본 응답 보기</summary>
              <p>{source.restaurantName}</p>
              {source.note && <p className="mt-2 whitespace-pre-wrap">{source.note}</p>}
              {source.selectedLabels.length > 0 && <p className="mt-2">직접 선택 · {source.selectedLabels.join(' · ')}</p>}
            </details>)}
          </SectionCard>;
        })}
        {points.map((point: any) => point.item && point.submission && <SectionCard key={point.axis}>
          <p className="font-semibold">{TASTE_TOKENS[point.axis as TasteId].label} · {point.item.anchor.label}</p>
          <p className="mt-2">최근 · {point.submission.recordedAt.slice(0, 10)} · {responseLabel(point)}</p>
          {point.previous && <p>이전 · {point.previous.submission.recordedAt.slice(0, 10)} · {responseLabel(point, point.previous.submission)}</p>}
          <p className="mt-2">{point.item.prompt}</p>
          {point.item.anchor.conditions.map((text: string) => <p key={text} className="text-[12px] text-[var(--tb-color-text-secondary)]">{text}</p>)}
          <p className="mt-2 text-[12px] text-[var(--tb-color-text-hint)]">회상 응답은 실제 식사 횟수에 포함하지 않아요.</p>
        </SectionCard>)}
      </div>
    </BottomSheetShell>
  </PageSection>;
}
