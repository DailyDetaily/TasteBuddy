import type {
  TasteSurveyContextFieldId,
  TasteSurveyInstrumentMetadata,
  TasteSurveyLikertScaleConfig,
  TasteSurveyScoringConfig,
  TasteSurveySexContext,
  TasteSurveySmokingStatus,
  TasteSurveyUncertaintyReason,
} from '../types/tasteSurvey';

export const TASTE_SURVEY_INSTRUMENT = {
  id: 'taste-buddy-initial-six-taste-survey',
  title: 'Taste Buddy Reference Food Recall Survey',
  version: '2.0.0',
} as const satisfies TasteSurveyInstrumentMetadata;

export const TASTE_SURVEY_LIKERT_SCALE = {
  min: 0,
  max: 4,
  midpointValue: 2,
  uncertainLabel: '기억나지 않아요',
  labels: {
    0: '전혀 느끼지 않음',
    1: '약하게 느껴짐',
    2: '중간 정도로 느껴짐',
    3: '강하게 느껴짐',
    4: '매우 강하게 느껴짐',
  },
} as const satisfies TasteSurveyLikertScaleConfig;

export const TASTE_SURVEY_SCORING_CONFIG = {
  constructs: ['recalled_intensity'],
  outputSnapshotSource: 'recalled-intensity',
  recallWindow: 'recent-3-months',
} as const satisfies TasteSurveyScoringConfig;

export const TASTE_SURVEY_UNCERTAINTY_LABELS: Record<TasteSurveyUncertaintyReason, string> = {
  never_tried: '먹어본 적 없어요',
  cannot_recall: '기억나지 않아요',
  cannot_isolate_taste: '지방맛을 구분하기 어려워요',
};

export const TASTE_SURVEY_TASTE_ORDER = [
  'sweet',
  'salty',
  'sour',
  'bitter',
  'umami',
  'fat',
] as const;

export const TASTE_SURVEY_CONTEXT_COPY = {
  title: '설문 해석에 참고할 정보',
  description:
    '이 정보는 미각 설문을 더 안정적으로 해석하기 위한 참고값이에요. 진단이나 평가 목적이 아니며, 답변하지 않아도 설문을 계속할 수 있어요.',
  birthDateTitle: '생년월일',
  sexContextTitle: '성별 관련 정보',
  smokingStatusTitle: '흡연 상태',
} as const;

export const TASTE_SURVEY_CONTEXT_OPTIONS = {
  sexContext: [
    { value: 'female', label: '여성' },
    { value: 'male', label: '남성' },
    { value: 'other_or_not_listed', label: '기타 / 직접 응답하지 않음' },
    { value: 'prefer_not_to_say', label: '답변하지 않음' },
  ] as const satisfies readonly { label: string; value: TasteSurveySexContext }[],
  smokingStatus: [
    { value: 'never', label: '비흡연' },
    { value: 'former', label: '과거 흡연' },
    { value: 'current', label: '현재 흡연' },
    { value: 'prefer_not_to_say', label: '답변하지 않음' },
  ] as const satisfies readonly { label: string; value: TasteSurveySmokingStatus }[],
} as const;

export const TASTE_SURVEY_CONTEXT_STEPS = [
  {
    id: 'birthDate',
    badgeLabel: '생년월일',
    title: '생년월일을 선택해주세요.',
    description: '선택한 날짜는 미각 응답을 더 안정적으로 해석하기 위한 참고값으로만 사용됩니다.',
    options: [],
  },
  {
    id: 'sexContext',
    badgeLabel: '참고 정보',
    title: '성별 관련 정보를 선택해주세요.',
    description: '정체성 판단이 아니라 향후 미각 기준 보정을 위한 참고값으로만 사용됩니다.',
    options: TASTE_SURVEY_CONTEXT_OPTIONS.sexContext,
  },
  {
    id: 'smokingStatus',
    badgeLabel: '생활 맥락',
    title: '흡연 상태를 선택해주세요.',
    description: '점수를 조정하지 않고, 결과 해석과 향후 confidence 개선에 참고합니다.',
    options: TASTE_SURVEY_CONTEXT_OPTIONS.smokingStatus,
  },
] as const satisfies readonly {
  badgeLabel: string;
  description: string;
  id: TasteSurveyContextFieldId;
  options: readonly { label: string; value: string }[];
  title: string;
}[];
