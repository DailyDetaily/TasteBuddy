import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const petalSchema = z.object({
  backgroundColor: zColor().describe("배경 색"),
  symbolColor: zColor().describe("심볼 색"),
  "심볼 배율": z.number().min(0.25).max(0.65).step(0.01),
  "중앙 여백 비율": z
    .number()
    .min(0.1)
    .max(0.6)
    .step(0.01)
    .describe("전체 반지름 대비 비율. 0.25 = 1/4"),
  "영상 길이": z
    .number()
    .int()
    .min(30)
    .max(900)
    .describe("전체 컴포지션 길이. 30프레임 = 1초"),
});
export type PetalLogoProps = z.infer<typeof petalSchema>;
