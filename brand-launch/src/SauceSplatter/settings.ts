import { z } from "zod";
import { DISH_KIND_OPTIONS } from "../../../src/constants/dishKindTags";

const dishIconChoices = [
  "자동",
  "없음",
  ...DISH_KIND_OPTIONS.map((kind) => kind.id),
] as [string, ...string[]];

export const sauceSplatterSchema = z.object({
  재생: z.enum(["진입 후 유지", "정지"]),
  속도: z.number().min(0.25).max(2).step(0.05),
  "시작 대기": z.number().min(0).max(3).step(0.05),
  "유지 시간": z.number().min(0.25).max(6).step(0.05),
  "줄 수": z.number().int().min(1).max(8).default(5),
  "상하 여백": z
    .number()
    .min(0)
    .max(200)
    .step(8)
    .default(72)
    .describe("칩 그룹 위아래에 확보할 최소 여백입니다. 화면 px 기준입니다."),
  "카메라 여백": z
    .number()
    .min(24)
    .max(200)
    .step(8)
    .default(80)
    .describe(
      "시작 칩의 왼쪽 여백과 이동 완료 후 오른쪽 여백입니다. 화면 px 기준입니다.",
    ),
  "확대 배율": z
    .number()
    .min(1)
    .max(8)
    .step(0.25)
    .describe(
      "전체 줄 높이를 화면에 맞춰 확대합니다. 양옆 칩은 화면 밖으로 이어집니다.",
    ),
  칩: z
    .array(
      z.object({
        문구: z.string().trim().min(1).max(24),
        아이콘: z
          .enum(dishIconChoices)
          .optional()
          .describe("자동은 문구와 같은 음식 종류 아이콘을 사용합니다."),
        선택: z
          .boolean()
          .optional()
          .describe(
            "네이티브 음식 종류 칩의 선택 상태. 검정 배경·흰색 아이콘과 문구를 사용합니다.",
          ),
      }),
    )
    .min(1)
    .max(24)
    .describe(
      "모션 확인용 예시입니다. 네이티브 음식 종류 선택 칩의 라이트 모드 규격을 사용합니다.",
    ),
});

export type SauceSplatterProps = z.infer<typeof sauceSplatterSchema>;
