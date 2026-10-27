import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { foodIcons } from "./catalog";

const motionSettings = {
  재생: z.enum(["반복", "정지"]),
  "모션 속도": z.number().min(0.5).max(2).step(0.1),
  "모션 강도": z.number().min(0.5).max(1.5).step(0.1),
};

export type FoodIconMotionProps = {
  재생: "반복" | "정지";
  "모션 속도": number;
  "모션 강도": number;
};

const appearance = {
  "배경 색": zColor(),
  "아이콘 색": zColor(),
  ...motionSettings,
};

export const foodIconGridSchema = z.object({
  ...motionSettings,
  "아이콘 크기": z.number().min(24).max(120).step(4),
  "열 개수": z.number().int().min(4).max(8),
});

export const foodIconSingleSchema = z.object({
  ...appearance,
  아이콘: z.enum(foodIcons.map(({ label }) => label) as [string, ...string[]]),
  "아이콘 크기": z.number().min(48).max(480).step(8),
});

export type FoodIconGridProps = z.infer<typeof foodIconGridSchema>;
export type FoodIconSingleProps = z.infer<typeof foodIconSingleSchema>;

const motionDefaults: FoodIconMotionProps = {
  재생: "반복",
  "모션 속도": 1,
  "모션 강도": 1,
};

export const gridDefaults: FoodIconGridProps = {
  ...motionDefaults,
  "아이콘 크기": 56,
  "열 개수": 8,
};

export const singleDefaults: FoodIconSingleProps = {
  ...motionDefaults,
  "배경 색": "#E8EEF5",
  "아이콘 색": "#90969C",
  아이콘: foodIcons[0].label,
  "아이콘 크기": 240,
};
