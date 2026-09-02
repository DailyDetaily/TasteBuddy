import { COLOR_TOKENS, SHADOW_TOKENS } from "../constants/designTokens";

export type DesignTokenRuntimeState = {
  background: string;
  bodySize: number;
  bodyText: string;
  border: string;
  captionSize: number;
  cardRadius: number;
  cardSurface: string;
  controlRadius: number;
  displaySize: number;
  fontWeight: number;
  gap: number;
  lineHeight: number;
  sectionGap: number;
  shadowKey: keyof typeof SHADOW_TOKENS;
  primaryText: string;
  titleSize: number;
};

export const DESIGN_TOKEN_RUNTIME_STORAGE_KEY = "tastebuddy-design-system-runtime-v1";

export const DESIGN_TOKEN_RUNTIME_DEFAULTS: DesignTokenRuntimeState = {
  background: COLOR_TOKENS.background.page,
  bodySize: 14,
  bodyText: COLOR_TOKENS.text.body,
  border: COLOR_TOKENS.border.default,
  captionSize: 12,
  cardRadius: 20,
  cardSurface: COLOR_TOKENS.surface.card,
  controlRadius: 10,
  displaySize: 18,
  fontWeight: 600,
  gap: 12,
  lineHeight: 1.45,
  sectionGap: 20,
  shadowKey: "button",
  primaryText: COLOR_TOKENS.text.primary,
  titleSize: 18,
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clampTypographySize(value: unknown, fallback: number): number {
  if (!isFiniteNumber(value)) {
    return fallback;
  }

  return Math.min(18, Math.max(10, Math.round(value)));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isShadowKey(value: unknown): value is keyof typeof SHADOW_TOKENS {
  return typeof value === "string" && value in SHADOW_TOKENS;
}

export function loadPersistedDesignTokenRuntimeState(): DesignTokenRuntimeState {
  if (typeof window === "undefined") {
    return DESIGN_TOKEN_RUNTIME_DEFAULTS;
  }

  try {
    const rawValue = window.localStorage.getItem(DESIGN_TOKEN_RUNTIME_STORAGE_KEY);

    if (!rawValue) {
      return DESIGN_TOKEN_RUNTIME_DEFAULTS;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<DesignTokenRuntimeState>;

    return {
      background: isNonEmptyString(parsedValue.background)
        ? parsedValue.background
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.background,
      bodySize: clampTypographySize(parsedValue.bodySize, DESIGN_TOKEN_RUNTIME_DEFAULTS.bodySize),
      bodyText: isNonEmptyString(parsedValue.bodyText)
        ? parsedValue.bodyText
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.bodyText,
      border: isNonEmptyString(parsedValue.border)
        ? parsedValue.border
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.border,
      captionSize: clampTypographySize(
        parsedValue.captionSize,
        DESIGN_TOKEN_RUNTIME_DEFAULTS.captionSize,
      ),
      cardRadius: isFiniteNumber(parsedValue.cardRadius)
        ? parsedValue.cardRadius
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.cardRadius,
      cardSurface: isNonEmptyString(parsedValue.cardSurface)
        ? parsedValue.cardSurface
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.cardSurface,
      controlRadius: isFiniteNumber(parsedValue.controlRadius)
        ? parsedValue.controlRadius
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.controlRadius,
      displaySize: clampTypographySize(
        parsedValue.displaySize,
        DESIGN_TOKEN_RUNTIME_DEFAULTS.displaySize,
      ),
      fontWeight: isFiniteNumber(parsedValue.fontWeight)
        ? parsedValue.fontWeight
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.fontWeight,
      gap: isFiniteNumber(parsedValue.gap) ? parsedValue.gap : DESIGN_TOKEN_RUNTIME_DEFAULTS.gap,
      lineHeight: isFiniteNumber(parsedValue.lineHeight)
        ? parsedValue.lineHeight
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.lineHeight,
      primaryText: isNonEmptyString(parsedValue.primaryText)
        ? parsedValue.primaryText
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.primaryText,
      sectionGap: isFiniteNumber(parsedValue.sectionGap)
        ? parsedValue.sectionGap
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.sectionGap,
      shadowKey: isShadowKey(parsedValue.shadowKey)
        ? parsedValue.shadowKey
        : DESIGN_TOKEN_RUNTIME_DEFAULTS.shadowKey,
      titleSize: clampTypographySize(parsedValue.titleSize, DESIGN_TOKEN_RUNTIME_DEFAULTS.titleSize),
    };
  } catch {
    return DESIGN_TOKEN_RUNTIME_DEFAULTS;
  }
}

export function hasPersistedDesignTokenRuntimeState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DESIGN_TOKEN_RUNTIME_STORAGE_KEY) !== null;
}

export function buildDesignTokenRuntimeOverrides(
  state: DesignTokenRuntimeState,
): Record<string, string> {
  const captionSize = clampTypographySize(state.captionSize, DESIGN_TOKEN_RUNTIME_DEFAULTS.captionSize);
  const bodySize = clampTypographySize(state.bodySize, DESIGN_TOKEN_RUNTIME_DEFAULTS.bodySize);
  const titleSize = clampTypographySize(state.titleSize, DESIGN_TOKEN_RUNTIME_DEFAULTS.titleSize);
  const displaySize = clampTypographySize(
    state.displaySize,
    DESIGN_TOKEN_RUNTIME_DEFAULTS.displaySize,
  );

  return {
    "--background": state.background,
    "--foreground": state.primaryText,
    "--card": state.cardSurface,
    "--card-foreground": state.primaryText,
    "--popover": state.cardSurface,
    "--popover-foreground": state.primaryText,
    "--primary": state.primaryText,
    "--primary-foreground": "#ffffff",
    "--secondary": COLOR_TOKENS.surface.muted,
    "--secondary-foreground": state.primaryText,
    "--accent": COLOR_TOKENS.surface.muted,
    "--accent-foreground": state.primaryText,
    "--destructive": COLOR_TOKENS.state.destructive,
    "--destructive-foreground": COLOR_TOKENS.text.inverse,
    "--border": state.border,
    "--input": state.border,
    "--input-background": COLOR_TOKENS.surface.muted,
    "--switch-background": state.border,
    "--ring": state.primaryText,
    "--radius": `${state.controlRadius}px`,
    "--tb-color-bg-page": state.background,
    "--tb-color-surface-base": state.cardSurface,
    "--tb-color-surface-card": state.cardSurface,
    "--tb-color-text-primary": state.primaryText,
    "--tb-color-text-body": state.bodyText,
    "--tb-color-text-tertiary": state.bodyText,
    "--tb-color-border-default": state.border,
    "--tb-color-border-strong": state.border,
    "--tb-color-success": COLOR_TOKENS.state.success,
    "--tb-color-success-soft": COLOR_TOKENS.state.successSoft,
    "--tb-color-warning": COLOR_TOKENS.state.warning,
    "--tb-color-warning-soft": COLOR_TOKENS.state.warningSoft,
    "--tb-color-destructive": COLOR_TOKENS.state.destructive,
    "--tb-radius-20": `${state.cardRadius}px`,
    "--tb-radius-14": `${Math.max(state.controlRadius + 4, state.controlRadius)}px`,
    "--tb-radius-12": `${Math.max(state.controlRadius + 2, state.controlRadius)}px`,
    "--tb-radius-10": `${state.controlRadius}px`,
    "--tb-layout-section-gap": `${state.sectionGap}px`,
    "--tb-layout-card-stack-gap": `${state.gap}px`,
    "--tb-space-12": `${state.gap}px`,
    "--tb-space-16": `${state.sectionGap}px`,
    "--tb-space-20": `${state.sectionGap}px`,
    "--tb-font-size-28": `${displaySize}px`,
    "--tb-font-size-24": `${displaySize}px`,
    "--tb-font-size-22": `${displaySize}px`,
    "--tb-font-size-20": `${displaySize}px`,
    "--tb-font-size-18": `${titleSize}px`,
    "--tb-font-size-14": `${bodySize}px`,
    "--tb-font-size-12": `${captionSize}px`,
    "--tb-font-weight-semibold": `${state.fontWeight}`,
    "--tb-line-height-relaxed": `${state.lineHeight}`,
    "--tb-shadow-button": SHADOW_TOKENS[state.shadowKey],
    "--tb-shadow-strong": SHADOW_TOKENS.strong,
  };
}

export function applyDesignTokenRuntimeState(state: DesignTokenRuntimeState) {
  if (typeof document === "undefined") {
    return;
  }

  const rootStyle = document.documentElement.style;

  for (const [key, value] of Object.entries(buildDesignTokenRuntimeOverrides(state))) {
    rootStyle.setProperty(key, value);
  }
}

export function persistDesignTokenRuntimeState(state: DesignTokenRuntimeState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DESIGN_TOKEN_RUNTIME_STORAGE_KEY, JSON.stringify(state));
}

