import { z } from "zod";
import { carouselSchema } from "./carousel-settings";

export const flipSchema = carouselSchema
  .pick({
    카드: true,
    "배경 속도": true,
    "정지 카드": true,
  })
  .extend({
    재생: z.enum(["자동 플립", "정지"]),
    "카드 유지 시간": z.number().min(0).max(8).step(0.1),
    "접힘 시간": z.number().min(0.1).max(2).step(0.01),
    "펼침 시간": z.number().min(0.1).max(2).step(0.01),
    "플립 방향": z.enum(["좌우 번갈아", "왼쪽", "오른쪽"]),
  });
export type FlipProps = z.infer<typeof flipSchema>;
