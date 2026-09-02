import type {
  TbaFoodKnowledgeEntry,
  TbaFoodKnowledgeRankedCandidate,
  TbaFoodKnowledgeSurface,
} from '../types/tbaFoodOntology';
import { inferDishKindIds } from '../constants/dishKindTags';
import { findTbaSignalDefinitionsByText, normalizeSignalText } from './tbaSignalMapping';

const SURFACE_CONFIDENCE_THRESHOLDS: Readonly<Record<TbaFoodKnowledgeSurface, number>> = {
  'taste-bubble': 0.45,
  'detail-tag': 0.45,
  'dining-note': 0.5,
  recommendation: 0.72,
  'chef-guide': 0.78,
  tcs: 0.5,
};

interface RankTbaFoodKnowledgeOptions {
  limit?: number;
  surface?: TbaFoodKnowledgeSurface;
}

export interface TbaMenuContextInference {
  confidence: number;
  dishKindIds: string[];
  foodKnowledgeMatchIds: string[];
  ingredients: string[];
  techniques: string[];
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[·,./|()[\]{}'"`~!?+<>]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function uniqueStrings(values: readonly string[], limit = Number.POSITIVE_INFINITY) {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeSignalText(value);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function getMenuNameScore(entry: TbaFoodKnowledgeEntry, menuName: string) {
  const normalizedMenuName = normalizeText(menuName);
  const compactMenuName = normalizedMenuName.replace(/\s+/g, '');

  if (!normalizedMenuName) {
    return 0;
  }

  return [entry.koName, entry.canonicalName, ...entry.aliases]
    .map((label) => normalizeText(label))
    .filter(Boolean)
    .reduce((maxScore, label) => {
      const compactLabel = label.replace(/\s+/g, '');

      if (label === normalizedMenuName || compactLabel === compactMenuName) {
        return Math.max(maxScore, 1);
      }

      if (
        normalizedMenuName.includes(label) ||
        label.includes(normalizedMenuName) ||
        compactMenuName.includes(compactLabel) ||
        compactLabel.includes(compactMenuName)
      ) {
        return Math.max(maxScore, 0.86);
      }

      return maxScore;
    }, 0);
}

function getStrongSignalMatches(menuName: string, domain: 'ingredient-kind' | 'cooking-process') {
  const matches = findTbaSignalDefinitionsByText(menuName, {
    domains: [domain],
    limit: 8,
    minScore: 0.82,
  });
  const strongestByAlias = new Map<string, typeof matches[number]>();

  matches.forEach((match) => {
    const aliasKey = normalizeSignalText(match.matchedAlias ?? match.definition.label);
    const existing = strongestByAlias.get(aliasKey);

    if (
      !existing ||
      match.score > existing.score ||
      (
        match.score === existing.score &&
        match.definition.confidence > existing.definition.confidence
      )
    ) {
      strongestByAlias.set(aliasKey, match);
    }
  });

  return [...strongestByAlias.values()]
    .sort((left, right) => (
      right.score - left.score ||
      right.definition.confidence - left.definition.confidence
    ))
    .slice(0, 4);
}

function getTextScore(entry: TbaFoodKnowledgeEntry, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const labels = [
    entry.koName,
    entry.canonicalName,
    entry.foodGroup,
    ...entry.aliases,
    ...entry.dishKindIds,
    ...entry.ingredientSignalIds,
    ...entry.processSignalIds,
  ].map(normalizeText).filter(Boolean);

  return labels.reduce((maxScore, label) => {
    if (normalizedQuery === label || normalizedQuery.includes(label) || label.includes(normalizedQuery)) {
      return Math.max(maxScore, 1);
    }

    const labelTokens = label.split(/\s+/).filter((token) => token.length >= 3);
    const matchedTokenCount = labelTokens.filter((token) => normalizedQuery.includes(token)).length;

    return Math.max(maxScore, matchedTokenCount > 0 ? Math.min(0.68, matchedTokenCount / Math.max(4, labelTokens.length)) : 0);
  }, 0);
}

export function canUseTbaFoodKnowledgeForSurface(
  entry: TbaFoodKnowledgeEntry,
  surface: TbaFoodKnowledgeSurface,
) {
  if (entry.status === 'retired') {
    return false;
  }

  if (surface === 'chef-guide') {
    return (
      entry.confidence >= SURFACE_CONFIDENCE_THRESHOLDS[surface] &&
      (entry.status === 'active' || entry.status === 'human-reviewed')
    );
  }

  return entry.confidence >= SURFACE_CONFIDENCE_THRESHOLDS[surface];
}

export function getTbaFoodKnowledgeSurfaceThreshold(surface: TbaFoodKnowledgeSurface) {
  return SURFACE_CONFIDENCE_THRESHOLDS[surface];
}

export function rankTbaFoodKnowledgeEntries(
  entries: readonly TbaFoodKnowledgeEntry[],
  query: string,
  options: RankTbaFoodKnowledgeOptions = {},
): TbaFoodKnowledgeRankedCandidate[] {
  const surface = options.surface ?? 'dining-note';

  const ranked = entries
    .map((entry) => {
      const textScore = getTextScore(entry, query);

      return {
        entry,
        score: Number((entry.confidence * 0.58 + textScore * 0.42).toFixed(3)),
        textScore,
        usable: canUseTbaFoodKnowledgeForSurface(entry, surface),
      };
    })
    .filter((candidate) => candidate.usable && candidate.textScore > 0)
    .sort((left, right) => (
      right.score - left.score ||
      right.entry.confidence - left.entry.confidence ||
      left.entry.koName.localeCompare(right.entry.koName, 'ko')
    ));

  return typeof options.limit === 'number' ? ranked.slice(0, options.limit) : ranked;
}

export function getTbaFoodKnowledgeEntryLabel(entry: TbaFoodKnowledgeEntry) {
  return entry.koName || entry.canonicalName || entry.id;
}

export function getTbaFoodKnowledgeEntryById(
  entries: readonly TbaFoodKnowledgeEntry[],
  id: string,
) {
  return entries.find((entry) => entry.id === id) ?? null;
}

export function inferTbaMenuContext(
  entries: readonly TbaFoodKnowledgeEntry[],
  menuName: string,
): TbaMenuContextInference {
  const normalizedMenuName = menuName.trim();

  if (!normalizedMenuName) {
    return {
      confidence: 0,
      dishKindIds: [],
      foodKnowledgeMatchIds: [],
      ingredients: [],
      techniques: [],
    };
  }

  const foodKnowledgeMatches = entries
    .map((entry) => ({
      entry,
      nameScore: getMenuNameScore(entry, normalizedMenuName),
    }))
    .filter((match) => match.nameScore >= 0.86 && match.entry.status !== 'retired')
    .sort((left, right) => (
      right.nameScore - left.nameScore ||
      right.entry.confidence - left.entry.confidence
    ))
    .slice(0, 4);
  const ingredientMatches = getStrongSignalMatches(normalizedMenuName, 'ingredient-kind');
  const processMatches = getStrongSignalMatches(normalizedMenuName, 'cooking-process');
  const ingredientSignalIds = uniqueStrings([
    ...foodKnowledgeMatches.flatMap((match) => match.entry.ingredientSignalIds),
    ...ingredientMatches.map((match) => match.definition.id),
  ]);
  const processSignalIds = uniqueStrings([
    ...foodKnowledgeMatches.flatMap((match) => match.entry.processSignalIds),
    ...processMatches.map((match) => match.definition.id),
  ]);
  const ingredients = uniqueStrings(
    ingredientSignalIds.map((signalId) => (
      findTbaSignalDefinitionsByText(signalId, {
        domains: ['ingredient-kind'],
        limit: 1,
        minScore: 0.82,
      })[0]?.definition.label ?? ''
    )),
    5,
  );
  const directTechniques = uniqueStrings(
    processSignalIds.map((signalId) => (
      findTbaSignalDefinitionsByText(signalId, {
        domains: ['cooking-process'],
        limit: 1,
        minScore: 0.82,
      })[0]?.definition.label ?? ''
    )),
    5,
  );
  const keywordDishKindIds = inferDishKindIds({
    ingredients,
    techniques: directTechniques,
    title: normalizedMenuName,
  });
  const dishKindIds = uniqueStrings([
    ...keywordDishKindIds,
    ...foodKnowledgeMatches.flatMap((match) => match.entry.dishKindIds),
    ...ingredientMatches
      .map((match) => match.definition.canonicalDishKindId ?? ''),
    ...processMatches
      .map((match) => match.definition.canonicalDishKindId ?? ''),
  ], 4);
  const techniques = uniqueStrings([
    ...directTechniques,
    ...(dishKindIds.includes('cold') ? ['차갑게'] : []),
  ], 5);
  const evidenceScores = [
    ...foodKnowledgeMatches.map((match) => match.entry.confidence * match.nameScore),
    ...ingredientMatches.map((match) => match.definition.confidence * match.score),
    ...processMatches.map((match) => match.definition.confidence * match.score),
    ...(keywordDishKindIds.length > 0 ? [0.62] : []),
  ];

  return {
    confidence: evidenceScores.length
      ? Number((evidenceScores.reduce((sum, score) => sum + score, 0) / evidenceScores.length).toFixed(3))
      : 0,
    dishKindIds,
    foodKnowledgeMatchIds: foodKnowledgeMatches.map((match) => match.entry.id),
    ingredients,
    techniques,
  };
}
