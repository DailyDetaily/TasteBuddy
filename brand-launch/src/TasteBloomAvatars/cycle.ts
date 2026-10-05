export const BLOOM_FPS = 30;
export const BLOOM_CYCLE_FRAMES = 210;
export const BLOOM_CYCLE_COUNT = 4;
export const BLOOM_GALLERY_FRAMES = BLOOM_CYCLE_FRAMES * BLOOM_CYCLE_COUNT;
// Independent ring phases carry each color outward like the feedback ripple.
// The next pulse grows while the fully open previous pulse quickly contracts.
export const BLOOM_OVERVIEW_COLOR_COUNT = 6;
// New colors leave the center while earlier pulses are still crossing the grid.
// Unequal emission/travel intervals keep adjacent rings at distinct pulse phases.
export const BLOOM_OVERVIEW_WAVE_INTERVAL = 12;
export const BLOOM_OVERVIEW_RING_DELAY = 10;
export const BLOOM_OVERVIEW_MOTION_RATE = 6;
export const BLOOM_OVERVIEW_OPEN_FRAME = 12;
export const BLOOM_OVERVIEW_SHRINK_FRAMES = 6;
export const BLOOM_OVERVIEW_BACKGROUND_FRAMES = BLOOM_OVERVIEW_OPEN_FRAME;
export const BLOOM_OVERVIEW_FRAMES =
  BLOOM_OVERVIEW_WAVE_INTERVAL * (BLOOM_OVERVIEW_COLOR_COUNT - 1) +
  BLOOM_OVERVIEW_RING_DELAY * 4 +
  BLOOM_OVERVIEW_OPEN_FRAME +
  1;
// B holds two radial steps, then retains each avatar at 12px on its 60px canvas.
export const BLOOM_OVERVIEW_MIN_SCALE = 0.2;
export const BLOOM_OVERVIEW_SINGLE_BACKGROUND_FRAMES = 8;
export const BLOOM_OVERVIEW_SINGLE_STAGGER_FRAMES = 6;
export const BLOOM_OVERVIEW_SINGLE_SHRINK_START = Math.max(
  BLOOM_OVERVIEW_RING_DELAY * 2,
  BLOOM_OVERVIEW_SINGLE_BACKGROUND_FRAMES + BLOOM_OVERVIEW_OPEN_FRAME,
);
// Start the next color only after every ring has returned to its minimum size.
export const BLOOM_OVERVIEW_SINGLE_WAVE_FRAMES =
  BLOOM_OVERVIEW_RING_DELAY * 4 +
  BLOOM_OVERVIEW_SINGLE_SHRINK_START +
  BLOOM_OVERVIEW_SHRINK_FRAMES;
export const BLOOM_OVERVIEW_SINGLE_SPEED = 0.75;
export const BLOOM_OVERVIEW_SINGLE_COLOR_FRAMES =
  Math.ceil(
    (BLOOM_OVERVIEW_SINGLE_WAVE_FRAMES * BLOOM_OVERVIEW_COLOR_COUNT) /
      BLOOM_OVERVIEW_SINGLE_SPEED,
  ) + 1;
export const BLOOM_DURATION_FRAMES =
  BLOOM_GALLERY_FRAMES +
  BLOOM_OVERVIEW_FRAMES +
  BLOOM_OVERVIEW_SINGLE_COLOR_FRAMES;
export const BLOOM_OPEN_SECONDS = 2.7;
export const BLOOM_FOLD_START = 132;
export const BLOOM_FOLD_END = 192;
export const BLOOM_COLOR_END = 207;

export const bloomCycleAt = (frame: number) => {
  const wrapped =
    ((frame % BLOOM_GALLERY_FRAMES) + BLOOM_GALLERY_FRAMES) %
    BLOOM_GALLERY_FRAMES;
  const batch = Math.floor(wrapped / BLOOM_CYCLE_FRAMES);
  const local = wrapped % BLOOM_CYCLE_FRAMES;
  const nextBatch = Math.min(batch + 1, BLOOM_CYCLE_COUNT - 1);
  const closed = local >= BLOOM_FOLD_END;
  const colorProgress = Math.min(
    1,
    Math.max(0, (local - BLOOM_FOLD_END) / (BLOOM_COLOR_END - BLOOM_FOLD_END)),
  );
  return {
    batch,
    nextBatch,
    displayedBatch: closed ? nextBatch : batch,
    motionTime:
      local < BLOOM_FOLD_START
        ? Math.min(BLOOM_OPEN_SECONDS, local / BLOOM_FPS)
        : Math.max(
            0,
            BLOOM_OPEN_SECONDS *
              (1 -
                (local - BLOOM_FOLD_START) /
                  (BLOOM_FOLD_END - BLOOM_FOLD_START)),
          ),
    colorProgress: colorProgress * colorProgress * (3 - 2 * colorProgress),
  };
};
