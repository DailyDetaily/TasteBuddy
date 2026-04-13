import { TASTE_IDS, TASTE_TOKENS, type TasteId } from './designTokens';
import {
  createTasteMeasurementSnapshot,
  resolveTasteMeasurementValue,
  type TasteMeasurementSnapshot,
} from './tasteMeasurementData';

export type QuickCalibrationSliderValue = -3 | -2 | -1 | 0 | 1 | 2 | 3;
export type QuickTasteCalibrationQuestionId = TasteId;
export type QuickTasteCalibrationResponses = Partial<
  Record<QuickTasteCalibrationQuestionId, QuickCalibrationSliderValue>
>;
export type StarterAxisVector = Record<TasteId, number>;
export type AbsoluteTasteVector = Record<TasteId, number>;

export interface StarterDiningContext {
  baselineReference: 'popular-k-fnb';
  calibrationMode: 'digital-anchoring';
}

export interface RestaurantReadyGuidance {
  cautionAxis: TasteId;
  cautionLabel: string;
  confidence: 'Starter' | 'Building' | 'Refined';
  context: StarterDiningContext;
  evidence: string[];
  goalPhrase: string;
  summaryLine: string;
  surfaceLabel: string;
  topAxes: TasteId[];
  topLabels: string[];
}

type SliderCopyMap = Record<QuickCalibrationSliderValue, string>;

export interface QuickCalibrationResult {
  absoluteScores: AbsoluteTasteVector;
  relativeScores: Record<TasteId, QuickCalibrationSliderValue>;
  snapshot: TasteMeasurementSnapshot;
  starterGuidance: RestaurantReadyGuidance;
}

export interface QuickTasteCalibrationQuestion {
  anchorDetail: string;
  anchorName: string;
  calibrationHint: string;
  description: string;
  eyebrow: string;
  id: QuickTasteCalibrationQuestionId;
  responseLabels: SliderCopyMap;
  responseNotes: SliderCopyMap;
  scaleCenterLabel: string;
  scaleLeftLabel: string;
  scaleRightLabel: string;
  tasteId: TasteId;
  title: string;
}

export interface QuickTasteCalibrationSelection {
  absoluteScore: number;
  measurementValue: number;
  question: QuickTasteCalibrationQuestion;
  responseLabel: string;
  responseNote: string;
  sliderValue: QuickCalibrationSliderValue;
}

export const QUICK_CALIBRATION_SLIDER_VALUES = [-3, -2, -1, 0, 1, 2, 3] as const;

const QUICK_CALIBRATION_SCALE_ZERO = 0;
const QUICK_CALIBRATION_ABSOLUTE_MAX = 100;
const QUICK_CALIBRATION_RELATIVE_MIN = -3;
const QUICK_CALIBRATION_RELATIVE_MAX = 3;

const DEFAULT_STARTER_CONTEXT: StarterDiningContext = {
  baselineReference: 'popular-k-fnb',
  calibrationMode: 'digital-anchoring',
};

function clampQuickCalibrationValue(value: number): QuickCalibrationSliderValue {
  const roundedValue = Math.round(value);

  if (roundedValue <= QUICK_CALIBRATION_RELATIVE_MIN) {
    return QUICK_CALIBRATION_RELATIVE_MIN;
  }

  if (roundedValue >= QUICK_CALIBRATION_RELATIVE_MAX) {
    return QUICK_CALIBRATION_RELATIVE_MAX;
  }

  return roundedValue as QuickCalibrationSliderValue;
}

function createSliderCopyMap(values: readonly string[]): SliderCopyMap {
  return QUICK_CALIBRATION_SLIDER_VALUES.reduce((accumulator, sliderValue, index) => {
    accumulator[sliderValue] = values[index] ?? values[0] ?? '';
    return accumulator;
  }, {} as SliderCopyMap);
}

function createQuestion(
  config: Omit<QuickTasteCalibrationQuestion, 'responseLabels' | 'responseNotes'> & {
    responseLabels: readonly string[];
    responseNotes: readonly string[];
  },
): QuickTasteCalibrationQuestion {
  return {
    ...config,
    responseLabels: createSliderCopyMap(config.responseLabels),
    responseNotes: createSliderCopyMap(config.responseNotes),
  };
}

