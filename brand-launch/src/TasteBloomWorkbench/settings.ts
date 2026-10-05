import type { TasteKey, TasteProfile } from "./source-avatar.generated";
export type { TasteKey, TasteProfile } from "./source-avatar.generated";
export const STUDIO_WIDTH = 1600;
export const STUDIO_HEIGHT = 1000;
export const DEMO_FRAMES = 720;
export const DEMO_FPS = 30;
export const tasteControls: { key: TasteKey; label: string }[] = [
  { key: "sweet", label: "단맛" },
  { key: "sour", label: "신맛" },
  { key: "bitter", label: "쓴맛" },
  { key: "salty", label: "짠맛" },
  { key: "umami", label: "감칠맛" },
  { key: "fat", label: "지방맛" },
];
export const layerLabels = [
  "배경",
  "바깥 꽃잎",
  "안쪽 꽃잎",
  "바깥 수술",
  "안쪽 수술",
  "암술",
];
// DesignSystemPage defaults, converted from 0–10 values to 0–100 scores.
export const defaultProfile: TasteProfile = {
  sweet: 85,
  sour: 72,
  bitter: 41,
  salty: 63,
  umami: 54,
  fat: 38,
};
// Match the playground overrides, isolating score-driven size/colour changes.
export const playgroundShape = {
  shapeCountOverride: 4,
  petalShape: "roundPetal",
  stamenShape: "thinStamen",
  pistilShape: "solidPistil",
} as const;

// PalateBloomAvatar.PALATE_BLOOM_SHAPE_COUNT_LIMITS.
export const shapeCountLimits = { min: 4, max: 8 } as const;

export const shapeOptions = {
  petalShape: [
    ["roundPetal", "원형"],
    ["capsulePetal", "캡슐"],
    ["softDiamondPetal", "마름모"],
    ["serratedTipPetal", "톱니"],
  ],
  stamenShape: [
    ["thinStamen", "가는 수술"],
    ["roundedSpokeStamen", "둥근 수술"],
    ["dottedRayStamen", "점 수술"],
  ],
  pistilShape: [
    ["solidPistil", "원형"],
    ["diamondPistil", "마름모"],
    ["seedCluster", "씨앗"],
  ],
} as const;
export type BloomShape = {
  -readonly [Key in keyof typeof shapeOptions]: (typeof shapeOptions)[Key][number][0];
};
