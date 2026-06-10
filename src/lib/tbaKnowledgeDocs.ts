import { TBA_CORE_TASTE_LEXICON } from '../constants/tbaCoreTasteLexicon';
import { getDishKindLabel } from '../constants/dishKindTags';
import { TBA_FOODON_BRIDGE_ENTRIES } from '../constants/tbaFoodOnBridge';
import { TASTE_IDS, type TasteId } from '../constants/designTokens';
import type {
  TbaCanonicalDishKindId,
  TbaCoreTasteLexiconEntry,
  TbaKnowledgeDoc,
  TbaKnowledgeMatchedSignal,
  TbaKnowledgeRetrievalCandidate,
  TbaKnowledgeRetrievalInput,
  TbaKnowledgeRetrievalResult,
  TbaKnowledgeSurface,
} from '../types/tasteBuddyKnowledge';
import {
  PERCEPTUAL_AXES,
  type PerceptualAxis,
} from '../types/tastePersonalization';
import {
  calculateLexiconConfidence,
  normalizeLexiconDishKindAffinity,
} from './tbaKnowledge';
import { mapFoodOnBridgeInput } from './tbaFoodOnMapping';
import type {
  TbaFoodOntologyBridgeEntry,
  TbaFoodOntologyMatch,
} from '../types/tbaFoodOntology';

export const TBA_KNOWLEDGE_DOC_VERSION = '0.1';
export const TBA_KNOWLEDGE_DOC_UPDATED_AT = '2026-06-01T00:00:00.000Z';

interface BuildKnowledgeDocOptions {
  appFeedbackConfidence?: number;
  updatedAt?: string;
  version?: string;
}

interface FilterKnowledgeDocsOptions {
  dishKindIds?: readonly string[];
  minDishKindScore?: number;
}

interface RankKnowledgeDocsOptions extends FilterKnowledgeDocsOptions {
  limit?: number;
  surface?: TbaKnowledgeSurface;
}

