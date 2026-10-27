export const DESIGN_SYSTEM = {
  name: '플레이팅',
  englishName: 'Plating',
  product: 'Taste Buddy',
  description: '맛의 경험을 담고, 관계를 정돈하고, 의미가 드러나는 순간을 설계한다.',
} as const;

export const SPACING_TOKENS = {
  2: '2px',
  4: '4px',
  6: '6px',
  8: '8px',
  10: '10px',
  12: '12px',
  16: '16px',
  20: '20px',
  24: '24px',
  40: '40px',
} as const;

export const RADIUS_TOKENS = {
  6: '6px',
  8: '8px',
  10: '10px',
  12: '12px',
  14: '14px',
  20: '20px',
  24: '24px',
  full: '9999px',
} as const;

export const TYPOGRAPHY_TOKENS = {
  family: {
    sans: '"Pretendard", ui-sans-serif, system-ui, sans-serif',
  },
  fontSize: {
    10: '10px',
    11: '11px',
    12: '12px',
    13: '13px',
    14: '14px',
    15: '15px',
    16: '16px',
    18: '18px',
    20: '18px',
    22: '18px',
    24: '18px',
    28: '18px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.4,
    relaxed: 1.5,
  },
  letterSpacing: {
    tight: '-0.24px',
    micro: '0.14px',
    none: '0',
  },
} as const;

export const SHADOW_TOKENS = {
  hover: '0 1px 3px rgba(15, 15, 15, 0.06)',
  soft: '0 4px 20px rgba(0, 0, 0, 0.1)',
  strong: '0 12px 32px rgba(15, 15, 15, 0.12)',
  button: '0 8px 20px rgba(0, 0, 0, 0.1)',
  drawer: '0 20px 60px rgba(0, 0, 0, 0.24)',
} as const;

export const MOTION_TOKENS = {
  durationMs: {
    press: 120,
    fast: 180,
    normal: 300,
    medium: 500,
    slow: 620,
    slowest: 720,
    loopPulse: 1600,
    splash: 2500,
  },
  staggerMs: 60,
  easing: {
    standard: 'ease',
    entrance: 'cubic-bezier(0.22, 1, 0.36, 1)',
    exit: 'ease-out',
  },
  spring: {
    screenDamping: 25,
    screenStiffness: 200,
  },
  scale: {
    press: 0.98,
    tabHover: 1.05,
    tabActive: 1.1,
    loopNodePulse: 1.28,
    loopLabelPulse: 1.06,
  },
  distance: {
    xSmall: 8,
    small: 12,
    medium: 20,
    large: 40,
    onboardingSwipe: 100,
  },
} as const;

export const ICON_TOKENS = {
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    control: 20,
    lg: 24,
    xl: 28,
    touch: 24,
    hero: 24,
  },
  strokeWidth: {
    thin: 1.5,
    regular: 1.8,
    medium: 2,
    strong: 2.2,
    emphasis: 3,
  },
  container: {
    sm: 18,
    md: 24,
    lg: 32,
    xl: 32,
  },
} as const;

export const BOX_TOKENS = {
  size: {
    sm: 32,
    md: 40,
    lg: 48,
  },
} as const;

export const DATA_VIZ_TOKENS = {
  progress: {
    barHeight: 8,
    barTrack: '#E8E8E8',
  },
  radar: {
    size: 320,
    gridColor: '#E8E8E8',
    averageFill: 'rgba(240, 240, 240, 0.6)',
    averageStroke: '#D0D0D0',
    highlightFill: 'rgba(255, 153, 0, 0.12)',
    highlightStroke: '#FF9900',
    labelSize: 10,
    labelColor: '#888888',
    nodeSize: 3,
    outerDotSize: 8,
  },
  trend: {
    lineStrokeWidth: 1,
    dotSize: 4,
    activeDotSize: 5,
  },
  ring: {
    outerSize: 320,
    innerNodeRadius: 12,
    stepCount: 10,
    outerRingThickness: 24,
    guideDotSize: 1,
    stepPulses: 1,
  },
} as const;

