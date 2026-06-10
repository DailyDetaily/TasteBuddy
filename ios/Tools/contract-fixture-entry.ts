import {
  buildPreferenceIntakeProfile,
  getNextPreferenceMultiSelectValue,
  isPreferenceQuestionAnswered,
  PREFERENCE_INTAKE_QUESTIONS,
  type PreferenceIntakeQuestionId,
  type PreferenceIntakeResponses,
} from '../../src/constants/preferenceIntakeData';
import {
  buildRestaurantReadyGuidanceFromAxisVector,
  createAbsoluteTasteVector,
  createRelativeTasteVector,
  createStarterAxisVector,
  type QuickTasteCalibrationResponses,
} from '../../src/constants/quickTasteCalibrationData';
import { diningDetailTagCategories } from '../../src/constants/diningDetailTags';
import { DINING_FEEDBACK_SCENARIOS } from '../../src/constants/diningFeedbackData';
import { DISH_KIND_OPTIONS } from '../../src/constants/dishKindTags';
import { TASTE_IDS } from '../../src/constants/designTokens';
import {
  TASTE_SURVEY_CONTEXT_STEPS,
  TASTE_SURVEY_INSTRUMENT,
  TASTE_SURVEY_LIKERT_SCALE,
} from '../../src/constants/tasteSurveyConfig';
import { TASTE_SURVEY_ITEMS } from '../../src/constants/tasteSurveyItems';
import { buildTasteSurveyCompatibleResult } from '../../src/lib/tasteSurveyScoring';
import { TBA } from '../../src/lib/tasteBuddyAgent';
import type { TasteSurveyResponse } from '../../src/types/tasteSurvey';

const FIXED_MEASURED_AT = '2026-06-05T00:00:00.000Z';
const FIXED_TBA_GENERATED_AT = '2026-06-05T00:00:00.000Z';

function createQuickCalibrationCase(
  id: string,
  responses: QuickTasteCalibrationResponses,
) {
  const axisVector = createStarterAxisVector(responses);

  return {
    id,
    responses,
    expected: {
      absoluteScores: createAbsoluteTasteVector(responses),
      relativeScores: createRelativeTasteVector(responses),
      snapshot: {
        measuredAt: FIXED_MEASURED_AT,
        results: axisVector,
        source: 'broad-starter',
      },
      starterGuidance: buildRestaurantReadyGuidanceFromAxisVector(axisVector),
    },
  };
}

function createSurveyResponses(
  selectedValue: TasteSurveyResponse['selectedValue'],
): TasteSurveyResponse[] {
  return TASTE_SURVEY_ITEMS.map((item) => ({
    itemId: item.id,
    selectedValue,
    uncertain: selectedValue === null,
  }));
}

function createSurveyCase(
  id: string,
  responses: TasteSurveyResponse[],
) {
  const result = buildTasteSurveyCompatibleResult(responses);

  return {
    id,
    responses,
    expected: {
      ...result,
      snapshot: {
        ...result.snapshot,
        measuredAt: FIXED_MEASURED_AT,
      },
    },
  };
}

const PREFERENCE_REFERENCE_RESPONSES: PreferenceIntakeResponses = {
  allergies: ['allergies-none'],
  avoidedSignals: ['avoided-signals-none'],
  dietaryRestrictions: ['dietary-restrictions-none'],
  explorationStyle: 'balanced',
  flavorIntensityPreference: 'balanced',
  preferredCuisineTypes: ['korean-course'],
  sharePreferenceWithRestaurant: 'preview-first',
};

function createPreferenceSelectionCase(
  id: string,
  questionId: PreferenceIntakeQuestionId,
  currentValue: string[],
  optionId: string,
) {
  const question = PREFERENCE_INTAKE_QUESTIONS.find(
    (candidate) => candidate.id === questionId,
  );

  if (!question || question.selectionMode !== 'multiple') {
    throw new Error(`Expected multiple preference question: ${questionId}`);
  }

  return {
    id,
    questionId,
    currentValue,
    optionId,
    expected: getNextPreferenceMultiSelectValue(question, currentValue, optionId),
  };
}

const TBA_DINING_ANALYSIS_INPUTS = [
  {
    id: 'home-broth',
    input: {
      detailTags: ['맑은 감칠맛', '가벼운 피니시', '산미'],
      dishKindTags: ['broth'],
      id: 'following-mina-broth',
      ingredients: ['육수'],
      restaurantName: '온지음',
      reviewSnippet: '감칠맛의 깊이는 살리면서 후반부 무게를 가볍게 읽기 좋은 기록이에요.',
      subject: '맑은 육수와 산뜻한 여운',
      tasteTags: ['감칠맛', '신맛'],
      techniques: [],
    },
  },
  {
    id: 'dining-broth',
    input: {
      detailTags: ['balance-umami-depth', 'balance-clear-seasoning', 'flow-clean-finish'],
      dishKindTags: ['broth'],
      id: 'dish-onjium-clear-broth',
      ingredients: ['육수'],
      restaurantName: '온지음',
      reviewSnippet: '감칠맛은 선명했지만 후반부의 무게가 가볍게 정리되어 편안하게 이어졌어요.',
      subject: '맑은 육수 코스',
      tasteTags: ['감칠맛', '짠맛', '신맛'],
      techniques: [],
    },
  },
  {
    id: 'dining-acidity',
    input: {
      detailTags: ['flow-first-clear', 'balance-sweet-support', 'balance-aftertaste-light'],
      dishKindTags: ['seafood'],
      id: 'dish-bistro-acidity',
      ingredients: ['생선', '시트러스'],
      restaurantName: '비스트로 샘플',
      reviewSnippet: '밝은 산미가 초반 리듬을 잘 만들었고, 단맛은 조금만 더 낮아도 좋겠다는 기록을 남겼어요.',
      subject: '시트러스 소스 생선 요리',
      tasteTags: ['신맛', '단맛'],
      techniques: ['소스'],
    },
  },
] as const;

