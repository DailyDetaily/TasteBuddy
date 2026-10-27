import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const barGraphSchema = z.object({
  색상: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  "시작 대기": z.number().min(0).max(3).step(0.05),
  "진입 시간": z
    .number()
    .min(0.2)
    .max(3)
    .step(0.05)
    .describe("각 원이 캡슐로 자라는 시간 (초). 퇴장은 같은 움직임의 역재생."),
  "막대 간 지연": z.number().min(0).max(0.3).step(0.01),
  "유지 시간": z.number().min(0).max(10).step(0.1),
  "끝 여백": z.number().min(0).max(3).step(0.05),
  "확대 배율": z
    .number()
    .min(1)
    .max(7)
    .step(0.5)
    .describe("132×56 원본을 균등 확대. 1은 제품 크기."),
  "배경 색": zColor(),
  데이터: z
    .array(
      z.object({
        항목: z.string().max(20),
        값: z
          .number()
          .int()
          .min(0)
          .max(1000000)
          .nullable()
          .describe(
            "합성 요리 기록 수. 0은 짧은 표시, 1은 원, null은 빈 슬롯.",
          ),
      }),
    )
    .min(0)
    .max(31)
    .describe("날짜순 합성 견본. 실제 계정과 연결되지 않음."),
});

export type BarGraphProps = z.infer<typeof barGraphSchema>;
