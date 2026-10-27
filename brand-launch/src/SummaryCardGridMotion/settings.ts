import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const SUMMARY_GRID_FPS = 60;
export const SUMMARY_CARD_WIDTH = 352;
export const SUMMARY_CARD_HEIGHT = 148;

export const summaryCardGridSchema = z.object({
  재생: z.enum(["전체 모션", "진입 후 유지", "정지"]),
  "카드 간격": z.number().min(8).max(40).step(1),
  "화면 배율": z.number().min(0.8).max(2).step(0.05),
  "카드 시차": z.number().min(0).max(0.3).step(0.01),
  "정지 시간": z.number().min(0).max(10).step(0.1),
  "배경 색": zColor(),
});
export type SummaryCardGridProps = z.infer<typeof summaryCardGridSchema>;

export const summaryCardGridDefaultProps: SummaryCardGridProps = {
  재생: "전체 모션",
  "카드 간격": 16,
  "화면 배율": 1.55,
  "카드 시차": 0.1,
  "정지 시간": 2,
  "배경 색": "#F3F3F3",
};
