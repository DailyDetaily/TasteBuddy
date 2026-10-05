import { bloomTasteColors } from "./generated";
import { random } from "remotion";
import { easyEase } from "../PetalLogo/motion";
import type { BloomLayerColors } from "./palette";
import {
  BLOOM_FPS,
  BLOOM_OVERVIEW_COLOR_COUNT,
  BLOOM_OVERVIEW_WAVE_INTERVAL,
  BLOOM_OVERVIEW_RING_DELAY,
  BLOOM_OVERVIEW_MOTION_RATE,
  BLOOM_OVERVIEW_OPEN_FRAME,
  BLOOM_OVERVIEW_SHRINK_FRAMES,
  BLOOM_OVERVIEW_BACKGROUND_FRAMES,
  BLOOM_OVERVIEW_SINGLE_WAVE_FRAMES,
  BLOOM_OVERVIEW_SINGLE_SHRINK_START,
  BLOOM_OVERVIEW_SINGLE_BACKGROUND_FRAMES,
  BLOOM_OVERVIEW_SINGLE_STAGGER_FRAMES,
  BLOOM_OVERVIEW_MIN_SCALE,
} from "./cycle";

// User-specified concentric layout, in row-major order. Do not derive it from
// Euclidean distance: that would incorrectly split the middle band into two.
export const OVERVIEW_RING_LAYOUT = [
  [5, 4, 3, 3, 4, 5],
  [4, 3, 2, 2, 3, 4],
  [3, 2, 1, 1, 2, 3],
  [3, 2, 1, 1, 2, 3],
  [4, 3, 2, 2, 3, 4],
  [5, 4, 3, 3, 4, 5],
] as const;

const { sweet, sour, bitter, salty, umami, fat } = bloomTasteColors;
const palette = [sweet, sour, bitter, salty, umami, fat];
export type OverviewPaletteMode = "individual" | "wave";
export type OverviewWaveMode = "overlap" | "single-color";

// Both comparison layers draw from the same source colors and permutations.
const permutations = (colors: readonly string[]): string[][] =>
  colors.length === 0
    ? [[]]
    : colors.flatMap((color, index) =>
        permutations(colors.filter((_, other) => index !== other)).map(
          (rest) => [color, ...rest],
        ),
      );
const interiorPalettes = palette.map((background) =>
  permutations(palette.filter((color) => color !== background)),
);

const appearanceFrom = (colorIndex: number, combination: readonly string[]) => {
  const [outerPetals, innerPetals, outerStamens, innerStamens, pistil] = combination;
  const colors: BloomLayerColors = {
    outerPetals,
    innerPetals,
    outerStamens,
    innerStamens,
    pistil,
  };
  return {
    colorNumber: colorIndex + 1,
    backgroundColor: palette[colorIndex],
    colors,
  };
};

const layoutCells = OVERVIEW_RING_LAYOUT.flat().map((ring, index) => {
  const x = Math.abs((index % 6) - 2.5);
  const y = Math.abs(Math.floor(index / 6) - 2.5);
  return {
    index,
    ring,
    // Use geometry only for timing, never to change the specified color bands.
    // Nearer cells lead; a gentle angular offset separates equal-radius cells.
    travelCoordinate: Math.hypot(x, y) + (Math.atan2(y, x) / Math.PI) * 0.6,
  };
});

export const overviewCells = layoutCells.map((cell) => {
  const coordinates = layoutCells
    .filter((other) => other.ring === cell.ring)
    .map((other) => other.travelCoordinate);
  const min = Math.min(...coordinates);
  const range = Math.max(...coordinates) - min;
  return {
    index: cell.index,
    ring: cell.ring,
    // Keep the center and final corner anchors. Intermediate bands unfold in
    // overlapping subgroups over six motion frames instead of moving as blocks.
    rippleOffset:
      range === 0
        ? 0
        : ((cell.travelCoordinate - min) / range) *
          BLOOM_OVERVIEW_SINGLE_STAGGER_FRAMES,
  };
});

