import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const miniPieGraphSchema = z.object({
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  "값 기준": z.enum(["구성비", "절대 백분율"]),
  "확대 배율": z.number().min(1).max(7).step(0.5),
  "배경 색": zColor(),
  데이터: z
    .array(
      z.object({
        항목: z.string(),
        색상: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
        값: z.number().min(0).max(1000000),
      }),
    )
    .max(12)
    .describe(
      "합성 예시. 구성비는 유효 양수 합계를 분모로, 절대 백분율은 100을 분모로 사용하며 나머지는 뉴트럴. 300프레임 고정.",
    ),
});
export type MiniPieGraphProps = z.infer<typeof miniPieGraphSchema>;

/** Same proportions and colors as the original Plating pie specimen. */
export const miniPieDefaultProps: MiniPieGraphProps = {
  재생: "진입·유지·퇴장",
  "값 기준": "구성비",
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  데이터: [
    { 항목: "집밥", 색상: "감칠맛", 값: 18 },
    { 항목: "외식", 색상: "단맛", 값: 12 },
    { 항목: "배달", 색상: "쓴맛", 값: 6 },
  ],
};
