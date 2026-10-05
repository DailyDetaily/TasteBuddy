export const PERSONAL_TASTE_MODEL_VERSION: string;
export const PERSONAL_TASTE_POLICY: {
  minMeals: number;
  minConditionMeals: number;
  maxConditionDimensions: number;
};
export function buildPersonalTasteModel(
  normalized: { userId: string; records: any[] },
  options?: {
    asOf?: string | null;
    policy?: Record<string, number>;
    suppressedQuestionIDs?: string[];
    _assessQuestions?: boolean;
    _includeEvidence?: boolean;
    individualQuestions?: boolean;
    nativeAnswerOptions?: (record: any, facet: string) => string[];
    validatedIntensityLinks?: Record<string, string[]>;
  },
): any;
export function predictPersonalTaste(model: any, query: any): any;
