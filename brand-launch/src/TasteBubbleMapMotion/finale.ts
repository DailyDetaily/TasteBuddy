import { GRID_FINAL_ZOOM, MAP } from "./layout";
import type { Bubble, Point } from "./types";

// Times exclude the native entrance. The finale only zooms/shrinks;
// the map orientation stays fixed throughout shrink, hold and exit.
export const FINALE = {
  start: 12.4,
  settled: 13.6,
  exitStart: 14.8,
  exitEnd: 16.0,
  end: 16.6,
  degrees: 0,
} as const;

const clamp = (n: number) => n <= 1e-10 ? 0 : n >= 1 - 1e-10 ? 1 : n;
export const finaleEase = (n: number): number => {
  const t = clamp(n);
  if (t === 0 || t === 1) return t;
  return clamp(t * t * t * (t * (t * 6 - 15) + 10));
};

// Deliberate ease-in for the zoom-out: the map keeps accelerating toward
// the end instead of easing back down before the settled hold.
export const shrinkEase = (n: number): number => {
  const t = clamp(n);
  if (t === 0 || t === 1) return t;
  return clamp(t * t * (1.25 - 0.25 * t));
};

export function rotateMapPoint(point: Point, degrees: number): Point {
  if (degrees === 0) return point;
  // SVG's positive y points down, so +degrees is clockwise on screen.
  const radians = degrees * Math.PI / 180;
  const c = Math.cos(radians), s = Math.sin(radians);
  const x = point.x - MAP.center, y = point.y - MAP.center;
  return { x: MAP.center + x * c - y * s, y: MAP.center + x * s + y * c };
}

export function finaleState(seconds: number, enabled: boolean) {
  seconds = Math.round(seconds * 1e10) / 1e10;
  const progress = enabled ? shrinkEase((seconds - FINALE.start) / (FINALE.settled - FINALE.start)) : 0;
  const exitProgress = enabled ? clamp((seconds - FINALE.exitStart) / (FINALE.exitEnd - FINALE.exitStart)) : 0;
  return {
    progress,
    rotationDegrees: 0,
    exitProgress,
    phase: !enabled || seconds < FINALE.start ? "interaction" as const
      : seconds < FINALE.settled ? "shrink" as const
      : seconds < FINALE.exitStart ? "grid-hold" as const
      : seconds < FINALE.exitEnd ? "reverse-exit" as const
      : "blank" as const,
  };
}

// The field has no symbol contour or per-sector clipping. The same camera
// viewport is filled with neighboring cells right through the held frame.
// Normalize reverse-order timing to the visible square's diagonal radius.
const EXIT_ORDER_RADIUS = Math.SQRT2 * MAP.viewport / (2 * GRID_FINAL_ZOOM);
const EXIT_STAGGER = 0.68;
const EXIT_WINDOW = 0.32;
const NATIVE_INTRO_START = 0.18;
const NATIVE_INTRO_END = 0.8;

/** Reverse entrance ordering in place.
 * Outer cells begin first; the original center cells disappear last.
 * Each bubble stays on its grid coordinate and disappears ONLY by scale:
 * scale 1 -> 0 while opacity stays 1. There is no fade, center contraction,
 * flash/veil, or central replacement dot.
 */
export function reverseBubbleExit(bubble: Bubble, progress: number) {
  if (progress <= 0) return { scale: 1, opacity: 1, positionScale: 1 };
  if (progress >= 1) return { scale: 0, opacity: 1, positionScale: 1 };
  const radius = Math.hypot(bubble.x - MAP.center, bubble.y - MAP.center);
  // One GLOBAL radial wave for native + extended cells. Previously each group
  // was normalized independently, which made the outer edge of the native
  // 72 and the outer edge of the extended field disappear at the same time.
  // Radius is now the primary order for every bubble, so the wave physically
  // reaches the native map only after crossing the extended rings.
  const radialOrder = clamp(radius / EXIT_ORDER_RADIUS);
  const nativeTieBreak =
    bubble.kind === "native"
      ? clamp(
          (bubble.introDelay - NATIVE_INTRO_START) /
            (NATIVE_INTRO_END - NATIVE_INTRO_START),
        ) * 0.008
      : 0;
  const order = clamp(radialOrder + nativeTieBreak);
  // Spend most of the 1.2s exit on spatial staggering, not simultaneous fades:
  // the outermost band starts immediately, each bubble disappears in a short
  // 32% window, and the innermost band starts at 68% of the total exit.
  const delay = EXIT_STAGGER * (1 - order);
  const local = clamp((progress - delay) / EXIT_WINDOW);
  // Scale must be monotonic. A literal reversed spring briefly rebounds near 1
  // and can visually invert the intended outside->inside order between
  // neighboring rings. Keep the stagger/order from the native map, but use a
  // smooth one-way 1->0 scale for disappearance.
  const scale = 1 - finaleEase(local);
  return { scale, opacity: 1, positionScale: 1 };
}
