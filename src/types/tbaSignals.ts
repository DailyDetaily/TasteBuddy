import type { TasteId } from '../constants/designTokens';
import type {
  TbaCanonicalDishKindId,
  TbaCoreTasteLexiconCategory,
} from './tasteBuddyKnowledge';
import type { PerceptualAxis } from './tastePersonalization';

export type TbaSignalDomain =
  | 'dish-kind'
  | 'ingredient-kind'
  | 'cooking-process'
  | 'taste-bubble'
  | 'perceptual-detail'
  | 'intensity'
  | 'sentiment';

export type TbaSignalStatus = 'candidate' | 'active' | 'retired';

export type TbaSignalSource =
  | 'dish-kind-tag'
  | 'taste-tag'
  | 'detail-tag'
  | 'core-lexicon'
  | 'manual';

export interface TbaSignalDefinition {
  aliases: readonly string[];
  canonicalDishKindId?: TbaCanonicalDishKindId;
  confidence: number;
  description: string;
  domain: TbaSignalDomain;
  id: string;
  intensityValue?: number;
  label: string;
  lexiconCategory?: TbaCoreTasteLexiconCategory;
  lexiconIds?: readonly string[];
  parentIds?: readonly string[];
  perceptualAxis?: PerceptualAxis;
  sentimentValue?: -1 | 0 | 1;
  status: TbaSignalStatus;
  tasteAxis?: TasteId;
}

export interface TbaSignalDefinitionMatch {
  definition: TbaSignalDefinition;
  matchedAlias?: string;
  score: number;
}

export interface TbaMappedSignal extends TbaSignalDefinitionMatch {
  source: TbaSignalSource;
  sourceLabel: string;
}

export interface TbaSignalMappingInput {
  detailTags?: readonly string[];
  dishKindTags?: readonly string[];
  lexiconIds?: readonly string[];
  tasteTags?: readonly string[];
}

export interface TbaSignalMappingResult {
  byDomain: Partial<Record<TbaSignalDomain, TbaMappedSignal[]>>;
  mappedSignals: TbaMappedSignal[];
  unmappedTags: Array<{
    source: TbaSignalSource;
    value: string;
  }>;
}
