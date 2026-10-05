export const PROFILE_AVATAR_SIZE = 96;
export const PROFILE_ROW_HEIGHT = 128;
export const PROFILE_ROW_GAP = 224;
export const PROFILE_ROW_PITCH = PROFILE_ROW_HEIGHT + PROFILE_ROW_GAP;
export const PROFILE_TYPE_COUNT = 9;
export const PROFILE_SLOT_COUNT = PROFILE_TYPE_COUNT + 1;
export const PROFILE_HOLD_FRAMES = 60;
export const PROFILE_MOVE_FRAMES = 18;
export const PROFILE_STEP_FRAMES = PROFILE_HOLD_FRAMES + PROFILE_MOVE_FRAMES;
export const PROFILE_BLOOM_SPEED = 2;
export const PROFILE_BLOOM_FADE_FRAMES = 6;
export const PROFILE_EDGE_LEAD_FRAMES = 6;
export const PROFILE_END_PAUSE_FRAMES = 45;
export const PROFILE_DURATION_FRAMES =
  PROFILE_TYPE_COUNT * PROFILE_STEP_FRAMES +
  PROFILE_END_PAUSE_FRAMES +
  PROFILE_MOVE_FRAMES;
export const profileHoldFrames = (index: number) =>
  index === PROFILE_TYPE_COUNT ? PROFILE_END_PAUSE_FRAMES : PROFILE_HOLD_FRAMES;
export const profileMoveStart = (index: number) =>
  index * PROFILE_STEP_FRAMES + profileHoldFrames(index);

// Identical coordinates avoid subpixel SVG differences at the loop endpoints.
export const profileLoopFrame = (frame: number) =>
  frame === PROFILE_DURATION_FRAMES - 1 ? 0 : frame;

// TBColor.textPrimary / TBColor.textHint in ios/TasteBuddy/DesignSystem/TBTheme.swift.
export const PROFILE_TEXT_TOKENS = {
  primary: "#0F0F0F",
  hint: "#888888",
} as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export const profileListTop = (height: number) =>
  (height - PROFILE_ROW_HEIGHT) / 2;

export const profileStepEase = (progress: number) => {
  const t = clamp(progress);
  if (t === 0 || t === 1) return t;
  const back = 1;
  const shifted = t - 1;
  return 1 + (back + 1) * shifted ** 3 + back * shifted ** 2;
};

export const profilePlaybackAt = (frame: number) => {
  const safeFrame = Math.max(0, Math.min(PROFILE_DURATION_FRAMES - 1, frame));
  const centerIndex = Math.min(
    PROFILE_SLOT_COUNT - 1,
    Math.floor(safeFrame / PROFILE_STEP_FRAMES),
  );
  const localFrame = safeFrame - centerIndex * PROFILE_STEP_FRAMES;
  const holdFrames = profileHoldFrames(centerIndex);
  const moving = localFrame >= holdFrames;
  const progress = moving
    ? (localFrame - holdFrames) / (PROFILE_MOVE_FRAMES - 1)
    : 0;
  const scrollIndex = centerIndex + (moving ? profileStepEase(progress) : 0);
  return {
    centerIndex,
    localFrame,
    holdFrames,
    moving,
    progress,
    scrollIndex,
    offset: scrollIndex * PROFILE_ROW_PITCH,
  };
};

export const profileScrollAt = (frame: number) =>
  profilePlaybackAt(frame).offset;

// Side circles start 0.2s earlier; both use the same speed curve and overlap.
export const profileEdgeScrollAt = (frame: number) =>
  profileScrollAt(frame + PROFILE_EDGE_LEAD_FRAMES);

export const profileEdgeCenterAt = (
  baseCenter: number,
  frame: number,
  height: number,
  avatarSize = PROFILE_AVATAR_SIZE,
) => {
  const period = PROFILE_SLOT_COUNT * PROFILE_ROW_PITCH;
  const lower = height + avatarSize / 2 - period;
  const value = baseCenter + profileEdgeScrollAt(frame) - lower;
  return lower + (((value % period) + period) % period);
};

export const profileRowAt = (index: number, frame: number, fps = 30) => {
  const state = profilePlaybackAt(frame);
  const nearCenter = clamp(1 - Math.abs(index - state.scrollIndex) * 2);
  const focus = nearCenter * nearCenter * (3 - 2 * nearCenter);
  const centered =
    !state.moving &&
    index >= 0 &&
    index < PROFILE_TYPE_COUNT &&
    index === state.centerIndex;
  // Fade the flower during the last six resting frames, before the row moves.
  // Both seam frames are background-only; Purist opens after the loop restarts.
  const interiorOpacity =
    centered && state.localFrame > 0
      ? 1 -
        clamp(
          (state.localFrame - (state.holdFrames - PROFILE_BLOOM_FADE_FRAMES)) /
            (PROFILE_BLOOM_FADE_FRAMES - 1),
        )
      : 0;
  return {
    focus,
    centered,
    avatarOpacity: 0.55 + 0.45 * focus,
    interiorVisible: interiorOpacity > 0,
    interiorOpacity,
    motionTime: centered
      ? Math.min((state.localFrame / fps) * PROFILE_BLOOM_SPEED, 2.7)
      : 0,
  };
};
