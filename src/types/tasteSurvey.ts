import type { TasteId } from '../constants/designTokens';
import type { RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
import type { TasteMeasurementSnapshot } from '../constants/tasteMeasurementData';

export type TasteSurveyInstrumentId = 'taste-buddy-initial-six-taste-survey';
export type TasteSurveyVersion = '2.0.0';
export type TasteSurveyRecallWindow = 'recent-3-months';
export type TasteSurveyConstruct = 'recalled_intensity';
/** Ordered response categories, not measured thresholds or equal sensory intervals. */
export type TasteSurveyLikertValue = 0 | 1 | 2 | 3 | 4;
export type TasteSurveyUncertaintyReason = 'never_tried' | 'cannot_recall' | 'cannot_isolate_taste';
export type TasteSurveyAnchorStability = 'high' | 'medium' | 'low';
export type TasteSurveySexContext =
  | 'female'
  | 'male'
  | 'other_or_not_listed'
  | 'prefer_not_to_say';
export type TasteSurveySmokingStatus =
  | 'never'
  | 'former'
  | 'current'
  | 'prefer_not_to_say';
export type TasteSurveyContextFieldId = 'birthDate' | 'sexContext' | 'smokingStatus';

export interface TasteSurveyInstrumentMetadata {
  id: TasteSurveyInstrumentId;
  title: string;
  version: TasteSurveyVersion;
}

export interface TasteSurveyAnchor {
  id: string;
  version: string;
  description: string;
  label: string;
  stability: TasteSurveyAnchorStability;
  conditions: readonly string[];
}

export interface TasteSurveyExploratoryMetadata {
  appliesToTasteIds: Extract<TasteId, 'umami' | 'fat'>[];
  interpretationCaution: string;
  rationale: string;
}

export interface TasteSurveyItem {
  anchor: TasteSurveyAnchor;
  construct: TasteSurveyConstruct;
  exploratoryMetadata?: TasteSurveyExploratoryMetadata;
  id: string;
  prompt: string;
  helper: string;
  recallWindow: TasteSurveyRecallWindow;
  reverseKeyed: false;
  tasteId: TasteId;
}

export interface TasteSurveyResponse {
  itemId: TasteSurveyItem['id'];
  selectedValue: TasteSurveyLikertValue | null;
  uncertain: boolean;
  uncertaintyReason?: TasteSurveyUncertaintyReason;
}

export interface TasteSurveyRespondentContext {
  birthDate?: string;
  sexContext?: TasteSurveySexContext;
  smokingStatus?: TasteSurveySmokingStatus;
}

export interface TasteSurveyLikertScaleConfig {
  labels: Record<TasteSurveyLikertValue, string>;
  max: 4;
  min: 0;
  midpointValue: 2;
  uncertainLabel: string;
}

export interface TasteSurveyScoringConfig {
  constructs: readonly TasteSurveyConstruct[];
  outputSnapshotSource: 'recalled-intensity';
  recallWindow: TasteSurveyRecallWindow;
}

export interface TasteSurveyCompatibleResult {
  snapshot: TasteMeasurementSnapshot;
  starterGuidance: RestaurantReadyGuidance;
}

/** The instrument actually shown; future catalog edits must not rewrite old evidence. */
export interface TasteSurveySubmission {
  schemaVersion: 2;
  source: 'reference-food-recall';
  recordedAt: string;
  instrument: TasteSurveyInstrumentMetadata;
  recallWindow: TasteSurveyRecallWindow;
  scale: TasteSurveyLikertScaleConfig;
  items: readonly TasteSurveyItem[];
  responses: readonly TasteSurveyResponse[];
  respondentContext: TasteSurveyRespondentContext;
}
