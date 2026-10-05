import { createElement, useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { CHOPSTICK_PIVOT, noodleAnchor, noodleMotion } from "./noodle-motion";

export const Noodle = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rimClipId = `noodle-rim-${useId().replace(/:/g, "")}`;
  const chopstickMaskId = `${rimClipId}-chopsticks`;
  const { chopsticks, noodles } = noodleMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );
  const transform = `translate(${chopsticks.x} ${chopsticks.y}) rotate(${chopsticks.angle} ${CHOPSTICK_PIVOT.x} ${CHOPSTICK_PIVOT.y})`;

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
      <defs>
        <clipPath id={rimClipId} clipPathUnits="userSpaceOnUse">
          {/* Only the bowl's width occludes submerged parts. The rear ends can
              extend past its right edge without being cut at the rim height. */}
          <path d="M-48 -48H72V72H21V12H3V72H-48Z" fill="black" stroke="none" />
        </clipPath>
        <mask
          id={chopstickMaskId}
          maskUnits="userSpaceOnUse"
          x={-48}
          y={-48}
          width={120}
          height={120}
          style={{ maskType: "luminance" }}
        >
          <rect
            x={-48}
            y={-48}
            width={120}
            height={120}
            fill="white"
            stroke="none"
          />
          {/* Match the bowl's actual 2px outline: the chopsticks meet its outer
              edge with no added gap and never overlap the bowl stroke. */}
          <path
            d={icon.nodes[0][1].d}
            fill="black"
            stroke="black"
            strokeWidth={2}
          />
        </mask>
      </defs>
      <g clipPath={`url(#${rimClipId})`}>
        {noodles.visible &&
          icon.nodes.slice(4).map(([tag, attributes], index) => {
            // Read the original Mx bottom Vtop paths instead of redrawing the icon.
            const [x, bottom, top] = attributes.d
              .match(/-?\d*\.?\d+/g)!
              .map(Number);
            const anchor = noodleAnchor(x, top, chopsticks);
            // During the two wrist beats, both ends move together so the
            // noodles stay vertical without stretching or starting to retract.
            const length =
              Math.max(0, bottom + noodles.bobY - anchor.y) *
              (1 - noodles.retract);
            if (length <= 0) return null;
            return createElement(tag, {
              ...attributes,
              key: `${icon.id}-strand-${index}`,
              "data-icon-part": `${icon.id}-${index + 4}`,
              "data-noodle-strand": index,
              d: `M${anchor.x} ${anchor.y}V${anchor.y + length}`,
            });
          })}
        <g mask={`url(#${chopstickMaskId})`}>
          <g data-noodle-part="chopsticks" transform={transform}>
            {part(2)}
            {part(3)}
          </g>
        </g>
      </g>
      {/* The front rim occludes both dipped tips and the emerging noodles. */}
      <g data-noodle-part="bowl">
        {part(0)}
        {part(1)}
      </g>
    </>
  );
};
