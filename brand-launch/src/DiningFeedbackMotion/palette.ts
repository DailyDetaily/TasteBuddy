import { palette, type TasteAxis } from "./settings";
import type { CarouselProps } from "./carousel-settings";

const supportingAxes: Record<TasteAxis, [TasteAxis, TasteAxis]> = {
  단맛: ["감칠맛", "신맛"],
  신맛: ["짠맛", "단맛"],
  쓴맛: ["신맛", "짠맛"],
  짠맛: ["감칠맛", "쓴맛"],
  감칠맛: ["단맛", "짠맛"],
  지방맛: ["단맛", "감칠맛"],
};

export const cardPalette = (card: CarouselProps["카드"][number]) => {
  const axis = card["메인 컬러"];
  const [secondary, tertiary] = supportingAxes[axis];
  return {
    background: palette[axis].tint,
    main: palette[axis].main,
    secondary: palette[card["보조 컬러"] ?? secondary].main,
    tertiary: palette[card["세 번째 컬러"] ?? tertiary].main,
    mainCoverage: card["주색 영역 비중"] ?? 0.56,
  };
};
