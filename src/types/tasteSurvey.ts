import type { TasteId } from '../constants/designTokens';
import type { RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
import type { TasteMeasurementSnapshot } from '../constants/tasteMeasurementData';

export type TasteSurveyInstrumentId = 'taste-buddy-initial-six-taste-survey';
export type TasteSurveyVersion = '1.0.0';
export type TasteSurveyRecallWindow = 'recent-3-months';
export type TasteSurveyConstruct = 'salience' | 'overload';
export type TasteSurveyLikertValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type TasteSurveyAnchorStability = 'high' | 'medium' | 'low';
export type TasteSurveyAgeRange =
  | 'teen'
  | '18_24'
  | '25_34'
  | '35_44'
  | '45_54'
  | '55_64'
  | '65_plus'
  | 'prefer_not_to_say';
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
export type TasteSurveyContextFieldId = 'ageRange' | 'sexContext' | 'smokingStatus';

export interface TasteSurveyInstrumentMetadata {
  id: TasteSurveyInstrumentId;
  title: string;
  version: TasteSurveyVersion;
}

export interface TasteSurveyAnchor {
  description: string;
  label: string;
  stability: TasteSurveyAnchorStability;
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
  recallWindow: TasteSurveyRecallWindow;
  reverseKeyed: false;
  tasteId: TasteId;
}

export interface TasteSurveyResponse {
  itemId: TasteSurveyItem['id'];
  selectedValue: TasteSurveyLikertValue | null;
  uncertain: boolean;
}

export interface TasteSurveyRespondentContext {
  ageRange?: TasteSurveyAgeRange;
  sexContext?: TasteSurveySexContext;
  smokingStatus?: TasteSurveySmokingStatus;
}

export interface TasteSurveyLikertScaleConfig {
  labels: Record<TasteSurveyLikertValue, string>;
  max: 7;
  min: 1;
  neutralValue: 4;
  uncertainLabel: string;
}

export interface TasteSurveyScoringConfig {
  constructs: readonly TasteSurveyConstruct[];
  outputSnapshotSource: 'broad-starter';
  recallWindow: TasteSurveyRecallWindow;
}

export interface TasteSurveyCompatibleResult {
  snapshot: TasteMeasurementSnapshot;
  starterGuidance: RestaurantReadyGuidance;
}
