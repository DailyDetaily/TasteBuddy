import type { TbaCanonicalDishKindId } from './tasteBuddyKnowledge';

export type TbaFoodOntologyKind = 'ingredient' | 'process' | 'product-category';

export type TbaFoodOntologyFacet = 'food-material' | 'food-process' | 'food-product';

export type TbaFoodOntologySource = 'FoodOn-reference' | 'Taste-Buddy-curated';

export type TbaFoodKnowledgeSource =
  | 'foodon-taxonomy'
  | 'korean-standard-food-composition-db'
  | 'nongsaro-native-food-api'
  | 'taste-buddy-curated';

export type TbaFoodKnowledgeKind = 'ingredient' | 'process' | 'product-category' | 'korean-food' | 'native-dish';

export type TbaFoodKnowledgeStatus = 'candidate' | 'active' | 'human-reviewed' | 'retired';

export type TbaFoodKnowledgeSurface =
  | 'taste-bubble'
  | 'detail-tag'
  | 'dining-note'
  | 'recommendation'
  | 'chef-guide'
  | 'tcs';

export interface TbaFoodOntologyBridgeEntry {
  aliases: readonly string[];
  canonicalName: string;
  description: string;
  dishKindIds: readonly TbaCanonicalDishKindId[];
  familyId?: string;
  foodOnIri?: string;
  id: string;
  kind: TbaFoodOntologyKind;
  koName: string;
  parentIds?: readonly string[];
  source: TbaFoodOntologySource;
  sourceFacet: TbaFoodOntologyFacet;
  tbaSignalIds: readonly string[];
}

export interface TbaFoodOntologyMatch {
  entry: TbaFoodOntologyBridgeEntry;
  matchedAlias?: string;
  score: number;
}

export interface TbaFoodOntologyMappingInput {
  dishKindTags?: readonly string[];
  ingredients?: readonly string[];
  menuText?: string;
  techniques?: readonly string[];
}

export interface TbaFoodOntologyMappingResult {
  matches: TbaFoodOntologyMatch[];
  tbaSignalIds: string[];
  unmappedTerms: string[];
}

export interface KoreanFoodCatalogEntry {
  aliases: readonly string[];
  dbIndex: string;
  englishName: string;
  foodCode: string;
  foodGroup: string;
  id: string;
  koName: string;
  scientificName: string;
  source: 'korean-standard-food-composition-db';
  sourceVersion: string;
}

export interface FoodOnTaxonomyEntry {
  aliases: readonly string[];
  canonicalName: string;
  id: string;
  iri: string;
  kind: TbaFoodOntologyKind;
  parentIds: readonly string[];
  source: 'FoodOn-reference';
}

export interface NativeFoodCatalogEntry {
  cookingMethodPath: readonly string[];
  foodTypePath: readonly string[];
  imageUrls: readonly Array<{
    typeCode: string;
    url: string;
  }>;
  koDishName: string;
  mainIngredientsText: string;
  originText: string;
  recipeText: string;
  source: 'nongsaro-native-food-api';
  sourceId: string;
  subIngredientsText: string;
}

export interface TbaFoodKnowledgeSourceRef {
  id?: string;
  source: TbaFoodKnowledgeSource;
  version?: string;
}

export interface TbaFoodKnowledgeEntry {
  aliases: readonly string[];
  canonicalName: string;
  confidence: number;
  dishKindIds: readonly TbaCanonicalDishKindId[];
  foodGroup: string;
  foodOnIds: readonly string[];
  id: string;
  ingredientSignalIds: readonly string[];
  kind: TbaFoodKnowledgeKind;
  koName: string;
  lexiconIds: readonly string[];
  nativeFoodIds: readonly string[];
  processSignalIds: readonly string[];
  sourceRefs: readonly TbaFoodKnowledgeSourceRef[];
  status: TbaFoodKnowledgeStatus;
  surfaces: Readonly<Record<TbaFoodKnowledgeSurface, boolean>>;
}

export interface TbaFoodKnowledgeRankedCandidate {
  entry: TbaFoodKnowledgeEntry;
  score: number;
  textScore: number;
  usable: boolean;
}
