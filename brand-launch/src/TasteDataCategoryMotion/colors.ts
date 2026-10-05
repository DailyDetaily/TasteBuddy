/** Shared filled-dot tint: retain the surface tone with a gentle amount of its own pigment. */
export const MOTION_TINT_PIGMENT = 0.16;
export const motionTint = ({ main, tintSurface }: { main: string; tintSurface: string }) => {
  const base = parseInt(tintSurface.slice(1), 16);
  const pigment = parseInt(main.slice(1), 16);
  return "#" + [16, 8, 0].map((shift) =>
    Math.round(((base >> shift) & 255) * (1 - MOTION_TINT_PIGMENT) + ((pigment >> shift) & 255) * MOTION_TINT_PIGMENT)
      .toString(16).padStart(2, "0"),
  ).join("");
};
