import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { PETAL_PATH } from "./source";
import { PETAL_ANGLES, PETAL_PERSPECTIVE, PETAL_PIVOT } from "./motion";
import { projectedPetalRadii, sidewallColor } from "./solidGeometry";
import {
  feedbackLoopRings,
  feedbackPoint,
  feedbackPose,
} from "./feedbackGeometry";

export const PetalFeedback: React.FC<{
  from?: number;
  seconds: number;
  loopSeconds?: number;
  symbolScale: number;
  innerRatio: number;
  symbolColor: string;
  thickness: number;
  copyRotation: number;
}> = ({
  from = 0,
  seconds,
  loopSeconds,
  symbolScale,
  innerRatio,
  symbolColor,
  thickness,
  copyRotation,
}) => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame() + from;
  const outer = React.useMemo(
    () =>
      projectedPetalRadii(
        PETAL_PATH,
        symbolScale,
        PETAL_PIVOT,
        PETAL_PERSPECTIVE,
      ).outer,
    [symbolScale],
  );
  const inner = outer * innerRatio,
    section = (outer - inner) / 3;
  const pose = feedbackPose(seconds);
  const rings =
    loopSeconds === undefined
      ? undefined
      : feedbackLoopRings(loopSeconds, inner, outer);
  const paths = Array.from({ length: 3 }, (_, layer) =>
    Array.from({ length: 25 }, (_, sample) => {
      const p = feedbackPoint(
        { x: 0, y: -(inner + section * (layer + sample / 24)) },
        seconds,
        layer,
        inner,
        outer,
        rings?.[layer].offset ?? 0,
      );
      return `${sample === 0 ? "M" : "L"}${p.x},${p.y}`;
    }).join(" "),
  );
  return (
    <svg
      role="img"
      aria-label="Taste Buddy 피드백"
      data-renderer="feedback-2d"
      data-logo-frame={frame}
      data-feedback-time={seconds}
      data-feedback-loop-time={loopSeconds}
      width={width}
      height={(width * 1920) / 1080}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", inset: 0 }}
    >
      <g
        transform="translate(540 960)"
        fill="none"
        stroke={sidewallColor(symbolColor)}
        strokeWidth={thickness}
        strokeLinecap="butt"
        strokeLinejoin="round"
      >
        {pose.bend === 1 && copyRotation === 30
          ? Array.from({ length: 3 }, (_, layer) => (
              <circle
                key={layer}
                data-feedback-layer={layer}
                r={
                  rings?.[layer].radius ??
                  inner + section * (layer + 0.5) + (section / 2) * pose.spread
                }
                opacity={rings?.[layer].opacity ?? 1}
              />
            ))
          : [...PETAL_ANGLES, ...PETAL_ANGLES.map((a) => a + copyRotation)].map(
              (angle, ray) => (
                <g key={ray} transform={`rotate(${angle + 30})`}>
                  {paths.map((path, layer) => (
                    <path
                      key={layer}
                      data-feedback-layer={layer}
                      d={path}
                      opacity={rings?.[layer].opacity ?? 1}
                    />
                  ))}
                </g>
              ),
            )}
      </g>
    </svg>
  );
};
