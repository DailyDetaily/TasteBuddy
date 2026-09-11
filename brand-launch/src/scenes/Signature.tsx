import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BrandSymbol, LogoConstruction } from "../components/MotionElements";
export const Signature: React.FC = () => {
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
      <Interactive.Div
        name="로고 가이드가 모이는 장면"
        style={{
          position: "absolute",
          left: 280,
          top: 115,
          width: 700,
          height: 700,
          opacity: interpolate(frame, [0, 10, 36, 62], [0.8, 0.8, 0.6, 0], {
            extrapolateRight: "clamp",
          }),
          rotate: interpolate(frame, [0, 58], ["-25deg", "0deg"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <LogoConstruction />
      </Interactive.Div>
      <Interactive.Div
        name="원본 Taste Buddy 심볼"
        style={{
          position: "absolute",
          left: 486,
          top: 307,
          width: 260,
          height: 293,
          opacity: interpolate(frame, [0, 44], [0.12, 1], {
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 46], [0.65, 1], {
            extrapolateRight: "clamp",
            output: "perceptual-scale",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <BrandSymbol />
      </Interactive.Div>
      <CanvasImage
        name="원본 Taste Buddy 워드마크"
        src={staticFile("brand/wordmark.svg")}
        style={{
          position: "absolute",
          left: 865,
          top: 302,
          width: 575,
          height: 312,
          objectFit: "contain",
          opacity: interpolate(frame, [10, 44], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <Interactive.Div
        name="브랜드 약속"
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 755,
          textAlign: "center",
          fontSize: 68,
          fontWeight: 400,
          letterSpacing: -3,
          opacity: interpolate(frame, [34, 55], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [34, 58], ["0px 25px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        나의 맛을 이해하다.
      </Interactive.Div>
    </AbsoluteFill>
  );
};