export const COLOR_TOKENS = {
  background: {
    page: '#F3F3F3',
    focus: '#FFFFFF',
  },
  surface: {
    base: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#FAFAFA',
    muted: '#F7F7F7',
    elevated: '#FCFCFC',
    disabled: '#EFEFEF',
    overlay: 'rgba(255, 255, 255, 0.8)',
    placeholder: '#EFEFEF',
    inverse: '#0F0F0F',
  },
  text: {
    primary: '#0F0F0F',
    secondary: '#3F3F3F',
    tertiary: '#535353',
    body: '#666666',
    action: '#666666',
    hint: '#6F6F6F',
    disabled: '#AFAFAF',
    inverse: '#FFFFFF',
    subtle: 'rgba(15, 15, 15, 0.6)',
    muted: 'rgba(15, 15, 15, 0.5)',
    faint: 'rgba(15, 15, 15, 0.4)',
  },
  border: {
    card: '#F0F0F0',
    subtle: '#E8E8E8',
    default: '#E7E7E7',
    strong: '#E5E5E5',
    disabled: '#E0E0E0',
    avatar: 'rgba(15, 15, 15, 0.2)',
    avatarSoft: 'rgba(15, 15, 15, 0.15)',
  },
  icon: {
    primary: '#3F3F3F',
    hover: '#6F6F6F',
    muted: '#AFAFAF',
  },
  state: {
    neutral: '#3F3F3F',
    neutralSoft: '#EFEFEF',
    informative: '#3F3F3F',
    informativeSoft: '#F7F7F7',
    success: '#2F8F5B',
    successText: '#236B45',
    successStrong: '#236B45',
    successSoft: '#E6F4EC',
    warning: '#A8661A',
    warningText: '#875014',
    warningStrong: '#875014',
    warningSoft: '#FFF1DE',
    destructive: '#D4183D',
    destructiveText: '#B31333',
    destructiveSoft: '#FCEDEF',
  },
  interaction: {
    primary: '#0F0F0F',
    onPrimary: '#FFFFFF',
    selected: '#0F0F0F',
    onSelected: '#FFFFFF',
    focus: '#3F3F3F',
    hoverOverlay: 'rgba(0, 0, 0, 0.04)',
    pressedOverlay: 'rgba(0, 0, 0, 0.06)',
    pressedInverseOverlay: 'rgba(255, 255, 255, 0.1)',
  },
  scrim: {
    subtle: 'rgba(0, 0, 0, 0.35)',
    default: 'rgba(0, 0, 0, 0.5)',
    strong: 'rgba(0, 0, 0, 0.6)',
  },
  shadow: SHADOW_TOKENS,
} as const;

export const LAYOUT_TOKENS = {
  screenMaxWidth: '1440px',
  pageGutter: '20px',
  sectionGap: SPACING_TOKENS[20],
  cardStackGap: SPACING_TOKENS[12],
  cardPadding: '12px',
  topAppBarHeight: '48px',
  flowTopBarHeight: '32px',
  bottomTabBarHeight: '60px',
  primaryButtonHeight: '48px',
  bottomFadeMinHeight: '140px',
  bottomIndicatorWidth: '134px',
  tasteLoopSize: 320,
  tasteLoopGuideDotDiameter: 1,
  tasteLoopGuideDotGap: 3,
  tasteLoopGuideRadius: 138,
  tasteLoopLabelOffset: 4,
  tasteLoopNodeRadius: 12,
  tasteLoopOuterRingInset: 10,
  tasteLoopOuterRingThickness: 24,
  tasteLoopRingRadius: 138,
  tasteLoopStepCount: 10,
} as const;

