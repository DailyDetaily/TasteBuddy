import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const barGraphSchema = z.object({
  형태: z.enum(["상세", "홈 미니"]),
  색상: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
  끝점: z.enum(["마지막 막대", "모든 막대", "없음"]),
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  "진입 시간": z
    .number()
    .min(0.2)
    .max(3)
    .step(0.1)
    .describe("각 막대가 자라는 시간 (초)"),
  "막대 간 지연": z
    .number()
    .min(0)
    .max(0.3)
    .step(0.01)
    .describe("왼쪽부터 시작하는 간격 (초)"),
  "유지 시간": z
    .number()
    .min(0.5)
    .max(10)
    .step(0.1)
    .describe("모든 막대가 정착한 뒤 유지하는 시간 (초)"),
  "수치와 라벨": z.boolean(),
  "배경 색": zColor(),
  데이터: z
    .array(
      z.object({
        항목: z.string().max(12),
        값: z
          .number()
          .int()
          .min(0)
          .max(1000000)
          .nullable()
          .describe("미리보기용 예시 횟수. 0은 확인된 0회, null은 미확인."),
      }),
    )
    .min(1)
    .max(16)
    .describe("실제 계정 기록에 연결되지 않은 모션 예시 데이터"),
});

export type BarGraphProps = z.infer<typeof barGraphSchema>;
