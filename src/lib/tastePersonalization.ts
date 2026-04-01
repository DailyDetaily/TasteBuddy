import { TASTE_IDS, type TasteId } from '../constants/designTokens';
import {
  DEFAULT_DISH_SIGNAL_WEIGHTS,
  DEFAULT_FEEDBACK_TAG_DEFINITIONS,
} from '../constants/tastePersonalization';
import {
  PERCEPTUAL_AXES,
  type DishInferenceProfile,
  type DishSignalInputs,
  type DishSignalWeights,
  type FeedbackObservation,
  type FeedbackTagDefinition,
  type FeedbackTagSelection,
  type LearningUpdate,
  type ParsedFeedbackReaction,
  type PersonalizedDishProjection,
  type PerceptualAxis,
  type PerceptualVector,
  type ReservationLearningSignal,
  type SignedPerceptualVector,
  type SignedTasteVector,
  type TasteVector,
  type UserLearnedCalibration,
} from '../types/tastePersonalization';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals = 4) {
  return Number(value.toFixed(decimals));
}

function buildRecord<K extends string>(keys: readonly K[], initialValue = 0): Record<K, number> {
  return keys.reduce<Record<K, number>>((accumulator, key) => {
    accumulator[key] = initialValue;
    return accumulator;
  }, {} as Record<K, number>);
}

function addPartialRecord<K extends string>(
  keys: readonly K[],
  base: Record<K, number>,
  delta: Partial<Record<K, number>>,
  weight = 1,
) {
  const next = { ...base };

  for (const key of keys) {
    next[key] = roundTo(next[key] + (delta[key] ?? 0) * weight);
  }

  return next;
}

function scaleRecord<K extends string>(keys: readonly K[], value: Record<K, number>, scalar: number) {
  const next = { ...value };

  for (const key of keys) {
    next[key] = roundTo(next[key] * scalar);
  }

  return next;
}

function clampPositiveRecord<K extends string>(keys: readonly K[], value: Record<K, number>) {
  const next = { ...value };

  for (const key of keys) {
    next[key] = roundTo(clamp(next[key], 0, 1));
  }

  return next;
}

