import { z } from "zod";
import {
  miniLineGraphSchema,
  type MiniLineGraphProps,
} from "./mini-line-settings";

export const GRAPH_TRANSITION_BLANK_FRAMES = 15; // 0.25 seconds at 60 fps.
export const GRAPH_TRANSITION_HOLD_FRAMES = 60; // 1 second at 60 fps.
export const GRAPH_TRANSITION_DURATION = 1566;
// Independent synthetic comparison values for the two surfaces.
export const LARGE_AREA_VALUES = [4, 6, 7, 10];
export const SMALL_AREA_VALUES = [2, 2.5, 4, 6.5];

export const graphTransitionSchema = miniLineGraphSchema
  .pick({
    "확대 배율": true,
    "배경 색": true,
    데이터: true,
  })
  .extend({
    데이터: z
      .array(
        miniLineGraphSchema.shape.데이터.element.extend({
          기록: z
            .array(z.number().min(-1000000).max(1000000))
            .length(4)
            .describe("원본 라인과 같은 4개 합성 미각 변화 값."),
        }),
      )
      .max(1),
    "막대 기록": z
      .array(z.number().int().min(0).max(1000000))
      .length(7)
      .refine(
        (values) => values[6] > 0,
        "우측 진한 노드가 이어질 마지막 막대는 양수여야 합니다.",
      )
      .describe(
        "별도의 합성 요리 기록 수. 0/1 표시 규칙은 원본 막대와 같습니다.",
      ),
    "큰 영역 값": z
      .array(z.number().positive().max(1000000))
      .length(4)
      .default(LARGE_AREA_VALUES)
      .describe(
        "기존 비교 영역 견본의 큰 면. 막대에서 집계한 값이 아닌 독립 합성 값.",
      ),
    "작은 영역 값": z
      .array(z.number().positive().max(1000000))
      .length(4)
      .default(SMALL_AREA_VALUES)
      .describe(
        "큰 면과 같은 척도의 작은 비교 면. 같은 위치의 큰 값 이하여야 합니다.",
      ),
  })
  .superRefine((props, ctx) => {
    if (
      props["작은 영역 값"].some((value, i) => value > props["큰 영역 값"][i])
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["작은 영역 값"],
        message: "작은 영역은 각 위치에서 큰 영역 값 이하여야 합니다.",
      });
    }
  });
export type GraphTransitionProps = z.infer<typeof graphTransitionSchema>;

export const graphTransitionDefaultProps: GraphTransitionProps = {
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  데이터: [{ 미각: "감칠맛", 기록: [1.2, 2.1, 2.4, 4.5] }],
  "막대 기록": [0, 1, 3, 2, 5, 4, 7],
  "큰 영역 값": LARGE_AREA_VALUES,
  "작은 영역 값": SMALL_AREA_VALUES,
};

/** Reuse line entrance; the transition owns the following timeline. */
export const graphTransitionLineProps = (
  props: GraphTransitionProps,
): MiniLineGraphProps => ({
  ...props,
  재생: "진입 후 유지",
  "시작 대기": GRAPH_TRANSITION_BLANK_FRAMES / 60,
  "진입 시간": 1.2,
  "행 간 지연": 0.12,
  "유지 시간": GRAPH_TRANSITION_HOLD_FRAMES / 60,
  "끝 여백": 0,
});
