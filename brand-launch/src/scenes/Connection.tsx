import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Phone } from "../components/MotionElements";
export const Connection: React.FC = () => {
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
        name="연결된 취향 이야기"
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 86,
          textAlign: "center",
          fontSize: 72,
          fontWeight: 500,
          letterSpacing: -4,
          opacity: interpolate(frame, [12, 32], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        한 끼의 기록이, 나를 이해하는 이야기로.
      </Interactive.Div>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        <path
          d="M 410 700 C 700 1020, 1270 240, 1530 650"
          stroke="#D5D5D5"
          strokeWidth="2"
          fill="none"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={interpolate(frame, [22, 100], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      </svg>
      <Interactive.Div
        name="식사 기록의 장면"
        style={{
          position: "absolute",
          left: 325,
          top: 275,
          width: 320,
          height: 696,
          rotate: "-7deg",
          translate: interpolate(frame, [0, 40], ["-220px 80px", "0px 0px"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Phone screen="dining" />
      </Interactive.Div>
      <Interactive.Div
        name="맛 피드백의 장면"
        style={{
          position: "absolute",
          left: 795,
          top: 235,
          width: 330,
          height: 718,
          translate: interpolate(frame, [0, 50], ["0px 170px", "0px 0px"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Phone screen="feedback" />
      </Interactive.Div>
      <Interactive.Div
        name="취향 해석의 장면"
        style={{
          position: "absolute",
          left: 1280,
          top: 275,
          width: 320,
          height: 696,
          rotate: "7deg",
          translate: interpolate(frame, [0, 40], ["220px 80px", "0px 0px"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Phone screen="analysis" />
      </Interactive.Div>
    </AbsoluteFill>
  );
};
