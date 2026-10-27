import { z } from "zod";
import { zColor } from "@remotion/zod-types";

const records = z
  .array(z.number().int().min(0).max(1000000).nullable())
  .max(31);
export const miniGroupedBarGraphSchema = z.object({
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  색상: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
  "확대 배율": z.number().min(1).max(7).step(0.5),
  "배경 색": zColor(),
  "이전 기록": records.describe(
    "왼쪽 회색. 같은 인덱스끼리 비교하는 합성 요리 기록 수. null·빠진 값은 미확인.",
  ),
  "현재 기록": records.describe(
    "오른쪽 미각색. 0은 짧은 표시, 1은 원. 두 계열의 공통 최댓값 사용. 300프레임 고정.",
  ),
});
export type MiniGroupedBarGraphProps = z.infer<
  typeof miniGroupedBarGraphSchema
>;

/** Original MiniChartExamples grouped specimen, not account data. */
export const miniGroupedBarDefaultProps: MiniGroupedBarGraphProps = {
  재생: "진입·유지·퇴장",
  색상: "감칠맛",
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  "이전 기록": [0, 2, 4, 3],
  "현재 기록": [1, 4, 3, 6],
};
