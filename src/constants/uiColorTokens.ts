import { COLOR_TOKENS as RAW_COLORS, DATA_VIZ_TOKENS as RAW_DATA_VIZ, TASTE_TOKENS as RAW_TASTES, TASTE_IDS, TASTE_TINT_STEPS } from './designTokens';
import { CHART_ON_BRIGHT_FILL, colorTokenCSSName, DATA_VIZ_COLOR_ROLES, miniChartTint20Color } from './colorModes';

export const CHART_ON_BRIGHT_FILL_COLOR = `var(--tb-color-chart-on-bright-fill, ${CHART_ON_BRIGHT_FILL})`;
export const CHART_COMPARISON_TRACK_COLOR = 'var(--tb-color-chart-comparison-track, rgba(102, 102, 102, 0.18))';

const kebab = (value: string) => value.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

/** CSS-backed UI roles resolve at the nearest explicit Light/Dark boundary. */
export const COLOR_TOKENS = Object.fromEntries(Object.entries(RAW_COLORS).map(([group,values]) => [group,
  Object.fromEntries(Object.entries(values).map(([key,value]) => [key, `var(${colorTokenCSSName(group,key)}, ${value})`])),
])) as { [G in keyof typeof RAW_COLORS]: { [K in keyof typeof RAW_COLORS[G]]: string } };

export const TASTE_TOKENS = Object.fromEntries(TASTE_IDS.map(id => [id, {
  ...RAW_TASTES[id],
  palette: Object.fromEntries(Object.entries(RAW_TASTES[id].palette).map(([role,value]) => [role,
    role === 'gradient' ? value : `var(--tb-taste-${id}-${kebab(role)}, ${value})`,
  ])),
}])) as typeof RAW_TASTES;

export const TASTE_COLORS = Object.fromEntries(TASTE_IDS.map(id => [RAW_TASTES[id].label,TASTE_TOKENS[id].palette])) as Record<(typeof RAW_TASTES)[typeof TASTE_IDS[number]]['label'], (typeof RAW_TASTES)[typeof TASTE_IDS[number]]['palette']>;

export const MINI_CHART_MAIN_COLORS = Object.fromEntries(TASTE_IDS.map(id =>
  [id, `var(--tb-taste-${id}-chart-main, ${TASTE_TOKENS[id].palette.main})`],
)) as Record<typeof TASTE_IDS[number], string>;

export const MINI_CHART_TINT20_COLORS = Object.fromEntries(TASTE_IDS.map(id =>
  [id, `var(--tb-taste-${id}-chart-tint-20, var(--tb-taste-${id}-tint-20, ${miniChartTint20Color(id, 'light')}))`],
)) as Record<typeof TASTE_IDS[number], string>;

export const TASTE_TINTS = Object.fromEntries(TASTE_IDS.map(id => [id,Object.fromEntries(TASTE_TINT_STEPS.map(step => [step,`var(--tb-taste-${id}-tint-${step})`]))])) as Record<typeof TASTE_IDS[number], Record<typeof TASTE_TINT_STEPS[number],string>>;

export const NEUTRAL_TASTE_TOKENS = { label: '모든맛', palette: { main: 'var(--tb-taste-neutral-main)', tint80: 'var(--tb-taste-neutral-tint-80)', tintSurface: 'var(--tb-taste-neutral-tint-surface)' } } as const;

export const DATA_VIZ_TOKENS = {
  ...RAW_DATA_VIZ,
  progress: { ...RAW_DATA_VIZ.progress },
  radar: { ...RAW_DATA_VIZ.radar },
} as { [G in keyof typeof RAW_DATA_VIZ]: { -readonly [K in keyof typeof RAW_DATA_VIZ[G]]: typeof RAW_DATA_VIZ[G][K] extends string ? string : typeof RAW_DATA_VIZ[G][K] } };
for (const role of Object.values(DATA_VIZ_COLOR_ROLES)) {
  (DATA_VIZ_TOKENS[role.group] as unknown as Record<string,string | number>)[role.key] = `var(${role.css})`;
}

/** Border roles are shared by cards, fields, buttons, lists and tags. */
export const BORDER_TOKENS = Object.fromEntries([
  'faint', 'subtle', 'default', 'strong', 'onMuted', 'disabled', 'focus', 'selected',
  'destructive', 'success', 'successSoft', 'warning', 'warningSoft',
].map(role => [role, `var(--tb-color-border-${kebab(role)})`])) as Record<
  'faint' | 'subtle' | 'default' | 'strong' | 'onMuted' | 'disabled' | 'focus' | 'selected' |
  'destructive' | 'success' | 'successSoft' | 'warning' | 'warningSoft', string>;
