import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  BrandCorner,
  LogoConstruction,
  Phone,
} from "../components/MotionElements";
export const Feedback: React.FC = () => {
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
        name="맛 피드백 메시지"
        style={{
          position: "absolute",
          left: 112,
          top: 290,
          fontSize: 136,
          fontWeight: 500,
          letterSpacing: -7,
          lineHeight: 1.15,
          translate: interpolate(frame, [8, 35], ["0px 50px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          opacity: interpolate(frame, [8, 28], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        느낀 맛을
        <br />
        남기면.
      </Interactive.Div>
      <Interactive.Div
        name="선택을 감싸는 가이드"
        style={{
          position: "absolute",
          left: 880,
          top: 30,
          width: 950,
          height: 950,
          opacity: 0.5,
          rotate: interpolate(frame, [0, 192], ["-15deg", "15deg"]),
        }}
      >
        <LogoConstruction />
      </Interactive.Div>
      <Interactive.Div
        name="실제 SwiftUI 맛 지도"
        style={{
          position: "absolute",
          left: 1200,
          top: 90,
          width: 410,
          height: 890,
          translate: interpolate(
            frame,
            [0, 50, 102, 144],
            ["100px 0px", "0px 0px", "0px 0px", "-25px 90px"],
            {
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          scale: interpolate(frame, [0, 50, 102, 144], [1, 1.08, 1.08, 1.48], {
            extrapolateRight: "clamp",
            output: "perceptual-scale",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Phone screen="feedback" />
      </Interactive.Div>
      <Interactive.Div
        name="피드백의 의미"
        style={{
          position: "absolute",
          left: 120,
          top: 716,
          fontSize: 36,
          lineHeight: 1.6,
          letterSpacing: -1,
          color: "#666666",
          opacity: interpolate(frame, [40, 64], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        나에게 남은 맛과
        <br />그 맛이 좋았던 이유까지.
      </Interactive.Div>
    </AbsoluteFill>
  );
};
