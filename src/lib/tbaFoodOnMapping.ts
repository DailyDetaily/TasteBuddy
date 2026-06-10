import {
  TBA_FOODON_BRIDGE_ENTRIES,
} from '../constants/tbaFoodOnBridge';
import { getDishKindLabel } from '../constants/dishKindTags';
import { getTbaSignalById } from './tbaSignalMapping';
import type {
  TbaFoodOntologyBridgeEntry,
  TbaFoodOntologyMappingInput,
  TbaFoodOntologyMappingResult,
  TbaFoodOntologyMatch,
} from '../types/tbaFoodOntology';

interface FindFoodOnBridgeOptions {
  entries?: readonly TbaFoodOntologyBridgeEntry[];
  limit?: number;
  minScore?: number;
}

function normalizeFoodText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[·,./|()[\]{}'"`~!?+]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function compactFoodText(value: string) {
  return normalizeFoodText(value).replace(/\s+/g, '');
}

function tokenizeFoodText(value: string) {
  return normalizeFoodText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function getEntrySearchLabels(entry: TbaFoodOntologyBridgeEntry) {
  return [
    entry.id,
    entry.koName,
    entry.canonicalName,
    entry.familyId,
    ...entry.aliases,
  ].filter((value): value is string => Boolean(value));
}

function getEntryTextScore(entry: TbaFoodOntologyBridgeEntry, value: string): TbaFoodOntologyMatch | null {
  const normalizedValue = normalizeFoodText(value);
  const compactValue = compactFoodText(value);

  if (!normalizedValue) {
    return null;
  }

  const labels = getEntrySearchLabels(entry)
    .map((label) => ({
      compact: compactFoodText(label),
      label,
      normalized: normalizeFoodText(label),
    }))
    .filter((candidate) => candidate.normalized);
  const exactMatch = labels.find((candidate) => (
    candidate.normalized === normalizedValue ||
    candidate.compact === compactValue
  ));

  if (exactMatch) {
    return {
      entry,
      matchedAlias: exactMatch.label,
      score: 1,
    };
  }

  const containmentMatch = labels.find((candidate) => (
    normalizedValue.includes(candidate.normalized) ||
    candidate.normalized.includes(normalizedValue) ||
    compactValue.includes(candidate.compact) ||
    candidate.compact.includes(compactValue)
  ));

  if (containmentMatch) {
    return {
      entry,
      matchedAlias: containmentMatch.label,
      score: 0.86,
    };
  }

  const tokens = tokenizeFoodText(value);

  if (tokens.length === 0) {
    return null;
  }

  const entryText = normalizeFoodText([
    entry.koName,
    entry.canonicalName,
    entry.description,
    entry.familyId,
    ...entry.aliases,
  ].filter(Boolean).join(' '));
  const matchedCount = tokens.filter((token) => entryText.includes(token)).length;

  if (matchedCount === 0) {
    return null;
  }

  return {
    entry,
    score: Math.min(0.64, matchedCount / Math.max(4, tokens.length)),
  };
}

function pushUniqueMatch(matches: TbaFoodOntologyMatch[], match: TbaFoodOntologyMatch) {
  const existingIndex = matches.findIndex((candidate) => candidate.entry.id === match.entry.id);

  if (existingIndex === -1) {
    matches.push(match);
    return;
  }

  if (match.score > matches[existingIndex].score) {
    matches[existingIndex] = match;
  }
}

function pushUniqueSignalId(signalIds: string[], signalId: string) {
  if (!getTbaSignalById(signalId) || signalIds.includes(signalId)) {
    return;
  }

  signalIds.push(signalId);
}

export function getFoodOnBridgeEntryById(
  id: string,
  entries: readonly TbaFoodOntologyBridgeEntry[] = TBA_FOODON_BRIDGE_ENTRIES,
) {
  return entries.find((entry) => entry.id === id) ?? null;
}

export function findFoodOnBridgeEntriesByText(
  value: string,
  options: FindFoodOnBridgeOptions = {},
): TbaFoodOntologyMatch[] {
  const {
    entries = TBA_FOODON_BRIDGE_ENTRIES,
    limit = 8,
    minScore = 0.5,
  } = options;

  return entries
    .map((entry) => getEntryTextScore(entry, value))
    .filter((match): match is TbaFoodOntologyMatch => Boolean(match && match.score >= minScore))
    .sort((left, right) => (
      right.score - left.score ||
      left.entry.koName.localeCompare(right.entry.koName, 'ko')
    ))
    .slice(0, limit);
}

export function mapFoodOnBridgeInput({
  dishKindTags = [],
  ingredients = [],
  menuText = '',
  techniques = [],
}: TbaFoodOntologyMappingInput): TbaFoodOntologyMappingResult {
  const matches: TbaFoodOntologyMatch[] = [];
  const unmappedTerms: string[] = [];
  const sourceTerms = [
    menuText,
    ...ingredients,
    ...techniques,
    ...dishKindTags.map(getDishKindLabel),
  ]
    .map((term) => term.trim())
    .filter(Boolean);

  sourceTerms.forEach((term) => {
    const termMatches = findFoodOnBridgeEntriesByText(term, { limit: 4 });

    if (termMatches.length === 0) {
      unmappedTerms.push(term);
      return;
    }

    termMatches.forEach((match) => pushUniqueMatch(matches, match));
  });

  const sortedMatches = matches.sort((left, right) => (
    right.score - left.score ||
    left.entry.koName.localeCompare(right.entry.koName, 'ko')
  ));
  const tbaSignalIds: string[] = [];

  sortedMatches.forEach((match) => {
    match.entry.tbaSignalIds.forEach((signalId) => pushUniqueSignalId(tbaSignalIds, signalId));
  });

  return {
    matches: sortedMatches,
    tbaSignalIds,
    unmappedTerms,
  };
}
