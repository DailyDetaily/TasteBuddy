import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import { TASTE_SURVEY_ITEMS } from '../constants/tasteSurveyItems';
import type { TasteMeasurementSnapshot } from '../constants/tasteMeasurementData';
import type { RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
import type {
  TasteSurveyCompatibleResult,
  TasteSurveyConstruct,
  TasteSurveyRespondentContext,
  TasteSurveyResponse,
} from '../types/tasteSurvey';
import {
  createTasteSurveySubmission,
  normalizeTasteSurveyResponses,
  snapshotFromTasteSurveySubmission,
  tasteSurveyResponseLabel,
} from './tasteSurveyEvidence';
import { sanitizeTasteSurveyRespondentContext } from './tasteSurveyPersistence';

interface TasteSurveyTasteScore {
  baseVectorScore: number | null;
  /** No calibrated sensitivity confidence is available for this recall instrument. */
  confidence: number;
  constructConfidence: Partial<Record<TasteSurveyConstruct, number>>;
  constructScores: Partial<Record<TasteSurveyConstruct, number>>;
  excludedItemCount: number;
  respondedItemCount: number;
  tasteId: TasteId;
  totalItemCount: number;
}

interface TasteSurveyScoringOutput {
  snapshot: TasteMeasurementSnapshot;
  tasteScores: Record<TasteId, TasteSurveyTasteScore>;
}

interface TasteSurveyScoringOptions {
  measuredAt?: string;
  respondentContext?: TasteSurveyRespondentContext;
}

export function scoreTasteSurveyResponses(
  responses: readonly TasteSurveyResponse[],
  options: TasteSurveyScoringOptions = {},
): TasteSurveyScoringOutput {
  const normalized = normalizeTasteSurveyResponses(responses);
  const byItem = new Map(normalized.map((response) => [response.itemId, response]));
  const submission = createTasteSurveySubmission(
    normalized,
    options.measuredAt ?? new Date().toISOString(),
    sanitizeTasteSurveyRespondentContext(options.respondentContext),
  );
  const tasteScores = Object.fromEntries(TASTE_IDS.map((tasteId) => {
    const items = TASTE_SURVEY_ITEMS.filter((item) => item.tasteId === tasteId);
    const values = items.flatMap((item) => {
      const response = byItem.get(item.id);
      return response && !response.uncertain && response.selectedValue !== null
        ? [response.selectedValue / 4] : [];
    });
    const score = values[0] ?? null;
    return [tasteId, {
      baseVectorScore: score,
      confidence: 0,
      constructConfidence: { recalled_intensity: 0 },
      constructScores: score === null ? {} : { recalled_intensity: score },
      excludedItemCount: items.length - values.length,
      respondedItemCount: values.length,
      tasteId,
      totalItemCount: items.length,
    } satisfies TasteSurveyTasteScore];
  })) as Record<TasteId, TasteSurveyTasteScore>;

  return { snapshot: snapshotFromTasteSurveySubmission(submission), tasteScores };
}

export function buildTasteSurveyCompatibleResult(
  responses: readonly TasteSurveyResponse[],
  options: TasteSurveyScoringOptions = {},
): TasteSurveyCompatibleResult {
  const { snapshot } = scoreTasteSurveyResponses(responses, options);
  const submission = snapshot.surveySubmission!;
  const byItem = new Map(submission.responses.map((response) => [response.itemId, response]));
  const answered = submission.responses.filter((response) => !response.uncertain && response.selectedValue !== null);
  const evidence = submission.items.flatMap((item) => {
    const response = byItem.get(item.id);
    return response && !response.uncertain
      ? [`${item.anchor.label}의 ${TASTE_TOKENS[item.tasteId].label}: ${tasteSurveyResponseLabel(response)}.`]
      : [];
  });
  const summaryLine = answered.length > 0
    ? `${answered.length}가지 기준 음식에서 기억한 맛의 강도를 남겼어요. 음식마다 기준이 달라 맛 사이의 민감도 순위나 좋아하는 정도로 해석하지 않아요.`
    : '아직 강도를 답한 기준 음식이 없어요. 먹어본 적 없거나 기억나지 않는 응답은 점수로 채우지 않고 남겨요.';
  const starterGuidance: RestaurantReadyGuidance = {
    // Required by older consumers, but no caution axis or ranking is inferred from this survey.
    cautionAxis: 'fat',
    cautionLabel: '추가 확인',
    confidence: 'Starter',
    context: { baselineReference: 'reference-food-recall-v2', calibrationMode: 'recalled-intensity' },
    evidence: [...evidence, '흰 우유의 지방맛 응답은 예비 단서이며 질감·향·느끼함과 구분해 살펴봐요.'],
    goalPhrase: '기준 음식에서 기억한 맛의 강도',
    summaryLine,
    surfaceLabel: '기준 음식 회상 기록',
    topAxes: [],
    topLabels: [],
  };
  return { snapshot, starterGuidance };
}
