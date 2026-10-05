import { bloomVariants } from "./variants";
import { bloomName } from "./names";

const petalShapes = [
  "roundPetal",
  "capsulePetal",
  "softDiamondPetal",
  "serratedTipPetal",
] as const;
const stamenShapes = ["thinStamen", "roundedSpokeStamen", "dottedRayStamen"] as const;
const pistilShapes = ["solidPistil", "diamondPistil", "seedCluster"] as const;
const tasteKeys = ["sweet", "sour", "bitter", "salty", "umami", "fat"] as const;

type Shape = {
  petalShape: (typeof petalShapes)[number];
  stamenShape: (typeof stamenShapes)[number];
  pistilShape: (typeof pistilShapes)[number];
};
type Profile = Record<(typeof tasteKeys)[number], number>;
type BloomForm = Shape & {
  id: string;
  name: string;
  detail: string;
  formNumber: number;
  shapeCountOverride: number;
  profile: Profile;
};

const names = {
  roundPetal: "원형 꽃잎",
  capsulePetal: "캡슐 꽃잎",
  softDiamondPetal: "마름모 꽃잎",
  serratedTipPetal: "톱니 꽃잎",
  thinStamen: "가는 수술",
  roundedSpokeStamen: "둥근 수술",
  dottedRayStamen: "점 수술",
  solidPistil: "원형 암술",
  diamondPistil: "마름모 암술",
  seedCluster: "씨앗 암술",
};
const shapeKey = (shape: Shape) =>
  `${shape.petalShape}/${shape.stamenShape}/${shape.pistilShape}`;
const shapeDescription = (shape: Shape) =>
  `${names[shape.petalShape]} · ${names[shape.stamenShape]} · ${names[shape.pistilShape]}`;
const remaining = petalShapes
  .flatMap((petalShape) =>
    stamenShapes.flatMap((stamenShape) =>
      pistilShapes.map((pistilShape) => ({ petalShape, stamenShape, pistilShape })),
    ),
  )
  .filter(
    (shape) =>
      !bloomVariants.some((variant) => shapeKey(variant) === shapeKey(shape)),
  );

const rotateColors = (profile: Profile, shift: number): Profile =>
  Object.fromEntries(
    tasteKeys.map((taste, index) => [
      tasteKeys[(index + shift) % tasteKeys.length],
      profile[taste],
    ]),
  ) as Profile;

// Keep the original nine as the first group. Each later group changes the petal
// silhouette where possible, and all 4 × 3 × 3 base forms occur exactly once.
export const bloomForms: BloomForm[] = bloomVariants.map((variant, index) => ({
  ...variant,
  name: bloomName(variant),
  detail: shapeDescription(variant),
  formNumber: index + 1,
}));
while (remaining.length > 0) {
  const index = bloomForms.length;
  const slot = index % 9;
  const previous = bloomForms[index - 9];
  const score = (candidate: Shape) =>
    Number(candidate.petalShape !== previous.petalShape) * 4 +
    Number(candidate.stamenShape !== previous.stamenShape) * 2 +
    Number(candidate.pistilShape !== previous.pistilShape);
  const selected = remaining.reduce(
    (best, candidate, candidateIndex) =>
      score(candidate) > score(remaining[best]) ? candidateIndex : best,
    0,
  );
  const [shape] = remaining.splice(selected, 1);
  const original = bloomVariants[slot];
  bloomForms.push({
    ...shape,
    id: `form-${String(index + 1).padStart(2, "0")}`,
    name: bloomName(shape),
    detail: shapeDescription(shape),
    formNumber: index + 1,
    shapeCountOverride: original.shapeCountOverride,
    profile: rotateColors(original.profile, Math.floor(index / 9)),
  });
}
