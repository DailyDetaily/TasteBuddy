import { zColor } from "@remotion/zod-types";
import { z } from "zod";

const englishCopy = z
  .string()
  .trim()
  .min(1)
  .max(48)
  .regex(
    /^[A-Za-z0-9 .,!?;:'"()\-–—’‘“”\n]+$/,
    "Kalice 영문, 숫자, 기본 문장부호를 사용하세요.",
  );

export const kineticStatementsSchema = z.object({
  "문구 1": englishCopy,
  "문구 2": englishCopy,
  "문구 3": englishCopy,
  "문구 4": englishCopy,
  "문구 채움 시간": z.number().min(0.2).max(1.2).step(0.05),
  "글자 시차": z
    .number()
    .int()
    .min(0)
    .max(3)
    .describe("글자 사이의 지연 프레임"),
  "문구 유지": z.number().min(0.1).max(1.5).step(0.05),
  "전환 시간": z.number().min(0.1).max(0.6).step(0.05),
  "마지막 유지": z.number().min(0.5).max(3).step(0.1),
  "문장 색": zColor(),
});

export type KineticStatementsProps = z.infer<typeof kineticStatementsSchema>;

export const kineticStatementsDefaults: KineticStatementsProps = {
  "문구 1": "Save the meals",
  "문구 2": "find the patterns",
  "문구 3": "know your taste",
  "문구 4": "Taste Buddy",
  "문구 채움 시간": 0.4,
  "글자 시차": 1,
  "문구 유지": 0.35,
  "전환 시간": 0.25,
  "마지막 유지": 1.2,
  "문장 색": "#0F0F0F",
};
