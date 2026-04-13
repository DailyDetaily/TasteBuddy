import { TASTE_COLORS } from './designTokens';

export { TASTE_COLORS };
export type TasteType = keyof typeof TASTE_COLORS;
export const TASTE_TYPES: TasteType[] = ['단맛', '신맛', '쓴맛', '짠맛', '감칠맛', '지방맛'];
export interface TasteAdjustmentLike {
  change: number | string;
  taste: string;
}

interface TasteAdjustmentGradientOptions {
  direction?: string;
  useTint?: boolean;
}

export function getTasteColor(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.main || '#FF9900';
}

function normalizeHex(hex: string): string {
  const trimmed = hex.replace('#', '').trim();

  if (trimmed.length === 3) {
    return trimmed
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  return trimmed.padEnd(6, '0').slice(0, 6);
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);

  return {
    b: Number.parseInt(normalized.slice(4, 6), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    r: Number.parseInt(normalized.slice(0, 2), 16),
  };
}

export function mixHexColors(leftHex: string, rightHex: string, rightWeight: number) {
  const left = hexToRgb(leftHex);
  const right = hexToRgb(rightHex);
  const safeWeight = Math.min(1, Math.max(0, rightWeight));
  const leftWeight = 1 - safeWeight;

  const r = Math.round(left.r * leftWeight + right.r * safeWeight);
  const g = Math.round(left.g * leftWeight + right.g * safeWeight);
  const b = Math.round(left.b * leftWeight + right.b * safeWeight);

  return `rgb(${r}, ${g}, ${b})`;
}

export function getTasteTint(taste: string, alpha: number): string {
  const { r, g, b } = hexToRgb(getTasteColor(taste));
  const safeAlpha = Math.min(1, Math.max(0, alpha));

  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

export function getTasteBg(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.bg || '#FFD699';
}

export function getTasteTintSurface(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.tintSurface || '#FFEBCC';
}

export function getTasteDark(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.dark || '#CC7A00';
}

export function getTasteLight(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.light || '#E0E0E0';
}

export function getTasteTintSurfaceText(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.tintSurfaceText || getTasteDark(taste);
}

export function getTasteTintSurfaceSubText(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.tintSurfaceSubText || getTasteTintSurfaceText(taste);
}

function parseTasteAdjustmentWeight(change: number | string): number {
  if (typeof change === 'number') {
    return Math.abs(change);
  }

  const parsed = Number.parseFloat(change.replace('%', '').trim());

  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

export function getTasteGradient(tastes: string[]): string {
  if (tastes.length === 0) return '#E0E0E0';
  const colors = tastes.map(t => getTasteLight(t));
  if (colors.length === 1) return colors[0];
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

export function buildTasteAdjustmentGradient(
  adjustments: TasteAdjustmentLike[],
  optionsOrDirection: TasteAdjustmentGradientOptions | string = '135deg',
): string {
  const direction =
    typeof optionsOrDirection === 'string'
      ? optionsOrDirection
      : optionsOrDirection.direction ?? '135deg';
  const useTint =
    typeof optionsOrDirection === 'string'
      ? true
      : optionsOrDirection.useTint ?? true;

  if (adjustments.length === 0) {
    return '#E0E0E0';
  }

  const weightedAdjustments = adjustments
    .map((adjustment) => ({
      color: useTint
        ? mixHexColors(getTasteLight(adjustment.taste), '#FFFFFF', 0.25)
        : getTasteColor(adjustment.taste),
      weight: parseTasteAdjustmentWeight(adjustment.change),
    }))
    .filter((adjustment) => adjustment.weight > 0);

  if (weightedAdjustments.length === 0) {
    return '#E0E0E0';
  }

  if (weightedAdjustments.length === 1) {
    const color = weightedAdjustments[0]?.color ?? '#E0E0E0';
    return `linear-gradient(${direction}, ${color} 0%, ${color} 100%)`;
  }

  const totalWeight = weightedAdjustments.reduce(
    (sum, adjustment) => sum + adjustment.weight,
    0,
  );

  const segmentWidths = weightedAdjustments.map(
    (adjustment) => (adjustment.weight / totalWeight) * 100,
  );
  const stops: string[] = [`${weightedAdjustments[0]?.color ?? '#E0E0E0'} 0%`];

  let accumulatedWidth = segmentWidths[0] ?? 0;

  for (let index = 1; index < weightedAdjustments.length; index += 1) {
    const previous = weightedAdjustments[index - 1];
    const current = weightedAdjustments[index];
    const previousWidth = segmentWidths[index - 1] ?? 0;
    const currentWidth = segmentWidths[index] ?? 0;

    if (!previous || !current) {
      continue;
    }

    const boundary = accumulatedWidth;
    const transitionWidth = Math.min(24, previousWidth * 0.8, currentWidth * 0.8);
    const leftStop = Math.max(0, boundary - transitionWidth / 2);
    const rightStop = Math.min(100, boundary + transitionWidth / 2);

    stops.push(`${previous.color} ${leftStop.toFixed(2)}%`);
    stops.push(`${current.color} ${rightStop.toFixed(2)}%`);

    accumulatedWidth += currentWidth;
  }

  const lastColor = weightedAdjustments[weightedAdjustments.length - 1]?.color ?? '#E0E0E0';
  stops.push(`${lastColor} 100%`);

  return `linear-gradient(${direction}, ${stops.join(', ')})`;
}
