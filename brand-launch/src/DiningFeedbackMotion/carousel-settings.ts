import { z } from "zod";
import { feedbackSchema, tasteAxes } from "./settings";

export const carouselSchema = z.object({
  재생: z.enum(["자동 스크롤", "정지"]),
  "카드 유지 시간": z.number().min(0).max(8).step(0.1),
  "스크롤 시간": z.number().min(0.6).max(5).step(0.1),
  "주변 카드 불투명도": z.number().min(0).max(1).step(0.05),
  "카드 간격": z.number().min(12).max(80).step(2),
  "배경 속도": z.number().min(0).max(3).step(0.1),
  "정지 카드": z.number().int().min(1).max(6),
  카드: z
    .array(
      feedbackSchema
        .pick({
          "사진 경로": true,
          메뉴명: true,
          식당명: true,
          "맛 반응": true,
          "상세 태그": true,
          "미식 노트": true,
        })
        .extend({
          "메인 컬러": z.enum(tasteAxes),
          "보조 컬러": z.enum(tasteAxes).optional(),
          "세 번째 컬러": z.enum(tasteAxes).optional(),
          "주색 영역 비중": z
            .number()
            .min(0.4)
            .max(0.9)
            .step(0.01)
            .optional()
            .describe(
              "값이 클수록 주색은 넓어지고 두 보조색의 영역은 작아집니다. 기본값은 0.56입니다.",
            ),
        }),
    )
    .length(6)
    .describe(
      "디시 탑뷰 여섯 장과 미리보기용 예시 피드백. 메인·보조·세 번째 컬러가 배경 그라데이션을 구성합니다.",
    ),
});
export type CarouselProps = z.infer<typeof carouselSchema>;
