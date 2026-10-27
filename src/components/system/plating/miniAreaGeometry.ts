import { COMPONENT_TOKENS } from '../../../constants/designTokens';
import { buildRoundedAreaPath } from './roundedAreaPath';

export type MiniAreaVariant = 'layered' | 'comparison';
export interface MiniAreaLayerEntry {
  id: string;
  taste: string;
  values: readonly (number | null)[];
}

/** Shared presentation scale: known zero stays at the floor; one is 12px. */
export function miniAreaValueHeight(value: number | null, maximum: number, height: number = COMPONENT_TOKENS.miniChart.height): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  const one = Math.min(COMPONENT_TOKENS.miniChart.maximumBarWidth, height);
  if (value <= 1) return value * one;
  return one + (value - 1) / (Math.max(maximum, value) - 1) * (height - one);
}

/** Retain date slots and break at unknown values; a single known sample spans the plot. */
export function miniAreaPointRuns(values: readonly (number | null)[], maximum: number,
  width: number = COMPONENT_TOKENS.miniChart.width, height: number = COMPONENT_TOKENS.miniChart.height) {
  const runs: Array<Array<{ x: number; y: number }>> = [];
  let run: Array<{ x: number; y: number }> = [];
  values.forEach((value, index) => {
    const pointHeight = miniAreaValueHeight(value, maximum, height);
    if (pointHeight === null) { if (run.length > 1) runs.push(run); run = []; return; }
    const y = height - pointHeight;
    if (values.length === 1) { runs.push([{ x: 0, y }, { x: width, y }]); return; }
    run.push({ x: width * index / (values.length - 1), y });
  });
  if (run.length > 1) runs.push(run);
  return runs;
}

/** Overlaid values share a zero baseline and one scale; they are never accumulated. */
export function miniAreaLayerGeometry(entries: readonly MiniAreaLayerEntry[], variant: MiniAreaVariant) {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  if (!entries.length || entries.length > 3 || (variant === 'comparison' &&
    (entries.length !== 2 || entries[0].taste !== entries[1].taste))) return [];
  const count = entries[0].values.length;
  if (count < 2 || entries.some(entry => entry.values.length !== count)) return [];
  const values = entries.map(entry => entry.values.slice(-4).map(value =>
    value !== null && Number.isFinite(value) && value >= 0 ? value : null));
  const maximum = Math.max(0, ...values.flat().filter((value): value is number => value !== null));
  if (maximum === 0) return [];
  return entries.map((entry, index) => {
    const runs = miniAreaPointRuns(values[index], maximum, width, height);
    let area = 0;
    values[index].forEach((value, slot) => {
      if (value === null) return;
      const previous = slot > 0 ? values[index][slot - 1] : null;
      if (previous !== null) area += (miniAreaValueHeight(previous, maximum, height)! / height + miniAreaValueHeight(value, maximum, height)! / height) / 2;
    });
    const paths = runs.map(points => buildRoundedAreaPath([
      ...points, { x: points.at(-1)!.x, y: height }, { x: points[0].x, y: height },
    ], 6));
    return { id: entry.id, index, area, paths, runs, tint: 20 as 20 | 80 };
  }).sort((a, b) => b.area - a.area || a.index - b.index)
    .map((layer, order) => ({ ...layer, tint: variant === 'layered' ? 20 as const : order === 0 ? 80 as const : 20 as const }));
}
