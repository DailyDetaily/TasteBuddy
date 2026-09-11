import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { BrandCorner, Food, Phone } from "../components/MotionElements";
export const Record: React.FC = () => {
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
        name="기록 메시지"
        style={{
          position: "absolute",
          left: 112,
          top: 275,
          fontSize: 142,
          fontWeight: 500,
          letterSpacing: -8,
          lineHeight: 1.13,
          opacity: interpolate(frame, [8, 28], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [8, 34], ["0px 40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        한 끼를
        <br />
        기록하고.
      </Interactive.Div>
      <Interactive.Div
        name="사진에서 앱으로"
        style={{
          position: "absolute",
          left: 1000,
          top: 230,
          width: 580,
          height: 580,
          borderRadius: interpolate(frame, [0, 42], [290, 34], {
            extrapolateRight: "clamp",
          }),
          overflow: "hidden",
          rotate: interpolate(frame, [0, 90], ["0deg", "-5deg"], {
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0, 70], ["110px 0px", "-110px 20px"], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 70], [1, 0.82], {
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      >
        <Food />
      </Interactive.Div>
      <Interactive.Div
        name="실제 식사 기록 화면"
        style={{
          position: "absolute",
          left: 1300,
          top: 90,
          width: 410,
          height: 890,
          translate: interpolate(frame, [14, 64], ["430px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          opacity: interpolate(frame, [14, 34], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Phone screen="dining" />
      </Interactive.Div>
      <Interactive.Div
        name="기록의 의미"
        style={{
          position: "absolute",
          left: 120,
          top: 710,
          fontSize: 36,
          lineHeight: 1.6,
          letterSpacing: -1,
          color: "#666666",
          opacity: interpolate(frame, [50, 75], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        사진 한 장에
        <br />
        오늘의 식사를 남겨요.
      </Interactive.Div>
    </AbsoluteFill>
  );
};
