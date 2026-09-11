import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  BrandCorner,
  Food,
  LogoConstruction,
} from "../components/MotionElements";
export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: "#FFFFFF",
        fontFamily: "Pretendard",
        color: "#0F0F0F",
        overflow: "hidden",
      }}
    >
      <BrandCorner />
      <Interactive.Div
        name="사진을 감싸는 로고의 원"
        style={{
          position: "absolute",
          left: 983,
          top: 40,
          width: 950,
          height: 950,
          rotate: interpolate(frame, [0, 102], ["-24deg", "0deg"]),
          opacity: interpolate(frame, [0, 22], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <LogoConstruction
          progress={interpolate(frame, [0, 62], [0, 1], {
            extrapolateRight: "clamp",
          })}
        />
      </Interactive.Div>
      <Interactive.Div
        name="기억에 남는 한 접시"
        style={{
          position: "absolute",
          left: 1110,
          top: 215,
          width: 640,
          height: 640,
          borderRadius: "50%",
          overflow: "hidden",
          scale: interpolate(frame, [0, 75], [0.83, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [0, 14], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Food />
      </Interactive.Div>
      <Interactive.Div
        name="첫 질문"
        style={{
          position: "absolute",
          left: 112,
          top: 325,
          fontSize: 144,
          fontWeight: 500,
          letterSpacing: -8,
          lineHeight: 1.13,
          translate: interpolate(frame, [3, 29], ["0px 65px", "0px 0px"], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          opacity: interpolate(frame, [3, 22], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        왜 이 맛이
        <br />
        좋았을까?
      </Interactive.Div>
      <Interactive.Div
        name="식사에서 시작하는 질문"
        style={{
          position: "absolute",
          left: 120,
          top: 733,
          fontSize: 36,
          letterSpacing: -1,
          color: "#666666",
          opacity: interpolate(frame, [34, 51], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        좋아했던 한 끼에서 시작하는 취향 이야기.
      </Interactive.Div>
    </AbsoluteFill>
  );
};
