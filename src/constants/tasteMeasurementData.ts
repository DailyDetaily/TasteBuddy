import { TASTE_IDS, TASTE_TOKENS, type TasteId } from './designTokens';

export type TasteMeasurementResults = Record<TasteId, number | null>;
export type TasteMeasurementSource = 'broad-starter' | 'measured';

export interface TasteMeasurementSnapshot {
  measuredAt: string;
  results: TasteMeasurementResults;
  source?: TasteMeasurementSource;
}

export interface TasteMeasurementEntry {
  averageMm: number;
  averageScore: number;
  deltaMm: number;
  id: TasteId;
  label: string;
  score: number;
  valueMm: number;
}

export const DEFAULT_TASTE_MEASUREMENT_RESULTS: TasteMeasurementResults = {
  sweet: 8.5,
  sour: 7.4,
  bitter: 4.0,
  salty: 6.0,
  umami: 3.0,
  fat: 5.5,
};

export const TASTE_MEASUREMENT_AVERAGES: Record<TasteId, number> = {
  sweet: 5.0,
  sour: 4.4,
  bitter: 5.5,
  salty: 4.8,
  umami: 5.2,
  fat: 4.0,
};

export function createInitialTasteMeasurementResults(): TasteMeasurementResults {
  return TASTE_IDS.reduce((accumulator, tasteId) => {
    accumulator[tasteId] = null;
    return accumulator;
  }, {} as TasteMeasurementResults);
}

export function createInitialTasteMeasurementSnapshot(): TasteMeasurementSnapshot {
  return {
    measuredAt: '2026-03-08T15:20:00+09:00',
    results: DEFAULT_TASTE_MEASUREMENT_RESULTS,
    source: 'measured',
  };
}

export function createTasteMeasurementSnapshot(
  results: TasteMeasurementResults,
  measuredAt = new Date().toISOString(),
  source: TasteMeasurementSource = 'measured',
): TasteMeasurementSnapshot {
  return {
    measuredAt,
    results: { ...results },
    source,
  };
}

export function isBroadStarterMeasurementSnapshot(
  snapshot: TasteMeasurementSnapshot,
) {
  return snapshot.source === 'broad-starter';
}

export function resolveTasteMeasurementValue(
  snapshot: TasteMeasurementSnapshot,
  tasteId: TasteId,
) {
  return snapshot.results[tasteId] ?? DEFAULT_TASTE_MEASUREMENT_RESULTS[tasteId];
}

export function getTasteMeasurementEntries(
  snapshot: TasteMeasurementSnapshot,
): TasteMeasurementEntry[] {
  return TASTE_IDS.map((tasteId) => {
    const valueMm = resolveTasteMeasurementValue(snapshot, tasteId);
    const averageMm = TASTE_MEASUREMENT_AVERAGES[tasteId];

    return {
      averageMm,
      averageScore: Math.round(averageMm * 10),
      deltaMm: Number((valueMm - averageMm).toFixed(2)),
      id: tasteId,
      label: TASTE_TOKENS[tasteId].label,
      score: Math.round(valueMm * 10),
      valueMm,
    };
  });
}

export function getAverageMeasurementMm(snapshot: TasteMeasurementSnapshot) {
  const entries = getTasteMeasurementEntries(snapshot);
  const sum = entries.reduce((accumulator, entry) => accumulator + entry.valueMm, 0);

  return Number((sum / entries.length).toFixed(2));
}

export function getAverageReferenceMeasurementMm() {
  const sum = TASTE_IDS.reduce(
    (accumulator, tasteId) => accumulator + TASTE_MEASUREMENT_AVERAGES[tasteId],
    0,
  );

  return Number((sum / TASTE_IDS.length).toFixed(2));
}

export function getStrongestTasteMeasurement(snapshot: TasteMeasurementSnapshot) {
  return getTasteMeasurementEntries(snapshot).reduce((strongest, entry) =>
    entry.valueMm > strongest.valueMm ? entry : strongest,
  );
}

export function getWeakestTasteMeasurement(snapshot: TasteMeasurementSnapshot) {
  return getTasteMeasurementEntries(snapshot).reduce((weakest, entry) =>
    entry.valueMm < weakest.valueMm ? entry : weakest,
  );
}

export function getTasteProfileBadge(averageMm: number) {
  if (averageMm >= 7.5) {
    return 'Super Taster+';
  }

  if (averageMm >= 5.5) {
    return 'Balanced Taster';
  }

  return 'Taste Explorer';
}

export function formatMeasurementValue(value: number, suffix = 'mM') {
  return suffix ? `${value.toFixed(2)} ${suffix}` : value.toFixed(2);
}

export function formatMeasurementDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export const TASTE_MEASUREMENT_STALE_AFTER_DAYS = 30;

export function getDaysSinceMeasurement(
  snapshot: TasteMeasurementSnapshot,
  now = new Date(),
) {
  const measuredAt = new Date(snapshot.measuredAt);
  const diffMs = now.getTime() - measuredAt.getTime();

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function isTasteMeasurementStale(
  snapshot: TasteMeasurementSnapshot,
  staleAfterDays = TASTE_MEASUREMENT_STALE_AFTER_DAYS,
) {
  return getDaysSinceMeasurement(snapshot) >= staleAfterDays;
}

export function getTasteMeasurementAgeLabel(snapshot: TasteMeasurementSnapshot) {
  const daysSinceMeasurement = getDaysSinceMeasurement(snapshot);

  if (daysSinceMeasurement === 0) {
    return '오늘 측정';
  }

  if (daysSinceMeasurement === 1) {
    return '어제 측정';
  }

  return `${daysSinceMeasurement}일 전 측정`;
}
