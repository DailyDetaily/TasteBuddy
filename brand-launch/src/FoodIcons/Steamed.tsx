import { getBoundingBox } from "@remotion/paths";
import { createElement, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { smokedSeconds } from "./smoked-motion";
import { SteamField, useSteamField } from "./SteamField";
import { steamedHandleMotion } from "./steamed-handle-motion";

// The current product SVG keeps the top handle in its own path.
const HANDLE_INDEX = 11;
// Three steam cycles fit the original five-second loop exactly.
const STEAM_SPEED = 1.5;

export const Steamed = ({
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
  const steamSeconds = seconds * STEAM_SPEED;
  const steam = useSteamField(icon, steamSeconds, motion["모션 강도"], 2, true);
  const handle = steamedHandleMotion(seconds, motion["모션 강도"]);
  const handleCenter = useMemo(() => {
    const bounds = getBoundingBox(icon.nodes[HANDLE_INDEX][1].d);
    return { x: (bounds.x1 + bounds.x2) / 2, y: (bounds.y1 + bounds.y2) / 2 };
  }, [icon.nodes]);
  const waveIndices = new Set(steam.lanes.map((lane) => lane.sourceIndex));

  return (
    <>
      <SteamField
        state={steam}
        seconds={steamSeconds}
        iconId={icon.id}
        kind="steamed"
      />
      <g data-steamed-part="base">
        {icon.nodes.map(([tag, attributes], index) =>
          waveIndices.has(index) || index === HANDLE_INDEX
            ? null
            : createElement(tag, {
                ...attributes,
                key: `${icon.id}-${index}`,
                "data-icon-part": `${icon.id}-${index}`,
              }),
        )}
      </g>
      <g
        data-steamed-part="handle"
        transform={`rotate(${handle.angle} ${handleCenter.x} ${handleCenter.y})`}
      >
        {icon.nodes.map(([tag, attributes], index) =>
          index === HANDLE_INDEX
            ? createElement(tag, {
                ...attributes,
                key: `${icon.id}-${index}`,
                "data-icon-part": `${icon.id}-${index}`,
              })
            : null,
        )}
      </g>
    </>
  );
};
