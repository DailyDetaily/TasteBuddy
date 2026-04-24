import type {
  TasteSurveyInstrumentMetadata,
  TasteSurveyLikertScaleConfig,
  TasteSurveyScoringConfig,
} from '../types/tasteSurvey';

export const TASTE_SURVEY_INSTRUMENT = {
  id: 'taste-buddy-initial-six-taste-survey',
  title: 'Taste Buddy Initial Six-Taste Survey',
  version: '1.0.0',
} as const satisfies TasteSurveyInstrumentMetadata;

export const TASTE_SURVEY_LIKERT_SCALE = {
  min: 1,
  max: 7,
  neutralValue: 4,
  uncertainLabel: '잘 모르겠어요',
  labels: {
    1: '전혀 그렇지 않다',
    2: '그렇지 않은 편이다',
    3: '조금 그렇지 않다',
    4: '보통이다',
    5: '조금 그렇다',
    6: '그런 편이다',
    7: '매우 그렇다',
  },
} as const satisfies TasteSurveyLikertScaleConfig;

export const TASTE_SURVEY_SCORING_CONFIG = {
  constructs: ['salience', 'overload'],
  outputSnapshotSource: 'broad-starter',
  recallWindow: 'recent-3-months',
} as const satisfies TasteSurveyScoringConfig;

export const TASTE_SURVEY_TASTE_ORDER = [
  'sweet',
  'salty',
  'sour',
  'bitter',
  'umami',
  'fat',
] as const;