function roundConfidence(value: number) {
  return Number(Math.min(1, Math.max(0, value)).toFixed(3));
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

function tokenizeText(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function getHumanReviewConfidence(entry: TbaCoreTasteLexiconEntry) {
  if (entry.status === 'active') {
    return 1;
  }

  if (entry.status === 'human-reviewed') {
    return 0.86;
  }

  return 0;
}

function getMaxDishKindAffinity(affinity: TbaKnowledgeDoc['dishKindAffinity'], dishKindIds?: readonly string[]) {
  const scopedKindIds = dishKindIds?.length
    ? dishKindIds.filter((kindId): kindId is TbaCanonicalDishKindId => kindId in affinity)
    : Object.keys(affinity) as TbaCanonicalDishKindId[];

  return scopedKindIds.reduce((maxScore, kindId) => Math.max(maxScore, affinity[kindId] ?? 0), 0);
}

function getDishKindMatchedSignals(
  doc: TbaKnowledgeDoc,
  dishKindIds: readonly string[] = [],
): TbaKnowledgeMatchedSignal[] {
  return dishKindIds
    .map((kindId) => ({
      kind: 'dish-kind' as const,
      label: getDishKindLabel(kindId),
      score: doc.dishKindAffinity[kindId as TbaCanonicalDishKindId] ?? 0,
    }))
    .filter((signal) => signal.score > 0)
    .sort((left, right) => right.score - left.score);
}

function getTextMatchScore(doc: TbaKnowledgeDoc, sourceText: string) {
  const normalizedSource = normalizeText(sourceText);
  const compactSource = compactText(sourceText);

  if (!normalizedSource) {
    return 0;
  }

  const exactLabels = [
    doc.title,
    ...doc.aliases,
    ...doc.ingredientHints,
    ...doc.processHints,
    ...doc.lexiconIds,
  ];
  const exactScore = exactLabels.reduce((maxScore, label) => {
    const normalizedLabel = normalizeText(label);
    const compactLabel = compactText(label);

    if (!normalizedLabel) {
      return maxScore;
    }

    if (normalizedSource === normalizedLabel || compactSource === compactLabel) {
      return Math.max(maxScore, 1);
    }

    if (
      normalizedSource.includes(normalizedLabel) ||
      normalizedLabel.includes(normalizedSource) ||
      compactSource.includes(compactLabel) ||
      compactLabel.includes(compactSource)
    ) {
      return Math.max(maxScore, 0.86);
    }

    return maxScore;
  }, 0);

  if (exactScore > 0) {
    return exactScore;
  }

  const docText = normalizeText(doc.searchableText);
  const sourceTokens = tokenizeText(sourceText);

  if (!docText || sourceTokens.length === 0) {
    return 0;
  }

  const matchedCount = sourceTokens.filter((token) => docText.includes(token)).length;

  return Math.min(0.64, matchedCount / Math.max(4, sourceTokens.length));
}

function getTextMatchedSignals({
  detailTags = [],
  doc,
  queryText,
  tasteTags = [],
}: {
  detailTags?: readonly string[];
  doc: TbaKnowledgeDoc;
  queryText?: string;
  tasteTags?: readonly string[];
}): TbaKnowledgeMatchedSignal[] {
  const signals: TbaKnowledgeMatchedSignal[] = [];

  if (queryText) {
    const score = getTextMatchScore(doc, queryText);

    if (score > 0) {
      signals.push({ kind: 'query', label: queryText, score });
    }
  }

  tasteTags.forEach((tag) => {
    const score = getTextMatchScore(doc, tag);

    if (score > 0) {
      signals.push({ kind: 'taste-tag', label: tag, score });
    }
  });

  detailTags.forEach((tag) => {
    const score = getTextMatchScore(doc, tag);

    if (score > 0) {
      signals.push({ kind: 'detail-tag', label: tag, score });
    }
  });

  return signals.sort((left, right) => right.score - left.score);
}

function getProfileAxisScore(value: number | undefined, weight: number) {
  const normalizedValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0.5;

  return weight >= 0 ? normalizedValue * weight : (1 - normalizedValue) * Math.abs(weight);
}

function getReviewerProfileScore(
  doc: TbaKnowledgeDoc,
  profile: TbaKnowledgeRetrievalInput['reviewerProfile'],
) {
  if (!profile) {
    return 0;
  }

  let scoreSum = 0;
  let weightSum = 0;

  TASTE_IDS.forEach((tasteId: TasteId) => {
    const weight = doc.tasteVector[tasteId] ?? 0;
    const absoluteWeight = Math.abs(weight);

    if (absoluteWeight <= 0) {
      return;
    }

    scoreSum += getProfileAxisScore(profile.tasteVector[tasteId], weight);
    weightSum += absoluteWeight;
  });

  PERCEPTUAL_AXES.forEach((axis: PerceptualAxis) => {
    const weight = doc.perceptualVector[axis] ?? 0;
    const absoluteWeight = Math.abs(weight);

    if (absoluteWeight <= 0) {
      return;
    }

    scoreSum += getProfileAxisScore(profile.perceptualVector[axis], weight);
    weightSum += absoluteWeight;
  });

  return weightSum > 0 ? roundConfidence(scoreSum / weightSum) : 0;
}

function getProfileMatchedSignal(profileScore: number): TbaKnowledgeMatchedSignal[] {
  if (profileScore < 0.62) {
    return [];
  }

  return [{
    kind: 'profile',
    label: '작성자 미각 프로필',
    score: profileScore,
  }];
}

function getFoodOnMatchedSignals(
  doc: TbaKnowledgeDoc,
  matches: readonly TbaFoodOntologyMatch[],
): TbaKnowledgeMatchedSignal[] {
  const docText = normalizeText(doc.searchableText);

  return matches
    .map((match): TbaKnowledgeMatchedSignal | null => {
      const taxonomyId = getFoodOnTaxonomyId(match.entry);
      const lexiconIds = match.entry.tbaSignalIds
        .filter((signalId) => signalId.startsWith('lexicon:'))
        .map((signalId) => signalId.replace(/^lexicon:/, ''));
      const hasDirectTaxonomyMatch = doc.ingredientTaxonomyIds.includes(taxonomyId) ||
        doc.processTaxonomyIds.includes(taxonomyId);
      const hasLexiconMatch = lexiconIds.some((lexiconId) => doc.lexiconIds.includes(lexiconId));
      const hasTextMatch = [
        match.entry.koName,
        match.entry.canonicalName,
        match.matchedAlias ?? '',
      ].some((label) => {
        const normalizedLabel = normalizeText(label);

        return normalizedLabel && docText.includes(normalizedLabel);
      });

      if (!hasDirectTaxonomyMatch && !hasLexiconMatch && !hasTextMatch) {
        return null;
      }

      return {
        kind: 'foodon',
        label: match.entry.koName,
        score: match.score,
      };
    })
    .filter((signal): signal is TbaKnowledgeMatchedSignal => Boolean(signal))
    .sort((left, right) => (
      right.score - left.score ||
      left.label.localeCompare(right.label, 'ko')
    ));
}

function getMaxTextScore(signals: readonly TbaKnowledgeMatchedSignal[]) {
  return signals.reduce((maxScore, signal) => (
    signal.kind === 'query' || signal.kind === 'taste-tag' || signal.kind === 'detail-tag' || signal.kind === 'foodon'
      ? Math.max(maxScore, signal.score)
      : maxScore
  ), 0);
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getFoodOnBridgeEntriesForLexicon(lexiconId: string) {
  const signalId = `lexicon:${lexiconId}`;

  return TBA_FOODON_BRIDGE_ENTRIES.filter((entry) => entry.tbaSignalIds.includes(signalId));
}

function getFoodOnTaxonomyId(entry: TbaFoodOntologyBridgeEntry) {
  return entry.foodOnIri ?? entry.id;
}

function getFoodOnHintsByKind(
  foodOnEntries: readonly TbaFoodOntologyBridgeEntry[],
  kind: TbaFoodOntologyBridgeEntry['kind'],
) {
  return foodOnEntries
    .filter((entry) => entry.kind === kind)
    .flatMap((entry) => [
      entry.koName,
      entry.canonicalName,
      ...entry.aliases,
    ]);
}

function buildSearchableText(
  entry: TbaCoreTasteLexiconEntry,
  dishKindIds: readonly string[],
  foodOnEntries: readonly TbaFoodOntologyBridgeEntry[],
) {
  return [
    entry.id,
    entry.label,
    ...entry.aliases,
    entry.category,
    entry.summary,
    ...dishKindIds,
    ...foodOnEntries.flatMap((foodOnEntry) => [
      foodOnEntry.id,
      foodOnEntry.koName,
      foodOnEntry.canonicalName,
      foodOnEntry.description,
      foodOnEntry.familyId ?? '',
      foodOnEntry.foodOnIri ?? '',
      ...foodOnEntry.aliases,
      ...foodOnEntry.tbaSignalIds,
    ]),
    ...(entry.foodOnHints ?? []),
    ...(entry.recipeNlgTechniqueHints ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function buildKnowledgeDocFromLexicon(
  entry: TbaCoreTasteLexiconEntry,
  options: BuildKnowledgeDocOptions = {},
): TbaKnowledgeDoc {
  const foodOnEntries = getFoodOnBridgeEntriesForLexicon(entry.id);
  const dishKindAffinity = normalizeLexiconDishKindAffinity(entry);
  foodOnEntries.forEach((foodOnEntry) => {
    foodOnEntry.dishKindIds.forEach((dishKindId) => {
      dishKindAffinity[dishKindId] = Math.max(dishKindAffinity[dishKindId] ?? 0, 0.62);
    });
  });
  const dishKindIds = Object.keys(dishKindAffinity) as TbaCanonicalDishKindId[];
  const foodMappingConfidence = Math.max(
    getMaxDishKindAffinity(dishKindAffinity),
    foodOnEntries.length ? 0.72 : 0,
  );
  const humanReviewConfidence = getHumanReviewConfidence(entry);
  const appFeedbackConfidence = options.appFeedbackConfidence ?? 0;
  const combinedConfidence = calculateLexiconConfidence(entry, {
    appFeedbackConfidence,
    dishKindIds,
    foodMappingConfidence,
    humanReviewConfidence,
  });

  return {
    aliases: entry.aliases,
    category: entry.category,
    confidence: {
      appFeedback: roundConfidence(appFeedbackConfidence),
      combined: roundConfidence(combinedConfidence),
      foodMapping: roundConfidence(foodMappingConfidence),
      humanReview: roundConfidence(humanReviewConfidence),
      lexicon: roundConfidence(entry.initialConfidence),
    },
    dishKindAffinity,
    dishKindIds,
    docType: 'core-taste-lexicon',
    id: `core-taste-lexicon:${entry.id}`,
    ingredientHints: uniqueStrings([
      ...(entry.foodOnHints ?? []),
      ...getFoodOnHintsByKind(foodOnEntries, 'ingredient'),
      ...getFoodOnHintsByKind(foodOnEntries, 'product-category'),
    ]),
    ingredientTaxonomyIds: uniqueStrings(
      foodOnEntries
        .filter((foodOnEntry) => foodOnEntry.kind === 'ingredient' || foodOnEntry.kind === 'product-category')
        .map(getFoodOnTaxonomyId),
    ),
    lexiconIds: [entry.id],
    perceptualVector: entry.perceptualVector,
    polarity: entry.polarity,
    primaryLexiconId: entry.id,
    processHints: uniqueStrings([
      ...(entry.recipeNlgTechniqueHints ?? []),
      ...getFoodOnHintsByKind(foodOnEntries, 'process'),
    ]),
    processTaxonomyIds: uniqueStrings(
      foodOnEntries
        .filter((foodOnEntry) => foodOnEntry.kind === 'process')
        .map(getFoodOnTaxonomyId),
    ),
    searchableText: buildSearchableText(entry, dishKindIds, foodOnEntries),
    sourceNotes: uniqueStrings([
      ...entry.sourceNotes,
      ...(foodOnEntries.length ? ['foodon-taxonomy'] : []),
    ]) as TbaKnowledgeDoc['sourceNotes'],
    status: entry.status,
    summary: entry.summary,
    surfaces: entry.surfaces,
    tasteVector: entry.tasteVector,
    title: entry.label,
    updatedAt: options.updatedAt ?? TBA_KNOWLEDGE_DOC_UPDATED_AT,
    version: options.version ?? TBA_KNOWLEDGE_DOC_VERSION,
  };
}

export function buildCoreTasteKnowledgeDocs(
  entries: readonly TbaCoreTasteLexiconEntry[] = TBA_CORE_TASTE_LEXICON,
  options: BuildKnowledgeDocOptions = {},
) {
  return entries.map((entry) => buildKnowledgeDocFromLexicon(entry, options));
}

export function canUseKnowledgeDocForSurface(
  doc: TbaKnowledgeDoc,
  surface: TbaKnowledgeSurface,
  options: FilterKnowledgeDocsOptions = {},
) {
  if (doc.status === 'retired') {
    return false;
  }

  if (options.dishKindIds?.length) {
    const dishKindScore = getMaxDishKindAffinity(doc.dishKindAffinity, options.dishKindIds);

    if (dishKindScore < (options.minDishKindScore ?? 0)) {
      return false;
    }
  }

  switch (surface) {
    case 'taste-bubble':
      return doc.confidence.lexicon >= 0.42;
    case 'detail-tag':
      return doc.confidence.lexicon >= 0.5 || doc.confidence.foodMapping >= 0.5;
    case 'dining-note':
      return doc.confidence.lexicon >= 0.42;
    case 'recommendation':
      return doc.confidence.combined >= 0.72;
    case 'chef-guide':
      return (doc.status === 'human-reviewed' || doc.status === 'active') && doc.confidence.combined >= 0.78;
    case 'tcs':
      return false;
    default:
      return false;
  }
}

export function filterKnowledgeDocsForSurface(
  docs: readonly TbaKnowledgeDoc[],
  surface: TbaKnowledgeSurface,
  options: FilterKnowledgeDocsOptions = {},
) {
  return docs.filter((doc) => canUseKnowledgeDocForSurface(doc, surface, options));
}

export function rankKnowledgeDocsForDishKinds(
  docs: readonly TbaKnowledgeDoc[],
  dishKindIds: readonly string[],
  options: RankKnowledgeDocsOptions = {},
) {
  const surface = options.surface ?? 'dining-note';

  return filterKnowledgeDocsForSurface(docs, surface, {
    dishKindIds,
    minDishKindScore: options.minDishKindScore,
  })
    .map((doc) => {
      const dishKindScore = getMaxDishKindAffinity(doc.dishKindAffinity, dishKindIds);
      const score = roundConfidence(dishKindScore * 0.62 + doc.confidence.combined * 0.38);

      return {
        dishKindScore,
        doc,
        score,
      };
    })
    .sort((left, right) => (
      right.score - left.score ||
      right.dishKindScore - left.dishKindScore ||
      right.doc.confidence.combined - left.doc.confidence.combined ||
      left.doc.title.localeCompare(right.doc.title, 'ko')
    ))
    .slice(0, options.limit ?? docs.length);
}

export function retrieveTbaKnowledgeDocs({
  detailTags = [],
  dishKindTags = [],
  docs = TBA_CORE_TASTE_KNOWLEDGE_DOCS,
  ingredients = [],
  limit = 8,
  minScore = 0.18,
  queryText = '',
  reviewerProfile,
  surface = 'dining-note',
  tasteTags = [],
  techniques = [],
}: TbaKnowledgeRetrievalInput = {}): TbaKnowledgeRetrievalResult {
  const foodOnMapping = mapFoodOnBridgeInput({
    dishKindTags,
    ingredients,
    menuText: [queryText, ...tasteTags, ...detailTags].filter(Boolean).join(' '),
    techniques,
  });
  const resolvedDishKindTags = uniqueStrings([
    ...dishKindTags,
    ...foodOnMapping.matches.flatMap((match) => match.entry.dishKindIds),
  ]);
  const querySignals = [queryText, ...tasteTags, ...detailTags, ...ingredients, ...techniques]
    .map((value) => value.trim())
    .filter(Boolean);
  const hasExplicitInput = querySignals.length > 0 || resolvedDishKindTags.length > 0 || foodOnMapping.matches.length > 0;

  if (!hasExplicitInput && !reviewerProfile) {
    return {
      candidates: [],
      queryText,
      surface,
    };
  }

  const candidates = filterKnowledgeDocsForSurface(docs, surface)
    .map((doc): TbaKnowledgeRetrievalCandidate => {
      const dishKindSignals = getDishKindMatchedSignals(doc, resolvedDishKindTags);
      const textSignals = getTextMatchedSignals({
        detailTags,
        doc,
        queryText,
        tasteTags,
      });
      const foodOnSignals = getFoodOnMatchedSignals(doc, foodOnMapping.matches);
      const profileScore = getReviewerProfileScore(doc, reviewerProfile);
      const profileSignals = getProfileMatchedSignal(profileScore);
      const matchedSignals = [...textSignals, ...foodOnSignals, ...dishKindSignals, ...profileSignals]
        .sort((left, right) => right.score - left.score)
        .slice(0, 8);
      const dishKindScore = dishKindSignals[0]?.score ?? 0;
      const textScore = getMaxTextScore(textSignals);
      const foodOnScore = getMaxTextScore(foodOnSignals);
      const confidence = doc.confidence.combined;
      const score = roundConfidence(
        textScore * 0.34 +
          dishKindScore * 0.28 +
          foodOnScore * 0.16 +
          confidence * 0.12 +
          profileScore * 0.1,
      );

      return {
        confidence,
        dishKindScore,
        doc,
        matchedSignals,
        profileScore,
        score,
        textScore,
      };
    })
    .filter((candidate) => (
      candidate.score >= minScore &&
      (
        candidate.textScore > 0 ||
        candidate.dishKindScore > 0 ||
        candidate.matchedSignals.some((signal) => signal.kind === 'foodon') ||
        candidate.profileScore >= 0.62
      )
    ))
    .sort((left, right) => (
      right.score - left.score ||
      right.textScore - left.textScore ||
      right.dishKindScore - left.dishKindScore ||
      right.confidence - left.confidence ||
      left.doc.title.localeCompare(right.doc.title, 'ko')
    ))
    .slice(0, limit);

  return {
    candidates,
    queryText,
    surface,
  };
}

export const TBA_CORE_TASTE_KNOWLEDGE_DOCS = buildCoreTasteKnowledgeDocs();
