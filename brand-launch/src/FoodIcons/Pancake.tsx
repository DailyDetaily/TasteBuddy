import { createElement } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import {
  pancakeMotion,
  pancakeOutline,
  pancakePath,
  pancakeVerticalOffset,
} from "./pancake-motion";

export const Pancake = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flip = pancakeMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );
  const radius = Number(icon.nodes[0][1].r);
  const center = {
    x: Number(icon.nodes[0][1].cx),
    y: Number(icon.nodes[0][1].cy),
    baseY: Number(icon.nodes[0][1].cy) + radius,
  };
  const verticalOffset = pancakeVerticalOffset(center, radius, flip);

  return (
    <g
      data-pancake-part="body"
      data-pancake-angle={flip.angle}
      data-pancake-face={flip.facing >= 0 ? "front" : "back"}
      data-pancake-landing-time={flip.landingTime ?? undefined}
      transform={`translate(0 ${verticalOffset})`}
    >
      {icon.nodes.map(([tag, attributes], index) => {
        const common = {
          key: `${icon.id}-${index}`,
          "data-icon-part": `${icon.id}-${index}`,
        };
        if (
          tag === "circle" &&
          (flip.angle !== 0 || flip.landingTime !== null)
        ) {
          return createElement("path", {
            ...common,
            d: pancakeOutline(
              {
                x: Number(attributes.cx),
                y: Number(attributes.cy),
                baseY: center.baseY,
              },
              Number(attributes.r),
              flip,
            ),
          });
        }
        if (tag === "path" && flip.detailOpacity === 0) return null;
        return createElement(tag, {
          ...attributes,
          ...common,
          ...(tag === "path"
            ? {
                d: pancakePath(attributes.d, flip, center),
                opacity: flip.detailOpacity,
              }
            : {}),
        });
      })}
    </g>
  );
};
