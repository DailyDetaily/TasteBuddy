// Six tastes accumulate. Inner entry and exit share clockwise timing; exit accompanies outer travel.
export const COLOR_GUIDE_FPS = 30;
export const COLOR_GUIDE_INTRO_FRAMES = 15;
// Keep the existing six-frame inner travel speed, but run each dot exclusively.
const INNER_STEP_FRAMES = 6;
const INNER_DOT_COUNT = 10;
const INNER_SEQUENCE_FRAMES = INNER_STEP_FRAMES * INNER_DOT_COUNT;
const PALETTE_HOLD_FRAMES = 30;
const OUTER_TRANSFER_FRAMES = 30;
export const TASTE_PHASE_FRAMES =
  INNER_SEQUENCE_FRAMES * 2 + PALETTE_HOLD_FRAMES;
export const COLOR_GUIDE_LOOP_FRAMES = TASTE_PHASE_FRAMES * 6;
export const COLOR_GUIDE_ACTIVE_FRAMES =
  COLOR_GUIDE_INTRO_FRAMES + COLOR_GUIDE_LOOP_FRAMES;
export const COLOR_GUIDE_RESET_FRAMES = 3;
export const COLOR_GUIDE_DURATION_FRAMES =
  COLOR_GUIDE_ACTIVE_FRAMES + COLOR_GUIDE_RESET_FRAMES;
export const COLOR_GUIDE_TIMING = {
  innerMotionFrames: INNER_SEQUENCE_FRAMES,
  innerStepFrames: INNER_STEP_FRAMES,
  innerDotCount: INNER_DOT_COUNT,
  outerDotCount: 6,
  innerSweepDegrees: 36,
  entryStart: 0,
  entryEnd: INNER_SEQUENCE_FRAMES,
  exitStart: INNER_SEQUENCE_FRAMES + PALETTE_HOLD_FRAMES,
  exitEnd: TASTE_PHASE_FRAMES,
  // Keep arrival aligned with the next palette, but shorten the actual travel.
  outerMoveFrames: OUTER_TRANSFER_FRAMES,
  moveStart: TASTE_PHASE_FRAMES - OUTER_TRANSFER_FRAMES,
  phaseEnd: TASTE_PHASE_FRAMES,
} as const;

export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const ease = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

// Preserve the slow start, then add a small (~2.1%) positional overshoot.
// The bump and its velocity are zero at the endpoints, so settled dots stay put.
export const arrivalEase = (n: number) => {
  const t = clamp(n);
  if (t <= 0.5 || t >= 1) return ease(t);
  const bump = Math.sin(((t - 0.5) / 0.5) * Math.PI);
  return ease(t) + 0.125 * bump * bump;
};

