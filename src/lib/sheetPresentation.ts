import { SHEET_PRESENTATION_TOKENS } from '../constants/designTokens';

export type SheetPresentationPlatform = keyof typeof SHEET_PRESENTATION_TOKENS;

export function sheetPresentationProgress(progress: number) {
  return Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
}

/** iOS AppShell adds its safe-area top; the auth landing uses only the offset. */
export function getSheetBackgroundPresentation(
  progress: number,
  { platform = 'web', safeAreaTop = 0, reducedMotion = false }: {
    platform?: SheetPresentationPlatform;
    safeAreaTop?: number;
    reducedMotion?: boolean;
  } = {},
) {
  const token = SHEET_PRESENTATION_TOKENS[platform].background;
  const dimProgress = sheetPresentationProgress(progress);
  const motionProgress = reducedMotion ? 0 : dimProgress;
  return {
    scale: 1 - (1 - token.scale) * motionProgress,
    offsetY: (token.offsetY + (platform === 'native' ? Math.max(0, safeAreaTop) : 0)) * motionProgress,
    radius: token.radius * motionProgress,
    dimOpacity: token.dimOpacity * dimProgress,
    shadowY: token.shadowY * motionProgress,
    shadowBlur: token.shadowBlur * motionProgress,
    shadowOpacity: token.shadowOpacity * motionProgress,
  };
}

export function getSheetBackgroundStyle(progress: number, immediate = false, reducedMotion = false, platform: SheetPresentationPlatform = 'web', safeAreaTop = 0) {
  const value = getSheetBackgroundPresentation(progress, { reducedMotion, platform, safeAreaTop });
  const motion = SHEET_PRESENTATION_TOKENS.web.motion;
  return {
    transform: `translate3d(0, ${value.offsetY}px, 0) scale(${value.scale})`,
    borderRadius: `${value.radius}px`,
    boxShadow: value.shadowOpacity > 0
      ? `0 ${value.shadowY}px ${value.shadowBlur}px rgba(0,0,0,${value.shadowOpacity})`
      : 'none',
    transition: immediate || reducedMotion ? 'none' : [
      `transform ${motion.durationMs}ms ${motion.easing}`,
      `border-radius ${motion.radiusDurationMs}ms ${motion.easing}`,
      `box-shadow ${motion.durationMs}ms ${motion.easing}`,
    ].join(', '),
  };
}

/** The presenter owns progress; the modal overlay owns dimming and focus. */
export function applySheetBackgroundCardProgress(element: HTMLElement | null, progress: number, immediate = false) {
  if (!element) return;
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  Object.assign(element.style, getSheetBackgroundStyle(progress, immediate, reducedMotion));
}

/** Product screens follow the iOS presenting-card geometry; the specimen keeps its web variant. */
export function applyNativeSheetBackgroundCardProgress(element: HTMLElement | null, progress: number, immediate = false) {
  if (!element) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const safeAreaTop = element.dataset.sheetAuthLanding === 'true' ? 0
    : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tb-safe-area-top')) || 0;
  Object.assign(element.style, getSheetBackgroundStyle(progress, immediate, reducedMotion, 'native', safeAreaTop));
}
