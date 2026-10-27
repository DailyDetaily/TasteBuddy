import {
  COLOR_TOKENS, DATA_VIZ_TOKENS, NEUTRAL_TASTE_TOKENS, TASTE_COLOR_ROLE_STEPS, TASTE_IDS, TASTE_TINT_BASES, mixTasteWithBase,
  TASTE_TINTS_BY_MODE, TASTE_TOKENS, TASTE_MAIN_COLORS_BY_MODE, mixTasteWithWhite, type ColorMode, type TasteId,
} from './designTokens';

type ColorValues = { [G in keyof typeof COLOR_TOKENS]: { [K in keyof typeof COLOR_TOKENS[G]]: string } };

/** Product color styles. Mode selection is explicit; brand/artwork colors stay fixed. */
export const DARK_COLOR_TOKENS: ColorValues = {
  background: { page: '#141414', focus: '#141414' },
  surface: {
    base: '#282828', card: '#282828', cardHover: '#303030', muted: '#222222',
    elevated: '#343434', disabled: '#313131', overlay: 'rgba(40, 40, 40, 0.88)',
    placeholder: '#313131', inverse: '#F5F5F5',
  },
  text: {
    primary: '#F5F5F5', secondary: '#DEDEDE', tertiary: '#C6C6C6', body: '#B8B8B8',
    action: '#B8B8B8', hint: '#A3A3A3', disabled: '#666666', inverse: '#0F0F0F',
    subtle: 'rgba(245, 245, 245, 0.6)', muted: 'rgba(245, 245, 245, 0.5)', faint: 'rgba(245, 245, 245, 0.4)',
  },
  border: {
    card: '#303030', subtle: '#333333', default: '#3B3B3B', strong: '#808080', disabled: '#303030',
    avatar: 'rgba(245, 245, 245, 0.2)', avatarSoft: 'rgba(245, 245, 245, 0.15)',
  },
  icon: { primary: '#DEDEDE', hover: '#F5F5F5', muted: '#909090' },
  state: {
    neutral: '#DEDEDE', neutralSoft: '#252525', informative: '#DEDEDE', informativeSoft: '#222222',
    success: '#75CB9B', successText: '#ADE5C5', successStrong: '#75CB9B', successSoft: '#203B2D',
    warning: '#E6B572', warningText: '#F2D5AE', warningStrong: '#E6B572', warningSoft: '#44331F',
    destructive: '#F78298', destructiveText: '#F9B8C5', destructiveSoft: '#4A2430',
  },
  interaction: {
    primary: '#F5F5F5', onPrimary: '#0F0F0F', selected: '#F5F5F5', onSelected: '#0F0F0F', focus: '#DEDEDE',
    hoverOverlay: 'rgba(255, 255, 255, 0.06)', pressedOverlay: 'rgba(255, 255, 255, 0.1)',
    pressedInverseOverlay: 'rgba(0, 0, 0, 0.08)',
  },
  scrim: { subtle: 'rgba(0, 0, 0, 0.35)', default: 'rgba(0, 0, 0, 0.5)', strong: 'rgba(0, 0, 0, 0.6)' },
  shadow: {
    hover: '0 1px 3px rgba(0, 0, 0, 0.2)', soft: '0 4px 20px rgba(0, 0, 0, 0.28)',
    strong: '0 12px 32px rgba(0, 0, 0, 0.4)', button: '0 8px 20px rgba(0, 0, 0, 0.28)', drawer: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
};

export const COLOR_TOKENS_BY_MODE: Record<ColorMode, ColorValues> = { light: COLOR_TOKENS, dark: DARK_COLOR_TOKENS };

/** Generic border roles alias existing semantic colors; names describe use, not a component. */
export const BORDER_ROLE_ALIASES = {
  faint: { group: 'border', key: 'card', native: 'borderCard' },
  focus: { group: 'interaction', key: 'focus', native: 'focusRing' },
  selected: { group: 'interaction', key: 'selected', native: 'selectionSurface' },
  destructive: { group: 'state', key: 'destructive', native: 'destructive' },
  success: { group: 'state', key: 'success', native: 'success' },
  successSoft: { group: 'state', key: 'successSoft', native: 'successSoft' },
  warning: { group: 'state', key: 'warning', native: 'warning' },
  warningSoft: { group: 'state', key: 'warningSoft', native: 'warningSoft' },
} as const;

/** A boundary against muted/raised fills, shared by tags and other filled controls. */
export const BORDER_ON_MUTED_BY_MODE = { light: '#E5E5E5', dark: '#484848' } as const;

const DARK_NEUTRAL_CHART_TRACK = mixTasteWithBase('#A3A3A3', 70, 'dark');

/** Foreground surfaces must rise above the card in Dark without changing sunken surfaces. */
export const FOREGROUND_COLORS_BY_MODE = {
  light: { controlSurface: COLOR_TOKENS.surface.muted, switchOffThumb: COLOR_TOKENS.surface.card, switchOnThumb: COLOR_TOKENS.surface.card, heatmapNeutral: NEUTRAL_TASTE_TOKENS.palette.tint80, neutralSelectionText: NEUTRAL_TASTE_TOKENS.palette.main },
  dark: { controlSurface: '#484848', switchOffThumb: DARK_COLOR_TOKENS.text.primary, switchOnThumb: DARK_COLOR_TOKENS.interaction.onPrimary, heatmapNeutral: DARK_NEUTRAL_CHART_TRACK, neutralSelectionText: DARK_COLOR_TOKENS.text.secondary },
} as const;

const blendColor = (from: string, to: string, amount: number) => '#' + [1, 3, 5].map(offset =>
  Math.round(parseInt(from.slice(offset, offset + 2), 16) * (1 - amount) + parseInt(to.slice(offset, offset + 2), 16) * amount).toString(16).padStart(2, '0'),
).join('').toUpperCase();

/** Highest chart intensity; capsule bar endpoints use ordinary taste main. */
export function miniChartMainColor(id: TasteId, mode: ColorMode): string {
  const main = TASTE_MAIN_COLORS_BY_MODE[mode][id];
  return mode === 'dark' ? blendColor(main, '#FFFFFF', 0.25) : main;
}

/** Existing Figma chart/tint/20 uses tint/20 in Light and chart/high in Dark. */
export function miniChartTint20Color(id: TasteId, mode: ColorMode): string {
  return mode === 'dark' ? blendColor(TASTE_MAIN_COLORS_BY_MODE.dark[id], '#FFFFFF', 0.12)
    : TASTE_TINTS_BY_MODE.light[id][20];
}

export const TASTE_CHART_TINT_STEPS = [80, 60, 40, 20, 0] as const;
export type TasteChartTintStep = (typeof TASTE_CHART_TINT_STEPS)[number];

/** Chart intensity is separate from the charcoal-mix surface scale. */
export function tasteChartColor(id: TasteId, tint: TasteChartTintStep, mode: ColorMode): string {
  if (tint === 0) return miniChartMainColor(id, mode);
  if (tint === 20) return miniChartTint20Color(id, mode);
  if (mode === 'light') return TASTE_TINTS_BY_MODE.light[id][tint];
  return tint === 40 ? TASTE_MAIN_COLORS_BY_MODE.dark[id]
    : TASTE_TINTS_BY_MODE.dark[id][tint === 80 ? 20 : 10];
}

export const CHART_ON_BRIGHT_FILL = '#0F0F0F';

/** Same five count levels as Figma; only presentation changes with appearance. */
export function heatmapLevelColor(id: TasteId, level: number, mode: ColorMode): string {
  const index = Math.max(0, Math.min(4, level));
  if (mode === 'dark') {
    const steps = [70, 50, 30, 10] as const;
    return index === 4 ? TASTE_MAIN_COLORS_BY_MODE.dark[id] : TASTE_TINTS_BY_MODE.dark[id][steps[index]];
  }
  return tasteChartColor(id, TASTE_CHART_TINT_STEPS[index], mode);
}

export const TASTE_ROLE_STEPS_BY_MODE = {
  light: TASTE_COLOR_ROLE_STEPS,
  dark: { tintSoft: 70, tintSoftBorder: 80, borderSubtle: 70, borderDefault: 60, borderStrong: 50, tintSurface: 70, chartTrack: 70 },
} as const;

/** Line charts keep their own contrast range so capsule tracks remain visible in Dark. */
export const TASTE_LINE_CHART_STEPS_BY_MODE = {
  light: { track: 80, start: 70, end: 0, nodeStart: 70 },
  dark: { track: 70, start: 60, end: 0, nodeStart: 0 },
} as const;

export function tasteLineChartColor(id: TasteId, role: 'track' | 'start' | 'end' | 'nodeStart', mode: ColorMode): string {
  const step = TASTE_LINE_CHART_STEPS_BY_MODE[mode][role];
  return step === 0 ? TASTE_MAIN_COLORS_BY_MODE[mode][id] : TASTE_TINTS_BY_MODE[mode][id][step];
}

/** Cards, tonal buttons and taste chips share the same pale surface and its visible edge. */
export const TASTE_CHIP_ROLE_STEPS_BY_MODE = {
  light: { background: TASTE_ROLE_STEPS_BY_MODE.light.tintSurface, border: TASTE_ROLE_STEPS_BY_MODE.light.borderDefault },
  dark: { background: TASTE_ROLE_STEPS_BY_MODE.dark.tintSurface, border: TASTE_ROLE_STEPS_BY_MODE.dark.borderDefault },
} as const;

export const NEUTRAL_CHIP_COLORS_BY_MODE = {
  light: { background: COLOR_TOKENS.surface.muted, border: BORDER_ON_MUTED_BY_MODE.light },
  dark: { background: DARK_COLOR_TOKENS.surface.elevated, border: BORDER_ON_MUTED_BY_MODE.dark },
} as const;

export const TASTE_PALETTES_BY_MODE = Object.fromEntries((['light', 'dark'] as const).map(mode => [mode,
  Object.fromEntries(TASTE_IDS.map(id => {
    const original = TASTE_TOKENS[id].palette;
    if (mode === 'light') return [id, original];
    const tints = TASTE_TINTS_BY_MODE.dark[id];
    const lightTints = TASTE_TINTS_BY_MODE.light[id];
    const steps = TASTE_ROLE_STEPS_BY_MODE.dark;
    const main = TASTE_MAIN_COLORS_BY_MODE.dark[id];
    return [id, {
      ...original, main, dark: tints[20], light: mixTasteWithWhite(main, 20),
      bg: tints[60], tintSoft: tints[steps.tintSoft], tintSoftBorder: tints[steps.tintSoftBorder],
      borderSubtle: tints[steps.borderSubtle], borderDefault: tints[steps.borderDefault],
      borderStrong: tints[steps.borderStrong], borderAccent: main, tintSurface: tints[steps.tintSurface], chartTrack: tints[steps.chartTrack],
      // Reading colors retain a light taste tint; they are not mixed toward charcoal.
      tintSurfaceText: lightTints[80], tintSurfaceSubText: lightTints[50],
    }];
  })),
])) as Record<ColorMode, Record<TasteId, (typeof TASTE_TOKENS)[TasteId]['palette']>>;

export const DATA_VIZ_TOKENS_BY_MODE = {
  light: { ...DATA_VIZ_TOKENS, radar: { ...DATA_VIZ_TOKENS.radar, renderedGridColor: COLOR_TOKENS.border.strong, centerMask: '#FFFFFF' } },
  dark: {
    ...DATA_VIZ_TOKENS,
    progress: { ...DATA_VIZ_TOKENS.progress, barTrack: '#3B3B3B' },
    radar: {
      ...DATA_VIZ_TOKENS.radar, gridColor: '#3B3B3B', renderedGridColor: DARK_COLOR_TOKENS.border.strong, centerMask: DARK_COLOR_TOKENS.surface.base, averageFill: 'rgba(163, 163, 163, 0.18)',
      averageStroke: '#969696', highlightFill: 'rgba(255, 153, 0, 0.2)', highlightStroke: TASTE_MAIN_COLORS_BY_MODE.dark.sweet, labelColor: '#A3A3A3',
    },
  },
} as const;

export const DATA_VIZ_COLOR_ROLES = {
  'progress/barTrack': { group: 'progress', key: 'barTrack', css: '--tb-data-viz-progress-track', swift: 'progressBarTrack' },
  'radar/gridColor': { group: 'radar', key: 'gridColor', css: '--tb-data-viz-radar-grid', swift: 'radarGridColor' },
  'radar/averageFill': { group: 'radar', key: 'averageFill', css: '--tb-data-viz-radar-average-fill', swift: 'radarAverageFill' },
  'radar/averageStroke': { group: 'radar', key: 'averageStroke', css: '--tb-data-viz-radar-average-stroke', swift: 'radarAverageStroke' },
  'radar/highlightFill': { group: 'radar', key: 'highlightFill', css: '--tb-data-viz-radar-highlight-fill', swift: 'radarHighlightFill' },
  'radar/highlightStroke': { group: 'radar', key: 'highlightStroke', css: '--tb-data-viz-radar-highlight-stroke', swift: 'radarHighlightStroke' },
  'radar/labelColor': { group: 'radar', key: 'labelColor', css: '--tb-data-viz-radar-label', swift: 'radarLabelColor' },
  'radar/renderedGridColor': { group: 'radar', key: 'renderedGridColor', css: '--tb-data-viz-radar-rendered-grid', swift: 'radarRenderedGridColor' },
  'radar/centerMask': { group: 'radar', key: 'centerMask', css: '--tb-data-viz-radar-center-mask', swift: 'radarCenterMask' },
} as const;

export function dataVizColors(mode: ColorMode): Record<keyof typeof DATA_VIZ_COLOR_ROLES, string> {
  const tokens = DATA_VIZ_TOKENS_BY_MODE[mode] as { progress: Record<string, string | number>; radar: Record<string, string | number> };
  return Object.fromEntries(Object.entries(DATA_VIZ_COLOR_ROLES).map(([name, role]) => [name, tokens[role.group][role.key]])) as Record<keyof typeof DATA_VIZ_COLOR_ROLES, string>;
}

/** The numeric measurement ramp is distinct from the UI surface roles. */
export const MEASUREMENT_PALETTES_BY_MODE = Object.fromEntries((['light', 'dark'] as const).map(mode => [mode,
  Object.fromEntries(TASTE_IDS.map(id => {
    const original = TASTE_TOKENS[id].measurement;
    const tints = TASTE_TINTS_BY_MODE.dark[id];
    const main = TASTE_MAIN_COLORS_BY_MODE[mode][id];
    return [id, {
      ...original,
      accent: mode === 'light' ? original.accent : main,
      textColor: TASTE_PALETTES_BY_MODE[mode][id].tintSurfaceText,
      loop: mode === 'light' ? original.loop : {
        nodeColors: Array.from({ length: 10 }, (_, index) => blendColor(tints[50], main, index / 9)),
        ringBaseColor: tints[50], ringBaseColorSoft: main + '1A', ringGuideBaseColor: main,
        glowTransparentColor: main + '14',
      },
    }];
  })),
])) as Record<ColorMode, Record<TasteId, (typeof TASTE_TOKENS)[TasteId]['measurement'] & { textColor: string }>>;

export const NEUTRAL_TASTE_PALETTES_BY_MODE = {
  light: NEUTRAL_TASTE_TOKENS.palette,
  dark: { main: '#A3A3A3', tint80: mixTasteWithBase(NEUTRAL_TASTE_TOKENS.palette.main, 80, 'dark'), tintSurface: FOREGROUND_COLORS_BY_MODE.dark.controlSurface },
} as const;

/** Comparison capsules share the Dark background-tint role; Light retains its alpha. */
export const CHART_COMPARISON_TRACK_BY_MODE = {
  light: 'rgba(102, 102, 102, 0.18)',
  dark: DARK_NEUTRAL_CHART_TRACK,
} as const;

/** Unclassified share in absolute pies; shared by the remaining sector and legend. */
export const CHART_REMAINDER_BY_MODE = {
  light: NEUTRAL_TASTE_TOKENS.palette.tint80,
  dark: NEUTRAL_TASTE_PALETTES_BY_MODE.dark.main,
} as const;

export type ColorEffect = {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'BACKGROUND_BLUR';
  color?: string; x?: number; y?: number; blur: number; spread?: number;
};

const cssShadowEffects = (value: string): ColorEffect[] => {
  const match = value.match(/^(\d+) (\d+)px (\d+)px (rgba\(.+\))$/);
  if (!match) throw new Error('Unsupported shadow token: ' + value);
  return [{ type: 'DROP_SHADOW', x: Number(match[1]), y: Number(match[2]), blur: Number(match[3]), spread: 0, color: match[4] }];
};

const shadow = (y: number, blur: number, color: string): ColorEffect => ({ type: 'DROP_SHADOW', x: 0, y, blur, spread: 0, color });

/** Match existing Figma effect geometry; only the color changes with the mode. */
const effectsForMode = (mode: ColorMode): Record<string, ColorEffect[]> => ({
  ...Object.fromEntries(Object.entries(COLOR_TOKENS_BY_MODE[mode].shadow).map(([key,value]) => [key, cssShadowEffects(value)])),
  cardResult: [shadow(24, 35, mode === 'dark' ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.16)')],
  selectionCard: [shadow(8, 12, mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(15, 15, 15, 0.06)')],
  profilePicker: [shadow(16, 28, mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)')],
  profilePickerApply: [shadow(8, 20, mode === 'dark' ? 'rgba(0, 0, 0, 0.28)' : 'rgba(0, 0, 0, 0.1)')],
  stack: [shadow(2, 3, mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(15, 15, 15, 0.08)')],
  materialTopBar: [{ type: 'BACKGROUND_BLUR', blur: 12 }, shadow(1, 4, mode === 'dark' ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.08)')],
  badgeElevated: [
    shadow(2, 8, mode === 'dark' ? 'rgba(0, 0, 0, 0.28)' : 'rgba(0, 0, 0, 0.1)'),
    shadow(1, 2, mode === 'dark' ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.1)'),
    { type: 'INNER_SHADOW', x: 0, y: 1, blur: 0, spread: 0, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.3)' },
  ],
});
export const EFFECT_TOKENS_BY_MODE = { light: effectsForMode('light'), dark: effectsForMode('dark') };

const radarLightValues = [
  ['#FFE1B3','#FFCC80','#FFB342'], ['#FEEABD','#FDE096','#FCD369'], ['#E1F0B7','#CAE480','#B5D94A'],
  ['#D7E2FF','#B9CCFF','#9BB6FF'], ['#E8D7E9','#D9B9DA','#C69AC7'], ['#E0DBD8','#CAC2BD','#B1A69E'],
];
export const RADAR_PALETTES_BY_MODE = Object.fromEntries((['light','dark'] as const).map(mode => [mode,
  Object.fromEntries(TASTE_IDS.map((id,index) => [id, mode === 'light'
    ? { spoke: radarLightValues[index][0], outline: radarLightValues[index][1], lineStart: radarLightValues[index][2] }
    : { spoke: TASTE_TINTS_BY_MODE.dark[id][60], outline: TASTE_MAIN_COLORS_BY_MODE.dark[id], lineStart: TASTE_MAIN_COLORS_BY_MODE.dark[id] },
  ])),
])) as Record<ColorMode, Record<TasteId, { spoke: string; outline: string; lineStart: string }>>;

/** Dot foregrounds on the page surface; shared card and mini-chart fills keep their own roles. */
export const CATEGORY_MOTION_COMPANION_STEP = { light: 60, dark: 70 } as const;
export const CATEGORY_MOTION_PLACEHOLDER = { light: '#D0D0D0', dark: CHART_REMAINDER_BY_MODE.dark } as const;
export const CATEGORY_MOTION_EMPTY = { light: '#E4E4E4', dark: '#343434' } as const;

/** Resolve source-engine colors by role; older exported motion bundles remain compatible. */
export const CATEGORY_MOTION_COLORS_BY_MODE = Object.fromEntries((['light', 'dark'] as const).map(mode => [mode,
  Object.fromEntries([
    ...TASTE_IDS.flatMap(id => {
      const original = TASTE_TOKENS[id].palette;
      const legacyCompanion = '#' + [1, 3, 5].map(offset => Math.round(
        parseInt(original.tintSurface.slice(offset, offset + 2), 16) * 0.84
          + parseInt(original.main.slice(offset, offset + 2), 16) * 0.16,
      ).toString(16).padStart(2, '0')).join('').toUpperCase();
      return [
        [original.main.toUpperCase(), TASTE_MAIN_COLORS_BY_MODE[mode][id]],
        [original.tintSurface.toUpperCase(), TASTE_TINTS_BY_MODE[mode][id][CATEGORY_MOTION_COMPANION_STEP[mode]]],
        [legacyCompanion, TASTE_TINTS_BY_MODE[mode][id][CATEGORY_MOTION_COMPANION_STEP[mode]]],
      ];
    }),
    ...['#E4E0DA', '#DEDAD5', COLOR_TOKENS.border.subtle, NEUTRAL_TASTE_TOKENS.palette.tint80]
      .map(source => [source.toUpperCase(), CATEGORY_MOTION_PLACEHOLDER[mode]]),
    ['#E4E4E4', CATEGORY_MOTION_EMPTY[mode]],
  ]),
])) as Record<ColorMode, Record<string, string>>;

/** Compatibility export; new consumers resolve both appearances. */
export const CATEGORY_MOTION_DARK_COLORS = CATEGORY_MOTION_COLORS_BY_MODE.dark;

export function categoryMotionColor(color: string, mode: ColorMode): string {
  return CATEGORY_MOTION_COLORS_BY_MODE[mode][color.toUpperCase()] ?? color;
}

export const EFFECT_STYLE_NAMES: Record<string, string> = {
  hover: 'Elevation/Hover', soft: 'Elevation/Soft', strong: 'Elevation/Strong', button: 'Elevation/Button', drawer: 'Elevation/Drawer',
  cardResult: 'Elevation/CardResult', selectionCard: 'Elevation/SelectionCard', profilePicker: 'Elevation/ProfilePicker',
  profilePickerApply: 'Elevation/ProfilePickerApply', stack: 'Elevation/Stack', materialTopBar: 'Material/TopBar Clear Glass Reference', badgeElevated: 'Elevation/BadgeElevated',
};

export function effectCSSValue(effects: readonly ColorEffect[]): string {
  return effects.filter(effect => effect.type !== 'BACKGROUND_BLUR').map(effect => `${effect.type === 'INNER_SHADOW' ? 'inset ' : ''}${effect.x ?? 0}px ${effect.y ?? 0}px ${effect.blur}px ${effect.spread ?? 0}px ${effect.color}`).join(', ');
}

export const NATIVE_COLOR_PATHS: Record<string, [keyof ColorValues, string]> = {
  page: ['background', 'page'], focus: ['background', 'focus'],
  surface: ['surface', 'base'], surfaceHover: ['surface', 'cardHover'], mutedSurface: ['surface', 'muted'],
  elevatedSurface: ['surface', 'elevated'], disabledSurface: ['surface', 'disabled'], overlaySurface: ['surface', 'overlay'],
  placeholderSurface: ['surface', 'placeholder'], inverseSurface: ['surface', 'inverse'],
  actionPrimary: ['interaction', 'primary'], actionOnPrimary: ['interaction', 'onPrimary'],
  selectionSurface: ['interaction', 'selected'], selectionText: ['interaction', 'onSelected'], focusRing: ['interaction', 'focus'],
  hoverOverlay: ['interaction', 'hoverOverlay'], pressedOverlay: ['interaction', 'pressedOverlay'], pressedInverseOverlay: ['interaction', 'pressedInverseOverlay'],
};
for (const group of ['text', 'border', 'icon', 'state', 'scrim'] as const) {
  for (const key of Object.keys(COLOR_TOKENS[group])) {
    const name = group === 'state' ? key : group === 'border' && key === 'default' ? group : group + key[0].toUpperCase() + key.slice(1);
    NATIVE_COLOR_PATHS[name] = [group, key];
  }
}

export function nativeColorForMode(name: string, mode: ColorMode): string {
  const path = NATIVE_COLOR_PATHS[name];
  if (!path) throw new Error(`Unknown native color role: ${name}`);
  return (COLOR_TOKENS_BY_MODE[mode][path[0]] as Record<string, string>)[path[1]];
}

export const colorTokenCSSName = (group: string, key: string) => {
  const suffix = key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
  if (group === 'shadow') return `--tb-shadow-${suffix}`;
  return `--tb-color-${group === 'background' ? 'bg-' : group === 'state' ? '' : group + '-'}${suffix}`;
};

/** Explicit theme boundaries also redeclare aliases, so nested modes cannot leak. */
export function colorModeCSSVariables(mode: ColorMode): Record<string, string> {
  const result: Record<string, string> = { '--tb-taste-tint-base': TASTE_TINT_BASES[mode] };
  const aliases: Record<string,string> = {
    background: 'bg-page', foreground: 'text-primary', card: 'surface-card', 'card-foreground': 'text-primary',
    popover: 'surface-elevated', 'popover-foreground': 'text-primary', primary: 'interaction-primary', 'primary-foreground': 'interaction-on-primary',
    secondary: 'surface-muted', 'secondary-foreground': 'text-primary', muted: 'surface-muted', 'muted-foreground': 'text-hint',
    accent: 'surface-muted', 'accent-foreground': 'text-primary', destructive: 'destructive', 'destructive-foreground': 'text-inverse',
    border: 'border-default', input: 'border-default', 'input-background': 'surface-muted', 'switch-background': 'surface-disabled', ring: 'interaction-focus',
    sidebar: 'surface-base', 'sidebar-foreground': 'text-primary', 'sidebar-primary': 'interaction-primary', 'sidebar-primary-foreground': 'interaction-on-primary',
    'sidebar-accent': 'surface-muted', 'sidebar-accent-foreground': 'text-primary', 'sidebar-border': 'border-default', 'sidebar-ring': 'interaction-focus',
  };
  for (const [name,role] of Object.entries(aliases)) result['--' + name] = `var(--tb-color-${role})`;
  for (const [group, tokens] of Object.entries(COLOR_TOKENS_BY_MODE[mode])) {
    for (const [key, value] of Object.entries(tokens)) result[colorTokenCSSName(group, key)] = value;
  }
  for (const id of TASTE_IDS) {
    const prefix = `--tb-taste-${id}-`;
    result[prefix + 'chart-main'] = miniChartMainColor(id, mode);
    for (const tint of TASTE_CHART_TINT_STEPS) if (tint !== 0) result[prefix + 'chart-tint-' + tint] = tasteChartColor(id, tint, mode);
    for (const [role, step] of Object.entries(TASTE_LINE_CHART_STEPS_BY_MODE[mode])) {
      result[prefix + 'line-chart-' + role.replace(/[A-Z]/g, c => '-' + c.toLowerCase())] = `var(${prefix}${step === 0 ? 'main' : 'tint-' + step})`;
    }
    for (const [step, value] of Object.entries(TASTE_TINTS_BY_MODE[mode][id])) result[prefix + 'tint-' + step] = value;
    for (const [role, value] of Object.entries(TASTE_PALETTES_BY_MODE[mode][id])) {
      const step = TASTE_ROLE_STEPS_BY_MODE[mode][role as keyof typeof TASTE_COLOR_ROLE_STEPS];
      result[prefix + role.replace(/[A-Z]/g, c => '-' + c.toLowerCase())] = step ? `var(${prefix}tint-${step})` : value;
    }
    result[prefix + 'ring-base'] = `var(${prefix}tint-surface)`;
    result[prefix + 'motion-companion'] = `var(${prefix}tint-${CATEGORY_MOTION_COMPANION_STEP[mode]})`;
    for (const role of Object.keys(TASTE_CHIP_ROLE_STEPS_BY_MODE[mode])) {
      result[prefix + 'chip-' + role] = role === 'border' ? `var(${prefix}border-default)` : `var(${prefix}tint-surface)`;
    }
  }
  for (const [name, role] of Object.entries(BORDER_ROLE_ALIASES)) {
    result[`--tb-color-border-${name.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`] = `var(${colorTokenCSSName(role.group, role.key)})`;
  }
  result['--tb-color-border-on-muted'] = BORDER_ON_MUTED_BY_MODE[mode];
  result['--tb-color-chart-on-bright-fill'] = CHART_ON_BRIGHT_FILL;
  result['--tb-color-chart-comparison-track'] = CHART_COMPARISON_TRACK_BY_MODE[mode];
  result['--tb-color-chart-remainder'] = CHART_REMAINDER_BY_MODE[mode];
  result['--tb-color-chart-insight-placeholder'] = CATEGORY_MOTION_PLACEHOLDER[mode];
  result['--tb-color-chart-insight-empty'] = CATEGORY_MOTION_EMPTY[mode];
  for (const [role, value] of Object.entries(FOREGROUND_COLORS_BY_MODE[mode])) result[`--tb-color-${role.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`] = value;
  for (const id of TASTE_IDS) for (let level = 0; level <= 4; level++) result[`--tb-taste-${id}-heatmap-${level}`] = heatmapLevelColor(id, level, mode);
  for (const [role, value] of Object.entries(NEUTRAL_CHIP_COLORS_BY_MODE[mode])) result[`--tb-chip-neutral-${role}`] = role === 'border' ? 'var(--tb-color-border-on-muted)' : value;
  result['--tb-taste-neutral-main'] = NEUTRAL_TASTE_PALETTES_BY_MODE[mode].main;
  result['--tb-taste-neutral-tint-80'] = NEUTRAL_TASTE_PALETTES_BY_MODE[mode].tint80;
  result['--tb-taste-neutral-tint-80'] = mixTasteWithBase(NEUTRAL_TASTE_TOKENS.palette.main, 80, mode);
  result['--tb-taste-neutral-tint-surface'] = NEUTRAL_TASTE_PALETTES_BY_MODE[mode].tintSurface;
  for (const [name, role] of Object.entries(DATA_VIZ_COLOR_ROLES)) result[role.css] = dataVizColors(mode)[name as keyof typeof DATA_VIZ_COLOR_ROLES];
  for (const id of TASTE_IDS) {
    const measurement = MEASUREMENT_PALETTES_BY_MODE[mode][id];
    const prefix = `--tb-taste-${id}-measurement-`;
    result[prefix + 'accent'] = measurement.accent;
    result[prefix + 'text'] = measurement.textColor;
    measurement.loop.nodeColors.forEach((value, index) => { result[prefix + 'node-' + (index + 1)] = value; });
    for (const role of ['ringBaseColor', 'ringBaseColorSoft', 'ringGuideBaseColor', 'glowTransparentColor'] as const) result[prefix + role.replace(/[A-Z]/g, c => '-' + c.toLowerCase())] = measurement.loop[role];
    result[prefix + 'guide-tint-base'] = TASTE_TINT_BASES[mode];
    for (const [role,value] of Object.entries(RADAR_PALETTES_BY_MODE[mode][id])) result[`--tb-taste-${id}-radar-${role.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}`] = value;
  }
  for (const [key, effects] of Object.entries(EFFECT_TOKENS_BY_MODE[mode])) {
    const cssKey = key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    // Existing five shadow variables keep their exact serialized Light values.
    if (!(key in COLOR_TOKENS.shadow)) result[`--tb-shadow-${cssKey}`] = effectCSSValue(effects);
    effects.forEach((effect,index) => {
      if (effect.color) result[`--tb-effect-${cssKey}-${index}-color`] = effect.color;
      if (effect.type === 'BACKGROUND_BLUR') result[`--tb-effect-${cssKey}-blur`] = `${effect.blur}px`;
      for (const field of ['x','y','blur','spread'] as const) result[`--tb-effect-${cssKey}-${index}-${field}`] = `${effect[field] ?? 0}px`;
    });
  }
  return result;
}