export const COMPONENT_TOKENS = {
  miniChart: {
    lineStartTint: 70,
    stackedBarTint: 20,
    compactLine: { rowHeight: 26, rowGap: 4, trackWidth: 12, lineWidth: 2, currentDiameter: 12, historyDiameter: 4 },
    width: 132,
    height: 56,
    gap: 3,
    weeklyGap: 8,
    groupGap: 8,
    intraGroupGap: 2,
    maximumBarWidth: 12,
    zeroHeightRatio: 0.5,
    examplePadding: 16,
  },
  card: {
    background: COLOR_TOKENS.surface.card,
    hoverBackground: COLOR_TOKENS.surface.cardHover,
    padding: SPACING_TOKENS[12],
    radius: RADIUS_TOKENS[20],
  },
  button: {
    height: LAYOUT_TOKENS.primaryButtonHeight,
    radius: RADIUS_TOKENS[10],
    background: COLOR_TOKENS.text.primary,
    color: COLOR_TOKENS.text.inverse,
    disabledBackground: COLOR_TOKENS.surface.disabled,
    disabledColor: COLOR_TOKENS.text.disabled,
  },
  badge: {
    radius: RADIUS_TOKENS[6],
    paddingInline: SPACING_TOKENS[8],
    paddingBlock: SPACING_TOKENS[2],
  },
  chip: {
    radius: RADIUS_TOKENS.full,
    size: {
      xs: {
        fontSize: TYPOGRAPHY_TOKENS.fontSize[10],
        gap: SPACING_TOKENS[4],
        iconSize: TYPOGRAPHY_TOKENS.fontSize[12],
        paddingBlock: SPACING_TOKENS[4],
        paddingInline: SPACING_TOKENS[8],
      },
      sm: {
        fontSize: TYPOGRAPHY_TOKENS.fontSize[11],
        gap: SPACING_TOKENS[6],
        iconSize: TYPOGRAPHY_TOKENS.fontSize[12],
        paddingBlock: SPACING_TOKENS[6],
        paddingInline: SPACING_TOKENS[10],
      },
      md: {
        fontSize: TYPOGRAPHY_TOKENS.fontSize[12],
        gap: SPACING_TOKENS[8],
        iconSize: TYPOGRAPHY_TOKENS.fontSize[14],
        paddingBlock: SPACING_TOKENS[8],
        paddingInline: SPACING_TOKENS[12],
      },
    },
    tone: {
      neutral: {
        soft: {
          backgroundColor: COLOR_TOKENS.surface.muted,
          borderColor: COLOR_TOKENS.border.default,
          color: COLOR_TOKENS.text.muted,
        },
        outline: {
          backgroundColor: 'transparent',
          borderColor: COLOR_TOKENS.border.default,
          color: COLOR_TOKENS.text.secondary,
        },
        solid: {
          backgroundColor: COLOR_TOKENS.text.primary,
          borderColor: COLOR_TOKENS.text.primary,
          color: COLOR_TOKENS.text.inverse,
        },
        text: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: COLOR_TOKENS.text.secondary,
        },
      },
      success: {
        soft: {
          backgroundColor: COLOR_TOKENS.state.successSoft,
          borderColor: COLOR_TOKENS.state.successSoft,
          color: COLOR_TOKENS.state.success,
        },
        outline: {
          backgroundColor: 'transparent',
          borderColor: COLOR_TOKENS.state.success,
          color: COLOR_TOKENS.state.success,
        },
        solid: {
          backgroundColor: COLOR_TOKENS.state.success,
          borderColor: COLOR_TOKENS.state.success,
          color: COLOR_TOKENS.text.inverse,
        },
        text: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: COLOR_TOKENS.state.success,
        },
      },
      warning: {
        soft: {
          backgroundColor: COLOR_TOKENS.state.warningSoft,
          borderColor: COLOR_TOKENS.state.warningSoft,
          color: COLOR_TOKENS.state.warning,
        },
        outline: {
          backgroundColor: 'transparent',
          borderColor: COLOR_TOKENS.state.warning,
          color: COLOR_TOKENS.state.warning,
        },
        solid: {
          backgroundColor: COLOR_TOKENS.state.warning,
          borderColor: COLOR_TOKENS.state.warning,
          color: COLOR_TOKENS.text.inverse,
        },
        text: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: COLOR_TOKENS.state.warning,
        },
      },
      accent: {
        soft: {
          backgroundColor: COLOR_TOKENS.surface.base,
          borderColor: COLOR_TOKENS.text.primary,
          color: COLOR_TOKENS.text.primary,
        },
        outline: {
          backgroundColor: 'transparent',
          borderColor: COLOR_TOKENS.text.primary,
          color: COLOR_TOKENS.text.primary,
        },
        solid: {
          backgroundColor: COLOR_TOKENS.text.primary,
          borderColor: COLOR_TOKENS.text.primary,
          color: COLOR_TOKENS.text.inverse,
        },
        text: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: COLOR_TOKENS.text.primary,
        },
      },
    },
  },
  pill: {
    radius: RADIUS_TOKENS.full,
  },
} as const;

export const TASTE_IDS = ['sweet', 'sour', 'bitter', 'salty', 'umami', 'fat'] as const;

export type TasteId = (typeof TASTE_IDS)[number];

