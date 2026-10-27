/** Source role marker; product renderers resolve Light tint/60 and Dark tint/70 on page backgrounds. */
export const motionTint = ({ tintSurface }: { tintSurface: string }) => tintSurface;

/** Presentation-only empty ring; renderers resolve the mode-specific empty foreground. */
export const EMPTY_RING_COLOR = '#E4E4E4';
