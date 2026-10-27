import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const miniBubbleGraphSchema = z.object({
  재생: z.enum(["진입·유지·퇴장", "진입 후 유지", "정지"]),
  표시: z.enum(["숫자", "음식 아이콘"]),
  "확대 배율": z.number().min(1).max(7).step(0.5),
  "배경 색": zColor(),
  데이터: z
    .array(
      z.object({
        항목: z.string(),
        색상: z.enum(["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]),
        값: z.number().min(0).max(1000000).nullable(),
        "음식 종류": z
          .string()
          .optional()
          .describe(
            "원본 음식 아이콘 ID. 알 수 없는 ID는 원본 기본 아이콘을 표시합니다.",
          ),
      }),
    )
    .max(12)
    .describe(
      "합성 요리 기록 수. 원의 면적이 값에 비례하며 위치는 값이 아닙니다. 0/null은 원을 만들지 않습니다. 300프레임 고정.",
    ),
});
export type MiniBubbleGraphProps = z.infer<typeof miniBubbleGraphSchema>;

export const miniBubbleDefaultProps: MiniBubbleGraphProps = {
  재생: "진입·유지·퇴장",
  표시: "숫자",
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  데이터: [
    { 항목: "집밥", 색상: "감칠맛", 값: 9 },
    { 항목: "외식", 색상: "단맛", 값: 16 },
  ],
};
