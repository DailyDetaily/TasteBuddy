import { FOOD_ICON_CYCLE_SECONDS } from "./timing";

export const steamedHandleMotion = (seconds: number, strength: number) => {
  const local = seconds % FOOD_ICON_CYCLE_SECONDS;
  const progress = (local - 0.44) / 1.8;
  if (progress <= 0 || progress >= 1) return { angle: 0 };

  // Twelve short rattles gather and release pressure, then the handle settles.
  // Both ends have zero velocity so the quiet interval joins without a snap.
  const envelope = Math.sin(Math.PI * progress);
  return {
    angle: 12 * strength * envelope * Math.sin(progress * Math.PI * 24),
  };
};