export const QUICK_TASTE_CALIBRATION_QUESTIONS: readonly QuickTasteCalibrationQuestion[] = [
  createQuestion({
    id: 'sweet',
    tasteId: 'sweet',
    eyebrow: '01 단맛',
    title: '바나나맛우유의 단맛은\n지금의 나에게 어느 쪽에 가까운가요?',
    description:
      '정확한 숫자보다, 모두가 아는 단맛 기준이 내 입에서 어떻게 읽히는지 골라주세요.',
    anchorName: '빙그레 바나나맛우유',
    anchorDetail: '한 모금 마셨을 때 느껴지는 기본 단맛을 떠올려보세요.',
    calibrationHint:
      '기준보다 달게 느껴질수록 단맛 좌표는 낮아지고, 덜 달게 느껴질수록 높아져요.',
    scaleLeftLabel: '너무 달다',
    scaleCenterLabel: '기분 좋다',
    scaleRightLabel: '아쉽다',
    responseLabels: [
      '훨씬 달다',
      '꽤 달다',
      '조금 달다',
      '딱 좋다',
      '조금 아쉽다',
      '더 달아도 좋다',
      '훨씬 더 달아야 한다',
    ],
    responseNotes: [
      '단맛은 과하게 쌓이기 전에 충분히 느껴져서 강도를 많이 덜어낸 쪽이 잘 맞아요.',
      '단맛은 지금보다 한 톤만 가벼워져도 더 편안하게 느껴질 가능성이 커요.',
      '단맛은 기준보다 조금만 담백해져도 더 자연스럽게 맞을 수 있어요.',
      '단맛은 기준점에 가까운 구간에서 가장 편안하게 느껴져요.',
      '단맛은 기준보다 조금 더 분명할 때 만족감이 올라갈 수 있어요.',
      '단맛은 기준보다 또렷해야 디저트나 소스의 매력이 살아나는 편이에요.',
      '단맛은 꽤 강하게 살아야 만족감이 올라가는 편이에요.',
    ],
  }),
  createQuestion({
    id: 'sour',
    tasteId: 'sour',
    eyebrow: '02 신맛',
    title: '수제버거집 기본 피클의 산미는\n지금의 나에게 어느 쪽에 가까운가요?',
    description:
      '강한 산미를 좋아하는지보다, 익숙한 기준점이 내 입에 어떻게 들어오는지 떠올려보세요.',
    anchorName: '수제버거집 기본 피클',
    anchorDetail: '햄버거와 함께 나오는 얇은 피클 한 조각의 첫 인상을 떠올려보세요.',
    calibrationHint:
      '기준보다 부담스럽게 느껴질수록 신맛 좌표는 낮아지고, 더 즐겁게 느껴질수록 높아져요.',
    scaleLeftLabel: '불호',
    scaleCenterLabel: '적당히 즐김',
    scaleRightLabel: '극호',
    responseLabels: [
      '거의 못 먹는다',
      '꽤 부담스럽다',
      '조금 부담스럽다',
      '적당히 즐긴다',
      '조금 더 강해도 좋다',
      '강한 산미가 좋다',
      '강한 산미를 찾아먹는다',
    ],
    responseNotes: [
      '신맛은 강하게 치고 올라오기보다 많이 완화된 강도에서 훨씬 편안해요.',
      '신맛은 한 톤만 눌러줘도 훨씬 안정적으로 느껴질 가능성이 커요.',
      '신맛은 기준보다 조금만 부드러워도 더 잘 맞을 수 있어요.',
      '신맛은 기준점에 가까운 산뜻함에서 가장 자연스럽게 느껴져요.',
      '신맛은 기준보다 조금 더 또렷할 때 식사의 리듬을 더 즐길 수 있어요.',
      '신맛은 강한 산미가 살아 있어야 만족감이 생기는 편이에요.',
      '신맛은 분명하고 강한 산미를 오히려 찾아서 즐기는 편이에요.',
    ],
  }),
  createQuestion({
    id: 'bitter',
    tasteId: 'bitter',
    eyebrow: '03 쓴맛',
    title: '스타벅스 톨 아메리카노 투샷은\n지금의 나에게 어느 쪽에 가까운가요?',
    description:
      '쓴맛 자체의 취향보다, 대중적인 기준점이 나에게 어떻게 읽히는지에 집중해보세요.',
    anchorName: '스타벅스 아메리카노 톨 사이즈 기본 투샷',
    anchorDetail: '뜨거운 아메리카노 첫 두세 모금의 인상을 떠올려보세요.',
    calibrationHint:
      '기준보다 쓰게 느껴질수록 쓴맛 좌표는 낮아지고, 연하게 느껴질수록 높아져요.',
    scaleLeftLabel: '너무 쓰다',
    scaleCenterLabel: '기분 좋다',
    scaleRightLabel: '연하다',
    responseLabels: [
      '훨씬 쓰다',
      '꽤 쓰다',
      '조금 쓰다',
      '딱 좋다',
      '조금 연하다',
      '꽤 연하다',
      '훨씬 연하다',
    ],
    responseNotes: [
      '쓴맛은 강하게 밀기보다 정리된 톤에서 훨씬 안정적으로 느껴져요.',
      '쓴맛은 한 톤만 낮아져도 훨씬 편안하게 받아들여질 가능성이 커요.',
      '쓴맛은 기준보다 조금만 가벼워도 더 잘 맞을 수 있어요.',
      '쓴맛은 기준점에 가까운 강도에서 균형 있게 느껴져요.',
      '쓴맛은 기준보다 조금 더 또렷할 때 캐릭터가 살아날 수 있어요.',
      '쓴맛은 분명한 존재감이 있을 때 만족감이 올라가는 편이에요.',
      '쓴맛은 확실히 살아 있어야 커피나 탄 향의 매력을 더 잘 느끼는 편이에요.',
    ],
  }),
  createQuestion({
    id: 'salty',
    tasteId: 'salty',
    eyebrow: '04 짠맛',
    title: '신라면 기본 국물은\n지금의 나에게 어느 쪽에 가까운가요?',
    description:
      '추상적인 점수 대신, 익숙한 기준 음식이 내 입에 어떻게 느껴지는지만 확인해요.',
    anchorName: '신라면 기본 레시피 국물',
    anchorDetail: '집에서 끓인 첫 몇 숟갈의 간을 떠올려보세요.',
    calibrationHint:
      '기준보다 짜게 느껴질수록 짠맛 좌표는 낮아지고, 싱겁게 느껴질수록 높아져요.',
    scaleLeftLabel: '짜다',
    scaleCenterLabel: '딱 맞다',
    scaleRightLabel: '싱겁다',
    responseLabels: [
      '훨씬 짜다',
      '꽤 짜다',
      '조금 짜다',
      '딱 맞다',
      '조금 싱겁다',
      '꽤 싱겁다',
      '훨씬 싱겁다',
    ],
    responseNotes: [
      '짠맛은 기준보다 꽤 강하게 느껴져서 한 톤 덜어낸 쪽이 더 편안해요.',
      '짠맛이 조금만 줄어도 훨씬 안정적으로 느껴질 가능성이 커요.',
      '짠맛은 기준보다 살짝만 가벼워져도 더 잘 맞을 수 있어요.',
      '짠맛은 기준점에 가까운 간에서 가장 편하게 받아들여져요.',
      '짠맛은 기준보다 조금 더 또렷해야 만족감이 올라갈 수 있어요.',
      '짠맛은 기준보다 더 분명한 간에서 반응이 살아나는 편이에요.',
      '짠맛은 기준보다 확실히 또렷한 간에서 만족도가 높아질 가능성이 커요.',
    ],
  }),
  createQuestion({
    id: 'umami',
    tasteId: 'umami',
    eyebrow: '05 감칠맛',
    title: '평양냉면 육수의 깊이는\n지금의 나에게 어느 쪽에 가까운가요?',
    description:
      '은은한 국물의 깊이를 기준점으로 삼아, 감칠맛 축의 시작 좌표를 빠르게 잡아요.',
    anchorName: '평양냉면 육수',
    anchorDetail: '맑은 고기 육수를 한 모금 마셨을 때의 첫 인상을 떠올려보세요.',
    calibrationHint:
      '기준보다 밋밋하게 느껴질수록 감칠맛 좌표는 낮아지고, 깊게 반응할수록 높아져요.',
    scaleLeftLabel: '맹맛이다',
    scaleCenterLabel: '은은하다',
    scaleRightLabel: '깊게 반응한다',
    responseLabels: [
      '훨씬 밋밋하다',
      '꽤 밋밋하다',
      '조금 약하다',
      '은은해서 좋다',
      '조금 더 깊다',
      '꽤 깊게 느껴진다',
      '아주 깊게 반응한다',
    ],
    responseNotes: [
      '감칠맛은 지금보다 훨씬 더 살아나야 만족이 생길 가능성이 커요.',
      '감칠맛은 한 톤만 깊어져도 훨씬 만족도가 올라갈 수 있어요.',
      '감칠맛은 기준보다 조금만 더 분명해져도 더 잘 맞을 수 있어요.',
      '감칠맛은 기준점에 가까운 은은함에서 가장 자연스럽게 느껴져요.',
      '감칠맛은 기준보다 조금 더 깊게 느껴질 때 반응이 살아나요.',
      '감칠맛은 꽤 깊게 읽힐 때 만족감이 분명해지는 편이에요.',
      '감칠맛은 아주 깊고 선명하게 읽혀야 제대로 반응하는 편이에요.',
    ],
  }),
  createQuestion({
    id: 'fat',
    tasteId: 'fat',
    eyebrow: '06 지방',
    title: '삼겹살 첫 입의 고소함은\n지금의 나에게 어느 쪽에 가까운가요?',
    description:
      '기름지다, 고소하다의 취향을 숫자로 묻지 않고 기준 음식 하나로 빠르게 잡아요.',
    anchorName: '삼겹살 첫 입의 고소함',
    anchorDetail: '막 구운 삼겹살 첫 점을 먹었을 때의 고소함과 무게감을 떠올려보세요.',
    calibrationHint:
      '기준보다 느끼하게 느껴질수록 지방 좌표는 낮아지고, 부족하게 느껴질수록 높아져요.',
    scaleLeftLabel: '느끼하다',
    scaleCenterLabel: '고소하다',
    scaleRightLabel: '부족하다',
    responseLabels: [
      '훨씬 느끼하다',
      '꽤 느끼하다',
      '조금 느끼하다',
      '고소해서 좋다',
      '조금 부족하다',
      '꽤 부족하다',
      '훨씬 부족하다',
    ],
    responseNotes: [
      '지방감은 크게 눌러준 쪽이 훨씬 편안하고 안정적으로 느껴져요.',
      '지방감은 한 톤만 가벼워도 만족감이 올라갈 가능성이 커요.',
      '지방감은 기준보다 조금만 덜 무거워도 더 자연스럽게 맞을 수 있어요.',
      '지방감은 기준점에 가까운 고소함에서 가장 편안해요.',
      '지방감은 기준보다 조금 더 분명할 때 만족감이 올라갈 수 있어요.',
      '지방감은 꽤 또렷해야 재료의 매력을 잘 느끼는 편이에요.',
      '지방감은 확실하게 살아 있어야 고소함이 제대로 느껴지는 편이에요.',
    ],
  }),
] as const;

