import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  interpolateColors,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "../fonts";
import { kaliceReady } from "./fonts";
import { AnimatedBloom } from "./AnimatedBloom";
import { bloomForms } from "./forms";
import { bloomSvgLayers } from "./generated";
import { profileDisplayRows } from "./profile-types";
import {
  PROFILE_AVATAR_SIZE,
  PROFILE_ROW_HEIGHT,
  PROFILE_ROW_PITCH,
  PROFILE_TEXT_TOKENS,
  profileScrollAt,
  profileRowAt,
  profileEdgeCenterAt,
  profileLoopFrame,
} from "./profile-motion";
// Ten offscreen slots include the blank beat, returning edge colors at the seam.
// The initial four visible circles per side keep their established palettes.
const edgeAvatars = [
  { side: -1, forms: [7, 1, 6, 9, 24, 23, 16, 15, 30, 5] },
  { side: 1, forms: [4, 5, 8, 26, 2, 32, 9, 1, 7, 16] },
].flatMap(({ side, forms }) =>
  forms.map((formNumber, row) => ({
    name: `${side < 0 ? "왼쪽" : "오른쪽"} · ${row + 1}`,
    side,
    row,
    formNumber,
  })),
);

export const TasteBloomProfile = ({
  elementScale = 1,
}: {
  elementScale?: number;
}) => {
  const frame = profileLoopFrame(useCurrentFrame());
  const { fps, width, height } = useVideoConfig();
  // Keep the font loader in the bundle and wait for the real face before rendering.
  const [fontHandle] = useState(() => delayRender("Profile Kalice font"));
  useEffect(() => {
    kaliceReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);
  const scrollY = profileScrollAt(frame);
  const avatarSize = PROFILE_AVATAR_SIZE * elementScale;
  const rowHeight = PROFILE_ROW_HEIGHT * elementScale;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FFFFFF",
        color: PROFILE_TEXT_TOKENS.primary,
        fontFamily: "Kalice, Pretendard, serif",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        data-bloom-profile
        data-profile-scroll={scrollY}
        style={{
          position: "absolute",
          top: (height - rowHeight) / 2 - PROFILE_ROW_PITCH,
          left: "50%",
          transform: `translate(-50%, ${-scrollY}px)`,
          display: "flex",
          flexDirection: "column",
          gap: PROFILE_ROW_PITCH - rowHeight,
          alignItems: "flex-start",
          width: "max-content",
          maxWidth: 800 * elementScale,
          textAlign: "left",
        }}
      >
        {/* Keep the row pitch fixed as the landscape elements grow. */}
        {profileDisplayRows.map((profile) => {
          const appearance = profileRowAt(profile.rowIndex, frame, fps);
          if (profile.id === "loop-gap") {
            return (
              <Sequence
                key={`gap-${profile.rowIndex}`}
                name="루프 시작 여백"
                layout="none"
              >
                <div
                  data-profile-gap={profile.rowIndex}
                  style={{
                    height: rowHeight,
                    width: "100%",
                    flexShrink: 0,
                  }}
                />
              </Sequence>
            );
          }
          const form =
            bloomForms.find(
              (candidate) => candidate.formNumber === profile.avatarForm,
            ) ?? bloomForms[0];
          return (
            <Sequence
              key={`${profile.id}-${profile.rowIndex}`}
              name={`${profile.rowIndex + 1} · ${profile.title}`}
              layout="none"
            >
              <div
                data-profile-row={profile.id}
                data-profile-index={profile.rowIndex}
                data-profile-centered={appearance.centered}
                style={{
                  color: interpolateColors(
                    appearance.focus,
                    [0, 1],
                    [PROFILE_TEXT_TOKENS.hint, PROFILE_TEXT_TOKENS.primary],
                  ),
                  display: "flex",
                  alignItems: "center",
                  gap: 24 * elementScale,
                  width: "100%",
                  minHeight: rowHeight,
                }}
              >
                <Sequence name="블룸 아바타" layout="none">
                  <div
                    data-profile-avatar
                    style={{ opacity: appearance.avatarOpacity, flexShrink: 0 }}
                  >
                    <AnimatedBloom
                      id={form.id}
                      index={0}
                      label={`블룸 아바타 · ${form.name}`}
                      size={avatarSize}
                      motionTime={appearance.motionTime}
                      interiorVisible={appearance.interiorVisible}
                      interiorOpacity={appearance.interiorOpacity}
                      backgroundColor={bloomSvgLayers[form.id].backgroundColor}
                    />
                  </div>
                </Sequence>
                <Sequence name="미각 타입" layout="none">
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <div
                      data-profile-taste-type
                      style={{
                        fontSize: 60 * elementScale,
                        fontWeight: 400,
                        // Slightly thicken the bundled Kalice Regular face.
                        WebkitTextStroke: `${0.6 * elementScale}px currentColor`,
                        lineHeight: 1,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {profile.title}
                    </div>
                  </div>
                </Sequence>
              </div>
            </Sequence>
          );
        })}
      </div>
      {edgeAvatars.map((avatar) => {
        const form = bloomForms.find(
          (candidate) => candidate.formNumber === avatar.formNumber,
        )!;
        return (
          <Sequence
            key={avatar.name}
            name={`가장자리 아바타 · ${avatar.name} · ${form.name}`}
            layout="none"
          >
            <div
              data-edge-avatar={avatar.name}
              style={{
                position: "absolute",
                opacity: 0.55,
                left: ((avatar.side + 1) * width) / 2 - avatarSize / 2,
                top:
                  profileEdgeCenterAt(
                    height / 2 + (avatar.row - 1.5) * PROFILE_ROW_PITCH,
                    frame,
                    height,
                    avatarSize,
                  ) -
                  avatarSize / 2,
              }}
            >
              <AnimatedBloom
                id={form.id}
                index={0}
                label={`블룸 아바타 · ${form.name}`}
                size={avatarSize}
                motionTime={0}
                interiorVisible={false}
                backgroundColor={bloomSvgLayers[form.id].backgroundColor}
              />
            </div>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
