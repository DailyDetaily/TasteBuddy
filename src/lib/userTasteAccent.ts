import type { CSSProperties } from 'react';

import {
  createInitialTasteMeasurementSnapshot,
  getStrongestTasteMeasurement,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { type TasteId } from '../constants/designTokens';
import { TASTE_TOKENS } from '../constants/uiColorTokens';

export interface UserTasteAccent {
  label: string;
  palette: {
    bg: string;
    dark: string;
    gradient: string;
    light: string;
    main: string;
    tintSoft: string;
    tintSoftBorder: string;
    borderSubtle?: string;
    borderDefault?: string;
    borderStrong?: string;
    borderAccent?: string;
    tintSurface: string;
    tintSurfaceSubText: string;
    tintSurfaceText: string;
  };
  tasteId: TasteId;
}

type UserTasteAccentCssVariable =
  | '--tb-user-accent-bg'
  | '--tb-user-accent-dark'
  | '--tb-user-accent-gradient'
  | '--tb-user-accent-light'
  | '--tb-user-accent-main'
  | '--tb-user-accent-tint-soft'
  | '--tb-user-accent-tint-soft-border'
  | '--tb-user-accent-border-subtle'
  | '--tb-user-accent-border-default'
  | '--tb-user-accent-border-strong'
  | '--tb-user-accent-border-accent'
  | '--tb-user-accent-tint-surface'
  | '--tb-user-accent-tint-surface-sub-text'
  | '--tb-user-accent-tint-surface-text';

type UserTasteAccentStyle = CSSProperties & Record<UserTasteAccentCssVariable, string>;

export function resolveUserTasteAccent(
  measurementSnapshot?: TasteMeasurementSnapshot | null,
): UserTasteAccent {
  const strongestTaste = getStrongestTasteMeasurement(
    measurementSnapshot ?? createInitialTasteMeasurementSnapshot(),
  );
  const taste = TASTE_TOKENS[strongestTaste.id];

  return {
    label: taste.label,
    palette: taste.palette,
    tasteId: strongestTaste.id,
  };
}

export function createUserTasteAccentStyle(
  accent: UserTasteAccent,
): UserTasteAccentStyle {
  return {
    '--tb-user-accent-bg': accent.palette.bg,
    '--tb-user-accent-dark': accent.palette.dark,
    '--tb-user-accent-gradient': accent.palette.gradient,
    '--tb-user-accent-light': accent.palette.light,
    '--tb-user-accent-main': accent.palette.main,
    '--tb-user-accent-tint-soft': accent.palette.tintSoft,
    '--tb-user-accent-tint-soft-border': accent.palette.tintSoftBorder,
    '--tb-user-accent-border-subtle': accent.palette.borderSubtle ?? `var(--tb-taste-${accent.tasteId}-border-subtle)`,
    '--tb-user-accent-border-default': accent.palette.borderDefault ?? `var(--tb-taste-${accent.tasteId}-border-default)`,
    '--tb-user-accent-border-strong': accent.palette.borderStrong ?? `var(--tb-taste-${accent.tasteId}-border-strong)`,
    '--tb-user-accent-border-accent': accent.palette.borderAccent ?? `var(--tb-taste-${accent.tasteId}-border-accent)`,
    '--tb-user-accent-tint-surface': accent.palette.tintSurface,
    '--tb-user-accent-tint-surface-sub-text': accent.palette.tintSurfaceSubText,
    '--tb-user-accent-tint-surface-text': accent.palette.tintSurfaceText,
  };
}
