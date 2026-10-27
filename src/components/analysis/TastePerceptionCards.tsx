import { useNativeJournal } from '../../lib/gastronomy/useNativeJournal';
import { useNativeAnalysis, type NativePalateData } from '../../lib/gastronomy/useNativeAnalysis';
import { buildOverallTasteProfile } from '../../lib/overallTasteProfile.mjs';
import { buildNativePerceptionRecords } from '../../lib/gastronomy/nativePerception';
import { useEffect, useMemo, useState } from 'react';
import SectionCard from '../SectionCard';
import { DrawerTitle } from '../ui/drawer';
import HexRadarChart from '../system/HexRadarChart';
import TasteInsightSummaryCard, { TasteChangeEmptySummary } from '../system/TasteInsightSummaryCard';
import BottomSheetShell, { BottomSheetCloseButton } from '../system/BottomSheetShell';
import { TASTE_IDS, type TasteId } from '../../constants/designTokens';
import { TASTE_TOKENS } from '../../constants/uiColorTokens';
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

export default function TastePerceptionCards({ nativeOwnerID, nativeData, measurementSnapshot, surveyHistory = NO_HISTORY, feedbackSubmissions = NO_SUBMISSIONS, isActive = true, preferenceUserID = 'guest', onOpenTasteChange }: {
  nativeOwnerID?: string;
  nativeData?: NativePalateData;
  measurementSnapshot: TasteMeasurementSnapshot;
  surveyHistory?: readonly TasteSurveySubmission[];
  feedbackSubmissions?: readonly DiningPageExternalFeedbackSubmission[];
  isActive?: boolean;
  preferenceUserID?: string;
  onOpenTasteChange?: (series: TasteChangeSeries[]) => void;
}) {
  const [remoteDining, setRemoteDining] = useState<Awaited<ReturnType<typeof hydrateReservationPageData>> | null>(null);
  const [remoteMeasurements, setRemoteMeasurements] = useState<TasteMeasurementSnapshot[]>([]);
  const [detail, setDetail] = useState<{ kind: 'meal' | 'survey' | 'conditions'; axis?: TasteId } | null>(null);
  useEffect(() => {
    setRemoteDining(null); setRemoteMeasurements([]); setDetail(null);
    if (!isActive || nativeOwnerID) return;
    let cancelled = false;
    Promise.allSettled([hydrateReservationPageData({ seedIfEmpty: false }), hydrateRecentMeasurementSnapshots(7)]).then(([dining, measurements]) => {
      if (cancelled) return;
      if (dining.status === 'fulfilled') setRemoteDining(dining.value);
      if (measurements.status === 'fulfilled') setRemoteMeasurements(measurements.value);
    });
    return () => { cancelled = true; };
  }, [isActive, nativeOwnerID, preferenceUserID, measurementSnapshot.measuredAt]);
  const owner = nativeOwnerID ?? (preferenceUserID === 'local-owner' ? 'guest' : preferenceUserID);
  const localJournal = useNativeJournal(owner, isActive && !nativeData);
  const nativeJournal = nativeData?.journal ?? localJournal;
  const localAnalysis = useNativeAnalysis(nativeJournal.entries, owner, !nativeData && !!nativeJournal.archive && nativeJournal.canEdit);
  const analysis = nativeData?.analysis ?? localAnalysis;
  const waiting = nativeJournal.loading || analysis.updating || (!nativeJournal.archive && !nativeJournal.error);
  const error = analysis.error ?? (!nativeJournal.canEdit ? nativeJournal.error : null);
  const retry = () => { nativeJournal.retry(); analysis.retry(); };
  // The worker uses a stable model identity; the hook separately gates the result by real account owner.
  const overall = useMemo(() => buildOverallTasteProfile(analysis.snapshot?.model, analysis.snapshot?.observations ?? [], {
    userID: analysis.owner === owner ? analysis.snapshot?.model.userID ?? '' : '',
  }), [analysis.snapshot, analysis.owner, owner]);
  const dining = useMemo(() => {
    const native = buildNativePerceptionRecords(nativeJournal.entries);
    if (nativeOwnerID) return native;
    const legacy = buildDiningPerceptionRecords(feedbackSubmissions, remoteDining);
    return { records: [...legacy.records, ...native.records], sources: [...legacy.sources, ...native.sources] };
  }, [nativeOwnerID, feedbackSubmissions, remoteDining, nativeJournal.archive]);
  const model = useMemo(() => buildTastePerception(dining.records), [dining]);
  const survey = useMemo(() => buildSurveyPerception([
    ...remoteMeasurements.map(snapshot => snapshot.surveySubmission), ...surveyHistory, measurementSnapshot.surveySubmission,
  ]), [remoteMeasurements, surveyHistory, measurementSnapshot]);
  const currentFor = (axis: TasteId) => model.axes.find((row: any) => row.axis === axis)?.current;
  const currentPatterns = TASTE_IDS.map(currentFor).filter(Boolean);
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
  return <section className="flex flex-col gap-5" aria-label="전체 입맛과 변화">
    <div data-testid="taste-perception-radar">
      {waiting ? <p role="status" className="flex min-h-[300px] items-center justify-center text-[13px]">전체 기록을 불러오고 있어요</p>
        : error ? <div role="alert" className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <p>입맛 기록을 불러오지 못했어요</p><p className="text-[12px]">{error}</p>
          <button type="button" className="min-h-11 px-4 underline" onClick={retry}>다시 시도</button>
        </div> : <OverallTasteRadar key={owner} overall={overall} />}
    </div>
    <div data-testid="taste-perception-change">
      <TasteInsightSummaryCard details={[]} keywords={[]} sectionLabel="미각 변화" actionLabel="기록 비교"
        title={waiting ? "기록을 불러오고 있어요" : error ? "기록 조회 실패" : firstChange ? `${TASTE_TOKENS[firstChange.axis as TasteId].label}을 느낀 강도가 달라졌어요` : survey.changes.length ? '기준 음식에서 기억한 강도가 달라졌어요' : hasComparison ? '확인된 강도 변화가 없어요' : '비교할 기록이 부족해요'}
        onClick={waiting || error ? undefined : openChanges}>
        {!waiting && !error && !hasComparison && <TasteChangeEmptySummary />}
      </TasteInsightSummaryCard>
    </div>
    <TasteInsightSummaryCard category="context" details={[]} keywords={[]} sectionLabel="특이사항" actionLabel="조건과 근거"
      title={waiting ? '기록을 불러오고 있어요' : error ? '기록 조회 실패' : model.contrasts.length ? '같은 음식도 조건에 따라 다르게 느꼈어요' : '조건별 차이는 확인 중'} onClick={waiting || error ? undefined : () => setDetail({ kind: 'conditions' })}>
      <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-secondary)]">{waiting ? '현재 기록을 확인하고 있어요.' : error ? '기록을 다시 불러와 주세요.' : model.contrasts[0]
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
              <summary className="min-h-[44px] cursor-pointer py-2 font-medium">{source.foodName} · {source.observedAt ? new Date(source.observedAt).toLocaleDateString('ko-KR') : '식사일 미확인'} 원본 응답 보기</summary>
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
  </section>;
}


