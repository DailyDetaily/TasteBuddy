import { TASTE_IDS, type TasteId } from '../constants/designTokens';
import {
  TASTE_SURVEY_INSTRUMENT,
  TASTE_SURVEY_LIKERT_SCALE,
  TASTE_SURVEY_SCORING_CONFIG,
  TASTE_SURVEY_UNCERTAINTY_LABELS,
} from '../constants/tasteSurveyConfig';
import { TASTE_SURVEY_ITEMS } from '../constants/tasteSurveyItems';
import type { TasteMeasurementResults, TasteMeasurementSnapshot } from '../constants/tasteMeasurementData';
import type {
  TasteSurveyItem,
  TasteSurveyLikertValue,
  TasteSurveyLikertScaleConfig,
  TasteSurveyRespondentContext,
  TasteSurveyResponse,
  TasteSurveySubmission,
  TasteSurveyUncertaintyReason,
} from '../types/tasteSurvey';

export function isTasteSurveyIntensityValue(value: unknown): value is TasteSurveyLikertValue {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4;
}

export function isTasteSurveyUncertaintyReason(value: unknown): value is TasteSurveyUncertaintyReason {
  return typeof value === 'string' && Object.hasOwn(TASTE_SURVEY_UNCERTAINTY_LABELS, value);
}

export function normalizeTasteSurveyResponses(
  responses: readonly unknown[],
  items: readonly TasteSurveyItem[] = TASTE_SURVEY_ITEMS,
): TasteSurveyResponse[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const byId = new Map<string, TasteSurveyResponse>();
  for (const value of responses) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const response = value as Partial<TasteSurveyResponse>;
    const item = response.itemId ? itemsById.get(response.itemId) : undefined;
    if (!item) continue;
    // A later invalid copy must not silently resurrect an earlier answer.
    byId.delete(item.id);
    if (response.uncertain === true) {
      const reason = isTasteSurveyUncertaintyReason(response.uncertaintyReason)
        && (response.uncertaintyReason !== 'cannot_isolate_taste' || item.tasteId === 'fat')
        ? response.uncertaintyReason : 'cannot_recall';
      byId.set(item.id, { itemId: item.id, selectedValue: null, uncertain: true, uncertaintyReason: reason });
    } else if (response.uncertain === false && isTasteSurveyIntensityValue(response.selectedValue)
      && response.uncertaintyReason === undefined) {
      byId.set(item.id, { itemId: item.id, selectedValue: response.selectedValue, uncertain: false });
    }
  }
  return items.flatMap((item) => byId.has(item.id) ? [byId.get(item.id)!] : []);
}

export function tasteSurveyResponseLabel(
  response: TasteSurveyResponse | undefined,
  scale: TasteSurveyLikertScaleConfig = TASTE_SURVEY_LIKERT_SCALE,
): string {
  if (!response) return '미응답';
  if (response.uncertain) return TASTE_SURVEY_UNCERTAINTY_LABELS[response.uncertaintyReason ?? 'cannot_recall'];
  return isTasteSurveyIntensityValue(response.selectedValue) ? scale.labels[response.selectedValue] : '미응답';
}

/** 현재 응답과 이전 여섯 번의 원문만 보관한다. 같은 시각의 재저장은 이력이 아니다. */
export function mergeTasteSurveyHistory(values: readonly unknown[]): TasteSurveySubmission[] {
  const valid = values.map(readTasteSurveySubmission).filter((value): value is TasteSurveySubmission => value !== null);
  return [...new Map(valid.map(value => [Date.parse(value.recordedAt), value])).values()]
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)).slice(-7);
}

export function createTasteSurveySubmission(
  responses: readonly TasteSurveyResponse[],
  recordedAt: string,
  respondentContext: TasteSurveyRespondentContext = {},
): TasteSurveySubmission {
  // Copy source wording and conditions at submission time, never store a mutable catalog reference.
  return JSON.parse(JSON.stringify({
    schemaVersion: 2,
    source: 'reference-food-recall',
    recordedAt,
    instrument: TASTE_SURVEY_INSTRUMENT,
    recallWindow: TASTE_SURVEY_SCORING_CONFIG.recallWindow,
    scale: TASTE_SURVEY_LIKERT_SCALE,
    items: TASTE_SURVEY_ITEMS,
    responses: normalizeTasteSurveyResponses(responses),
    respondentContext,
  })) as TasteSurveySubmission;
}

export function snapshotFromTasteSurveySubmission(submission: TasteSurveySubmission): TasteMeasurementSnapshot {
  const responses = new Map(normalizeTasteSurveyResponses(submission.responses, submission.items)
    .map((response) => [response.itemId, response]));
  const results = Object.fromEntries(TASTE_IDS.map((id) => [id, null])) as TasteMeasurementResults;
  for (const item of submission.items) {
    const response = responses.get(item.id);
    if (response && !response.uncertain && isTasteSurveyIntensityValue(response.selectedValue)) {
      // Compatibility projection only. The original ordinal category remains the source of truth.
      results[item.tasteId] = response.selectedValue * 2.5;
    }
  }
  return { measuredAt: submission.recordedAt, results, source: 'recalled-intensity', surveySubmission: submission };
}

/** Validate stored v2 evidence without replacing its historical wording with today's catalog. */
export function readTasteSurveySubmission(value: unknown): TasteSurveySubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as TasteSurveySubmission;
  if (record.schemaVersion !== 2 || record.source !== 'reference-food-recall'
    || record.instrument?.id !== TASTE_SURVEY_INSTRUMENT.id || record.instrument.version !== '2.0.0'
    || typeof record.instrument.title !== 'string' || record.recallWindow !== 'recent-3-months'
    || typeof record.recordedAt !== 'string' || !Number.isFinite(Date.parse(record.recordedAt))
    || record.scale?.min !== 0 || record.scale.max !== 4 || record.scale.midpointValue !== 2
    || ![0, 1, 2, 3, 4].every((key) => typeof record.scale.labels?.[key as TasteSurveyLikertValue] === 'string')
    || typeof record.scale.uncertainLabel !== 'string'
    || !Array.isArray(record.items) || record.items.length !== 6 || !Array.isArray(record.responses)) return null;
  const axes = new Set<TasteId>();
  const ids = new Set<string>();
  for (const item of record.items) {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id)
      || !TASTE_IDS.includes(item.tasteId) || axes.has(item.tasteId)
      || item.construct !== 'recalled_intensity' || item.reverseKeyed !== false
      || item.recallWindow !== record.recallWindow || typeof item.prompt !== 'string' || typeof item.helper !== 'string'
      || typeof item.anchor?.id !== 'string' || !item.anchor.id || typeof item.anchor.version !== 'string'
      || typeof item.anchor.label !== 'string' || typeof item.anchor.description !== 'string'
      || !['high', 'medium', 'low'].includes(item.anchor.stability)
      || !Array.isArray(item.anchor.conditions) || !item.anchor.conditions.every((condition) => typeof condition === 'string')) return null;
    axes.add(item.tasteId); ids.add(item.id);
  }
  const context = record.respondentContext;
  if (!context || typeof context !== 'object' || Array.isArray(context)) return null;
  return { ...record, responses: normalizeTasteSurveyResponses(record.responses, record.items) };
}