export const cyclePose = (sourceFrame: number, still: boolean) => {
  const loopFrame = Math.max(0, sourceFrame) % COLOR_GUIDE_DURATION_FRAMES;
  if (!still && loopFrame >= COLOR_GUIDE_ACTIVE_FRAMES) {
    // Match the first frame exactly after every point has faded out.
    return {
      tasteIndex: 5,
      settledCount: 0,
      nextTasteIndex: 0,
      colorFromIndex: 5,
      colorToIndex: 5,
      localFrame: -1,
      travel: 0,
      angle: -180,
      movingOpacity: 0,
      isFinalExit: false,
      phase: "reset",
    };
  }
  if (!still && loopFrame < COLOR_GUIDE_INTRO_FRAMES) {
    const progress = clamp(loopFrame / COLOR_GUIDE_INTRO_FRAMES);
    const travel = ease(progress);
    return {
      tasteIndex: 0,
      settledCount: 0,
      nextTasteIndex: 0,
      colorFromIndex: 5,
      colorToIndex: 0,
      localFrame: -1,
      travel,
      angle: -180 + 60 * arrivalEase(progress),
      movingOpacity: progress,
      isFinalExit: false,
      phase: "intro",
    };
  }
  const elapsed = Math.max(0, loopFrame - COLOR_GUIDE_INTRO_FRAMES);
  const wrapped =
    ((elapsed % COLOR_GUIDE_LOOP_FRAMES) + COLOR_GUIDE_LOOP_FRAMES) %
    COLOR_GUIDE_LOOP_FRAMES;
  const tasteIndex = still ? 0 : Math.floor(wrapped / TASTE_PHASE_FRAMES);
  const localFrame = still
    ? (COLOR_GUIDE_TIMING.entryEnd + COLOR_GUIDE_TIMING.exitStart) / 2
    : wrapped - tasteIndex * TASTE_PHASE_FRAMES;
  const travelTime = still
    ? 0
    : clamp(
        (localFrame - COLOR_GUIDE_TIMING.moveStart) /
          (COLOR_GUIDE_TIMING.phaseEnd - COLOR_GUIDE_TIMING.moveStart),
      );
  const travel = ease(travelTime);
  const isFinalExit =
    !still && tasteIndex === 5 && localFrame >= COLOR_GUIDE_TIMING.exitStart;
  const phase = isFinalExit
    ? "all-exit"
    : localFrame >= COLOR_GUIDE_TIMING.exitStart
      ? "inner-exit"
      : localFrame >= COLOR_GUIDE_TIMING.entryEnd
        ? "inner-hold"
        : "inner-enter";
  return {
    tasteIndex,
    // Stations accumulate within the run and fade only in the final exit.
    settledCount: still
      ? 6
      : Math.min(6, Math.floor(elapsed / TASTE_PHASE_FRAMES) + 1),
    nextTasteIndex: (tasteIndex + 1) % 6,
    colorFromIndex: tasteIndex,
    // Keep the final band Fatty-colored, matching the next intro's first frame.
    colorToIndex: tasteIndex === 5 ? 5 : (tasteIndex + 1) % 6,
    localFrame,
    travel,
    angle: -120 + 60 * (tasteIndex + arrivalEase(travelTime)),
    movingOpacity:
      localFrame >= COLOR_GUIDE_TIMING.moveStart && !isFinalExit ? 1 : 0,
    isFinalExit,
    phase,
  };
};

// Final outer dots follow the same clockwise fade as the inner dots.
// Exactly one outer dot moves at a time; each reaches the next station before
// that station begins moving. The final point finishes with the inner 10% dot.
export const outerDotExitPose = (
  localFrame: number,
  index: number,
  isFinalExit: boolean,
) => {
  if (!isFinalExit) return { opacity: 1, angleOffset: 0 };
  const individualFrames =
    COLOR_GUIDE_TIMING.innerMotionFrames / COLOR_GUIDE_TIMING.outerDotCount;
  const exit = ease(
    (localFrame - COLOR_GUIDE_TIMING.exitStart - index * individualFrames) /
      individualFrames,
  );
  return { opacity: 1 - exit, angleOffset: 60 * exit };
};

// Each dot advances one 36° step on entry and another on exit. Numbers follow
// the dot upright. Entry/exit both use ten exclusive six-frame steps: the
// next step starts exactly when the previous point reaches its destination.
export const innerDotPose = (
  localFrame: number,
  index: number,
  still: boolean,
) => {
  if (still) return { opacity: 1, scale: 1, angleOffset: 0 };
  const individualFrames = COLOR_GUIDE_TIMING.innerStepFrames;
  const delay = index * individualFrames;
  const enterTime =
    (localFrame - COLOR_GUIDE_TIMING.entryStart - delay) / individualFrames;
  const enter = ease(enterTime);
  const exit = ease(
    (localFrame - COLOR_GUIDE_TIMING.exitStart - delay) / individualFrames,
  );
  return {
    opacity: enter * (1 - exit),
    scale: 1,
    angleOffset:
      COLOR_GUIDE_TIMING.innerSweepDegrees *
      (arrivalEase(enterTime) - 1 + exit),
  };
};
