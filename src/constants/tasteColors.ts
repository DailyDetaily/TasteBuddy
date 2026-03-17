import { TASTE_COLORS } from './designTokens';

export { TASTE_COLORS };
export type TasteType = keyof typeof TASTE_COLORS;
export const TASTE_TYPES: TasteType[] = ['단맛', '신맛', '쓴맛', '짠맛', '감칠맛', '지방맛'];

export function getTasteColor(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.main || '#FF9900';
}

export function getTasteBg(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.bg || '#FFEBCC';
}

export function getTasteDark(taste: string): string {
  return (TASTE_COLORS as any)[taste]?.dark || '#CC7A00';
}

export function getTasteGradient(tastes: string[]): string {
  if (tastes.length === 0) return '#E0E0E0';
  const colors = tastes.map(t => (TASTE_COLORS as any)[t]?.light || '#E0E0E0');
  if (colors.length === 1) return colors[0];
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}
