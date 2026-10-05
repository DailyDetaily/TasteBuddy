import { createElement } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { seaweedPath, seaweedPhase } from "./seaweed-motion";

export const Seaweed = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase = seaweedPhase(
    frame,
    fps,
    motion["모션 속도"],
    motion.재생 === "정지",
  );

  const part = (index: number) => {
    const [tag, attributes] = icon.nodes[index];
    const d =
      index < 2
        ? seaweedPath(attributes.d, phase, index, motion["모션 강도"])
        : attributes.d;
    return createElement(tag, {
      ...attributes,
      d,
      key: `${icon.id}-${index}`,
      "data-icon-part": `${icon.id}-${index}`,
    });
  };

  return (
    <>
      <g data-seaweed-part="tall">{part(0)}</g>
      <g data-seaweed-part="short">{part(1)}</g>
      <g data-seaweed-part="stems">
        {part(2)}
        {part(3)}
      </g>
    </>
  );
};
