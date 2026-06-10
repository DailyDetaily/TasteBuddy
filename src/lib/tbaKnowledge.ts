import { DISH_KIND_OPTIONS } from '../constants/dishKindTags';
import { TBA_CORE_TASTE_LEXICON } from '../constants/tbaCoreTasteLexicon';
import { TASTE_IDS, type TasteId } from '../constants/designTokens';
import type {
  TbaCanonicalDishKindId,
  TbaCoreTasteLexiconEntry,
  TbaDiningNoteLexiconCandidate,
  TbaDiningNoteLexiconMapperInput,
  TbaDiningNoteLexiconMapping,
  TbaKnowledgeSurface,
  TbaLexiconConfidenceContext,
  TbaLexiconDishKindAffinity,
  TbaLexiconRankOptions,
  TbaRankedLexiconCandidate,
} from '../types/tasteBuddyKnowledge';
import {
  PERCEPTUAL_AXES,
  type PerceptualAxis,
} from '../types/tastePersonalization';
import type { TbaFoodKnowledgeRankedCandidate, TbaFoodOntologyMatch } from '../types/tbaFoodOntology';
import { rankTbaFoodKnowledgeEntries } from './tbaFoodKnowledgeDataset';
import { mapFoodOnBridgeInput } from './tbaFoodOnMapping';
import { mapFeedbackInputToTbaSignals } from './tbaSignalMapping';

const CANONICAL_DISH_KIND_IDS = new Set(DISH_KIND_OPTIONS.map((option) => option.id));

