import type { SelectionParseResult } from './dining-selections.mjs';
export const DINING_OVERALL_VERSION: string;
export const DINING_OVERALL_QUESTION: string;
export const DINING_OVERALL_RESPONSES: Readonly<Record<string,{label:string;value:string}>>;
export function parseOverallEvaluation(evaluation: unknown, options?: Record<string, unknown>): SelectionParseResult;
export function validateOverallEvaluationAtom(atom: unknown, answer: unknown): { valid: boolean; errors: string[] };