function clampSignedRecord<K extends string>(keys: readonly K[], value: Record<K, number>) {
  const next = { ...value };

  for (const key of keys) {
    next[key] = roundTo(clamp(next[key], -1, 1));
  }

  return next;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getDefinedTagDefinitions(tagDefinitions: readonly FeedbackTagDefinition[]) {
  return new Map(tagDefinitions.map((definition) => [definition.id, definition]));
}

export function createZeroTasteVector(): TasteVector {
  return buildRecord(TASTE_IDS);
}

export function createZeroSignedTasteVector(): SignedTasteVector {
  return buildRecord(TASTE_IDS);
}

export function createZeroPerceptualVector(): PerceptualVector {
  return buildRecord(PERCEPTUAL_AXES);
}

export function createZeroSignedPerceptualVector(): SignedPerceptualVector {
  return buildRecord(PERCEPTUAL_AXES);
}

export function clampTasteVector(vector: TasteVector) {
  return clampPositiveRecord(TASTE_IDS, vector);
}

export function clampPerceptualVector(vector: PerceptualVector) {
  return clampPositiveRecord(PERCEPTUAL_AXES, vector);
}

export function clampSignedTasteVector(vector: SignedTasteVector) {
  return clampSignedRecord(TASTE_IDS, vector);
}

export function clampSignedPerceptualVector(vector: SignedPerceptualVector) {
  return clampSignedRecord(PERCEPTUAL_AXES, vector);
}

export function createEmptyUserLearnedCalibration(): UserLearnedCalibration {
  return {
    perceptionTasteDelta: createZeroSignedTasteVector(),
    perceptionPerceptualDelta: createZeroSignedPerceptualVector(),
    preferenceTasteDelta: createZeroSignedTasteVector(),
    preferencePerceptualDelta: createZeroSignedPerceptualVector(),
    supportCount: 0,
    hypothesisCount: 0,
  };
}

export function composeDishInferenceVectors(
  inputs: DishSignalInputs,
  weights: DishSignalWeights = DEFAULT_DISH_SIGNAL_WEIGHTS,
) {
  let tasteVector = createZeroTasteVector();
  let perceptualVector = createZeroPerceptualVector();

  tasteVector = addPartialRecord(TASTE_IDS, tasteVector, inputs.ingredientTaste ?? {}, weights.ingredient);
  tasteVector = addPartialRecord(TASTE_IDS, tasteVector, inputs.techniqueTaste ?? {}, weights.technique);
  tasteVector = addPartialRecord(TASTE_IDS, tasteVector, inputs.menuTaste ?? {}, weights.menu);
  tasteVector = addPartialRecord(TASTE_IDS, tasteVector, inputs.reviewTaste ?? {}, weights.review);
  tasteVector = addPartialRecord(TASTE_IDS, tasteVector, inputs.courseTaste ?? {}, weights.course);

  perceptualVector = addPartialRecord(
    PERCEPTUAL_AXES,
    perceptualVector,
    inputs.ingredientPerceptual ?? {},
    weights.ingredient,
  );
  perceptualVector = addPartialRecord(
    PERCEPTUAL_AXES,
    perceptualVector,
    inputs.techniquePerceptual ?? {},
    weights.technique,
  );
  perceptualVector = addPartialRecord(
    PERCEPTUAL_AXES,
    perceptualVector,
    inputs.menuPerceptual ?? {},
    weights.menu,
  );
  perceptualVector = addPartialRecord(
    PERCEPTUAL_AXES,
    perceptualVector,
    inputs.reviewPerceptual ?? {},
    weights.review,
  );
  perceptualVector = addPartialRecord(
    PERCEPTUAL_AXES,
    perceptualVector,
    inputs.coursePerceptual ?? {},
    weights.course,
  );

  return {
    tasteVector: clampTasteVector(tasteVector),
    perceptualVector: clampPerceptualVector(perceptualVector),
  };
}

export function buildDishInferenceProfile(
  dishId: string,
  inputs: DishSignalInputs,
  options?: {
    confidence?: number;
    evidenceIds?: string[];
    rationale?: string;
    uncertaintyNotes?: string[];
    version?: number;
    weights?: DishSignalWeights;
  },
): DishInferenceProfile {
  const vectors = composeDishInferenceVectors(inputs, options?.weights);

  return {
    dishId,
    version: options?.version ?? 1,
    tasteVector: vectors.tasteVector,
    perceptualVector: vectors.perceptualVector,
    confidence: roundTo(clamp(options?.confidence ?? 0.6, 0, 1), 3),
    evidenceIds: options?.evidenceIds ?? [],
    rationale: options?.rationale ?? 'Public source aggregation + seed heuristic composition',
    uncertaintyNotes: options?.uncertaintyNotes ?? [],
  };
}

export function parseFeedbackSelections(
  selections: readonly FeedbackTagSelection[],
  tagDefinitions: readonly FeedbackTagDefinition[] = DEFAULT_FEEDBACK_TAG_DEFINITIONS,
) {
  const definitionMap = getDefinedTagDefinitions(tagDefinitions);
  const validSelections = selections
    .map((selection) => {
      const definition = definitionMap.get(selection.tagId);

      if (!definition) {
        return null;
      }

      return {
        definition,
        intensity: clamp(selection.intensity ?? 1, 0.25, 1.5),
      };
    })
    .filter((selection): selection is { definition: FeedbackTagDefinition; intensity: number } => selection !== null);

  if (validSelections.length === 0) {
    return {
      perceptionTasteDelta: createZeroSignedTasteVector(),
      perceptionPerceptualDelta: createZeroSignedPerceptualVector(),
      preferenceTasteDelta: createZeroSignedTasteVector(),
      preferencePerceptualDelta: createZeroSignedPerceptualVector(),
      confidence: 0,
      evidenceTagIds: [],
      rationale: 'No valid feedback tags selected',
    } satisfies ParsedFeedbackReaction;
  }

  let perceptionTasteDelta = createZeroSignedTasteVector();
  let perceptionPerceptualDelta = createZeroSignedPerceptualVector();
  let preferenceTasteDelta = createZeroSignedTasteVector();
  let preferencePerceptualDelta = createZeroSignedPerceptualVector();
  let totalIntensity = 0;

  for (const selection of validSelections) {
    totalIntensity += selection.intensity;
    perceptionTasteDelta = addPartialRecord(
      TASTE_IDS,
      perceptionTasteDelta,
      selection.definition.perceptionTasteDelta,
      selection.intensity,
    );
    perceptionPerceptualDelta = addPartialRecord(
      PERCEPTUAL_AXES,
      perceptionPerceptualDelta,
      selection.definition.perceptionPerceptualDelta,
      selection.intensity,
    );
    preferenceTasteDelta = addPartialRecord(
      TASTE_IDS,
      preferenceTasteDelta,
      selection.definition.preferenceTasteDelta,
      selection.intensity,
    );
    preferencePerceptualDelta = addPartialRecord(
      PERCEPTUAL_AXES,
      preferencePerceptualDelta,
      selection.definition.preferencePerceptualDelta,
      selection.intensity,
    );
  }

  const normalizationWeight = totalIntensity > 0 ? 1 / totalIntensity : 1;

  return {
    perceptionTasteDelta: clampSignedTasteVector(scaleRecord(TASTE_IDS, perceptionTasteDelta, normalizationWeight)),
    perceptionPerceptualDelta: clampSignedPerceptualVector(
      scaleRecord(PERCEPTUAL_AXES, perceptionPerceptualDelta, normalizationWeight),
    ),
    preferenceTasteDelta: clampSignedTasteVector(scaleRecord(TASTE_IDS, preferenceTasteDelta, normalizationWeight)),
    preferencePerceptualDelta: clampSignedPerceptualVector(
      scaleRecord(PERCEPTUAL_AXES, preferencePerceptualDelta, normalizationWeight),
    ),
    confidence: roundTo(
      average(validSelections.map((selection) => selection.definition.confidence * selection.intensity)) /
        average(validSelections.map((selection) => selection.intensity)),
      3,
    ),
    evidenceTagIds: validSelections.map((selection) => selection.definition.id),
    rationale: validSelections.map((selection) => selection.definition.label).join(', '),
  } satisfies ParsedFeedbackReaction;
}

export function getRatingLearningWeight(rating: number) {
  const clampedRating = clamp(Math.round(rating), 1, 5);

  return roundTo(0.2 + ((6 - clampedRating) / 5) * 0.8, 3);
}

export function getRecencyWeight(daysSinceDining = 0, halfLifeDays = 45) {
  const safeDays = Math.max(0, daysSinceDining);
  const safeHalfLife = Math.max(1, halfLifeDays);

  return roundTo(Math.pow(0.5, safeDays / safeHalfLife), 4);
}

export function computeReservationLearningSignal(
  observations: readonly FeedbackObservation[],
): ReservationLearningSignal {
  if (observations.length === 0) {
    return {
      perceptionTasteDelta: createZeroSignedTasteVector(),
      perceptionPerceptualDelta: createZeroSignedPerceptualVector(),
      preferenceTasteDelta: createZeroSignedTasteVector(),
      preferencePerceptualDelta: createZeroSignedPerceptualVector(),
      confidence: 0,
      evidenceCount: 0,
      reasons: [],
    };
  }

  let perceptionTasteDelta = createZeroSignedTasteVector();
  let perceptionPerceptualDelta = createZeroSignedPerceptualVector();
  let preferenceTasteDelta = createZeroSignedTasteVector();
  let preferencePerceptualDelta = createZeroSignedPerceptualVector();
  let totalWeight = 0;
  const confidenceWeights: number[] = [];
  const reasons = new Set<string>();

  for (const observation of observations) {
    const ratingWeight = getRatingLearningWeight(observation.rating);
    const recencyWeight = getRecencyWeight(observation.daysSinceDining);
    const sourceConfidence = clamp(observation.sourceConfidence ?? 1, 0, 1);
    const parsedConfidence = clamp(observation.parsedReaction.confidence, 0, 1);
    const totalObservationWeight = ratingWeight * recencyWeight * sourceConfidence * parsedConfidence;

    totalWeight += totalObservationWeight;
    confidenceWeights.push(totalObservationWeight);

    perceptionTasteDelta = addPartialRecord(
      TASTE_IDS,
      perceptionTasteDelta,
      observation.parsedReaction.perceptionTasteDelta,
      totalObservationWeight,
    );
    perceptionPerceptualDelta = addPartialRecord(
      PERCEPTUAL_AXES,
      perceptionPerceptualDelta,
      observation.parsedReaction.perceptionPerceptualDelta,
      totalObservationWeight,
    );
    preferenceTasteDelta = addPartialRecord(
      TASTE_IDS,
      preferenceTasteDelta,
      observation.parsedReaction.preferenceTasteDelta,
      totalObservationWeight,
    );
    preferencePerceptualDelta = addPartialRecord(
      PERCEPTUAL_AXES,
      preferencePerceptualDelta,
      observation.parsedReaction.preferencePerceptualDelta,
      totalObservationWeight,
    );

    for (const tagId of observation.parsedReaction.evidenceTagIds) {
      reasons.add(tagId);
    }
  }

  const normalizationWeight = totalWeight > 0 ? 1 / totalWeight : 1;

  return {
    perceptionTasteDelta: clampSignedTasteVector(scaleRecord(TASTE_IDS, perceptionTasteDelta, normalizationWeight)),
    perceptionPerceptualDelta: clampSignedPerceptualVector(
      scaleRecord(PERCEPTUAL_AXES, perceptionPerceptualDelta, normalizationWeight),
    ),
    preferenceTasteDelta: clampSignedTasteVector(scaleRecord(TASTE_IDS, preferenceTasteDelta, normalizationWeight)),
    preferencePerceptualDelta: clampSignedPerceptualVector(
      scaleRecord(PERCEPTUAL_AXES, preferencePerceptualDelta, normalizationWeight),
    ),
    confidence: roundTo(average(confidenceWeights), 3),
    evidenceCount: observations.length,
    reasons: Array.from(reasons),
  };
}

export function updateUserLearnedCalibration(
  current: UserLearnedCalibration,
  reservationSignal: ReservationLearningSignal,
  options?: {
    learningRate?: number;
    minimumConfidence?: number;
    promotionThreshold?: number;
    promotionMagnitude?: number;
    timestamp?: string;
  },
): LearningUpdate {
  const learningRate = clamp(options?.learningRate ?? 0.18, 0.05, 0.5);
  const minimumConfidence = clamp(options?.minimumConfidence ?? 0.35, 0, 1);
  const promotionThreshold = Math.max(1, Math.round(options?.promotionThreshold ?? 3));
  const promotionMagnitude = clamp(options?.promotionMagnitude ?? 0.18, 0.05, 0.6);
  const accepted = reservationSignal.confidence >= minimumConfidence;
  const effectiveLearningRate = accepted
    ? learningRate * reservationSignal.confidence
    : learningRate * reservationSignal.confidence * 0.5;

  const next: UserLearnedCalibration = {
    perceptionTasteDelta: createZeroSignedTasteVector(),
    perceptionPerceptualDelta: createZeroSignedPerceptualVector(),
    preferenceTasteDelta: createZeroSignedTasteVector(),
    preferencePerceptualDelta: createZeroSignedPerceptualVector(),
    supportCount: current.supportCount + (accepted ? reservationSignal.evidenceCount : 0),
    hypothesisCount: current.hypothesisCount + (accepted ? 0 : reservationSignal.evidenceCount),
    updatedAt: options?.timestamp ?? new Date().toISOString(),
  };

  for (const tasteId of TASTE_IDS) {
    next.perceptionTasteDelta[tasteId] = roundTo(
      current.perceptionTasteDelta[tasteId] * (1 - effectiveLearningRate) +
        reservationSignal.perceptionTasteDelta[tasteId] * effectiveLearningRate,
    );
    next.preferenceTasteDelta[tasteId] = roundTo(
      current.preferenceTasteDelta[tasteId] * (1 - effectiveLearningRate) +
        reservationSignal.preferenceTasteDelta[tasteId] * effectiveLearningRate,
    );
  }

  for (const axis of PERCEPTUAL_AXES) {
    next.perceptionPerceptualDelta[axis] = roundTo(
      current.perceptionPerceptualDelta[axis] * (1 - effectiveLearningRate) +
        reservationSignal.perceptionPerceptualDelta[axis] * effectiveLearningRate,
    );
    next.preferencePerceptualDelta[axis] = roundTo(
      current.preferencePerceptualDelta[axis] * (1 - effectiveLearningRate) +
        reservationSignal.preferencePerceptualDelta[axis] * effectiveLearningRate,
    );
  }

  next.perceptionTasteDelta = clampSignedTasteVector(next.perceptionTasteDelta);
  next.preferenceTasteDelta = clampSignedTasteVector(next.preferenceTasteDelta);
  next.perceptionPerceptualDelta = clampSignedPerceptualVector(next.perceptionPerceptualDelta);
  next.preferencePerceptualDelta = clampSignedPerceptualVector(next.preferencePerceptualDelta);

  const promotedTasteAxes = TASTE_IDS.filter((tasteId) => {
    const strongestSignal = Math.max(
      Math.abs(next.perceptionTasteDelta[tasteId]),
      Math.abs(next.preferenceTasteDelta[tasteId]),
    );

    return next.supportCount >= promotionThreshold && strongestSignal >= promotionMagnitude;
  });

  const promotedPerceptualAxes = PERCEPTUAL_AXES.filter((axis) => {
    const strongestSignal = Math.max(
      Math.abs(next.perceptionPerceptualDelta[axis]),
      Math.abs(next.preferencePerceptualDelta[axis]),
    );

    return next.supportCount >= promotionThreshold && strongestSignal >= promotionMagnitude;
  });

  return {
    next,
    promotedTasteAxes,
    promotedPerceptualAxes,
    confidence: reservationSignal.confidence,
    reservationSignal,
  };
}

export function projectDishForUser(
  dishProfile: Pick<DishInferenceProfile, 'tasteVector' | 'perceptualVector' | 'confidence'>,
  calibration: UserLearnedCalibration,
  options?: {
    sensitivityInfluence?: number;
    reasons?: string[];
  },
): PersonalizedDishProjection {
  const sensitivityInfluence = clamp(options?.sensitivityInfluence ?? 0.35, 0, 1);
  const predictedTasteVector = createZeroTasteVector();
  const predictedPerceptualVector = createZeroPerceptualVector();

  for (const tasteId of TASTE_IDS) {
    predictedTasteVector[tasteId] = roundTo(
      clamp(
        dishProfile.tasteVector[tasteId] +
          calibration.perceptionTasteDelta[tasteId] * sensitivityInfluence,
        0,
        1,
      ),
    );
  }

  for (const axis of PERCEPTUAL_AXES) {
    predictedPerceptualVector[axis] = roundTo(
      clamp(
        dishProfile.perceptualVector[axis] +
          calibration.perceptionPerceptualDelta[axis] * sensitivityInfluence,
        0,
        1,
      ),
    );
  }

  return {
    predictedTasteVector,
    predictedPerceptualVector,
    preferenceTasteDelta: calibration.preferenceTasteDelta,
    preferencePerceptualDelta: calibration.preferencePerceptualDelta,
    confidence: roundTo(
      clamp((dishProfile.confidence + Math.min(1, calibration.supportCount / 5)) / 2, 0, 1),
      3,
    ),
    reasons: options?.reasons ?? [],
  };
}

export function scoreDishUserFit(
  projection: PersonalizedDishProjection,
  options?: {
    tasteWeight?: number;
    perceptualWeight?: number;
  },
) {
  const tasteWeight = clamp(options?.tasteWeight ?? 0.65, 0, 1);
  const perceptualWeight = clamp(options?.perceptualWeight ?? 0.35, 0, 1);

  const tasteFit =
    TASTE_IDS.reduce((sum, tasteId) => {
      return sum + projection.predictedTasteVector[tasteId] * projection.preferenceTasteDelta[tasteId];
    }, 0) / TASTE_IDS.length;

  const perceptualFit =
    PERCEPTUAL_AXES.reduce((sum, axis) => {
      return sum + projection.predictedPerceptualVector[axis] * projection.preferencePerceptualDelta[axis];
    }, 0) / PERCEPTUAL_AXES.length;

  return roundTo(clamp(0.5 + tasteFit * tasteWeight + perceptualFit * perceptualWeight, 0, 1), 4);
}

export function getDominantTasteAxis(vector: TasteVector | SignedTasteVector) {
  return TASTE_IDS.reduce<TasteId>((current, candidate) => {
    return Math.abs(vector[candidate]) > Math.abs(vector[current]) ? candidate : current;
  }, TASTE_IDS[0]);
}

export function getDominantPerceptualAxis(vector: PerceptualVector | SignedPerceptualVector) {
  return PERCEPTUAL_AXES.reduce<PerceptualAxis>((current, candidate) => {
    return Math.abs(vector[candidate]) > Math.abs(vector[current]) ? candidate : current;
  }, PERCEPTUAL_AXES[0]);
}
