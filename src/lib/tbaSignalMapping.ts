import {
  TBA_SIGNAL_BY_ID,
  TBA_SIGNAL_TAXONOMY,
} from '../constants/tbaSignalTaxonomy';
import { getDishKindLabel } from '../constants/dishKindTags';
import type {
  TbaMappedSignal,
  TbaSignalDefinition,
  TbaSignalDefinitionMatch,
  TbaSignalDomain,
  TbaSignalMappingInput,
  TbaSignalMappingResult,
  TbaSignalSource,
} from '../types/tbaSignals';

interface FindSignalDefinitionsOptions {
  domains?: readonly TbaSignalDomain[];
  includeRetired?: boolean;
  limit?: number;
  minScore?: number;
  taxonomy?: readonly TbaSignalDefinition[];
}

interface MapTagsToSignalsOptions extends FindSignalDefinitionsOptions {
  limitPerTag?: number;
  source?: TbaSignalSource;
}

export function normalizeSignalText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[·,./|()[\]{}'"`~!?+]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function compactSignalText(value: string) {
  return normalizeSignalText(value).replace(/\s+/g, '');
}

function tokenizeSignalText(value: string) {
  return normalizeSignalText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function getSignalSearchLabels(definition: TbaSignalDefinition) {
  return [
    definition.id,
    definition.id.split(':').at(-1) ?? definition.id,
    definition.label,
    ...definition.aliases,
    ...(definition.lexiconIds ?? []),
  ];
}

function getSignalTextScore(definition: TbaSignalDefinition, value: string): TbaSignalDefinitionMatch | null {
  const normalizedValue = normalizeSignalText(value);
  const compactValue = compactSignalText(value);

  if (!normalizedValue) {
    return null;
  }

  const labels = getSignalSearchLabels(definition)
    .map((label) => ({
      compact: compactSignalText(label),
      label,
      normalized: normalizeSignalText(label),
    }))
    .filter((candidate) => candidate.normalized);

  const exactMatch = labels.find((candidate) => (
    candidate.normalized === normalizedValue ||
    candidate.compact === compactValue
  ));

  if (exactMatch) {
    return {
      definition,
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
      definition,
      matchedAlias: containmentMatch.label,
      score: 0.86,
    };
  }

  const valueTokens = tokenizeSignalText(value);

  if (valueTokens.length === 0) {
    return null;
  }

  const definitionText = normalizeSignalText([
    definition.id,
    definition.label,
    definition.description,
    ...definition.aliases,
  ].join(' '));
  const matchedCount = valueTokens.filter((token) => definitionText.includes(token)).length;

  if (matchedCount === 0) {
    return null;
  }

  return {
    definition,
    score: Math.min(0.64, matchedCount / Math.max(4, valueTokens.length)),
  };
}

function isAllowedDomain(definition: TbaSignalDefinition, domains?: readonly TbaSignalDomain[]) {
  return !domains?.length || domains.includes(definition.domain);
}

export function getTbaSignalById(id: string) {
  return TBA_SIGNAL_BY_ID[id] ?? null;
}

export function findTbaSignalDefinitionsByText(
  value: string,
  options: FindSignalDefinitionsOptions = {},
): TbaSignalDefinitionMatch[] {
  const {
    domains,
    includeRetired = false,
    limit = 8,
    minScore = 0.5,
    taxonomy = TBA_SIGNAL_TAXONOMY,
  } = options;

  return taxonomy
    .filter((definition) => includeRetired || definition.status !== 'retired')
    .filter((definition) => isAllowedDomain(definition, domains))
    .map((definition) => getSignalTextScore(definition, value))
    .filter((match): match is TbaSignalDefinitionMatch => Boolean(match && match.score >= minScore))
    .sort((left, right) => (
      right.score - left.score ||
      right.definition.confidence - left.definition.confidence ||
      left.definition.label.localeCompare(right.definition.label, 'ko')
    ))
    .slice(0, limit);
}

function groupMappedSignalsByDomain(mappedSignals: readonly TbaMappedSignal[]) {
  return mappedSignals.reduce<TbaSignalMappingResult['byDomain']>((byDomain, signal) => {
    const existing = byDomain[signal.definition.domain] ?? [];

    byDomain[signal.definition.domain] = [...existing, signal];
    return byDomain;
  }, {});
}

function pushMappedSignal(
  mappedSignals: TbaMappedSignal[],
  signal: TbaMappedSignal,
) {
  const existingIndex = mappedSignals.findIndex((candidate) => candidate.definition.id === signal.definition.id);

  if (existingIndex === -1) {
    mappedSignals.push(signal);
    return;
  }

  if (signal.score > mappedSignals[existingIndex].score) {
    mappedSignals[existingIndex] = signal;
  }
}

export function mapTagsToTbaSignals(
  tags: readonly string[],
  options: MapTagsToSignalsOptions = {},
): TbaSignalMappingResult {
  const {
    limitPerTag = 1,
    source = 'manual',
    ...findOptions
  } = options;
  const mappedSignals: TbaMappedSignal[] = [];
  const unmappedTags: TbaSignalMappingResult['unmappedTags'] = [];

  tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .forEach((tag) => {
      const matches = findTbaSignalDefinitionsByText(tag, {
        ...findOptions,
        limit: limitPerTag,
      });

      if (matches.length === 0) {
        unmappedTags.push({ source, value: tag });
        return;
      }

      matches.forEach((match) => {
        pushMappedSignal(mappedSignals, {
          ...match,
          source,
          sourceLabel: tag,
        });
      });
    });

  return {
    byDomain: groupMappedSignalsByDomain(mappedSignals),
    mappedSignals,
    unmappedTags,
  };
}

export function mapDishKindTagsToTbaSignals(dishKindIds: readonly string[]): TbaSignalMappingResult {
  const mappedSignals: TbaMappedSignal[] = [];
  const unmappedTags: TbaSignalMappingResult['unmappedTags'] = [];

  dishKindIds
    .map((kindId) => kindId.trim())
    .filter(Boolean)
    .forEach((kindId) => {
      const definition = getTbaSignalById(`dish-kind:${kindId}`);

      if (!definition || definition.status === 'retired') {
        unmappedTags.push({
          source: 'dish-kind-tag',
          value: getDishKindLabel(kindId),
        });
        return;
      }

      pushMappedSignal(mappedSignals, {
        definition,
        matchedAlias: kindId,
        score: 1,
        source: 'dish-kind-tag',
        sourceLabel: getDishKindLabel(kindId),
      });
    });

  return {
    byDomain: groupMappedSignalsByDomain(mappedSignals),
    mappedSignals,
    unmappedTags,
  };
}

export function mapCoreLexiconToTbaSignalIds(lexiconIds: readonly string[]) {
  return lexiconIds
    .map((lexiconId) => `lexicon:${lexiconId}`)
    .filter((signalId) => Boolean(TBA_SIGNAL_BY_ID[signalId]));
}

export function mapFeedbackInputToTbaSignals({
  detailTags = [],
  dishKindTags = [],
  lexiconIds = [],
  tasteTags = [],
}: TbaSignalMappingInput): TbaSignalMappingResult {
  const dishKindMapping = mapDishKindTagsToTbaSignals(dishKindTags);
  const tasteMapping = mapTagsToTbaSignals(tasteTags, {
    domains: ['taste-bubble', 'intensity', 'sentiment'],
    limitPerTag: 2,
    source: 'taste-tag',
  });
  const detailMapping = mapTagsToTbaSignals(detailTags, {
    domains: ['perceptual-detail', 'ingredient-kind', 'cooking-process', 'intensity', 'sentiment'],
    limitPerTag: 2,
    source: 'detail-tag',
  });
  const mappedSignals: TbaMappedSignal[] = [];

  [
    ...dishKindMapping.mappedSignals,
    ...tasteMapping.mappedSignals,
    ...detailMapping.mappedSignals,
  ].forEach((signal) => pushMappedSignal(mappedSignals, signal));

  lexiconIds.forEach((lexiconId) => {
    const signalId = `lexicon:${lexiconId}`;
    const definition = getTbaSignalById(signalId);

    if (!definition || definition.status === 'retired') {
      return;
    }

    pushMappedSignal(mappedSignals, {
      definition,
      matchedAlias: lexiconId,
      score: 1,
      source: 'core-lexicon',
      sourceLabel: lexiconId,
    });
  });

  return {
    byDomain: groupMappedSignalsByDomain(mappedSignals),
    mappedSignals: mappedSignals.sort((left, right) => (
      right.score - left.score ||
      right.definition.confidence - left.definition.confidence ||
      left.definition.label.localeCompare(right.definition.label, 'ko')
    )),
    unmappedTags: [
      ...dishKindMapping.unmappedTags,
      ...tasteMapping.unmappedTags,
      ...detailMapping.unmappedTags,
    ],
  };
}
