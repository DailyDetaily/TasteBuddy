import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const bubbleMapSchema = z.object({
  재생: z.enum(["전체 흐름", "대기 루프", "모션 줄이기"]),
  "배경 색": zColor(),
  "재생 속도": z.number().min(0.5).max(1.5).step(0.1),
  "주변 감쇠": z.number().min(0).max(1).step(0.05),
  "미세 이동": z.number().min(0).max(2).step(0.1),
});
export type BubbleMapProps = z.infer<typeof bubbleMapSchema>;
export const bubbleMapDefaults: BubbleMapProps = {
  재생: "전체 흐름",
  "배경 색": "#FFFFFF",
  "재생 속도": 1,
  "주변 감쇠": 1,
  "미세 이동": 1,
};
