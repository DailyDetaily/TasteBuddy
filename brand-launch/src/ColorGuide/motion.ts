// One clockwise traveler deposits then clears the inner tones without a dwell.
export const COLOR_GUIDE_FPS = 30;
export const COLOR_GUIDE_INTRO_FRAMES = 15;
// Keep the existing six-frame inner travel speed, but run each dot exclusively.
const INNER_STEP_FRAMES = 6;
const INNER_DOT_COUNT = 10;
const INNER_SEQUENCE_FRAMES = INNER_STEP_FRAMES * INNER_DOT_COUNT;
const OUTER_TRANSFER_FRAMES = INNER_SEQUENCE_FRAMES;
export const TASTE_PHASE_FRAMES = INNER_SEQUENCE_FRAMES * 2;
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
  exitStart: INNER_SEQUENCE_FRAMES,
  exitEnd: TASTE_PHASE_FRAMES,
  // Outer travel spans the full inner clearing lap and arrives with it.
  outerMoveFrames: OUTER_TRANSFER_FRAMES,
  moveStart: TASTE_PHASE_FRAMES - OUTER_TRANSFER_FRAMES,
  phaseEnd: TASTE_PHASE_FRAMES,
} as const;

export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const ease = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
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
      angle: -180 + 60 * ease(progress),
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
    angle: -120 + 60 * (tasteIndex + travel),
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
  const exit = clamp(
    (localFrame - COLOR_GUIDE_TIMING.exitStart - index * individualFrames) /
      individualFrames,
  );
  return { opacity: 1 - ease(exit), angleOffset: 60 * exit };
};

// Stationary tones appear underneath the traveler on arrival, then disappear
// underneath it on departure. The complete ring never rotates as a group.
export const innerDotPose = (
  localFrame: number,
  index: number,
  still: boolean,
) => {
  if (still) return { opacity: 1, scale: 1, angleOffset: 0 };
  if (localFrame < 0) return { opacity: 0, scale: 1, angleOffset: 0 };
  const entering = localFrame < COLOR_GUIDE_TIMING.exitStart;
  const step = Math.floor(
    (entering ? localFrame : localFrame - COLOR_GUIDE_TIMING.exitStart) /
      INNER_STEP_FRAMES,
  );
  return {
    opacity: (entering ? index <= step : index > step) ? 1 : 0,
    scale: 1,
    angleOffset: 0,
  };
};

// Each lap starts/ends at 100. The 10→100 wrap closes the entry lap, so the
// clearing lap can continue immediately without a 36° jump or a speed reset.
export const innerFlowPose = (
  localFrame: number,
  still: boolean,
  firstTaste: boolean,
  finalExit: boolean,
) => {
  const moving = !still && localFrame >= 0;
  const phase = Math.max(0, localFrame) / INNER_STEP_FRAMES;
  const fromIndex = Math.floor(phase) % INNER_DOT_COUNT;
  const progress = phase - Math.floor(phase);
  const appearance = firstTaste ? ease(localFrame / INNER_STEP_FRAMES) : 1;
  const disappearance = finalExit
    ? 1 -
      ease(
        (localFrame - (TASTE_PHASE_FRAMES - INNER_STEP_FRAMES)) /
          INNER_STEP_FRAMES,
      )
    : 1;
  const opacity = moving ? appearance * disappearance : 0;
  return {
    fromIndex,
    toIndex: (fromIndex + 1) % INNER_DOT_COUNT,
    progress,
    angleOffset: phase * COLOR_GUIDE_TIMING.innerSweepDegrees,
    opacity,
    // Keep upright moving numbers clear of the fixed station numbers.
    labelOpacity: opacity * Math.sin(Math.PI * progress),
    handingToNextTaste:
      localFrame >= COLOR_GUIDE_TIMING.exitStart &&
      fromIndex === INNER_DOT_COUNT - 1,
  };
};
