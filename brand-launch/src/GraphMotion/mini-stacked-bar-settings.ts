import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const miniStackedBarGraphSchema = z.object({
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  "확대 배율": z.number().min(1).max(7).step(0.5),
  "배경 색": zColor(),
  데이터: z
    .array(
      z.object({
        항목: z.string(),
        색상: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
        기록: z.array(z.number().int().min(0).max(1000000).nullable()).max(31),
      }),
    )
    .max(6)
    .describe(
      "서로 겹치지 않는 범주의 합성 요리 기록 수. 같은 인덱스는 같은 날이며, null·빠진 값은 미확인. 300프레임 고정.",
    ),
});
export type MiniStackedBarGraphProps = z.infer<
  typeof miniStackedBarGraphSchema
>;

// Same first seven days as the original Plating specimen; these are not account data.
export const miniStackedBarDefaultProps: MiniStackedBarGraphProps = {
  재생: "진입·유지·퇴장",
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  데이터: [
    { 항목: "집밥", 색상: "감칠맛", 기록: [2, 3, 2, 4, 3, 4, 5] },
    { 항목: "외식", 색상: "단맛", 기록: [1, 2, 2, 1, 3, 2, 3] },
    { 항목: "배달", 색상: "쓴맛", 기록: [1, 0, 1, 2, 1, 1, 2] },
  ],
};
