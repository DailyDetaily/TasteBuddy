import type { TasteId } from '../constants/designTokens';

export const PERCEPTUAL_AXES = [
  'brightness',
  'heaviness',
  'cleanFinish',
  'linger',
  'smoke',
  'aromaIntensity',
  'textureRichness',
  'thermalImpact',
] as const;

export const SOURCE_DOCUMENT_TYPES = [
  'menu',
  'interview',
  'review',
  'article',
  'social',
  'operatorNote',
] as const;

export const COURSE_POSITIONS = [
  'snack',
  'amuse',
  'starter',
  'fish',
  'main',
  'dessert',
  'petitFour',
  'beverage',
  'other',
] as const;

export const TEMPERATURE_BANDS = ['cold', 'cool', 'room', 'warm', 'hot', 'mixed', 'unknown'] as const;

export type PerceptualAxis = (typeof PERCEPTUAL_AXES)[number];
export type SourceDocumentType = (typeof SOURCE_DOCUMENT_TYPES)[number];
export type CoursePosition = (typeof COURSE_POSITIONS)[number];
export type TemperatureBand = (typeof TEMPERATURE_BANDS)[number];

export type TasteVector = Record<TasteId, number>;
export type SignedTasteVector = Record<TasteId, number>;
export type PerceptualVector = Record<PerceptualAxis, number>;
export type SignedPerceptualVector = Record<PerceptualAxis, number>;

export interface SourceEvidence {
  id: string;
  sourceType: SourceDocumentType;
  title?: string;
  url?: string;
  excerpt?: string;
  confidence: number;
}

export interface DishObservedFacts {
  dishId: string;
  restaurantName?: string;
  publicTitle: string;
  publicSubtitle?: string;
  coursePosition: CoursePosition;
  ingredients: string[];
  techniques: string[];
  sensoryWords: string[];
  temperature: TemperatureBand;
  notes: string[];
}

export interface DishInferenceProfile {
  dishId: string;
  version: number;
  tasteVector: TasteVector;
  perceptualVector: PerceptualVector;
  confidence: number;
  rationale: string;
  uncertaintyNotes: string[];
  evidenceIds: string[];
}

export interface ResearchRule {
  ruleCode: string;
  label: string;
  summary: string;
  evidenceStrength: number;
  triggerTasteFloor?: Partial<TasteVector>;
  triggerPerceptualFloor?: Partial<PerceptualVector>;
  effectTasteDelta?: Partial<SignedTasteVector>;
  effectPerceptualDelta?: Partial<SignedPerceptualVector>;
  notes?: string[];
}

export interface FeedbackTagDefinition {
  id: string;
  label: string;
  summary: string;
  polarity: 'positive' | 'negative' | 'mixed';
  perceptionTasteDelta: Partial<SignedTasteVector>;
  perceptionPerceptualDelta: Partial<SignedPerceptualVector>;
  preferenceTasteDelta: Partial<SignedTasteVector>;
  preferencePerceptualDelta: Partial<SignedPerceptualVector>;
  confidence: number;
}

export interface FeedbackTagSelection {
  tagId: string;
  intensity?: number;
}

export interface ParsedFeedbackReaction {
  perceptionTasteDelta: SignedTasteVector;
  perceptionPerceptualDelta: SignedPerceptualVector;
  preferenceTasteDelta: SignedTasteVector;
  preferencePerceptualDelta: SignedPerceptualVector;
  confidence: number;
  evidenceTagIds: string[];
  rationale: string;
}

export interface FeedbackObservation {
  rating: number;
  overallRating?: number;
  daysSinceDining?: number;
  sourceConfidence?: number;
  parsedReaction: ParsedFeedbackReaction;
}

export interface ReservationLearningSignal {
  perceptionTasteDelta: SignedTasteVector;
  perceptionPerceptualDelta: SignedPerceptualVector;
  preferenceTasteDelta: SignedTasteVector;
  preferencePerceptualDelta: SignedPerceptualVector;
  confidence: number;
  evidenceCount: number;
  reasons: string[];
}

export interface UserLearnedCalibration {
  perceptionTasteDelta: SignedTasteVector;
  perceptionPerceptualDelta: SignedPerceptualVector;
  preferenceTasteDelta: SignedTasteVector;
  preferencePerceptualDelta: SignedPerceptualVector;
  supportCount: number;
  hypothesisCount: number;
  updatedAt?: string;
}

export interface LearningUpdate {
  next: UserLearnedCalibration;
  promotedTasteAxes: TasteId[];
  promotedPerceptualAxes: PerceptualAxis[];
  confidence: number;
  reservationSignal: ReservationLearningSignal;
}

export interface DishSignalWeights {
  ingredient: number;
  technique: number;
  menu: number;
  review: number;
  course: number;
}

export interface DishSignalInputs {
  ingredientTaste?: Partial<TasteVector>;
  techniqueTaste?: Partial<TasteVector>;
  menuTaste?: Partial<TasteVector>;
  reviewTaste?: Partial<TasteVector>;
  courseTaste?: Partial<TasteVector>;
  ingredientPerceptual?: Partial<PerceptualVector>;
  techniquePerceptual?: Partial<PerceptualVector>;
  menuPerceptual?: Partial<PerceptualVector>;
  reviewPerceptual?: Partial<PerceptualVector>;
  coursePerceptual?: Partial<PerceptualVector>;
}

export interface PersonalizedDishProjection {
  predictedTasteVector: TasteVector;
  predictedPerceptualVector: PerceptualVector;
  preferenceTasteDelta: SignedTasteVector;
  preferencePerceptualDelta: SignedPerceptualVector;
  confidence: number;
  reasons: string[];
}
