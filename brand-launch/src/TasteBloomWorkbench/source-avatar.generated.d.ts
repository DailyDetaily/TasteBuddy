import type { ComponentType } from "react";
export type TasteKey = "sweet" | "sour" | "bitter" | "salty" | "umami" | "fat";
export type TasteProfile = Record<TasteKey, number>;
export const TASTE_COLORS: Record<TasteKey, string>;
export function sortTasteProfile(profile: TasteProfile): {
  taste: TasteKey;
  color: string;
  value: number;
  rank: number;
}[];
export const SourceBloomAvatar: ComponentType<{
  profile: TasteProfile;
  ariaLabel?: string;
  size?: number;
  showFrame?: boolean;
  shapeCountOverride?: number;
  petalShape?:
    | "roundPetal"
    | "capsulePetal"
    | "softDiamondPetal"
    | "serratedTipPetal";
  stamenShape?: "thinStamen" | "roundedSpokeStamen" | "dottedRayStamen";
  pistilShape?: "solidPistil" | "diamondPistil" | "seedCluster";
}>;
