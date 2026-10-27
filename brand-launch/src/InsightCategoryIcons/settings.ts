import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { foodIconTransitionDefaults } from "../FoodIcons/transition-settings";

export const categoryIconTransitionSchema = z.object({
  "배경 색": zColor(),
  "아이콘 크기": z.number().min(120).max(640).step(8),
  "유지 시간": z.number().min(0.2).max(5).step(0.1),
  "전환 시간": z.number().min(0.15).max(1).step(0.05),
  재생: z.enum(["반복", "정지"]),
});

export type CategoryIconTransitionProps = z.infer<
  typeof categoryIconTransitionSchema
>;

export const categoryIconTransitionDefaults: CategoryIconTransitionProps = {
  "배경 색": "#F3F3F3",
  "아이콘 크기": foodIconTransitionDefaults["아이콘 크기"],
  "유지 시간": 1.5,
  "전환 시간": 0.65,
  재생: "반복",
};
