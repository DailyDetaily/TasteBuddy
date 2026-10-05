import { z } from "zod";
import { barGraphSchema } from "./settings";

export const tasteChangeGraphSchema = barGraphSchema
  .pick({ 재생: true, "진입 시간": true, "유지 시간": true, "배경 색": true })
  .extend({
    "진입 시간": barGraphSchema.shape["진입 시간"].describe(
      "각 가로 그래프가 원래 경로를 따라 펼쳐지는 시간 (초)",
    ),
    "유지 시간": barGraphSchema.shape["유지 시간"].describe(
      "모든 가로 그래프가 정착한 뒤 유지하는 시간 (초)",
    ),
    "행 간 지연": z
      .number()
      .min(0)
      .max(0.5)
      .step(0.01)
      .describe("다음 가로 그래프가 시작하는 간격 (초)"),
    "라벨 표시": z.boolean(),
    "첫 기록 대기선": z
      .boolean()
      .describe(
        "한 개의 기록만 있을 때 원본의 흐려지는 대기선을 표시. 과거/예측 데이터가 아님.",
      ),
    데이터: z
      .array(
        z.object({
          미각: barGraphSchema.shape.색상,
          기록: z
            .array(z.number().min(-100).max(100))
            .max(7)
            .describe(
              "과거 → 현재 순서의 예시 변화값. 원본과 같은 최대 7개. 빈 배열은 비교 기록 없음.",
            ),
        }),
      )
      .min(1)
      .max(6)
      .describe("실제 계정 기록과 연결되지 않은 모션 예시"),
  });

export type TasteChangeGraphProps = z.infer<typeof tasteChangeGraphSchema>;
