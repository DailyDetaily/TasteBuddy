import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const miniTreemapGraphSchema = z.object({
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  "확대 배율": z.number().min(1).max(7).step(0.5),
  "배경 색": zColor(),
  데이터: z
    .array(
      z.object({
        항목: z.string(),
        색상: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
        값: z.number().min(0).max(1000000).nullable(),
      }),
    )
    .max(12)
    .describe(
      "합성 요리 기록 수. 둥근 셀의 면적이 양수의 구성비에 비례하며 위치는 값이 아닙니다. 0/null은 셀을 만들지 않습니다. 300프레임 고정.",
    ),
});
export type MiniTreemapGraphProps = z.infer<typeof miniTreemapGraphSchema>;

export const miniTreemapDefaultProps: MiniTreemapGraphProps = {
  재생: "진입·유지·퇴장",
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  데이터: [
    { 항목: "한식", 색상: "쓴맛", 값: 3 },
    { 항목: "양식", 색상: "단맛", 값: 8 },
    { 항목: "중식", 색상: "감칠맛", 값: 18 },
    { 항목: "일식", 색상: "짠맛", 값: 12 },
    { 항목: "분식", 색상: "신맛", 값: 6 },
    { 항목: "기타", 색상: "지방맛", 값: 4 },
  ],
};
