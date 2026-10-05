export interface FitPattern {
  id: string;
  conditions: { dimension: string; value: string }[];
  repeatedValue: string | null;
  status: string;
  distribution: {
    mealCount: number;
    belowPreferred: number;
    justRight: number;
    abovePreferred: number;
    mixed: number;
  };
  mealIDs: string[];
  evidenceIDs: string[];
}
export interface OverallPattern {
  conditions: { dimension: string; value: string }[];
  cells: {
    overallValue: string;
    attributeValue: string;
    mealIDs: string[];
    evidenceIDs: string[];
  }[];
  mealIDs: string[];
  mixedMealIDs: string[];
  evidenceIDs: string[];
}
export function buildFitPatterns(
  records: unknown[],
  userID: string,
  policy: Record<string, number>,
  options?: {
    includeEvidence?: boolean;
    validatedIntensityLinks?: Record<string, string[]>;
  },
): FitPattern[];
export function buildOverallPatterns(
  records: unknown[],
  userID: string,
  options?: { includeEvidence?: boolean },
): OverallPattern[];
