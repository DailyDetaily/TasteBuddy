import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { BrandCorner, NativeDetail, Phone } from "../components/MotionElements";
export const Insight: React.FC = () => {
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
        name="취향 이해 메시지"
        style={{
          position: "absolute",
          left: 112,
          top: 248,
          fontSize: 125,
          fontWeight: 500,
          letterSpacing: -7,
          lineHeight: 1.15,
          opacity: interpolate(frame, [8, 35], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [8, 40], ["0px 48px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        나의 취향이
        <br />
        보이기 시작해요.
      </Interactive.Div>
      <Interactive.Div
        name="취향 해석 앱 화면"
        style={{
          position: "absolute",
          left: 1340,
          top: 85,
          width: 410,
          height: 890,
          translate: interpolate(frame, [0, 55], ["180px 0px", "0px 0px"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Phone screen="analysis" />
      </Interactive.Div>
      <Interactive.Div
        name="실제 해석 카드 확대"
        style={{
          position: "absolute",
          left: 110,
          top: 630,
          width: 1010,
          height: 320,
          borderRadius: 32,
          overflow: "hidden",
          border: "1px solid #E7E7E7",
          boxShadow: "0 16px 50px rgba(15,15,15,0.04)",
          opacity: interpolate(frame, [58, 90], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [58, 98], ["0px 70px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <NativeDetail screen="analysis" y={-420} />
      </Interactive.Div>
    </AbsoluteFill>
  );
};