export function clearAppliedDesignTokenRuntimeState() {
  if (typeof document === "undefined") {
    return;
  }

  const rootStyle = document.documentElement.style;

  for (const key of Object.keys(buildDesignTokenRuntimeOverrides(DESIGN_TOKEN_RUNTIME_DEFAULTS))) {
    rootStyle.removeProperty(key);
  }
}

export function clearPersistedDesignTokenRuntimeState() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DESIGN_TOKEN_RUNTIME_STORAGE_KEY);
  }

  clearAppliedDesignTokenRuntimeState();
}

export function applyPersistedDesignTokenRuntimeState() {
  if (!hasPersistedDesignTokenRuntimeState()) {
    return;
  }

  applyDesignTokenRuntimeState(loadPersistedDesignTokenRuntimeState());
}

export function countDesignTokenRuntimeDifferences(
  nextState: DesignTokenRuntimeState,
  appliedState: DesignTokenRuntimeState,
): number {
  return (Object.keys(nextState) as Array<keyof DesignTokenRuntimeState>).reduce((count, key) => {
    return Object.is(nextState[key], appliedState[key]) ? count : count + 1;
  }, 0);
}

export function buildDesignSystemCssSnippet(state: DesignTokenRuntimeState): string {
  const controlRadius14 = Math.max(state.controlRadius + 4, state.controlRadius);
  const controlRadius12 = Math.max(state.controlRadius + 2, state.controlRadius);
  const captionSize = clampTypographySize(state.captionSize, DESIGN_TOKEN_RUNTIME_DEFAULTS.captionSize);
  const bodySize = clampTypographySize(state.bodySize, DESIGN_TOKEN_RUNTIME_DEFAULTS.bodySize);
  const titleSize = clampTypographySize(state.titleSize, DESIGN_TOKEN_RUNTIME_DEFAULTS.titleSize);
  const displaySize = clampTypographySize(
    state.displaySize,
    DESIGN_TOKEN_RUNTIME_DEFAULTS.displaySize,
  );

  return [
    "/* Paste into :root in src/styles/design-system.css */",
    `--tb-color-bg-page: ${state.background};`,
    `--tb-color-surface-base: ${state.cardSurface};`,
    `--tb-color-surface-card: ${state.cardSurface};`,
    `--tb-color-text-primary: ${state.primaryText};`,
    `--tb-color-text-tertiary: ${state.bodyText};`,
    `--tb-color-text-body: ${state.bodyText};`,
    `--tb-color-border-default: ${state.border};`,
    `--tb-color-border-strong: ${state.border};`,
    `--tb-radius-10: ${state.controlRadius}px;`,
    `--tb-radius-12: ${controlRadius12}px;`,
    `--tb-radius-14: ${controlRadius14}px;`,
    `--tb-radius-20: ${state.cardRadius}px;`,
    `--tb-space-12: ${state.gap}px;`,
    `--tb-space-16: ${state.sectionGap}px;`,
    `--tb-space-20: ${state.sectionGap}px;`,
    `--tb-font-size-12: ${captionSize}px;`,
    `--tb-font-size-14: ${bodySize}px;`,
    `--tb-font-size-18: ${titleSize}px;`,
    `--tb-font-size-20: ${displaySize}px;`,
    `--tb-font-size-22: ${displaySize}px;`,
    `--tb-font-size-24: ${displaySize}px;`,
    `--tb-font-size-28: ${displaySize}px;`,
    `--tb-font-weight-semibold: ${state.fontWeight};`,
    `--tb-line-height-relaxed: ${state.lineHeight};`,
    `--tb-shadow-strong: ${SHADOW_TOKENS.strong};`,
    `--tb-shadow-button: ${SHADOW_TOKENS[state.shadowKey]};`,
  ].join("\n");
}