function createTbaDiningAnalysisCase({
  id,
  input,
}: (typeof TBA_DINING_ANALYSIS_INPUTS)[number]) {
  return {
    id,
    input,
    expected: {
      note: TBA.buildDiningNote(input),
      snapshot: {
        ...TBA.buildDiningAnalysisSnapshot(input),
        generatedAt: FIXED_TBA_GENERATED_AT,
      },
    },
  };
}

export function buildContractFixtures() {
  return {
    quickCalibration: {
      schemaVersion: 1,
      sourceFiles: [
        'src/constants/designTokens.ts',
        'src/constants/quickTasteCalibrationData.ts',
        'src/constants/tasteMeasurementData.ts',
      ],
      cases: [
        createQuickCalibrationCase(
          'balanced',
          Object.fromEntries(TASTE_IDS.map((tasteId) => [tasteId, 0])),
        ),
        createQuickCalibrationCase('distinct-axes', {
          sweet: 3,
          sour: 2,
          bitter: 0,
          salty: -3,
          umami: 1,
          fat: -1,
        }),
      ],
    },
    tasteSurvey: {
      schemaVersion: 1,
      sourceFiles: [
        'src/constants/tasteSurveyConfig.ts',
        'src/constants/tasteSurveyItems.ts',
        'src/lib/tasteSurveyScoring.ts',
      ],
      instrument: TASTE_SURVEY_INSTRUMENT,
      likertScale: TASTE_SURVEY_LIKERT_SCALE,
      contextSteps: TASTE_SURVEY_CONTEXT_STEPS,
      items: TASTE_SURVEY_ITEMS,
      cases: [
        createSurveyCase('neutral', createSurveyResponses(4)),
        createSurveyCase('uncertain', createSurveyResponses(null)),
      ],
    },
    preferenceIntake: {
      schemaVersion: 1,
      sourceFiles: ['src/constants/preferenceIntakeData.ts'],
      questions: PREFERENCE_INTAKE_QUESTIONS,
      referenceResponses: PREFERENCE_REFERENCE_RESPONSES,
      expectedProfile: buildPreferenceIntakeProfile(PREFERENCE_REFERENCE_RESPONSES),
      answeredByQuestion: Object.fromEntries(
        PREFERENCE_INTAKE_QUESTIONS.map((question) => [
          question.id,
          isPreferenceQuestionAnswered(question, PREFERENCE_REFERENCE_RESPONSES),
        ]),
      ),
      selectionCases: [
        createPreferenceSelectionCase(
          'none-replaces-specific',
          'allergies',
          ['shellfish', 'dairy'],
          'allergies-none',
        ),
        createPreferenceSelectionCase(
          'specific-replaces-none',
          'allergies',
          ['allergies-none'],
          'shellfish',
        ),
        createPreferenceSelectionCase(
          'max-five-cuisines',
          'preferredCuisineTypes',
          ['korean-course', 'japanese-omakase', 'french', 'italian', 'chinese-dining'],
          'steakhouse',
        ),
        createPreferenceSelectionCase(
          'deselect-current-option',
          'preferredCuisineTypes',
          ['korean-course', 'french'],
          'french',
        ),
      ],
    },
    diningFeedback: {
      schemaVersion: 1,
      sourceFiles: [
        'src/constants/diningFeedbackData.ts',
        'src/constants/diningDetailTags.ts',
        'src/constants/dishKindTags.ts',
      ],
      scenario: DINING_FEEDBACK_SCENARIOS[3],
      detailTagCategories: diningDetailTagCategories,
      dishKindOptions: DISH_KIND_OPTIONS,
    },
    tbaDiningAnalysis: {
      schemaVersion: 1,
      sourceFiles: [
        'src/lib/tasteBuddyAgent.ts',
        'src/lib/tbaKnowledge.ts',
        'src/constants/tbaCoreTasteLexicon.ts',
        'src/constants/tbaFoodOnBridge.ts',
        'src/constants/tbaFoodKnowledgeRuntime.ts',
        'src/constants/tbaSignalTaxonomy.ts',
        'src/constants/diningDetailTags.ts',
        'src/constants/dishKindTags.ts',
      ],
      generatedAt: FIXED_TBA_GENERATED_AT,
      cases: TBA_DINING_ANALYSIS_INPUTS.map(createTbaDiningAnalysisCase),
    },
  };
}
