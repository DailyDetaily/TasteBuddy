import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const miniLineGraphSchema = z.object({
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  "시작 대기": z.number().min(0).max(3).step(0.05),
  "진입 시간": z
    .number()
    .min(0.2)
    .max(3)
    .step(0.05)
    .describe(
      "원래 꺾인 경로를 따라 선을 그리는 시간 (초). 퇴장은 같은 경로의 역재생.",
    ),
  "행 간 지연": z.number().min(0).max(0.5).step(0.01),
  "유지 시간": z.number().min(0).max(10).step(0.1),
  "끝 여백": z.number().min(0).max(3).step(0.05),
  "확대 배율": z.number().min(1).max(7).step(0.5),
  "배경 색": zColor(),
  데이터: z
    .array(
      z.object({
        미각: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
        기록: z
          .array(z.number().min(-1000000).max(1000000))
          .max(31)
          .describe(
            "미각 변화의 합성 값. 원본처럼 최근 4개만 표시하며 0·음수도 유효.",
          ),
      }),
    )
    .max(2)
    .describe("합성 미각 변화 견본. 2개 계열은 같은 132×56 안에 배치."),
});
export type MiniLineGraphProps = z.infer<typeof miniLineGraphSchema>;
