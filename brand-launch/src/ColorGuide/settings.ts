import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { COLOR_GUIDE_DURATION_FRAMES } from "./motion";
export { COLOR_GUIDE_FPS } from "./motion";

export const colorGuideSchema = z.object({
  재생: z.enum(["영상", "정지"]),
  속도: z.number().min(0.5).max(2).step(0.1),
  "배경 색": zColor(),
});
export type ColorGuideProps = z.infer<typeof colorGuideSchema>;
export const colorGuideDuration = (speed: number) =>
  Math.round(COLOR_GUIDE_DURATION_FRAMES / speed);
