import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const miniAreaGraphSchema = z.object({
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  미각: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
  "확대 배율": z
    .number()
    .min(1)
    .max(7)
    .step(0.5)
    .describe("132×56 원본을 균등 확대. 1은 제품 크기."),
  "배경 색": zColor(),
  기록: z
    .array(z.number().min(-1000000).max(1000000))
    .max(31)
    .describe(
      "원본 예시의 단위 없는 합성 값. 최근 4개를 표시하며 0·음수도 유효. 300프레임 고정.",
    ),
});
export type MiniAreaGraphProps = z.infer<typeof miniAreaGraphSchema>;
