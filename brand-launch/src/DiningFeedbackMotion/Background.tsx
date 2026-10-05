import { AbsoluteFill } from "remotion";
import { rgba, type ResultPalette } from "./settings";

// DiningFeedbackResultBackground, DiningView.swift. All sizes are native points.
export const FeedbackBackground: React.FC<{
  colors: ResultPalette;
  elapsed: number;
  width: number;
  height: number;
  mainCoverage?: number;
}> = ({ colors, elapsed: t, width, height, mainCoverage = 0.56 }) => {
  const largest = Math.max(width, height);
  const mainScale = Math.sqrt(mainCoverage / 0.56);
  const supportScale = Math.sqrt((1 - mainCoverage) / 0.44);
  const blobs = [
    {
      color: colors.main,
      opacity: 0.92,
      w: 1.56,
      h: 1.28,
      x: 0.38,
      y: 0.42,
      dx: Math.sin(t / 3.8) * width * 0.1,
      dy: Math.cos(t / 3.8) * height * 0.08,
      scale: 1.1 + Math.sin(t / 2.2) * 0.08,
      blur: 34,
    },
    {
      color: colors.secondary,
      opacity: 0.86,
      w: 0.82,
      h: 0.66,
      x: 0.74,
      y: 0.25,
      dx: Math.cos(t / 3.2) * width * 0.16,
      dy: Math.sin(t / 3.2) * height * 0.12,
      scale: 1.08 + Math.cos(t / 2.4) * 0.1,
      blur: 28,
    },
    {
      color: colors.tertiary,
      opacity: 0.82,
      w: 0.88,
      h: 0.72,
      x: 0.4,
      y: 0.78,
      dx: Math.sin(t / 3.5) * width * 0.14,
      dy: Math.cos(t / 3.5) * height * 0.15,
      scale: 1.1 + Math.sin(t / 2.6) * 0.11,
      blur: 30,
    },
  ];
  return (
    <AbsoluteFill
      data-feedback-background
      data-elapsed={t}
      style={{ background: colors.background, overflow: "hidden" }}
    >
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          transform: "scale(1.16)",
          opacity: 0.68,
        }}
      >
        <defs>
          <linearGradient id="feedback-diagonal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={colors.secondary} stopOpacity={0.1} />
            <stop offset="0.5" stopColor={colors.main} stopOpacity={0.42} />
            <stop offset="1" stopColor={colors.tertiary} stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#feedback-diagonal)" />
      </svg>
      {blobs.map((blob, index) => {
        const areaScale = index === 0 ? mainScale : supportScale;
        const w = largest * blob.w * areaScale;
        const h = largest * blob.h * areaScale;
        const radius = Math.max(w, h) * 0.48;
        return (
          <div
            key={index}
            data-feedback-blob={index}
            style={{
              position: "absolute",
              width: w,
              height: h,
              left: blob.x * width - w / 2,
              top: blob.y * height - h / 2,
              transform: `translate(${blob.dx}px, ${blob.dy}px) scale(${blob.scale})`,
              willChange: "transform",
              filter: `blur(${blob.blur}px)`,
              background: `radial-gradient(circle ${radius}px at center, rgba(255,255,255,0.24) 0%, ${rgba(blob.color, blob.opacity * 0.7)} 33.333%, ${rgba(blob.color, blob.opacity * 0.34)} 66.667%, transparent 100%)`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "rgba(255,255,255,0.08)" }} />
    </AbsoluteFill>
  );
};
