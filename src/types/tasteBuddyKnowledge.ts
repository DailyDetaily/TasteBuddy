import type { TasteId } from '../constants/designTokens';
import type { PerceptualAxis, TasteVector } from './tastePersonalization';
import type { TasteProfileSnapshot } from './tasteBuddyAgent';
import type {
  TbaFoodKnowledgeEntry,
  TbaFoodKnowledgeRankedCandidate,
  TbaFoodOntologyMatch,
} from './tbaFoodOntology';

export type TbaKnowledgeSource =
  | 'manual-core-lexicon'
  | 'foodon-taxonomy'
  | 'recipenlg-pattern'
  | 'foodsky-rag'
  | 'app-feedback'
  | 'human-review';

export type TbaCoreTasteLexiconCategory =
  | 'taste'
  | 'finish'
  | 'texture'
  | 'aroma'
  | 'process'
  | 'ingredient'
  | 'composition';

export type TbaKnowledgeSurface =
  | 'taste-bubble'
  | 'detail-tag'
  | 'dining-note'
  | 'recommendation'
  | 'chef-guide'
  | 'tcs';

export type TbaKnowledgeReviewStatus = 'draft' | 'candidate' | 'human-reviewed' | 'active' | 'retired';

export type TbaCanonicalDishKindId =
  | 'seafood'
  | 'meat'
  | 'vegetable_herb'
  | 'legume_tofu'
  | 'grain_noodle'
  | 'dumpling_batter'
  | 'broth'
  | 'sauce_glaze'
  | 'grilled_smoked'
  | 'stir_fried_wok'
  | 'fried_crispy'
  | 'steamed_braised'
  | 'raw_cured'
  | 'fermented_jang'
  | 'dairy_cheese'
  | 'spice_heat'
  | 'dessert'
  | 'cold'
  | 'beverage_pairing';

export type TbaLexiconDishKindAffinity = Partial<Record<TbaCanonicalDishKindId, number>>;

export interface TbaCoreTasteLexiconEntry {
  aliases: string[];
  category: TbaCoreTasteLexiconCategory;
  dishKindAffinity: Record<string, number>;
  foodOnHints?: string[];
  id: string;
  initialConfidence: number;
  label: string;
  minRecommendationConfidence: number;
  perceptualVector: Partial<Record<PerceptualAxis, number>>;
  polarity: 'positive' | 'negative' | 'mixed' | 'neutral';
  recipeNlgTechniqueHints?: string[];
  sourceNotes: TbaKnowledgeSource[];
  status: TbaKnowledgeReviewStatus;
  summary: string;
  surfaces: TbaKnowledgeSurface[];
  tasteVector: Partial<Record<TasteId, number>>;
  version: string;
}

export interface TbaLexiconConfidenceContext {
  appFeedbackConfidence?: number;
  dishKindIds?: readonly string[];
  evidenceCount?: number;
  foodMappingConfidence?: number;
  humanReviewConfidence?: number;
}

export interface TbaLexiconRankOptions extends TbaLexiconConfidenceContext {
  includeBlocked?: boolean;
  limit?: number;
  surface?: TbaKnowledgeSurface;
}

export interface TbaRankedLexiconCandidate {
  confidence: number;
  dishKindScore: number;
  entry: TbaCoreTasteLexiconEntry;
  normalizedDishKindAffinity: TbaLexiconDishKindAffinity;
  usable: boolean;
}

export interface TbaDiningNoteLexiconMapperInput {
  detailTags: readonly string[];
  dishKindTags?: readonly string[];
  entries?: readonly TbaCoreTasteLexiconEntry[];
  foodKnowledgeEntries?: readonly TbaFoodKnowledgeEntry[];
  ingredients?: readonly string[];
  reviewerProfile?: TasteProfileSnapshot;
  subject?: string;
  tasteTags: readonly string[];
  techniques?: readonly string[];
}

export interface TbaDiningNoteLexiconCandidate extends TbaRankedLexiconCandidate {
  foodKnowledgeScore: number;
  foodOnScore: number;
  profileScore: number;
  score: number;
  textScore: number;
}

export interface TbaDiningNoteLexiconMapping {
  confidence: number;
  detailTagLabels: string[];
  foodKnowledgeMatches: TbaFoodKnowledgeRankedCandidate[];
  foodOnMatches: TbaFoodOntologyMatch[];
  lexiconCandidates: TbaDiningNoteLexiconCandidate[];
  perceptualVector: Partial<Record<PerceptualAxis, number>>;
  tbaSignalIds: string[];
  tasteBubbleLabels: string[];
  tasteVector: Partial<TasteVector>;
}

export interface TbaKnowledgeDoc {
  confidence: {
    appFeedback: number;
    combined: number;
    foodMapping: number;
    humanReview: number;
    lexicon: number;
  };
  aliases: string[];
  category: TbaCoreTasteLexiconCategory;
  dishKindAffinity: TbaLexiconDishKindAffinity;
  dishKindIds: TbaCanonicalDishKindId[];
  docType: 'core-taste-lexicon';
  id: string;
  ingredientHints: string[];
  ingredientTaxonomyIds: string[];
  lexiconIds: string[];
  perceptualVector: Partial<Record<PerceptualAxis, number>>;
  polarity: TbaCoreTasteLexiconEntry['polarity'];
  primaryLexiconId: string;
  processHints: string[];
  processTaxonomyIds: string[];
  searchableText: string;
  sourceNotes: TbaKnowledgeSource[];
  status: TbaKnowledgeReviewStatus;
  summary: string;
  surfaces: TbaKnowledgeSurface[];
  tasteVector: Partial<TasteVector>;
  title: string;
  updatedAt: string;
  version: string;
}

export interface TbaKnowledgeRetrievalInput {
  detailTags?: readonly string[];
  dishKindTags?: readonly string[];
  docs?: readonly TbaKnowledgeDoc[];
  ingredients?: readonly string[];
  limit?: number;
  minScore?: number;
  queryText?: string;
  reviewerProfile?: TasteProfileSnapshot;
  surface?: TbaKnowledgeSurface;
  tasteTags?: readonly string[];
  techniques?: readonly string[];
}

export interface TbaKnowledgeMatchedSignal {
  kind: 'detail-tag' | 'dish-kind' | 'foodon' | 'profile' | 'query' | 'taste-tag';
  label: string;
  score: number;
}

export interface TbaKnowledgeRetrievalCandidate {
  confidence: number;
  dishKindScore: number;
  doc: TbaKnowledgeDoc;
  matchedSignals: TbaKnowledgeMatchedSignal[];
  profileScore: number;
  score: number;
  textScore: number;
}

export interface TbaKnowledgeRetrievalResult {
  candidates: TbaKnowledgeRetrievalCandidate[];
  queryText: string;
  surface: TbaKnowledgeSurface;
}