export const overviewWaveAt = (
  frame: number,
  ring: number,
  wave: number,
  mode: OverviewWaveMode = "overlap",
  rippleOffset = 0,
) => {
  if (mode === "single-color") {
    const currentWave = Math.min(
      BLOOM_OVERVIEW_COLOR_COUNT - 1,
      Math.floor(Math.max(0, frame) / BLOOM_OVERVIEW_SINGLE_WAVE_FRAMES),
    );
    const startsAt =
      wave * BLOOM_OVERVIEW_SINGLE_WAVE_FRAMES +
      (ring - 1) * BLOOM_OVERVIEW_RING_DELAY +
      rippleOffset;
    const age = frame - startsAt;
    if (frame < 0 || wave !== currentWave || (wave === 0 && age < 0))
      return null;

    // Once revealed, a cell stays present. Switching the active wave for the
    // whole grid also recolors waiting miniatures, so old hues never linger.
    if (age < 0) {
      return {
        wave,
        startsAt,
        age,
        motionTime:
          (BLOOM_OVERVIEW_OPEN_FRAME / BLOOM_FPS) * BLOOM_OVERVIEW_MOTION_RATE,
        scale: BLOOM_OVERVIEW_MIN_SCALE,
        backgroundProgress: 1,
        interiorVisible: false,
        interiorOpacity: 0,
      };
    }

    const opening = easyEase(age / BLOOM_OVERVIEW_SINGLE_BACKGROUND_FRAMES);
    const contraction = easyEase(
      (age - BLOOM_OVERVIEW_SINGLE_SHRINK_START) / BLOOM_OVERVIEW_SHRINK_FRAMES,
    );
    // Finish the background before starting the original petal/pistil animation.
    const flowerAge = Math.max(
      0,
      age - BLOOM_OVERVIEW_SINGLE_BACKGROUND_FRAMES,
    );
    return {
      wave,
      startsAt,
      age,
      motionTime:
        (Math.min(flowerAge, BLOOM_OVERVIEW_OPEN_FRAME) / BLOOM_FPS) *
        BLOOM_OVERVIEW_MOTION_RATE,
      // Waiting dots, both ahead of and behind the wave, show only background.
      interiorVisible:
        age >= BLOOM_OVERVIEW_SINGLE_BACKGROUND_FRAMES &&
        age < BLOOM_OVERVIEW_SINGLE_SHRINK_START + BLOOM_OVERVIEW_SHRINK_FRAMES,
      interiorOpacity: 1 - contraction,
      scale:
        BLOOM_OVERVIEW_MIN_SCALE +
        (1 - BLOOM_OVERVIEW_MIN_SCALE) * (1 - contraction),
      // Later colors grow from the existing miniature rather than vanishing.
      backgroundProgress:
        wave === 0
          ? opening
          : BLOOM_OVERVIEW_MIN_SCALE + (1 - BLOOM_OVERVIEW_MIN_SCALE) * opening,
    };
  }

  const startsAt =
    wave * BLOOM_OVERVIEW_WAVE_INTERVAL +
    (ring - 1) * BLOOM_OVERVIEW_RING_DELAY;
  const age = frame - startsAt;
  const holdOpen = wave === BLOOM_OVERVIEW_COLOR_COUNT - 1;
  if (
    age < 0 ||
    (!holdOpen &&
      age >= BLOOM_OVERVIEW_OPEN_FRAME + BLOOM_OVERVIEW_SHRINK_FRAMES)
  ) {
    return null;
  }
  return {
    wave,
    startsAt,
    age,
    motionTime: (age / BLOOM_FPS) * BLOOM_OVERVIEW_MOTION_RATE,
    interiorVisible: true,
    interiorOpacity: 1,
    scale: holdOpen
      ? 1
      : 1 -
        easyEase(
          (age - BLOOM_OVERVIEW_OPEN_FRAME) / BLOOM_OVERVIEW_SHRINK_FRAMES,
        ),
    // A quick leading edge keeps the next color visible during contraction;
    // expansion continues until the flower opens, without a full-size dwell.
    backgroundProgress:
      1 - (1 - Math.min(1, age / BLOOM_OVERVIEW_BACKGROUND_FRAMES)) ** 3,
  };
};

// Every color travels through all five rings. Each ring has its own clock,
// so outer blooms start while inner blooms are still unfolding.
export const overviewWaves = Array.from(
  { length: BLOOM_OVERVIEW_COLOR_COUNT },
  (_, colorIndex) => {
    const combinations = interiorPalettes[colorIndex];
    const selection = Math.floor(
      random(`bloom-wave-palette-v1:${colorIndex}`) * combinations.length,
    );
    return appearanceFrom(colorIndex, combinations[selection]);
  },
);

// Share a wave's color set, but reshuffle its layer assignments for every avatar.
// Draw without replacement across the full grid so no two avatars get the same
// interior combination. Seeds are fixed per wave/avatar, never per frame.
const overviewRandomWaveInteriors = overviewWaves.map((appearance, wave) => {
  const combinations = permutations(Object.values(appearance.colors));
  return overviewCells.map((cell) => {
    const selection = Math.floor(
      random(`bloom-wave-interior-v2:${wave}:${cell.index}`) *
        combinations.length,
    );
    return appearanceFrom(wave, combinations.splice(selection, 1)[0]);
  });
});

// Preserve the original per-avatar seed and sampling for comparison A.
const overviewIndividualWaves = Array.from(
  { length: BLOOM_OVERVIEW_COLOR_COUNT },
  (_, colorIndex) => {
    const availableByRing = new Map<number, string[][]>();
    return overviewCells.map((cell) => {
      const available = availableByRing.get(cell.ring) ?? [
        ...interiorPalettes[colorIndex],
      ];
      availableByRing.set(cell.ring, available);
      const selection = Math.floor(
        random(`bloom-interior-v2:${colorIndex}:${cell.index}`) *
          available.length,
      );
      return appearanceFrom(colorIndex, available.splice(selection, 1)[0]);
    });
  },
);

export const overviewAppearanceAt = (
  wave: number,
  cellIndex: number,
  mode: OverviewPaletteMode,
) =>
  mode === "individual"
    ? overviewIndividualWaves[wave][cellIndex]
    : overviewRandomWaveInteriors[wave][cellIndex];
