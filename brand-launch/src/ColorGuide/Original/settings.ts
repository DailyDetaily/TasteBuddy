import { COLOR_GUIDE_DURATION_FRAMES } from "./motion";

export { COLOR_GUIDE_FPS } from "./motion";
export type { ColorGuideProps } from "../settings";

export const originalColorGuideDuration = (speed: number) =>
  Math.round(COLOR_GUIDE_DURATION_FRAMES / speed);
