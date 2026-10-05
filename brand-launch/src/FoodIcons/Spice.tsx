import { createElement, useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { PESTLE_PIVOT, spiceMotion } from "./spice-motion";

export const Spice = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clipId = `spice-rim-${useId().replace(/:/g, "")}`;
  const pose = spiceMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );

  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect
            x={-24}
            y={-24}
            width={72}
            height={36}
            fill="black"
            stroke="none"
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g
          data-spice-part="pestle"
          transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle} ${PESTLE_PIVOT.x} ${PESTLE_PIVOT.y})`}
        >
          <path
            {...icon.nodes[2][1]}
            data-icon-part={`${icon.id}-2`}
            // Complete the hidden tip so the original sides remain continuous
            // when the pestle rises or tilts. The front rim hides the extension.
            d={`${icon.nodes[2][1].d} L13.8 15.85 Q11.4 18.2 8.8 15.3 Z`}
          />
        </g>
      </g>
      <g data-spice-part="mortar">
        {icon.nodes.map(([tag, attributes], index) =>
          index === 2
            ? null
            : createElement(tag, {
                ...attributes,
                key: `${icon.id}-${index}`,
                "data-icon-part": `${icon.id}-${index}`,
              }),
        )}
      </g>
    </>
  );
};
