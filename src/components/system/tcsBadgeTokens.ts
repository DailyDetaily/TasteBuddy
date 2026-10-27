import { TASTE_IDS, TASTE_TOKENS } from '../../constants/designTokens';

export const TCS_BADGE_BOX_SHADOW =
  '0 2px 8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), 1px 1px 2px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.5), inset 1px 0 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.1), inset -1px 0 1px rgba(0,0,0,0.1)';

export function tcsBadgeColor(taste: string) {
  const id = TASTE_IDS.find(id => TASTE_TOKENS[id].label === taste);
  const base = id ? TASTE_TOKENS[id].palette.light : '#E0E0E0';
  const fallback = `color-mix(in srgb, ${base} 75%, #FFFFFF 25%)`;
  return id ? `var(--tb-tcs-badge-${id}, ${fallback})` : fallback;
}
