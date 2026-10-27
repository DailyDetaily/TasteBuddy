import { getBoundingBox, getLength, getPointAtLength } from "@remotion/paths";
import { createElement, useId, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { WINE_LINE_WIDTH, wineMotion, wineSurface } from "./wine-motion";

type WineProps = { icon: FoodIconEntry; motion: FoodIconMotionProps };

export const Wine = (props: WineProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <WineFrame {...props} frame={frame} fps={fps} />;
};

/** Reuse the original animation with an explicit local clock when embedded. */
export const WineFrame = ({
  icon,
  motion,
  frame,
  fps,
}: WineProps & { frame: number; fps: number }) => {
  const clipId = `wine-bowl-${useId().replace(/:/g, "")}`;
  const pose = wineMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );
  const bowl = useMemo(() => {
    const bounds = getBoundingBox(icon.nodes[3][1].d);
    const sourceSurface = icon.nodes[1][1].d;
    const left = getPointAtLength(sourceSurface, 0);
    const right = getPointAtLength(sourceSurface, getLength(sourceSurface));
    if (!left || !right) throw new Error("Invalid wine surface path");
    return {
      left: Math.min(left.x, right.x),
      right: Math.max(left.x, right.x),
      fullY: left.y,
      bottomY: bounds.y2,
    };
  }, [icon.nodes]);
  const liquid = wineSurface(pose, bowl);
  const centerX = (bowl.left + bowl.right) / 2;

  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={icon.nodes[3][1].d} />
        </clipPath>
      </defs>
      {liquid.stream && (
        <path
          data-wine-part="pour"
          d={liquid.stream}
          strokeWidth={WINE_LINE_WIDTH}
          pathLength={1}
          strokeDasharray={`${liquid.streamLength} 1`}
          strokeDashoffset={-liquid.streamStart}
        />
      )}
      <g
        data-wine-part="glass"
        data-wine-fill={pose.fill}
        data-wine-angle={pose.angle}
        transform={`translate(${pose.x} ${pose.y}) rotate(${pose.angle} ${centerX} ${bowl.bottomY})`}
      >
        {pose.fill > 0.0001 && (
          <g data-wine-part="liquid" clipPath={`url(#${clipId})`}>
            <path
              data-wine-part="surface"
              data-icon-part={`${icon.id}-1`}
              d={liquid.surface}
              strokeWidth={WINE_LINE_WIDTH}
            />
          </g>
        )}
        {pose.dropletOpacity > 0.001 && (
          <circle
            data-wine-part="droplet"
            cx={centerX}
            cy={liquid.centerSurfaceY - pose.dropletHeight}
            r={pose.dropletRadius}
            opacity={pose.dropletOpacity}
            fill="currentColor"
            stroke="none"
          />
        )}
        {icon.nodes.map(([tag, attributes], index) =>
          index === 1
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
