import { easyEase } from "../PetalLogo/motion";
import {
  defaultProfile,
  playgroundShape,
  type BloomShape,
  type TasteKey,
  shapeCountLimits,
} from "./settings";
const moves: {
  taste: TasteKey;
  from: number;
  to: number;
  start: number;
  end: number;
  caption: string;
}[] = [
  {
    taste: "sweet",
    from: 85,
    to: 20,
    start: 55,
    end: 100,
    caption: "단맛 점수를 내리면 색상의 순서가 바뀝니다.",
  },
  {
    taste: "sour",
    from: 72,
    to: 100,
    start: 120,
    end: 165,
    caption: "다른 맛과의 차이가 커지면 배경이 더 넓어집니다.",
  },
  {
    taste: "bitter",
    from: 41,
    to: 90,
    start: 185,
    end: 230,
    caption: "쓴맛을 높이면 꽃잎의 색상과 크기가 달라집니다.",
  },
  {
    taste: "salty",
    from: 63,
    to: 35,
    start: 250,
    end: 295,
    caption: "각 영역은 여섯 점수의 관계를 함께 반영합니다.",
  },
  {
    taste: "umami",
    from: 54,
    to: 96,
    start: 315,
    end: 360,
    caption: "감칠맛을 높여 내부 영역의 변화를 확인합니다.",
  },
  {
    taste: "fat",
    from: 38,
    to: 100,
    start: 380,
    end: 425,
    caption: "지방맛도 같은 규칙으로 배치됩니다.",
  },
];
const countClicks = [610, 630, 650, 670];
export const demoAt = (frame: number) => {
  const profile = { ...defaultProfile };
  const shape: BloomShape = { ...playgroundShape };
  let focus: TasteKey | "count" | undefined;
  let caption = "여섯 가지 미각 점수로 블룸을 조절합니다.";
  for (const move of moves) {
    if (frame < move.start - 15) break;
    caption = move.caption;
    const progress = easyEase((frame - move.start) / (move.end - move.start));
    profile[move.taste] = Math.round(
      move.from + (move.to - move.from) * progress,
    );
    if (frame < move.end + 8) focus = move.taste;
  }
  if (frame >= 460) {
    shape.petalShape = "capsulePetal";
    caption = "꽃잎 형태도 직접 선택할 수 있습니다.";
  }
  if (frame >= 510) {
    shape.stamenShape = "roundedSpokeStamen";
    caption = "수술과 암술의 형태를 바꾸며 비교해 보세요.";
  }
  if (frame >= 550) shape.pistilShape = "seedCluster";
  const shapeCount = Math.min(
    shapeCountLimits.max,
    shapeCountLimits.min + countClicks.filter((at) => frame >= at).length,
  );
  if (frame >= 590 && frame <= 690) focus = "count";
  return { profile, shape, shapeCount, focus, caption };
};
// Set from the rendered shared panel; all coordinates stay fixed in the demo.
export const controlAnchor = (taste: TasteKey, score: number) => {
  const index = ["sweet", "sour", "bitter", "salty", "umami", "fat"].indexOf(
    taste,
  );
  return { x: 102 + (224 * score) / 100, y: 106.95 + 42 * index };
};
export const demoCursorAt = (frame: number) => {
  if (frame < 35 || frame >= 700) return undefined;
  const { profile } = demoAt(frame);
  let previous = { x: 760, y: 430 };
  for (const move of moves) {
    const current = controlAnchor(move.taste, profile[move.taste]);
    if (frame < move.start) {
      const t = easyEase((frame - (move.start - 20)) / 20);
      return {
        x: previous.x + (current.x - previous.x) * t,
        y: previous.y + (current.y - previous.y) * t,
        pressed: false,
      };
    }
    if (frame <= move.end + 8)
      return { ...current, pressed: frame <= move.end };
    previous = controlAnchor(move.taste, move.to);
  }
  const targets = [
    { at: 460, x: 184, y: 427.34 },
    { at: 510, x: 214, y: 469.34 },
    { at: 550, x: 294, y: 511.34 },
  ];
  for (const target of targets) {
    if (frame <= target.at + 10) {
      const t = easyEase((frame - (target.at - 20)) / 20);
      return {
        x: previous.x + (target.x - previous.x) * t,
        y: previous.y + (target.y - previous.y) * t,
        pressed: frame >= target.at && frame < target.at + 7,
      };
    }
    previous = target;
  }
  if (frame >= 580) {
    const target = {
      x: 313,
      y: 621.74,
    };
    const t = easyEase((frame - 580) / 30);
    return {
      x: previous.x + (target.x - previous.x) * t,
      y: previous.y + (target.y - previous.y) * t,
      pressed: countClicks.some((at) => frame >= at && frame < at + 7),
    };
  }
  return { ...previous, pressed: false };
};
