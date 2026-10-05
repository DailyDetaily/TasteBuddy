import { z } from "zod";
import { palette, tasteAxes } from "./colors";
export { palette, tasteAxes, type TasteAxis } from "./colors";

export const feedbackSchema = z.object({
  재생: z.enum(["진입 후 유지", "정지"]),
  "재생 시간": z.number().min(2).max(60).step(0.5),
  "배경 속도": z.number().min(0).max(3).step(0.1),
  "배경 시작 시점": z
    .number()
    .min(0)
    .max(120)
    .step(0.1)
    .describe(
      "네이티브 배경의 시간 위상. 초 단위이며 같은 프레임은 항상 동일하게 렌더됩니다.",
    ),
  "사진 경로": z
    .string()
    .describe(
      "public 기준 경로 또는 이미지 URL. 빈 값은 네이티브 카메라 자리표시자.",
    ),
  메뉴명: z.string(),
  식당명: z.string(),
  "맛 반응": z
    .array(z.object({ 미각: z.enum(tasteAxes), 문구: z.string() }))
    .max(3)
    .describe(
      "미리보기용 예시 반응. 첫 번째부터 배경의 주색·보조색·세 번째 색으로 사용됩니다.",
    ),
  "상세 태그": z.array(z.string()).max(20),
  "미식 노트": z.string(),
});
export type FeedbackProps = z.infer<typeof feedbackSchema>;

export const resultPalette = (reactions: FeedbackProps["맛 반응"]) => {
  const main = reactions[0]?.미각 ?? "감칠맛";
  const secondary = reactions[1]?.미각 ?? main;
  const tertiary = reactions[2]?.미각 ?? secondary;
  return {
    background: palette[main].tint,
    main: palette[main].main,
    secondary: palette[secondary].main,
    tertiary: palette[tertiary].main,
  };
};
export type ResultPalette = ReturnType<typeof resultPalette>;

export const rgba = (hex: string, alpha: number) => {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};