function resolveQuickCalibrationSliderValue(
  responses: QuickTasteCalibrationResponses,
  questionId: QuickTasteCalibrationQuestionId,
): QuickCalibrationSliderValue {
  const rawValue = responses[questionId];

  if (typeof rawValue !== 'number' || Number.isNaN(rawValue)) {
    return QUICK_CALIBRATION_SCALE_ZERO;
  }

  return clampQuickCalibrationValue(rawValue);
}

function relativeValueToAbsoluteScore(value: QuickCalibrationSliderValue) {
  return Math.round(
    ((value - QUICK_CALIBRATION_RELATIVE_MIN)
      / (QUICK_CALIBRATION_RELATIVE_MAX - QUICK_CALIBRATION_RELATIVE_MIN))
      * QUICK_CALIBRATION_ABSOLUTE_MAX,
  );
}

function absoluteScoreToMeasurementValue(score: number) {
  return Number((score / 10).toFixed(1));
}

function average(values: readonly number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getAxisGroupDescriptor(values: readonly number[]) {
  const averageValue = average(values);

  if (averageValue >= 7.6) {
    return '기준점보다 훨씬 또렷하게';
  }

  if (averageValue >= 5.9) {
    return '기준점보다 조금 더 또렷하게';
  }

  if (averageValue <= 2.4) {
    return '강하게 밀기보다 많이 덜어냈을 때';
  }

  if (averageValue <= 4.1) {
    return '한 톤 덜어냈을 때';
  }

  return '기준점에 가깝게';
}

function getProfileBalancePhrase(values: readonly number[]) {
  const averageValue = average(values);

  if (averageValue >= 6.7) {
    return '맛의 결이 분명한 메뉴';
  }

  if (averageValue <= 3.3) {
    return '강도를 한 톤 정리한 메뉴';
  }

  return '기준점 근처에서 밸런스가 좋은 메뉴';
}

function getCautionClause(axisLabel: string, value: number) {
  if (value <= 2.4) {
    return `${axisLabel}은 한 번에 세게 밀기보다 여백을 두는 편이 안정적이에요.`;
  }

  if (value <= 4.1) {
    return `${axisLabel}은 과하게 밀지 않는 편이 더 편안해요.`;
  }

  if (value >= 7.6) {
    return `${axisLabel}은 반응이 빠른 편이라 과해지면 전체 인상이 쉽게 무거워질 수 있어요.`;
  }

  return `${axisLabel}은 다른 축과의 균형을 보며 조절하면 좋아요.`;
}

function getSortedAxisEntries(vector: StarterAxisVector) {
  return [...TASTE_IDS]
    .map((tasteId) => ({
      id: tasteId,
      label: TASTE_TOKENS[tasteId].label,
      value: vector[tasteId],
    }))
    .sort((left, right) => right.value - left.value);
}

export function isRestaurantReadyGuidance(value: unknown): value is RestaurantReadyGuidance {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<RestaurantReadyGuidance>;

  return (
    typeof candidate.summaryLine === 'string'
    && Array.isArray(candidate.topAxes)
    && Array.isArray(candidate.evidence)
    && typeof candidate.cautionAxis === 'string'
    && typeof candidate.confidence === 'string'
  );
}

export function createInitialQuickTasteCalibrationResponses(): QuickTasteCalibrationResponses {
  return QUICK_TASTE_CALIBRATION_QUESTIONS.reduce((accumulator, question) => {
    accumulator[question.id] = QUICK_CALIBRATION_SCALE_ZERO;
    return accumulator;
  }, {} as QuickTasteCalibrationResponses);
}

export function getQuickTasteCalibrationQuestion(questionId: QuickTasteCalibrationQuestionId) {
  return QUICK_TASTE_CALIBRATION_QUESTIONS.find((question) => question.id === questionId) ?? null;
}

export function getQuickTasteCalibrationSelection(
  responses: QuickTasteCalibrationResponses,
  questionId: QuickTasteCalibrationQuestionId,
): QuickTasteCalibrationSelection | null {
  const question = getQuickTasteCalibrationQuestion(questionId);

  if (!question) {
    return null;
  }

  const sliderValue = resolveQuickCalibrationSliderValue(responses, questionId);
  const absoluteScore = relativeValueToAbsoluteScore(sliderValue);

  return {
    absoluteScore,
    measurementValue: absoluteScoreToMeasurementValue(absoluteScore),
    question,
    responseLabel: question.responseLabels[sliderValue],
    responseNote: question.responseNotes[sliderValue],
    sliderValue,
  };
}

export function getQuickTasteCalibrationSelections(
  responses: QuickTasteCalibrationResponses,
) {
  return QUICK_TASTE_CALIBRATION_QUESTIONS.map((question) =>
    getQuickTasteCalibrationSelection(responses, question.id),
  ).filter((selection): selection is QuickTasteCalibrationSelection => selection !== null);
}

export function createAbsoluteTasteVector(
  responses: QuickTasteCalibrationResponses,
): AbsoluteTasteVector {
  return TASTE_IDS.reduce((accumulator, tasteId) => {
    accumulator[tasteId] = relativeValueToAbsoluteScore(
      resolveQuickCalibrationSliderValue(responses, tasteId),
    );
    return accumulator;
  }, {} as AbsoluteTasteVector);
}

export function createRelativeTasteVector(
  responses: QuickTasteCalibrationResponses,
): Record<TasteId, QuickCalibrationSliderValue> {
  return TASTE_IDS.reduce((accumulator, tasteId) => {
    accumulator[tasteId] = resolveQuickCalibrationSliderValue(responses, tasteId);
    return accumulator;
  }, {} as Record<TasteId, QuickCalibrationSliderValue>);
}

export function createStarterAxisVector(
  responses: QuickTasteCalibrationResponses,
): StarterAxisVector {
  const absoluteScores = createAbsoluteTasteVector(responses);

  return TASTE_IDS.reduce((accumulator, tasteId) => {
    accumulator[tasteId] = absoluteScoreToMeasurementValue(absoluteScores[tasteId]);
    return accumulator;
  }, {} as StarterAxisVector);
}

function toTasteMeasurementResults(vector: StarterAxisVector) {
  return TASTE_IDS.reduce<Record<TasteId, number>>((accumulator, tasteId) => {
    accumulator[tasteId] = Number(vector[tasteId].toFixed(1));
    return accumulator;
  }, {} as Record<TasteId, number>);
}

export function createQuickTasteCalibrationSnapshot(
  responses: QuickTasteCalibrationResponses,
): TasteMeasurementSnapshot {
  const vector = createStarterAxisVector(responses);

  return createTasteMeasurementSnapshot(
    toTasteMeasurementResults(vector),
    new Date().toISOString(),
    'broad-starter',
  );
}

function buildEvidence(
  vector: StarterAxisVector,
  topEntries: ReturnType<typeof getSortedAxisEntries>,
  cautionLabel: string,
) {
  const values = TASTE_IDS.map((tasteId) => vector[tasteId]);
  const balancePhrase = getProfileBalancePhrase(values);
  const firstEntry = topEntries[0];
  const secondEntry = topEntries[1];

  return [
    `${firstEntry?.label ?? '첫 축'}은 ${getStarterAxisPreferenceLabel(firstEntry?.value ?? 5)} 편이에요.`,
    `${secondEntry?.label ?? '둘째 축'}도 ${getStarterAxisPreferenceLabel(secondEntry?.value ?? 5)} 축으로 읽혀요.`,
    `조심할 축은 ${cautionLabel}이고, 강도를 과하게 밀지 않는 편이 좋아요.`,
    `전체적인 시작점은 ${balancePhrase}에 가까워요.`,
  ];
}

export function buildRestaurantReadyGuidanceFromAxisVector(
  vector: StarterAxisVector,
  context: StarterDiningContext = DEFAULT_STARTER_CONTEXT,
  confidence: RestaurantReadyGuidance['confidence'] = 'Starter',
): RestaurantReadyGuidance {
  const sortedEntries = getSortedAxisEntries(vector);
  const topEntries = sortedEntries.slice(0, 2);
  const topAxes = topEntries.map((entry) => entry.id);
  const topLabels = topEntries.map((entry) => entry.label);
  const cautionAxis = sortedEntries[sortedEntries.length - 1]?.id ?? 'fat';
  const cautionValue = vector[cautionAxis];
  const cautionLabel = TASTE_TOKENS[cautionAxis].label;
  const allValues = TASTE_IDS.map((tasteId) => vector[tasteId]);
  const spread = (sortedEntries[0]?.value ?? 0) - (sortedEntries[sortedEntries.length - 1]?.value ?? 0);
  const topLabelText = topLabels.join('과 ');
  const goalPhrase = getProfileBalancePhrase(allValues);
  const cautionClause = getCautionClause(cautionLabel, cautionValue);
  const summaryLine =
    spread < 1.2
      ? `전반적으로 기준점에 가까운 균형형 스타터 프로필이에요. ${cautionClause} 첫 추천은 ${goalPhrase} 쪽으로 시작하면 잘 맞을 가능성이 높아요.`
      : `지금은 ${topLabelText} 축이 ${getAxisGroupDescriptor(topEntries.map((entry) => entry.value))} 살아나요. ${cautionClause} 첫 추천은 ${goalPhrase} 쪽으로 시작하면 잘 맞을 가능성이 높아요.`;

  return {
    cautionAxis,
    cautionLabel,
    confidence,
    context,
    evidence: buildEvidence(vector, sortedEntries, cautionLabel),
    goalPhrase,
    summaryLine,
    surfaceLabel: '빠른 스타터 가이드',
    topAxes,
    topLabels,
  };
}

export function buildRestaurantReadyGuidanceFromSnapshot(
  snapshot: TasteMeasurementSnapshot,
  context: StarterDiningContext = DEFAULT_STARTER_CONTEXT,
  confidence: RestaurantReadyGuidance['confidence'] = 'Starter',
) {
  const vector = TASTE_IDS.reduce<StarterAxisVector>((accumulator, tasteId) => {
    accumulator[tasteId] = resolveTasteMeasurementValue(snapshot, tasteId);
    return accumulator;
  }, {} as StarterAxisVector);

  return buildRestaurantReadyGuidanceFromAxisVector(vector, context, confidence);
}

export function createQuickCalibrationResult(
  responses: QuickTasteCalibrationResponses,
): QuickCalibrationResult {
  const absoluteScores = createAbsoluteTasteVector(responses);
  const relativeScores = createRelativeTasteVector(responses);
  const snapshot = createQuickTasteCalibrationSnapshot(responses);
  const starterGuidance = buildRestaurantReadyGuidanceFromSnapshot(
    snapshot,
    DEFAULT_STARTER_CONTEXT,
    'Starter',
  );

  return {
    absoluteScores,
    relativeScores,
    snapshot,
    starterGuidance,
  };
}

export function mergeRestaurantReadyGuidanceWithSnapshot(
  guidance: RestaurantReadyGuidance,
  snapshot: TasteMeasurementSnapshot,
  confidence: RestaurantReadyGuidance['confidence'] = guidance.confidence,
) {
  return buildRestaurantReadyGuidanceFromSnapshot(snapshot, DEFAULT_STARTER_CONTEXT, confidence);
}

export function createFallbackRestaurantReadyGuidance(
  snapshot: TasteMeasurementSnapshot,
) {
  return buildRestaurantReadyGuidanceFromSnapshot(snapshot, DEFAULT_STARTER_CONTEXT, 'Starter');
}

export function getStarterAxisPreferenceLabel(value: number) {
  if (value <= 2.4) {
    return '강하게 밀기보다 훨씬 덜어냈을 때 편안한';
  }

  if (value <= 4.1) {
    return '조금 덜어냈을 때 안정적인';
  }

  if (value >= 7.6) {
    return '기준보다 훨씬 선명해야 반응하는';
  }

  if (value >= 5.9) {
    return '기준보다 조금 선명할 때 살아나는';
  }

  return '기준점에 가깝게 편안한';
}

export function getStarterAxisDisplayLabel(value: number) {
  if (value <= 2.4) {
    return '많이 덜';
  }

  if (value <= 4.1) {
    return '조금 덜';
  }

  if (value >= 7.6) {
    return '많이 더';
  }

  if (value >= 5.9) {
    return '조금 더';
  }

  return '기준점';
}
