import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { smoothStep, type Viewport } from "./motion";

const Icon = ({
  kind,
  x,
  y,
  background = true,
}: {
  kind: "close" | "flash" | "image" | "switch";
  x: number;
  y: number;
  background?: boolean;
}) => (
  <g transform={`translate(${x},${y})`}>
    {background && <circle r={24} fill="white" fillOpacity={0.18} />}
    <g
      transform="translate(-12,-12)"
      stroke="white"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {kind === "close" && <path d="M6 6L18 18M6 18L18 6" />}
      {kind === "flash" && <path d="M13 2L3 14H11L10 22L21 9H13L13 2Z" />}
      {kind === "image" && (
        <>
          <rect x={3} y={3} width={18} height={18} rx={2} />
          <circle cx={8.5} cy={8.5} r={1.5} />
          <path d="M21 15L16 10L5 21" />
        </>
      )}
      {kind === "switch" && (
        <>
          <path d="M11 19H4A2 2 0 0 1 2 17V7A2 2 0 0 1 4 5H8L10 2H14L16 5H20A2 2 0 0 1 22 7V13M22 17L19 14L16 17M19 14V19A3 3 0 0 1 16 22" />
          <circle cx={12} cy={12} r={3} />
        </>
      )}
    </g>
  </g>
);

// Camera chrome follows DiningView.cameraCaptureView. The food preview uses a
// generated reference-inspired image with deterministic focus and handheld motion.
export const Camera = ({
  size,
  controlsOpacity,
  focusElapsed,
  capturing = false,
}: {
  size: Viewport;
  controlsOpacity: number;
  focusElapsed: number;
  capturing?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  // Let the blurred feed appear before autofocus starts resolving the food.
  const focus = smoothStep((focusElapsed - 0.42) / 0.62);
  const settling = 1 - focus;
  const blur = 8 * settling;
  const x = 2.2 * settling + Math.sin(seconds * 1.8) * 0.65;
  const y = -1.6 * settling + Math.sin(seconds * 1.35 + 0.7) * 0.5;
  const rotation = -0.55 * settling + Math.sin(seconds * 1.5) * 0.16;
  const showFeed = focusElapsed >= 0.08;
  const shutterY = size.height - 34 - 60 / 2;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#D8CCB9" }}>
      <Img
        src={staticFile("images/camera-entry/generated-pasta-reference.png")}
        alt="참고 사진을 바탕으로 생성한 버터와 허브 파스타 촬영 미리보기"
        data-camera-food
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 1,
          filter: `blur(${blur * 3}px)`,
          transform: `translate(${x}%, ${y}%) rotate(${rotation}deg) scale(${1.07 + 0.04 * settling})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.48), transparent 22%, transparent 72%, rgba(0,0,0,0.56))",
        }}
      />
      {!showFeed && (
        <AbsoluteFill
          data-camera-feed-cover
          style={{ backgroundColor: "#090909" }}
        />
      )}
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
        aria-label="카메라 화면 모션 미리보기"
      >
        <g data-camera-controls opacity={controlsOpacity}>
          <Icon kind="close" x={40} y={59 + 24} background={false} />
          <Icon kind="flash" x={size.width - 40} y={59 + 24} />
          <Icon kind="image" x={28 + 24} y={shutterY} />
          <circle
            cx={size.width / 2}
            cy={shutterY}
            r={36}
            fill="none"
            stroke="white"
            strokeWidth={2}
          />
          <circle
            cx={size.width / 2}
            cy={shutterY}
            r={capturing ? 25 : 29}
            fill="white"
          />
          <Icon kind="switch" x={size.width - 28 - 24} y={shutterY} />
        </g>
        <rect
          x={(size.width - 134) / 2}
          y={size.height - 13}
          width={134}
          height={5}
          rx={2.5}
          fill="white"
        />
      </svg>
    </AbsoluteFill>
  );
};