export function buildDesignTokensTsSnippet(state: DesignTokenRuntimeState): string {
  const controlRadius14 = Math.max(state.controlRadius + 4, state.controlRadius);
  const controlRadius12 = Math.max(state.controlRadius + 2, state.controlRadius);
  const captionSize = clampTypographySize(state.captionSize, DESIGN_TOKEN_RUNTIME_DEFAULTS.captionSize);
  const bodySize = clampTypographySize(state.bodySize, DESIGN_TOKEN_RUNTIME_DEFAULTS.bodySize);
  const titleSize = clampTypographySize(state.titleSize, DESIGN_TOKEN_RUNTIME_DEFAULTS.titleSize);
  const displaySize = clampTypographySize(
    state.displaySize,
    DESIGN_TOKEN_RUNTIME_DEFAULTS.displaySize,
  );

  return [
    "/* Paste the matching values into src/constants/designTokens.ts */",
    "export const SPACING_TOKENS = {",
    `  12: '${state.gap}px',`,
    `  16: '${state.sectionGap}px',`,
    `  20: '${state.sectionGap}px',`,
    "} as const;",
    "",
    "export const RADIUS_TOKENS = {",
    `  10: '${state.controlRadius}px',`,
    `  12: '${controlRadius12}px',`,
    `  14: '${controlRadius14}px',`,
    `  20: '${state.cardRadius}px',`,
    "} as const;",
    "",
    "export const TYPOGRAPHY_TOKENS = {",
    "  fontSize: {",
    `    12: '${captionSize}px',`,
    `    14: '${bodySize}px',`,
    `    18: '${titleSize}px',`,
    `    20: '${displaySize}px',`,
    `    22: '${displaySize}px',`,
    `    24: '${displaySize}px',`,
    `    28: '${displaySize}px',`,
    "  },",
    "  fontWeight: {",
    `    semibold: ${state.fontWeight},`,
    "  },",
    "  lineHeight: {",
    `    relaxed: ${state.lineHeight},`,
    "  },",
    "} as const;",
    "",
    "export const SHADOW_TOKENS = {",
    `  strong: '${SHADOW_TOKENS.strong}',`,
    `  button: '${SHADOW_TOKENS[state.shadowKey]}',`,
    "} as const;",
    "",
    "export const COLOR_TOKENS = {",
    "  background: {",
    `    page: '${state.background.toUpperCase()}',`,
    "  },",
    "  surface: {",
    `    base: '${state.cardSurface.toUpperCase()}',`,
    `    card: '${state.cardSurface.toUpperCase()}',`,
    "  },",
    "  text: {",
    `    primary: '${state.primaryText.toUpperCase()}',`,
    `    tertiary: '${state.bodyText.toUpperCase()}',`,
    `    body: '${state.bodyText.toUpperCase()}',`,
    "  },",
    "  border: {",
    `    default: '${state.border.toUpperCase()}',`,
    `    strong: '${state.border.toUpperCase()}',`,
    "  },",
    "} as const;",
  ].join("\n");
}
