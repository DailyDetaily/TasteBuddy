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
    20: '20px',
    22: '22px',
    24: '24px',
    28: '28px',
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
  button: '0 8px 20px rgba(0, 0, 0, 0.1)',
  drawer: '0 20px 60px rgba(0, 0, 0, 0.24)',
} as const;

export const MOTION_TOKENS = {
  durationMs: {
    fast: 180,
    normal: 300,
    medium: 500,
    slow: 620,
    slowest: 720,
    loopPulse: 1600,
    splash: 2500,
  },
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
    md: 16,
    lg: 18,
    xl: 20,
    touch: 24,
    hero: 28,
  },
  strokeWidth: {
    thin: 1.5,
    regular: 1.8,
    medium: 2,
    strong: 2.2,
    emphasis: 3,
  },
  container: {
    sm: 28,
    md: 32,
    lg: 40,
    xl: 48,
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
    labelSize: 9,
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
  },
  surface: {
    base: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#FAFAFA',
    muted: '#F7F7F7',
    elevated: '#FCFCFC',
    disabled: '#EFEFEF',
    overlay: 'rgba(255, 255, 255, 0.8)',
  },
  text: {
    primary: '#0F0F0F',
    secondary: '#3F3F3F',
    tertiary: '#535353',
    body: '#666666',
    hint: '#888888',
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
    success: '#2F8F5B',
    successSoft: '#E6F4EC',
    warning: '#A8661A',
    warningSoft: '#FFF1DE',
  },
  shadow: SHADOW_TOKENS,
} as const;

export const LAYOUT_TOKENS = {
  screenMaxWidth: '1440px',
  pageGutter: '20px',
  sectionGap: '32px',
  cardPadding: '12px',
  topAppBarHeight: '56px',
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
  pill: {
    radius: RADIUS_TOKENS.full,
  },
} as const;

export const TASTE_IDS = ['sweet', 'sour', 'bitter', 'salty', 'umami', 'fat'] as const;

export type TasteId = (typeof TASTE_IDS)[number];

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
  tintSubText: string;
  tintText: string;
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
      main: '#FF9900',
      dark: '#CC7A00',
      light: '#FFCC80',
      bg: '#FFEBCC',
      tintSubText: '#896735',
      tintText: '#6F4609',
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
    palette: {
      main: '#FBC02D',
      dark: '#C99A00',
      light: '#FDD835',
      bg: '#FFF7CC',
      tintSubText: '#897C35',
      tintText: '#6F5F09',
      gradient: 'linear-gradient(135deg, #FBC02D, #FFD54F)',
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
      main: '#95C900',
      dark: '#6E9600',
      light: '#E6EE9C',
      bg: '#EAF4CC',
      tintSubText: '#70794B',
      tintText: '#505B24',
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
      main: '#7299FF',
      dark: '#4A70CC',
      light: '#90CAF9',
      bg: '#E3EBFF',
      tintSubText: '#5A6789',
      tintText: '#36466F',
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
      main: '#B372B4',
      dark: '#8A5490',
      light: '#CE93D8',
      bg: '#F0E3F0',
      tintSubText: '#705B70',
      tintText: '#513751',
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
      main: '#95867A',
      dark: '#6B5E54',
      light: '#BCAAA4',
      bg: '#EAE7E4',
      tintSubText: '#66625D',
      tintText: '#453F3A',
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

export const DESIGN_TOKENS = {
  colors: COLOR_TOKENS,
  shadows: SHADOW_TOKENS,
  spacing: SPACING_TOKENS,
  radius: RADIUS_TOKENS,
  typography: TYPOGRAPHY_TOKENS,
  motion: MOTION_TOKENS,
  icon: ICON_TOKENS,
  dataViz: DATA_VIZ_TOKENS,
  layout: LAYOUT_TOKENS,
  components: COMPONENT_TOKENS,
  taste: TASTE_TOKENS,
} as const;