/** Uses the same per-axis repository aggregation as the palate type. Selection stores no values. */
export function OverallTasteRadar({ overall }: { overall: ReturnType<typeof buildOverallTasteProfile> }) {
  const [selectedAxis, setSelectedAxis] = useState<TasteId | null>(null);
  const selected = overall.axes.find(row => row.axis === selectedAxis);
  const values = overall.axes.map(row => row.current.value);
  const referenceValues = overall.axes.map(row => row.previous.value);
  const valueLabel = (previous: boolean) => {
    const value = selected && (previous ? selected.previous : selected.current).value;
    return value == null ? '—' : `${Math.round(value)}%`;
  };
  const summary = (previous: boolean) => {
    if (!selected) return '미각을 선택해 주세요';
    const value = previous ? selected.previous : selected.current;
    return `${TASTE_TOKENS[selected.axis].label}: ${value.value === null ? '미측정' : `좋아한 비율 ${Math.round(value.value)}%, 평가한 식사 ${value.rated}회 중 ${value.positive}회`}${value.mixed ? `, 평가가 나뉜 식사 ${value.mixed}회 제외` : ''}`;
  };
  return <>
    <HexRadarChart reportedValues={values} referenceValues={referenceValues} maximum={100}
      selectedAxis={selectedAxis} onSelectAxis={axis => setSelectedAxis(selectedAxis === axis ? null : axis)} />
    <div className="-mt-10" data-testid="radar-comparison-legend" aria-live="polite" aria-atomic="true">
      <div className="flex items-end justify-center gap-1 text-[10px] text-[var(--tb-color-text-hint)]">
        <span className="inline-flex flex-col items-center gap-1" title={`가장 최근 식사일 이전까지의 기록. ${summary(true)}`}>이전<span data-testid="radar-previous-value" aria-label={summary(true)} className="flex h-6 w-12 items-center justify-center rounded-md bg-[var(--tb-color-text-hint)] text-[12px] font-bold text-[var(--tb-color-text-inverse)]">{valueLabel(true)}</span></span>
        <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-md bg-[var(--tb-color-text-disabled)] text-[10px] font-bold text-white">→</span>
        <span className="inline-flex flex-col items-center gap-1" title={summary(false)}>현재<span data-testid="radar-current-value" aria-label={summary(false)} className="flex h-6 w-12 items-center justify-center rounded-md bg-[var(--tb-color-text-secondary)] text-[12px] font-bold text-[var(--tb-color-text-inverse)]">{valueLabel(false)}</span></span>
      </div>
    </div>
    {values.every(value => value === null) && <p className="mt-3 text-center text-[12px] text-[var(--tb-color-text-hint)]">식사일과 감각별 호감이 확인된 기록을 모아 보여드려요.</p>}
  </>;
}
