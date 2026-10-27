import type { TasteId } from '../constants/designTokens';
export interface OverallTasteDistribution { positive: number; rated: number; mixed: number; value: number | null; mealIDs: string[]; evidenceIDs: string[] }
export interface OverallTasteProfile { axes: { axis: TasteId; current: OverallTasteDistribution; previous: OverallTasteDistribution }[]; previousBefore: string | null }
export function buildOverallTasteProfile(model: unknown, records: readonly any[], options: { userID: string; asOf?: string; dayKey?: (timestamp: number) => string }): OverallTasteProfile;
