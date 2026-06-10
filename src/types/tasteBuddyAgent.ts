import type { TasteId } from '../constants/designTokens';
import type {
  PerceptualAxis,
  PerceptualVector,
  TasteVector,
} from './tastePersonalization';

export type TasteProfileStage = 'Starter' | 'Learning' | 'Patterned' | 'Refined';
export type TasteProfileVisibility = 'private' | 'followers' | 'public';
export type TasteMatchCategory = 'Strong Match' | 'Worth Exploring' | 'Taste Contrast';
export type TasteSocialRelation = 'Taste Twin' | 'Similar Palate' | 'Contrasting Palate';

export interface TasteIdentitySignal {
  confidence: number;
  id: string;
  label: string;
  summary: string;
  tasteId?: TasteId;
}

export interface TasteBuddyAgentDiningAnalysisTagSnapshot {
  colorTaste?: string;
  id: string;
  label: string;
  title?: string;
}

export interface TasteBuddyAgentDiningAnalysisSnapshot {
  confidence: number;
  detailTags: TasteBuddyAgentDiningAnalysisTagSnapshot[];
  foodKnowledgeMatchIds: string[];
  foodOnMatchIds: string[];
  generatedAt: string;
  lexiconCandidateIds: string[];
  source: 'TasteBuddyAgent';
  subject: string;
  summary: string;
  tasteBubbles: TasteBuddyAgentDiningAnalysisTagSnapshot[];
  tbaSignalIds: string[];
  version: string;
}

export type TasteBuddyAgentFeedbackEvidenceEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'taste_tags_changed'
  | 'detail_tags_changed'
  | 'dish_kind_tags_changed'
  | 'dining_note_regenerated';

export type TasteBuddyAgentFeedbackEvidenceAction =
  | 'include'
  | 'adjust'
  | 'remove'
  | 'ignore';

export interface TasteBuddyAgentFeedbackEvidenceState {
  detailTagIds?: string[];
  dishKindIds?: string[];
  signalIds?: string[];
  snapshot?: TasteBuddyAgentDiningAnalysisSnapshot | null;
  tasteTagIds?: string[];
  tbaConfidence?: number | null;
}

export interface TasteBuddyAgentFeedbackEvidenceConfidenceEffect {
  action: TasteBuddyAgentFeedbackEvidenceAction;
  changedDimensions: Array<'taste' | 'detail' | 'dish-kind' | 'signal' | 'snapshot'>;
  confidenceDelta: number;
  confidenceLift: number;
  nextEffectiveConfidence: number;
  previousEffectiveConfidence: number;
  reasons: string[];
}

export interface CalculateTasteBuddyAgentFeedbackEvidenceConfidenceInput {
  eventType: TasteBuddyAgentFeedbackEvidenceEventType;
  next?: TasteBuddyAgentFeedbackEvidenceState | null;
  previous?: TasteBuddyAgentFeedbackEvidenceState | null;
}

export type TasteBuddyAgentConfidenceSignalType =
  | 'tba-signal'
  | 'lexicon'
  | 'dish-kind'
  | 'foodon'
  | 'food-knowledge';

export interface TasteBuddyAgentFeedbackEvidenceEvent {
  confidenceDelta?: number;
  confidenceEffect?: TasteBuddyAgentFeedbackEvidenceConfidenceEffect | null;
  createdAt?: string;
  eventType: TasteBuddyAgentFeedbackEvidenceEventType;
  evidenceAction: TasteBuddyAgentFeedbackEvidenceAction;
  id?: string;
  nextDishKindIds?: string[];
  nextSignalIds?: string[];
  nextSnapshot?: TasteBuddyAgentDiningAnalysisSnapshot | null;
  previousDishKindIds?: string[];
  previousSignalIds?: string[];
  previousSnapshot?: TasteBuddyAgentDiningAnalysisSnapshot | null;
}

