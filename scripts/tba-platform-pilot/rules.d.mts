import type { SelectionParseResult } from './dining-selections.mjs';
export const LEXICON_VERSION: string;
export const RULE_VERSION: string;
export const SEMANTIC_CONTRACT: {attributes: {id: string;label?: string;meaning: string}[]};
export function parseByRules(answer: {question:string;questionVersion:string;choiceVersion:string;value:unknown}, options?: Record<string,unknown>): SelectionParseResult;
