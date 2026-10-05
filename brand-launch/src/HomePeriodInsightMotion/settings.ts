import { z } from "zod";
import { tasteChangeGraphSchema } from "../GraphMotion/line-settings";

export const cardKinds = [
  "recordFlow",
  "newExperiences",
  "repeatPatterns",
  "tasteClue",
  "experienceBreadth",
  "tasteChange",
] as const;
export const tasteAxes = [
  "sweet",
  "sour",
  "bitter",
  "salty",
  "umami",
  "fat",
] as const;
export type CardKind = (typeof cardKinds)[number];
export type TasteAxis = (typeof tasteAxes)[number];

export const periodCardSchema = z.object({
  종류: z.enum(cardKinds),
  제목: z.string(),
  설명: z.string(),
  기록: z.array(z.number().min(0)).max(24),
  섹션명: z.string().default(""),
  미각: z.enum(["기본", ...tasteAxes]).default("기본"),
  기간: z.string().optional(),
  키워드: z.array(z.string()).max(3).optional(),
  "가로 그래프": z
    .array(tasteChangeGraphSchema.shape.데이터.element)
    .max(2)
    .optional(),
});

export const homePeriodMotionSchema = z.object({
  재생: z.enum(["전체 모션", "진입 후 유지", "정지"]),
  "카드 간격": z.number().min(0).max(40),
  "화면 배율": z.number().min(1).max(2.5).step(0.1),
  "카드 시차": z.number().min(0).max(0.5).step(0.01),
  "정지 시간": z.number().min(0).max(5).step(0.1),
  "배경 색": z.string(),
  카드: z.array(periodCardSchema).min(1).max(3),
});
export type HomePeriodMotionProps = z.infer<typeof homePeriodMotionSchema>;

export const cardIdentity: Record<
  CardKind,
  { label: string; axis: TasteAxis }
> = {
  recordFlow: { label: "기록 흐름", axis: "umami" },
  newExperiences: { label: "새로운 경험", axis: "sweet" },
  repeatPatterns: { label: "반복 기록", axis: "salty" },
  tasteClue: { label: "미각 단서", axis: "sour" },
  experienceBreadth: { label: "경험의 폭", axis: "fat" },
  tasteChange: { label: "미각 기록 변화", axis: "bitter" },
};
