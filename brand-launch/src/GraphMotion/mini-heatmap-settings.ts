import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const HEATMAP_WEEKDAYS = [
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
  "일요일",
] as const;
export const miniHeatmapGraphSchema = z.object({
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  색상: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
  "시작 요일": z.enum(HEATMAP_WEEKDAYS),
  "확대 배율": z.number().min(1).max(7).step(0.5),
  "배경 색": zColor(),
  기록: z
    .array(z.number().int().min(0).max(1000000).nullable())
    .max(31)
    .describe(
      "날짜순 합성 요리 기록 수. 0/1/2/3/4개 이상 고정 색 단계, null은 미확인 테두리. 300프레임 고정.",
    ),
});
export type MiniHeatmapGraphProps = z.infer<typeof miniHeatmapGraphSchema>;

/** Original October layout with more mid-tone cells in this motion specimen. */
export const miniHeatmapDefaultProps: MiniHeatmapGraphProps = {
  재생: "진입·유지·퇴장",
  색상: "감칠맛",
  "시작 요일": "목요일",
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  // Calendar rows; the three darkest accents remain on days 3, 20 and 31.
  기록: [
    0, 3, 4, 2,
    2, 1, 2, 3, 1, 0, 2,
    0, 2, 1, 1, 3, 0, 1,
    2, 4, 3, 1, 2, 2, 1,
    1, 0, 2, 3, 0, 4,
  ],
};
