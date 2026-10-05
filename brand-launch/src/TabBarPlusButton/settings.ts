import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { pairNames } from "./motion";

export const plusButtonSchema = z.object({
  재생: z.enum(["반복", "정지"]),
  상태: z.enum(["기본", "누름"]),
  "버튼 크기": z.number().min(96).max(800).step(12),
  속도: z.number().min(0.25).max(3).step(0.05),
  "시작 색 조합": z.enum(pairNames),
  "글래스 강도": z.number().min(0).max(1.5).step(0.05),
  "배경 색": zColor(),
});
export type PlusButtonProps = z.infer<typeof plusButtonSchema>;