export interface TasteBuddyAgentUserConfidenceState {
  adjustCount: number;
  confidence: number;
  evidenceCount: number;
  label?: string;
  lastEvidenceAt?: string;
  lastEventId?: string;
  payload?: Record<string, unknown>;
  removeCount: number;
  signalId: string;
  signalType: TasteBuddyAgentConfidenceSignalType;
  supportCount: number;
}

export interface AggregateTasteBuddyAgentEvidenceEventsInput {
  events: readonly TasteBuddyAgentFeedbackEvidenceEvent[];
}

export interface TasteProfileSnapshot {
  confidenceByAxis: Record<TasteId, number>;
  generatedAt: string;
  perceptualVector: PerceptualVector;
  preferenceVector: TasteVector;
  sensitivityVector: TasteVector;
  stablePatterns: TasteIdentitySignal[];
  stage: TasteProfileStage;
  tasteSignature: string;
  tasteVector: TasteVector;
  userId: string;
  watchPoints: TasteIdentitySignal[];
}

export interface PublicTasteProfile {
  avatarPath?: string | null;
  displayName: string;
  nickname: string;
  publicStats: {
    averageRating: number | null;
    reviewCount: number;
  };
  stage: TasteProfileStage;
  tasteSignature: string;
  userId: string;
  visibility: TasteProfileVisibility;
  snapshot: TasteProfileSnapshot;
}

export interface DiningReview {
  createdAt: string;
  dishId?: string | null;
  dishKindTags?: string[];
  dishTitle?: string | null;
  experienceTags: string[];
  id: string;
  ingredients?: string[];
  rating: number;
  restaurantId: string;
  restaurantName: string;
  reviewSnippet: string;
  reviewerId: string;
  tasteSignals: Partial<Record<TasteId, number>>;
  tasteTags: string[];
  techniques?: string[];
  visibility: TasteProfileVisibility;
}

export interface TasteSimilarityEdge {
  computedAt: string;
  differenceSignals: TasteIdentitySignal[];
  sharedSignals: TasteIdentitySignal[];
  similarityScore: number;
  sourceUserId: string;
  targetUserId: string;
}

export interface TasteMatchFeedItem {
  category: TasteMatchCategory;
  dishId?: string | null;
  dishKindTags?: string[];
  dishTitle?: string | null;
  experienceTags: string[];
  id: string;
  ingredients?: string[];
  itemType: 'restaurant' | 'dish' | 'review';
  learnedConfidenceScore?: number;
  learnedConfidenceSignals?: string[];
  matchScore: number;
  reason: string;
  relationLabel: TasteSocialRelation;
  restaurantId: string;
  restaurantName: string;
  reviewCreatedAt?: string;
  reviewSnippet: string;
  reviewer: PublicTasteProfile;
  reviewerId: string;
  sharedSignals: TasteIdentitySignal[];
  supportingSignals: string[];
  tasteTags: string[];
  techniques?: string[];
}

export interface BuildTasteIdentityInput {
  feedbackCount?: number;
  measuredAtOverride?: string;
  measurementSnapshot: import('../constants/tasteMeasurementData').TasteMeasurementSnapshot;
  reviewCount?: number;
  userId?: string;
}

export interface GenerateTasteMatchFeedInput {
  candidateProfiles?: PublicTasteProfile[];
  limit?: number;
  reviews?: DiningReview[];
  userConfidenceStates?: TasteBuddyAgentUserConfidenceState[];
  viewerProfile: TasteProfileSnapshot;
}

export interface IngestDiningReviewInput {
  createdAt?: string;
  dishId?: string | null;
  dishKindTags?: string[];
  dishTitle?: string | null;
  experienceTags?: string[];
  id?: string;
  ingredients?: string[];
  rating: number;
  restaurantId: string;
  restaurantName: string;
  reviewText?: string;
  reviewerId: string;
  tasteTags?: string[];
  techniques?: string[];
  visibility?: TasteProfileVisibility;
}

export interface TasteSimilarityOptions {
  reviewBehaviorOverlap?: number;
}

export type AxisLabelResolver = (axis: PerceptualAxis) => string;
