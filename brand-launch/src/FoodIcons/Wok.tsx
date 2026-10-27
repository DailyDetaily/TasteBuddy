import { createElement, useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { WOK_ARC, wokMotion } from "./wok-motion";

type WokProps = { icon: FoodIconEntry; motion: FoodIconMotionProps };

export const Wok = (props: WokProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <WokFrame {...props} frame={frame} fps={fps} />;
};

/** Reuse the original animation with an explicit local clock when embedded. */
export const WokFrame = ({
  icon,
  motion,
  frame,
  fps,
}: WokProps & { frame: number; fps: number }) => {
  const rimClipId = `wok-rim-${useId().replace(/:/g, "")}`;
  const { pan, orbit } = wokMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );
  const panTransform = `translate(${pan.x} ${pan.y}) rotate(${pan.angle} 20 10)`;

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
          <path
            d="M-48 -48H72V12H-48Z"
            transform={panTransform}
            fill="black"
            stroke="none"
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${rimClipId})`} data-wok-ingredients>
        {orbit.visible ? (
          <g
            data-wok-orbit
            transform={`rotate(${orbit.angle} ${WOK_ARC.cx} ${WOK_ARC.cy})`}
          >
            <g data-wok-part="dot">{part(4)}</g>
            <g data-wok-part="arc">{part(3)}</g>
          </g>
        ) : null}
      </g>
      {/* Paint the front lip last so ingredients emerge from and land behind it. */}
      <g data-wok-part="pan" transform={panTransform}>
        {part(0)}
        {part(1)}
        {part(2)}
      </g>
    </>
  );
};
