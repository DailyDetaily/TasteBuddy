import { createElement, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { fruitMotion } from "./fruit-motion";
import { fruitOutline, prepareFruitOutline } from "./fruit-shape";

export const Fruit = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outline = useMemo(
    () => prepareFruitOutline(icon.nodes[0][1].d),
    [icon.nodes],
  );
  const pose = fruitMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );
  const activeBites = pose.bites.filter((bite) => bite.radius > 0.001);
  const path = fruitOutline(outline, activeBites);

  return (
    <g
      data-fruit-part="apple"
      data-fruit-bites={activeBites.map((bite) => bite.id).join(" ")}
      opacity={pose.opacity}
      transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle} 12 13)`}
    >
      <path
        {...icon.nodes[0][1]}
        d={path}
        data-icon-part={`${icon.id}-0`}
        data-fruit-part="outline"
      />
      {createElement(icon.nodes[1][0], {
        ...icon.nodes[1][1],
        "data-icon-part": `${icon.id}-1`,
        "data-fruit-part": "stem",
      })}
    </g>
  );
};
