import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import { TASTE_SURVEY_ITEMS } from '../constants/tasteSurveyItems';
import { TASTE_SURVEY_SCORING_CONFIG } from '../constants/tasteSurveyConfig';
import {
  createTasteMeasurementSnapshot,
  type TasteMeasurementResults,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import {
  buildRestaurantReadyGuidanceFromSnapshot,
  type RestaurantReadyGuidance,
} from '../constants/quickTasteCalibrationData';
import type {
  TasteSurveyCompatibleResult,
  TasteSurveyConstruct,
  TasteSurveyItem,
  TasteSurveyLikertValue,
  TasteSurveyResponse,
} from '../types/tasteSurvey';

type TasteSurveyConstructScores = Partial<Record<TasteSurveyConstruct, number>>;
type TasteSurveyConstructConfidence = Partial<Record<TasteSurveyConstruct, number>>;

interface TasteSurveyTasteScore {
  baseVectorScore: number | null;
  confidence: number;
  constructConfidence: TasteSurveyConstructConfidence;
  constructScores: TasteSurveyConstructScores;
  excludedItemCount: number;
  respondedItemCount: number;
  tasteId: TasteId;
  totalItemCount: number;
}

interface TasteSurveyScoringOutput {
  snapshot: TasteMeasurementSnapshot;
  tasteScores: Record<TasteId, TasteSurveyTasteScore>;
}

const SURVEY_CONSTRUCT_WEIGHTS: Record<TasteSurveyConstruct, number> = {
  overload: 0.42,
  salience: 0.58,
};

const ANCHOR_STABILITY_CONFIDENCE_FACTOR: Record<TasteSurveyItem['anchor']['stability'], number> = {
  high: 1,
  low: 0.72,
  medium: 0.88,
};

const EXPLORATORY_TASTE_CONFIDENCE_FACTOR: Partial<Record<TasteId, number>> = {
  fat: 0.82,
  umami: 0.82,
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLikertValue(value: TasteSurveyLikertValue) {
  return (value - 1) / 6;
}

function getResponseByItemId(responses: readonly TasteSurveyResponse[]) {
  return new Map(responses.map((response) => [response.itemId, response]));
}

function getValidItemScore(response: TasteSurveyResponse | undefined) {
  if (!response || response.uncertain || response.selectedValue === null) {
    return null;
  }

  return normalizeLikertValue(response.selectedValue);
}

function getItemConfidence(item: TasteSurveyItem, response: TasteSurveyResponse | undefined) {
  if (!response || response.uncertain || response.selectedValue === null) {
    return 0;
  }

  const stabilityFactor = ANCHOR_STABILITY_CONFIDENCE_FACTOR[item.anchor.stability];
  const exploratoryFactor = EXPLORATORY_TASTE_CONFIDENCE_FACTOR[item.tasteId] ?? 1;

  return clamp(stabilityFactor * exploratoryFactor);
}

function weightedAverage(
  entries: readonly { confidence: number; score: number; weight: number }[],
) {
  const totalWeight = entries.reduce(
    (sum, entry) => sum + entry.weight * entry.confidence,
    0,
  );

  if (totalWeight <= 0) {
    return null;
  }

  const weightedSum = entries.reduce(
    (sum, entry) => sum + entry.score * entry.weight * entry.confidence,
    0,
  );

  return clamp(weightedSum / totalWeight);
}

function scoreTasteAxis(
  tasteId: TasteId,
  responsesByItemId: Map<string, TasteSurveyResponse>,
): TasteSurveyTasteScore {
  const items = TASTE_SURVEY_ITEMS.filter((item) => item.tasteId === tasteId);
  const scoredEntries = items.map((item) => {
    const response = responsesByItemId.get(item.id);
    const score = getValidItemScore(response);
    const confidence = getItemConfidence(item, response);

    return {
      confidence,
      construct: item.construct,
      item,
      score,
      weight: SURVEY_CONSTRUCT_WEIGHTS[item.construct],
    };
  });

  const validEntries = scoredEntries.filter(
    (entry): entry is typeof entry & { score: number } => entry.score !== null,
  );
  const constructScores = TASTE_SURVEY_SCORING_CONFIG.constructs.reduce<TasteSurveyConstructScores>(
    (scores, construct) => {
      const entriesForConstruct = validEntries.filter((entry) => entry.construct === construct);
      const constructScore = weightedAverage(entriesForConstruct);

      if (constructScore !== null) {
        scores[construct] = constructScore;
      }

      return scores;
    },
    {},
  );
  const constructConfidence =
    TASTE_SURVEY_SCORING_CONFIG.constructs.reduce<TasteSurveyConstructConfidence>(
      (confidenceByConstruct, construct) => {
        const constructItems = scoredEntries.filter((entry) => entry.construct === construct);
        const confidenceSum = constructItems.reduce(
          (sum, entry) => sum + entry.confidence,
          0,
        );

        if (constructItems.length > 0) {
          confidenceByConstruct[construct] = clamp(confidenceSum / constructItems.length);
        }

        return confidenceByConstruct;
      },
      {},
    );
  const baseVectorScore = weightedAverage(validEntries);
  const confidence =
    items.length > 0
      ? clamp(
          scoredEntries.reduce((sum, entry) => sum + entry.confidence, 0) / items.length,
        )
      : 0;

  return {
    baseVectorScore,
    confidence,
    constructConfidence,
    constructScores,
    excludedItemCount: scoredEntries.length - validEntries.length,
    respondedItemCount: validEntries.length,
    tasteId,
    totalItemCount: items.length,
  };
}

function normalizedScoreToStarterMeasurementValue(score: number) {
  // TasteMeasurementSnapshot consumers already treat broad starter values as the
  // same 0..10 numeric scale created by the previous starter flow.
  // The survey produces a 0..1 vector, so v1 maps it linearly to 0..10.
  return Number((clamp(score) * 10).toFixed(1));
}

function createSurveyMeasurementResults(
  tasteScores: Record<TasteId, TasteSurveyTasteScore>,
): TasteMeasurementResults {
  return TASTE_IDS.reduce<TasteMeasurementResults>((results, tasteId) => {
    const score = tasteScores[tasteId].baseVectorScore;
    results[tasteId] =
      score === null
        ? null
        : normalizedScoreToStarterMeasurementValue(score);
    return results;
  }, {} as TasteMeasurementResults);
}

export function scoreTasteSurveyResponses(
  responses: readonly TasteSurveyResponse[],
): TasteSurveyScoringOutput {
  const responsesByItemId = getResponseByItemId(responses);
  const tasteScores = TASTE_IDS.reduce<Record<TasteId, TasteSurveyTasteScore>>(
    (scores, tasteId) => {
      scores[tasteId] = scoreTasteAxis(tasteId, responsesByItemId);
      return scores;
    },
    {} as Record<TasteId, TasteSurveyTasteScore>,
  );

  return {
    snapshot: createTasteMeasurementSnapshot(
      createSurveyMeasurementResults(tasteScores),
      new Date().toISOString(),
      TASTE_SURVEY_SCORING_CONFIG.outputSnapshotSource,
    ),
    tasteScores,
  };
}

function getConfidenceBand(tasteScores: Record<TasteId, TasteSurveyTasteScore>) {
  const averageConfidence =
    TASTE_IDS.reduce((sum, tasteId) => sum + tasteScores[tasteId].confidence, 0) /
    TASTE_IDS.length;

  if (averageConfidence >= 0.82) {
    return 'Building' as const;
  }

  return 'Starter' as const;
}

function createSurveyEvidence(
  guidance: RestaurantReadyGuidance,
  tasteScores: Record<TasteId, TasteSurveyTasteScore>,
) {
  const topEvidence = guidance.topAxes.map((tasteId) => {
    const taste = TASTE_TOKENS[tasteId];
    const score = tasteScores[tasteId];
    const confidenceNote =
      score.confidence < 0.5 ? '아직 더 확인할 축으로' : '먼저 읽히는 축으로';

    return `${taste.label}은 최근 응답에서 ${confidenceNote} 나타났어요.`;
  });
  const exploratoryEvidence = (['umami', 'fat'] as const)
    .filter((tasteId) => tasteScores[tasteId].respondedItemCount > 0)
    .map((tasteId) => {
      const taste = TASTE_TOKENS[tasteId];
      return `${taste.label}은 탐색 축이라 다음 식사 피드백과 함께 조심스럽게 다듬어요.`;
    });

  return [
    ...topEvidence,
    `조심할 축은 ${guidance.cautionLabel}이고, 강도가 빠르게 쌓이는지 이어서 확인합니다.`,
    ...exploratoryEvidence,
  ];
}

function buildStarterGuidanceFromSurveyScores(
  snapshot: TasteMeasurementSnapshot,
  tasteScores: Record<TasteId, TasteSurveyTasteScore>,
) {
  const confidence = getConfidenceBand(tasteScores);
  const baseGuidance = buildRestaurantReadyGuidanceFromSnapshot(
    snapshot,
    {
      baselineReference: 'popular-k-fnb',
      calibrationMode: 'digital-anchoring',
    },
    confidence,
  );
  const cautionConfidence = tasteScores[baseGuidance.cautionAxis].confidence;
  const exploratoryCaution =
    baseGuidance.cautionAxis === 'umami' || baseGuidance.cautionAxis === 'fat';
  const cautionPhrase =
    cautionConfidence < 0.5 || exploratoryCaution
      ? `${baseGuidance.cautionLabel}은 아직 확정하기보다 다음 식사에서 더 확인할 포인트예요.`
      : `${baseGuidance.cautionLabel}은 강도가 빠르게 쌓이는지 조심스럽게 볼 포인트예요.`;
  const topLabelText = baseGuidance.topLabels.join('과 ');

  return {
    ...baseGuidance,
    confidence,
    context: {
      baselineReference: 'popular-k-fnb',
      calibrationMode: 'digital-anchoring',
    },
    evidence: createSurveyEvidence(baseGuidance, tasteScores),
    summaryLine:
      topLabelText.length > 0
        ? `최근 응답에서는 ${topLabelText} 쪽의 차이가 먼저 읽히는 시작 프로필로 보여요. ${cautionPhrase} 이 해석은 예약 개인화의 출발점으로 쓰이고, 식후 피드백이 쌓이면 더 정교해집니다.`
        : `최근 응답으로 만든 시작 프로필이에요. ${cautionPhrase} 이 해석은 예약 개인화의 출발점으로 쓰이고, 식후 피드백이 쌓이면 더 정교해집니다.`,
    surfaceLabel: '설문 기반 스타터 가이드',
  } satisfies RestaurantReadyGuidance;
}

export function buildTasteSurveyCompatibleResult(
  responses: readonly TasteSurveyResponse[],
): TasteSurveyCompatibleResult {
  const { snapshot, tasteScores } = scoreTasteSurveyResponses(responses);

  return {
    snapshot,
    starterGuidance: buildStarterGuidanceFromSurveyScores(snapshot, tasteScores),
  };
}
