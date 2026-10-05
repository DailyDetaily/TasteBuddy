import { getLength, getPointAtLength, reversePath } from "@remotion/paths";
import { createElement } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { foodIcons, type FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { SMOKE_LANES } from "./smoked-motion";
import {
  FLAME_BASE,
  grilledFlameFragments,
  grilledFlamePath,
  grilledMotion,
} from "./grilled-motion";

const smokeIcon = foodIcons.find(({ id }) => id === "smoked");
const centerSmokeLane = SMOKE_LANES.find(({ name }) => name === "center");
if (!smokeIcon || !centerSmokeLane)
  throw new Error("Missing center smoke source");
const afterSmokePath = reversePath(
  smokeIcon.nodes[centerSmokeLane.sourceIndex][1].d,
);
const afterSmokeLength = getLength(afterSmokePath);

export const Grilled = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flame = grilledMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );
  const flamePath = grilledFlamePath(
    icon.nodes[0][1].d,
    flame.bend,
    flame.curlBend,
    flame.contourTopOffset,
  );
  const smokeDot = flame.smoke.dot.visible
    ? getPointAtLength(
        afterSmokePath,
        flame.smoke.dot.position * afterSmokeLength,
      )
    : null;
  const part = (index: number, d?: string) => {
    const [tag, attributes] = icon.nodes[index];
    return createElement(tag, {
      ...attributes,
      ...(d ? { d } : {}),
      key: `${icon.id}-${index}`,
      "data-icon-part": `${icon.id}-${index}`,
    });
  };

  return (
    <>
      {flame.visible && (
        <g
          data-grilled-part="flame"
          transform={`translate(${FLAME_BASE.x + flame.driftX} ${FLAME_BASE.y}) scale(${flame.scale}) translate(${-FLAME_BASE.x} ${-FLAME_BASE.y})`}
          strokeWidth={2 / Math.max(flame.scale, 0.2)}
        >
          {flame.breakup === 0
            ? part(0, flamePath)
            : grilledFlameFragments(flame.breakup, flamePath).map((fragment) =>
                fragment.length > 0
                  ? createElement(icon.nodes[0][0], {
                      ...icon.nodes[0][1],
                      key: `flame-fragment-${fragment.id}`,
                      d: flamePath,
                      "data-icon-part": `${icon.id}-0`,
                      "data-grilled-fragment": fragment.id,
                      "data-fragment-kind": fragment.kind,
                      pathLength: 1,
                      strokeDasharray: `${fragment.length} ${1 - fragment.length}`,
                      strokeDashoffset: -fragment.start,
                      strokeWidth: 2 * fragment.strokeScale,
                    })
                  : null,
              )}
        </g>
      )}
      {flame.smoke.visible && (
        <path
          data-grilled-part="after-smoke"
          data-smoke-lane="center"
          d={afterSmokePath}
          pathLength={1}
          strokeDasharray={`${flame.smoke.length} 2`}
          strokeDashoffset={-flame.smoke.start}
          strokeWidth={flame.smoke.width}
          opacity={flame.smoke.opacity}
        />
      )}
      {smokeDot && (
        <circle
          data-grilled-part="after-smoke-dot"
          data-smoke-lane="center"
          data-smoke-part="separator"
          cx={smokeDot.x}
          cy={smokeDot.y}
          r={flame.smoke.dot.radius}
          opacity={flame.smoke.dot.opacity}
          fill="currentColor"
          stroke="none"
        />
      )}
      <g data-grilled-part="logs">
        {part(1)}
        {part(2)}
      </g>
    </>
  );
};
