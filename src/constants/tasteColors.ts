// TasteBuddy — 6가지 미각 컬러 시스템
export const TASTE_COLORS = {
  단맛: { main: '#FF9900', dark: '#CC7A00', light: '#FFCC80', bg: '#FFEBCC', gradient: 'linear-gradient(135deg, #FF9900, #FFB84D)' },
  신맛: { main: '#FBC02D', dark: '#C99A00', light: '#FDD835', bg: '#FFF7CC', gradient: 'linear-gradient(135deg, #FBC02D, #FFD54F)' },
  쓴맛: { main: '#95C900', dark: '#6E9600', light: '#E6EE9C', bg: '#EAF4CC', gradient: 'linear-gradient(135deg, #95C900, #AED581)' },
  짠맛: { main: '#7299FF', dark: '#4A70CC', light: '#90CAF9', bg: '#E6F0FF', gradient: 'linear-gradient(135deg, #7299FF, #9FBFFF)' },
  감칠맛: { main: '#B372B4', dark: '#8A5490', light: '#CE93D8', bg: '#F0E3F0', gradient: 'linear-gradient(135deg, #B372B4, #CE93D8)' },
  지방맛: { main: '#95867A', dark: '#6B5E54', light: '#BCAAA4', bg: '#EAE7E4', gradient: 'linear-gradient(135deg, #95867A, #B0A49A)' },
} as const;

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