const DISH_KIND_ALIAS_TO_CANONICAL: Record<string, TbaCanonicalDishKindId> = {
  beef: 'meat',
  beverage: 'beverage_pairing',
  braised: 'meat',
  bread: 'grain_noodle',
  broth: 'broth',
  chocolate: 'dessert',
  crustacean: 'seafood',
  cured: 'fermented_jang',
  dairy: 'dessert',
  dessert: 'dessert',
  dumpling: 'grain_noodle',
  fermented: 'fermented_jang',
  fish: 'seafood',
  foam: 'dessert',
  fried: 'grilled_smoked',
  fruit: 'dessert',
  garnish: 'vegetable_herb',
  grain: 'grain_noodle',
  grilled: 'grilled_smoked',
  herb: 'vegetable_herb',
  leafyGreen: 'vegetable_herb',
  meat: 'meat',
  mushroom: 'vegetable_herb',
  noodle: 'grain_noodle',
  nut: 'dessert',
  pickled: 'fermented_jang',
  pork: 'meat',
  poultry: 'meat',
  powder: 'dessert',
  roasted: 'grilled_smoked',
  rootVegetable: 'vegetable_herb',
  salad: 'vegetable_herb',
  sauce: 'broth',
  scallop: 'seafood',
  seafood: 'seafood',
  seaweed: 'seafood',
  shellfish: 'seafood',
  smoked: 'grilled_smoked',
  steamed: 'broth',
  tea: 'beverage_pairing',
  vegetable: 'vegetable_herb',
  wine: 'beverage_pairing',
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function clampSigned(value: number) {
  return Math.min(1, Math.max(-1, value));
}

function getCanonicalDishKindId(kindId: string): TbaCanonicalDishKindId | null {
  if (CANONICAL_DISH_KIND_IDS.has(kindId)) {
    return kindId as TbaCanonicalDishKindId;
  }

  return DISH_KIND_ALIAS_TO_CANONICAL[kindId] ?? null;
}

function getStatusHumanReviewConfidence(entry: TbaCoreTasteLexiconEntry) {
  if (entry.status === 'active') {
    return 1;
  }

  if (entry.status === 'human-reviewed') {
    return 0.86;
  }

  return 0;
}

export function normalizeLexiconDishKindAffinity(entry: TbaCoreTasteLexiconEntry): TbaLexiconDishKindAffinity {
  const normalized: TbaLexiconDishKindAffinity = {};

  Object.entries(entry.dishKindAffinity).forEach(([rawKindId, rawScore]) => {
    const canonicalKindId = getCanonicalDishKindId(rawKindId);

    if (!canonicalKindId || typeof rawScore !== 'number' || Number.isNaN(rawScore)) {
      return;
    }

    normalized[canonicalKindId] = Math.max(normalized[canonicalKindId] ?? 0, clamp(rawScore));
  });

  return normalized;
}

export function getLexiconDishKindScore(
  entry: TbaCoreTasteLexiconEntry,
  dishKindIds: readonly string[] = [],
) {
  if (dishKindIds.length === 0) {
    return 0;
  }

  const normalizedAffinity = normalizeLexiconDishKindAffinity(entry);

  return dishKindIds.reduce((maxScore, kindId) => {
    const canonicalKindId = getCanonicalDishKindId(kindId);

    if (!canonicalKindId) {
      return maxScore;
    }

    return Math.max(maxScore, normalizedAffinity[canonicalKindId] ?? 0);
  }, 0);
}

export function calculateLexiconConfidence(
  entry: TbaCoreTasteLexiconEntry,
  context: TbaLexiconConfidenceContext = {},
) {
  if (entry.status === 'retired') {
    return 0;
  }

  const dishKindScore = getLexiconDishKindScore(entry, context.dishKindIds);
  const foodMappingConfidence = context.foodMappingConfidence ?? dishKindScore;
  const humanReviewConfidence = context.humanReviewConfidence ?? getStatusHumanReviewConfidence(entry);
  const appFeedbackConfidence = context.appFeedbackConfidence ?? 0;

  return clamp(
    entry.initialConfidence +
      dishKindScore * 0.16 +
      foodMappingConfidence * 0.12 +
      humanReviewConfidence * 0.12 +
      appFeedbackConfidence * 0.18,
  );
}

export function canUseLexiconForSurface(
  entry: TbaCoreTasteLexiconEntry,
  surface: TbaKnowledgeSurface,
  context: TbaLexiconConfidenceContext = {},
) {
  if (entry.status === 'retired') {
    return false;
  }

  const dishKindScore = getLexiconDishKindScore(entry, context.dishKindIds);
  const confidence = calculateLexiconConfidence(entry, context);

  switch (surface) {
    case 'taste-bubble':
      return entry.initialConfidence >= 0.42;
    case 'detail-tag':
      return entry.initialConfidence >= 0.5 || entry.initialConfidence + dishKindScore * 0.16 >= 0.5;
    case 'dining-note':
      return entry.initialConfidence >= 0.42;
    case 'recommendation':
      return confidence >= 0.72;
    case 'chef-guide':
      return (entry.status === 'human-reviewed' || entry.status === 'active') && confidence >= 0.78;
    case 'tcs':
      return false;
    default:
      return false;
  }
}

export function rankLexiconForDishKinds(
  entries: readonly TbaCoreTasteLexiconEntry[],
  dishKindIds: readonly string[],
  options: TbaLexiconRankOptions = {},
): TbaRankedLexiconCandidate[] {
  const surface = options.surface ?? 'taste-bubble';

  const ranked = entries
    .map((entry) => {
      const context: TbaLexiconConfidenceContext = {
        appFeedbackConfidence: options.appFeedbackConfidence,
        dishKindIds,
        evidenceCount: options.evidenceCount,
        foodMappingConfidence: options.foodMappingConfidence,
        humanReviewConfidence: options.humanReviewConfidence,
      };
      const normalizedDishKindAffinity = normalizeLexiconDishKindAffinity(entry);
      const dishKindScore = getLexiconDishKindScore(entry, dishKindIds);
      const confidence = calculateLexiconConfidence(entry, context);
      const usable = canUseLexiconForSurface(entry, surface, context);

      return {
        confidence,
        dishKindScore,
        entry,
        normalizedDishKindAffinity,
        usable,
      };
    })
    .filter((candidate) => options.includeBlocked || candidate.usable)
    .sort((left, right) => (
      right.dishKindScore - left.dishKindScore ||
      right.confidence - left.confidence ||
      left.entry.label.localeCompare(right.entry.label, 'ko')
    ));

  return typeof options.limit === 'number' ? ranked.slice(0, options.limit) : ranked;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[·,./|()[\]{}'"`~!?]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function compactText(value: string) {
  return normalizeText(value).replace(/\s+/g, '');
}

function getLexiconTextScore(entry: TbaCoreTasteLexiconEntry, sourceTexts: readonly string[]) {
  if (sourceTexts.length === 0) {
    return 0;
  }

  const normalizedSources = sourceTexts.map(normalizeText).filter(Boolean);
  const compactSources = sourceTexts.map(compactText).filter(Boolean);
  const candidates = [
    { label: entry.label, score: 1 },
    ...entry.aliases.map((alias) => ({ label: alias, score: 0.9 })),
    { label: entry.id.replace(/-/g, ' '), score: 0.64 },
  ];

  return candidates.reduce((maxScore, candidate) => {
    const normalizedCandidate = normalizeText(candidate.label);
    const compactCandidate = compactText(candidate.label);

    if (!normalizedCandidate) {
      return maxScore;
    }

    const hasMatch = normalizedSources.some((source) => (
      source === normalizedCandidate ||
      source.includes(normalizedCandidate) ||
      normalizedCandidate.includes(source)
    )) || compactSources.some((source) => (
      source === compactCandidate ||
      source.includes(compactCandidate) ||
      compactCandidate.includes(source)
    ));

    return hasMatch ? Math.max(maxScore, candidate.score) : maxScore;
  }, 0);
}

function getReviewerProfileScore(
  entry: TbaCoreTasteLexiconEntry,
  profile: TbaDiningNoteLexiconMapperInput['reviewerProfile'],
) {
  if (!profile) {
    return 0;
  }

  let scoreSum = 0;
  let weightSum = 0;

  Object.entries(entry.tasteVector).forEach(([tasteId, weight]) => {
    if (typeof weight !== 'number' || weight <= 0) {
      return;
    }

    scoreSum += (profile.tasteVector[tasteId as TasteId] ?? 0.5) * weight;
    weightSum += weight;
  });

  Object.entries(entry.perceptualVector).forEach(([axis, weight]) => {
    if (typeof weight !== 'number' || weight <= 0) {
      return;
    }

    scoreSum += (profile.perceptualVector[axis as PerceptualAxis] ?? 0.5) * weight;
    weightSum += weight;
  });

  return weightSum > 0 ? clamp(scoreSum / weightSum) : 0;
}

function weightedAverageVector<TAxis extends string>(
  axes: readonly TAxis[],
  candidates: readonly TbaDiningNoteLexiconCandidate[],
  getVector: (entry: TbaCoreTasteLexiconEntry) => Partial<Record<TAxis, number>>,
) {
  const result: Partial<Record<TAxis, number>> = {};
  const weightSum = candidates.reduce((sum, candidate) => sum + candidate.score, 0);

  if (weightSum <= 0) {
    return result;
  }

  axes.forEach((axis) => {
    const value = candidates.reduce((sum, candidate) => (
      sum + (getVector(candidate.entry)[axis] ?? 0) * candidate.score
    ), 0) / weightSum;

    if (Math.abs(value) > 0.001) {
      result[axis] = Number(clampSigned(value).toFixed(3));
    }
  });

  return result;
}

function pushUniqueLabel(labels: string[], label: string, limit: number) {
  if (labels.length >= limit || labels.includes(label)) {
    return;
  }

  labels.push(label);
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getFoodOnLexiconScore(
  entry: TbaCoreTasteLexiconEntry,
  matches: readonly TbaFoodOntologyMatch[],
) {
  const signalId = `lexicon:${entry.id}`;

  return matches.reduce((maxScore, match) => (
    match.entry.tbaSignalIds.includes(signalId)
      ? Math.max(maxScore, match.score)
      : maxScore
  ), 0);
}

function getFoodKnowledgeLexiconScore(
  entry: TbaCoreTasteLexiconEntry,
  matches: readonly TbaFoodKnowledgeRankedCandidate[],
) {
  const signalId = `lexicon:${entry.id}`;

  return matches.reduce((maxScore, match) => (
    match.entry.lexiconIds.includes(entry.id) ||
    match.entry.lexiconIds.includes(signalId)
      ? Math.max(maxScore, match.score)
      : maxScore
  ), 0);
}

export function mapCoreTasteLexiconSignalsForDiningNote({
  detailTags,
  dishKindTags = [],
  entries = TBA_CORE_TASTE_LEXICON,
  foodKnowledgeEntries = [],
  ingredients = [],
  reviewerProfile,
  subject,
  tasteTags,
  techniques = [],
}: TbaDiningNoteLexiconMapperInput): TbaDiningNoteLexiconMapping {
  const foodOnMapping = mapFoodOnBridgeInput({
    dishKindTags,
    ingredients,
    menuText: [
      subject,
      ...tasteTags,
      ...detailTags,
    ].filter(Boolean).join(' '),
    techniques,
  });
  const baseSourceTexts = [
    subject,
    ...tasteTags,
    ...detailTags,
    ...ingredients,
    ...techniques,
  ].filter((value): value is string => Boolean(value?.trim()));
  const foodKnowledgeMatches = rankTbaFoodKnowledgeEntries(
    foodKnowledgeEntries,
    baseSourceTexts.join(' '),
    {
      limit: 10,
      surface: 'dining-note',
    },
  );
  const foodOnDishKindTags = foodOnMapping.matches.flatMap((match) => match.entry.dishKindIds);
  const foodKnowledgeDishKindTags = foodKnowledgeMatches.flatMap((match) => match.entry.dishKindIds);
  const mappedLexiconLabels = foodOnMapping.matches.flatMap((match) => [
    match.matchedAlias ?? '',
    match.entry.koName,
    match.entry.canonicalName,
    ...match.entry.tbaSignalIds
      .filter((signalId) => signalId.startsWith('lexicon:'))
      .map((signalId) => signalId.replace(/^lexicon:/, '').replace(/-/g, ' ')),
  ]);
  const mappedFoodKnowledgeLabels = foodKnowledgeMatches.flatMap((match) => [
    match.entry.koName,
    match.entry.canonicalName,
    match.entry.foodGroup,
    ...match.entry.aliases,
    ...match.entry.lexiconIds.map((lexiconId) => lexiconId.replace(/^lexicon:/, '').replace(/-/g, ' ')),
  ]);
  const resolvedDishKindTags = uniqueStrings([...dishKindTags, ...foodOnDishKindTags, ...foodKnowledgeDishKindTags]);
  const sourceTexts = [
    ...baseSourceTexts,
    ...mappedLexiconLabels,
    ...mappedFoodKnowledgeLabels,
  ].filter((value): value is string => Boolean(value?.trim()));
  const lexiconCandidates = rankLexiconForDishKinds(entries, resolvedDishKindTags, {
    includeBlocked: true,
    surface: 'dining-note',
  })
    .map((candidate): TbaDiningNoteLexiconCandidate => {
      const textScore = getLexiconTextScore(candidate.entry, sourceTexts);
      const foodOnScore = getFoodOnLexiconScore(candidate.entry, foodOnMapping.matches);
      const foodKnowledgeScore = getFoodKnowledgeLexiconScore(candidate.entry, foodKnowledgeMatches);
      const profileScore = getReviewerProfileScore(candidate.entry, reviewerProfile);
      const confidence = clamp(
        candidate.confidence +
          textScore * 0.2 +
          foodOnScore * 0.12 +
          foodKnowledgeScore * 0.1 +
          profileScore * 0.06,
      );
      const score = clamp(
        candidate.dishKindScore * 0.3 +
          textScore * 0.38 +
          foodOnScore * 0.18 +
          foodKnowledgeScore * 0.18 +
          confidence * 0.1 +
          profileScore * 0.06,
      );

      return {
        ...candidate,
        confidence,
        foodKnowledgeScore,
        foodOnScore,
        profileScore,
        score,
        textScore,
      };
    })
    .filter((candidate) => (
      candidate.usable &&
      candidate.entry.status !== 'retired' &&
      (
        candidate.dishKindScore > 0 ||
        candidate.textScore > 0 ||
        candidate.foodOnScore > 0 ||
        candidate.foodKnowledgeScore > 0
      )
    ))
    .sort((left, right) => (
      right.score - left.score ||
      right.textScore - left.textScore ||
      right.dishKindScore - left.dishKindScore ||
      left.entry.label.localeCompare(right.entry.label, 'ko')
    ))
    .slice(0, 8);

  const tasteBubbleLabels: string[] = [];
  const detailTagLabels: string[] = [];

  lexiconCandidates.forEach((candidate) => {
    if (
      candidate.entry.category === 'taste' ||
      candidate.entry.category === 'ingredient' ||
      candidate.entry.category === 'composition'
    ) {
      pushUniqueLabel(tasteBubbleLabels, candidate.entry.label, 3);
    }

    if (
      candidate.entry.category === 'finish' ||
      candidate.entry.category === 'texture' ||
      candidate.entry.category === 'aroma' ||
      candidate.entry.category === 'process' ||
      candidate.entry.category === 'composition'
    ) {
      pushUniqueLabel(detailTagLabels, candidate.entry.label, 6);
    }
  });
  const feedbackSignalMapping = mapFeedbackInputToTbaSignals({
    detailTags,
    dishKindTags: resolvedDishKindTags,
    lexiconIds: lexiconCandidates.map((candidate) => candidate.entry.id),
    tasteTags,
  });

  return {
    confidence: lexiconCandidates.length
      ? Number((lexiconCandidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / lexiconCandidates.length).toFixed(3))
      : 0,
    detailTagLabels,
    foodKnowledgeMatches,
    foodOnMatches: foodOnMapping.matches,
    lexiconCandidates,
    perceptualVector: weightedAverageVector(PERCEPTUAL_AXES, lexiconCandidates, (entry) => entry.perceptualVector),
    tbaSignalIds: uniqueStrings([
      ...foodOnMapping.tbaSignalIds,
      ...foodKnowledgeMatches.flatMap((match) => [
        ...match.entry.ingredientSignalIds,
        ...match.entry.processSignalIds,
        ...match.entry.lexiconIds.map((lexiconId) => lexiconId.startsWith('lexicon:') ? lexiconId : `lexicon:${lexiconId}`),
        ...match.entry.dishKindIds.map((dishKindId) => `dish-kind:${dishKindId}`),
      ]),
      ...feedbackSignalMapping.mappedSignals.map((signal) => signal.definition.id),
    ]),
    tasteBubbleLabels,
    tasteVector: weightedAverageVector(TASTE_IDS, lexiconCandidates, (entry) => entry.tasteVector),
  };
}
