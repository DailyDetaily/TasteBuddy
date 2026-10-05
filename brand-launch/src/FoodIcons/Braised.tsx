import { createElement } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { BRAISED_CLOSED_LID_ANGLE, braisedMotion } from "./braised-motion";

export const Braised = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { lift, tilt } = braisedMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );
  const part = (index: number) => {
    const [tag, attributes] = icon.nodes[index];
    return createElement(tag, {
      ...attributes,
      key: `${icon.id}-${index}`,
      "data-icon-part": `${icon.id}-${index}`,
    });
  };

  return (
    <>
      <g data-braised-part="pot">
        {part(0)}
        {part(1)}
      </g>
      <g
        data-braised-part="lid"
        data-lid-lift={lift}
        transform={`translate(0 ${6 - lift}) rotate(${BRAISED_CLOSED_LID_ANGLE + tilt} 12 6)`}
      >
        {part(2)}
        {part(3)}
      </g>
    </>
  );
};