/** Steps name the mode's base-color percentage, not alpha or remaining taste color. */
export const TASTE_TINT_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const;
export type TasteTintStep = (typeof TASTE_TINT_STEPS)[number];
export type ColorMode = 'light' | 'dark';
export const TASTE_TINT_BASES = { light: '#FFFFFF', dark: '#1C1C1C' } as const;
export const TASTE_MAIN_COLORS = {
  sweet: '#FF9900', sour: '#FFD600', bitter: '#95C900',
  salty: '#7299FF', umami: '#B372B4', fat: '#95867A',
} as const;

/** Both appearances share the vivid taste identity; surfaces and chart roles adapt. */
export const DARK_TASTE_MAIN_COLORS = TASTE_MAIN_COLORS;
export const TASTE_MAIN_COLORS_BY_MODE = { light: TASTE_MAIN_COLORS, dark: DARK_TASTE_MAIN_COLORS } as const;

export function mixTasteWithBase(main: string, basePercent: TasteTintStep, mode: ColorMode): string {
  return '#' + [1, 3, 5].map(offset => {
    const channel = parseInt(main.slice(offset, offset + 2), 16);
    const base = parseInt(TASTE_TINT_BASES[mode].slice(offset, offset + 2), 16);
    return Math.floor((channel * (100 - basePercent) + base * basePercent + 50) / 100).toString(16).padStart(2, '0');
  }).join('').toUpperCase();
}

export function mixTasteWithWhite(main: string, whitePercent: TasteTintStep): string {
  return mixTasteWithBase(main, whitePercent, 'light');
}

export const TASTE_TINTS_BY_MODE = Object.fromEntries((['light', 'dark'] as const).map(mode => [mode,
  Object.fromEntries(TASTE_IDS.map(id => [id,
    Object.fromEntries(TASTE_TINT_STEPS.map(step => [step, mixTasteWithBase(TASTE_MAIN_COLORS_BY_MODE[mode][id], step, mode)])),
  ])),
])) as Record<ColorMode, Record<TasteId, Record<TasteTintStep, string>>>;

/** Existing unthemed consumers retain the Light palette. */
export const TASTE_TINTS = TASTE_TINTS_BY_MODE.light;

export const TASTE_COLOR_ROLE_STEPS = { tintSoft: 80, tintSoftBorder: 80, borderSubtle: 80, borderDefault: 70, borderStrong: 60, tintSurface: 80, chartTrack: 80 } as const;

type TasteScale = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

interface TastePalette {
  bg: string;
  dark: string;
  gradient: string;
  light: string;
  main: string;
  chartTrack: string;
  tintSoft: string;
  tintSoftBorder: string;
  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;
  borderAccent: string;
  tintSurface: string;
  tintSurfaceSubText: string;
  tintSurfaceText: string;
}

interface TasteMeasurementLoop {
  glowTransparentColor: string;
  nodeColors: TasteScale;
  ringBaseColor: string;
  ringBaseColorSoft: string;
  ringGuideBaseColor: string;
}

interface TasteDefinition {
  label: string;
  measurement: {
    accent: string;
    loop: TasteMeasurementLoop;
    ordinal: string;
  };
  palette: TastePalette;
}

