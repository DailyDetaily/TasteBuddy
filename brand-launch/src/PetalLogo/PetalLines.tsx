import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { analysisCircle } from "../taste-motion";
import { analysisRayTransform } from "./analysisGeometry";
import { adjustmentLayers } from "./adjustmentGeometry";
import { PETAL_ANGLES, PETAL_PERSPECTIVE, PETAL_PIVOT } from "./motion";
import { PETAL_PATH } from "./source";
import { projectedPetalRadii, sidewallColor } from "./solidGeometry";

const anchors = { top: analysisCircle(0), arrival: analysisCircle(1.5) };
export const PetalLines: React.FC<{
  from?: number;
  rotationZ?: number;
  shortening?: number;
  thickness?: number;
  analysisTime?: number;
  adjustmentTime?: number;
  sets?: "original" | "copy" | "both";
  symbolScale: number;
  symbolColor: string;
  innerRatio: number;
}> = ({
  from = 0,
  rotationZ = 0,
  shortening = 0,
  thickness = 10,
  analysisTime = 0,
  adjustmentTime = 0,
  sets,
  symbolScale,
  symbolColor,
  innerRatio,
}) => {
  const frame = useCurrentFrame() + from;
  const { width } = useVideoConfig();
  // Only the initial radius comes from the original silhouette. Animated lines
  // contain no projected faces, perspective transforms, or clipping meshes.
  const radii = React.useMemo(
    () =>
      projectedPetalRadii(
        PETAL_PATH,
        symbolScale,
        PETAL_PIVOT,
        PETAL_PERSPECTIVE,
      ),
    [symbolScale],
  );
  const inner =
    radii.inner +
    (radii.outer * innerRatio - radii.inner) *
      Math.max(0, Math.min(1, shortening));
  const adjusted = adjustmentLayers(adjustmentTime, inner, radii.outer);
  const sections =
    adjustmentTime > 0 && adjustmentTime < 3
      ? adjusted
      : [{ layer: -1, inner, outer: radii.outer, angle: adjusted[0].angle }];
  const rotations =
    sets === "copy"
      ? [rotationZ]
      : sets === "both" && rotationZ !== 0
        ? [0, rotationZ]
        : [0];
  const circle = analysisCircle(analysisTime);
  return (
    <svg
      role="img"
      aria-label="Taste Buddy 2D 라인"
      data-renderer="lines-2d"
      data-logo-frame={frame}
      width={width}
      height={(width * 1920) / 1080}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", inset: 0 }}
    >
      <g
        stroke={sidewallColor(symbolColor)}
        strokeWidth={thickness}
        strokeLinecap="butt"
        fill="none"
      >
        {rotations.flatMap((setRotation, set) =>
          PETAL_ANGLES.flatMap((angle, ray) => {
            const { matrix } = analysisRayTransform(
              analysisTime,
              circle,
              angle + setRotation,
              radii.outer,
              inner,
              anchors,
            );
            return sections.map((section) => {
              const rotation =
                ((angle + setRotation + section.angle) * Math.PI) / 180;
              const endpoint = (radius: number) => {
                const x = matrix[2] * -radius + matrix[4],
                  y = matrix[3] * -radius + matrix[5];
                return {
                  x: 540 + x * Math.cos(rotation) - y * Math.sin(rotation),
                  y: 960 + x * Math.sin(rotation) + y * Math.cos(rotation),
                };
              };
              const a = endpoint(section.inner),
                b = endpoint(section.outer);
              return (
                <line
                  key={`${set}-${ray}-${section.layer}`}
                  data-line-segment
                  data-adjustment-layer={section.layer}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              );
            });
          }),
        )}
      </g>
    </svg>
  );
};
