import { z } from "zod";

export const foodIconTransitionSchema = z.object({
  "아이콘 크기": z.number().min(120).max(640).step(8),
  "모션 후 정지": z.number().min(0).max(2).step(0.05),
  "모션 속도": z.number().min(0.5).max(2).step(0.1),
  "모션 강도": z.number().min(0.5).max(1.5).step(0.1),
  "전환 시간": z.number().min(0.15).max(1).step(0.05),
  재생: z.enum(["반복", "정지"]),
});

export type FoodIconTransitionProps = z.infer<typeof foodIconTransitionSchema>;

export const foodIconTransitionDefaults: FoodIconTransitionProps = {
  "아이콘 크기": 320,
  "모션 후 정지": 0,
  "모션 속도": 1,
  "모션 강도": 1,
  "전환 시간": 0.35,
  재생: "반복",
};