export const TASTE_TOKENS = {
  sweet: {
    label: '단맛',
    palette: {
      main: TASTE_MAIN_COLORS.sweet,
      chartTrack: TASTE_TINTS.sweet[TASTE_COLOR_ROLE_STEPS.chartTrack],
      dark: '#CC7A00',
      light: '#FFCC80',
      bg: '#FFD699',
      tintSoft: TASTE_TINTS.sweet[TASTE_COLOR_ROLE_STEPS.tintSoft],
      tintSoftBorder: TASTE_TINTS.sweet[TASTE_COLOR_ROLE_STEPS.tintSoftBorder],
      borderSubtle: TASTE_TINTS.sweet[TASTE_COLOR_ROLE_STEPS.borderSubtle],
      borderDefault: TASTE_TINTS.sweet[TASTE_COLOR_ROLE_STEPS.borderDefault],
      borderStrong: TASTE_TINTS.sweet[TASTE_COLOR_ROLE_STEPS.borderStrong],
      borderAccent: '#FF9900',
      tintSurface: TASTE_TINTS.sweet[TASTE_COLOR_ROLE_STEPS.tintSurface],
      tintSurfaceSubText: '#896735',
      tintSurfaceText: '#6F4609',
      gradient: 'linear-gradient(135deg, #FF9900, #FFB84D)',
    },
    measurement: {
      accent: '#FF9500',
      ordinal: '첫 번째',
      loop: {
        nodeColors: [
          '#FFF5E5',
          '#FFEBCC',
          '#FFE0B2',
          '#FFD699',
          '#FFCC7F',
          '#FFC266',
          '#FFB74C',
          '#FFAD33',
          '#FFA319',
          '#FF9900',
        ],
        ringBaseColor: '#FFEBCC',
        ringBaseColorSoft: '#FFEBCC1A',
        ringGuideBaseColor: '#FF9900',
        glowTransparentColor: '#FFEBCC08',
      },
    },
  },
  sour: {
    label: '신맛',
    // UI roles alias the white-mix scale. Measurement keeps its dedicated ramp.
    palette: {
      main: TASTE_MAIN_COLORS.sour,
      chartTrack: TASTE_TINTS.sour[TASTE_COLOR_ROLE_STEPS.chartTrack],
      dark: '#C99A00',
      light: '#FDD835',
      bg: '#FFEF99',
      tintSoft: TASTE_TINTS.sour[TASTE_COLOR_ROLE_STEPS.tintSoft],
      tintSoftBorder: TASTE_TINTS.sour[TASTE_COLOR_ROLE_STEPS.tintSoftBorder],
      borderSubtle: TASTE_TINTS.sour[TASTE_COLOR_ROLE_STEPS.borderSubtle],
      borderDefault: TASTE_TINTS.sour[TASTE_COLOR_ROLE_STEPS.borderDefault],
      borderStrong: TASTE_TINTS.sour[TASTE_COLOR_ROLE_STEPS.borderStrong],
      borderAccent: '#FFD600',
      tintSurface: TASTE_TINTS.sour[TASTE_COLOR_ROLE_STEPS.tintSurface],
      tintSurfaceSubText: '#897C35',
      tintSurfaceText: '#6F5F09',
      gradient: 'linear-gradient(135deg, #FFD600, #FFD54F)',
    },
    measurement: {
      accent: '#FFD600',
      ordinal: '두 번째',
      loop: {
        nodeColors: [
          '#FFF7CC',
          '#FFF4B8',
          '#FFF1A3',
          '#FFEE8F',
          '#FFEB7A',
          '#FFE866',
          '#FFE552',
          '#FFE23D',
          '#FFDF29',
          '#FFD600',
        ],
        ringBaseColor: '#FFF7CC',
        ringBaseColorSoft: '#FFF7CC1A',
        ringGuideBaseColor: '#FFD600',
        glowTransparentColor: '#FFF7CC08',
      },
    },
  },
  bitter: {
    label: '쓴맛',
    palette: {
      main: TASTE_MAIN_COLORS.bitter,
      chartTrack: TASTE_TINTS.bitter[TASTE_COLOR_ROLE_STEPS.chartTrack],
      dark: '#6E9600',
      light: '#E6EE9C',
      bg: '#E0EBB4',
      tintSoft: TASTE_TINTS.bitter[TASTE_COLOR_ROLE_STEPS.tintSoft],
      tintSoftBorder: TASTE_TINTS.bitter[TASTE_COLOR_ROLE_STEPS.tintSoftBorder],
      borderSubtle: TASTE_TINTS.bitter[TASTE_COLOR_ROLE_STEPS.borderSubtle],
      borderDefault: TASTE_TINTS.bitter[TASTE_COLOR_ROLE_STEPS.borderDefault],
      borderStrong: TASTE_TINTS.bitter[TASTE_COLOR_ROLE_STEPS.borderStrong],
      borderAccent: '#95C900',
      tintSurface: TASTE_TINTS.bitter[TASTE_COLOR_ROLE_STEPS.tintSurface],
      tintSurfaceSubText: '#70794B',
      tintSurfaceText: '#505B24',
      gradient: 'linear-gradient(135deg, #95C900, #AED581)',
    },
    measurement: {
      accent: '#8CC600',
      ordinal: '세 번째',
      loop: {
        nodeColors: [
          '#EAF4CC',
          '#E1EFC0',
          '#D8EAB4',
          '#CFE5A8',
          '#C5DF9C',
          '#BCDA90',
          '#B3D584',
          '#AAD078',
          '#A0CB6C',
          '#95C900',
        ],
        ringBaseColor: '#EAF4CC',
        ringBaseColorSoft: '#EAF4CC1A',
        ringGuideBaseColor: '#95C900',
        glowTransparentColor: '#EAF4CC08',
      },
    },
  },
  salty: {
    label: '짠맛',
    palette: {
      main: TASTE_MAIN_COLORS.salty,
      chartTrack: TASTE_TINTS.salty[TASTE_COLOR_ROLE_STEPS.chartTrack],
      dark: '#4A70CC',
      light: '#90CAF9',
      bg: '#C6D6FF',
      tintSoft: TASTE_TINTS.salty[TASTE_COLOR_ROLE_STEPS.tintSoft],
      tintSoftBorder: TASTE_TINTS.salty[TASTE_COLOR_ROLE_STEPS.tintSoftBorder],
      borderSubtle: TASTE_TINTS.salty[TASTE_COLOR_ROLE_STEPS.borderSubtle],
      borderDefault: TASTE_TINTS.salty[TASTE_COLOR_ROLE_STEPS.borderDefault],
      borderStrong: TASTE_TINTS.salty[TASTE_COLOR_ROLE_STEPS.borderStrong],
      borderAccent: '#7299FF',
      tintSurface: TASTE_TINTS.salty[TASTE_COLOR_ROLE_STEPS.tintSurface],
      tintSurfaceSubText: '#5A6789',
      tintSurfaceText: '#36466F',
      gradient: 'linear-gradient(135deg, #7299FF, #9FBFFF)',
    },
    measurement: {
      accent: '#5898FF',
      ordinal: '네 번째',
      loop: {
        nodeColors: [
          '#E3EBFF',
          '#D6E2FF',
          '#C9D9FF',
          '#BCD0FF',
          '#AFC7FF',
          '#A2BEFF',
          '#95B5FF',
          '#88ACFF',
          '#7BA3FF',
          '#7299FF',
        ],
        ringBaseColor: '#E3EBFF',
        ringBaseColorSoft: '#E3EBFF1A',
        ringGuideBaseColor: '#7299FF',
        glowTransparentColor: '#E3EBFF08',
      },
    },
  },
  umami: {
    label: '감칠맛',
    palette: {
      main: TASTE_MAIN_COLORS.umami,
      chartTrack: TASTE_TINTS.umami[TASTE_COLOR_ROLE_STEPS.chartTrack],
      dark: '#8A5490',
      light: '#CE93D8',
      bg: '#E1C7E1',
      tintSoft: TASTE_TINTS.umami[TASTE_COLOR_ROLE_STEPS.tintSoft],
      tintSoftBorder: TASTE_TINTS.umami[TASTE_COLOR_ROLE_STEPS.tintSoftBorder],
      borderSubtle: TASTE_TINTS.umami[TASTE_COLOR_ROLE_STEPS.borderSubtle],
      borderDefault: TASTE_TINTS.umami[TASTE_COLOR_ROLE_STEPS.borderDefault],
      borderStrong: TASTE_TINTS.umami[TASTE_COLOR_ROLE_STEPS.borderStrong],
      borderAccent: '#B372B4',
      tintSurface: TASTE_TINTS.umami[TASTE_COLOR_ROLE_STEPS.tintSurface],
      tintSurfaceSubText: '#705B70',
      tintSurfaceText: '#513751',
      gradient: 'linear-gradient(135deg, #B372B4, #CE93D8)',
    },
    measurement: {
      accent: '#AF52DE',
      ordinal: '다섯 번째',
      loop: {
        nodeColors: [
          '#F0E3F0',
          '#E7D7E8',
          '#DECAE0',
          '#D5BED8',
          '#CCB1D0',
          '#C3A5C8',
          '#BA98C0',
          '#B18CB8',
          '#A87FB0',
          '#B372B4',
        ],
        ringBaseColor: '#F0E3F0',
        ringBaseColorSoft: '#F0E3F01A',
        ringGuideBaseColor: '#B372B4',
        glowTransparentColor: '#F0E3F008',
      },
    },
  },
  fat: {
    label: '지방맛',
    palette: {
      main: TASTE_MAIN_COLORS.fat,
      chartTrack: TASTE_TINTS.fat[TASTE_COLOR_ROLE_STEPS.chartTrack],
      dark: '#6B5E54',
      light: '#BCAAA4',
      bg: '#D5CFCA',
      tintSoft: TASTE_TINTS.fat[TASTE_COLOR_ROLE_STEPS.tintSoft],
      tintSoftBorder: TASTE_TINTS.fat[TASTE_COLOR_ROLE_STEPS.tintSoftBorder],
      borderSubtle: TASTE_TINTS.fat[TASTE_COLOR_ROLE_STEPS.borderSubtle],
      borderDefault: TASTE_TINTS.fat[TASTE_COLOR_ROLE_STEPS.borderDefault],
      borderStrong: TASTE_TINTS.fat[TASTE_COLOR_ROLE_STEPS.borderStrong],
      borderAccent: '#95867A',
      tintSurface: TASTE_TINTS.fat[TASTE_COLOR_ROLE_STEPS.tintSurface],
      tintSurfaceSubText: '#66625D',
      tintSurfaceText: '#453F3A',
      gradient: 'linear-gradient(135deg, #95867A, #B0A49A)',
    },
    measurement: {
      accent: '#8E8279',
      ordinal: '여섯 번째',
      loop: {
        nodeColors: [
          '#EAE7E4',
          '#E2DEDA',
          '#DAD5D0',
          '#D2CCC6',
          '#CAC3BC',
          '#C2BAB2',
          '#BAB1A8',
          '#B2A89E',
          '#AA9F94',
          '#95867A',
        ],
        ringBaseColor: '#EAE7E4',
        ringBaseColorSoft: '#EAE7E41A',
        ringGuideBaseColor: '#95867A',
        glowTransparentColor: '#EAE7E408',
      },
    },
  },
} as const satisfies Record<TasteId, TasteDefinition>;

