import { getLength, getPointAtLength, reversePath } from "@remotion/paths";
import { createElement, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { SMOKE_LANES, smokedLane, smokedSeconds } from "./smoked-motion";

export const Smoked = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = smokedSeconds(
    frame,
    fps,
    motion["모션 속도"],
    motion.재생 === "정지",
  );
  const lanes = useMemo(
    () =>
      SMOKE_LANES.map((lane) => {
        // Reversing the original curve changes only traversal direction.
        const path = reversePath(icon.nodes[lane.sourceIndex][1].d);
        const length = getLength(path);
        if (length <= 0) throw new Error(`Empty smoke path: ${lane.name}`);
        return { ...lane, path, length };
      }),
    [icon.nodes],
  );

  return (
    <>
      {lanes.map((lane) => {
        const { lines, dots } = smokedLane(
          seconds,
          lane.start,
          lane.length,
          motion["모션 강도"],
        );
        return (
          <g key={lane.name} data-smoke-lane={lane.name}>
            {lines
              .filter((line) => line.visible)
              .map((line) => (
                <path
                  key={line.index}
                  data-icon-part={`${icon.id}-${lane.sourceIndex}`}
                  data-smoke-part="line"
                  data-smoke-segment={line.index}
                  d={lane.path}
                  pathLength={1}
                  strokeDasharray={`${line.length / lane.length} 2`}
                  strokeDashoffset={-line.start / lane.length}
                  strokeWidth={line.width}
                  opacity={line.opacity}
                />
              ))}
            {dots
              .filter((dot) => dot.visible)
              .map((dot) => {
                const point = getPointAtLength(lane.path, dot.distance);
                if (!point)
                  throw new Error(`Invalid smoke point: ${lane.name}`);
                return (
                  <circle
                    key={dot.name}
                    data-smoke-part="separator"
                    data-smoke-gap={dot.name}
                    cx={point.x}
                    cy={point.y}
                    r={dot.radius}
                    opacity={dot.opacity}
                    fill="currentColor"
                    stroke="none"
                  />
                );
              })}
          </g>
        );
      })}
      <g data-smoke-part="base">
        {icon.nodes.slice(3).map(([tag, attributes], index) =>
          createElement(tag, {
            ...attributes,
            key: `${icon.id}-${index + 3}`,
            "data-icon-part": `${icon.id}-${index + 3}`,
          }),
        )}
      </g>
    </>
  );
};
