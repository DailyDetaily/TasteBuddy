import { z } from "zod";
import { tasteChangeGraphSchema } from "./line-settings";

export const referenceLineSchema = tasteChangeGraphSchema.extend({
  "높낮이 배율": z
    .number()
    .min(1)
    .max(6)
    .step(0.5)
    .describe(
      "기록값을 유지하면서 그래프의 세로 변화 폭을 확대. 선 굵기와 노드 크기는 유지.",
    ),
  "시작 대기": z
    .number()
    .min(0)
    .max(3)
    .step(0.01)
    .describe("GIF에서 카드가 펼쳐진 뒤 그래프가 나타나는 대기 시간 (초)"),
  "진입 시간": z
    .number()
    .min(0.2)
    .max(3)
    .step(0.01)
    .describe("참고 영상에서 측정한 가속·감속 곡선으로 그리는 시간 (초)"),
  "유지 시간": z.number().min(0).max(10).step(0.01),
  "끝 여백": z
    .number()
    .min(0)
    .max(3)
    .step(0.01)
    .describe("다음 반복 전 빈 화면 유지 시간 (초)"),
});

export type ReferenceLineProps = z.infer<typeof referenceLineSchema>;