export const TASTE_LABELS = TASTE_IDS.map((id) => TASTE_TOKENS[id].label) as readonly string[];

export const TASTE_LABEL_TO_ID = Object.fromEntries(
  TASTE_IDS.map((id) => [TASTE_TOKENS[id].label, id]),
) as Record<(typeof TASTE_LABELS)[number], TasteId>;

export const TASTE_COLORS = Object.fromEntries(
  TASTE_IDS.map((id) => [TASTE_TOKENS[id].label, TASTE_TOKENS[id].palette]),
) as Record<(typeof TASTE_LABELS)[number], TastePalette>;

export const NEUTRAL_TASTE_TOKENS = {
  label: '모든맛',
  palette: {
    main: '#7A7A7A',
    tint80: mixTasteWithBase('#7A7A7A', 80, 'light'),
    tintSurface: '#E4E4E4',
  },
} as const;

/** Sheet surface and the presenting screen. Keep the current platform geometry. */
export const SHEET_PRESENTATION_TOKENS = {
  native: {
    background: { scale: 0.9, offsetY: 10, radius: 20, dimOpacity: 0.6, shadowY: 0, shadowBlur: 0, shadowOpacity: 0 },
    surface: { heightRatio: 0.98, topInset: 12, radius: 32, grabberWidth: 36, grabberHeight: 5 },
    drag: { minimumDistance: 6, dismissProgress: 0.32 },
  },
  web: {
    background: { scale: 0.9, offsetY: 30, radius: 24, dimOpacity: 0.6, shadowY: 20, shadowBlur: 60, shadowOpacity: 0.24 },
    surface: { heightRatio: 0.95, topInset: 12, radius: 20, grabberWidth: 40, grabberHeight: 6 },
    motion: { durationMs: MOTION_TOKENS.durationMs.slow, radiusDurationMs: MOTION_TOKENS.durationMs.slowest, easing: MOTION_TOKENS.easing.entrance },
  },
} as const;

export const DESIGN_TOKENS = {
  colors: COLOR_TOKENS,
  shadows: SHADOW_TOKENS,
  spacing: SPACING_TOKENS,
  radius: RADIUS_TOKENS,
  typography: TYPOGRAPHY_TOKENS,
  motion: MOTION_TOKENS,
  sheetPresentation: SHEET_PRESENTATION_TOKENS,
  icon: ICON_TOKENS,
  dataViz: DATA_VIZ_TOKENS,
  layout: LAYOUT_TOKENS,
  components: COMPONENT_TOKENS,
  taste: TASTE_TOKENS,
} as const;
