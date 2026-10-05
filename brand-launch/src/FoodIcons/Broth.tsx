import { getBoundingBox, getLength, getPointAtLength } from "@remotion/paths";
import { createElement, useId, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { SteamField, useSteamField } from "./SteamField";
import {
  BROTH_SPOON_HEAD_ANGLE,
  BROTH_SPOON_HEAD_DEPTH,
  BROTH_SPOON_HEAD_WIDTH,
  BROTH_SPOON_BOWL_GAP,
  BROTH_STEAM_SPEED,
  brothSeconds,
  brothSpoonPose,
  brothSteamOpacity,
  brothSteamSeconds,
} from "./broth-spoon-motion";

export const Broth = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spoonMaskId = `broth-spoon-${useId().replace(/:/g, "")}`;
  const seconds = brothSeconds(
    frame,
    fps,
    motion["모션 속도"],
    motion.재생 === "정지",
  );
  const spoonSource = useMemo(() => {
    const path = icon.nodes[2][1].d;
    const sourceFront = getPointAtLength(path, 0);
    const rear = getPointAtLength(path, getLength(path));
    if (!sourceFront || !rear) throw new Error("Invalid broth spoon path");
    const headRadians = (BROTH_SPOON_HEAD_ANGLE * Math.PI) / 180;
    // Center the level head above the bowl, then retain the existing 2px
    // painted gap by calculating the lift from the new handle length.
    const bowlBounds = getBoundingBox(icon.nodes[0][1].d);
    const bowlCenter = (bowlBounds.x1 + bowlBounds.x2) / 2;
    const handleLength =
      (rear.x - bowlCenter - BROTH_SPOON_HEAD_WIDTH / 2) /
      Math.cos(headRadians);
    const lift =
      rear.y +
      handleLength * Math.sin(headRadians) +
      BROTH_SPOON_HEAD_DEPTH +
      BROTH_SPOON_BOWL_GAP +
      2 -
      bowlBounds.y1;
    const sourceLength = Math.hypot(
      sourceFront.x - rear.x,
      sourceFront.y - rear.y,
    );
    const front = {
      x: rear.x + ((sourceFront.x - rear.x) / sourceLength) * handleLength,
      y: rear.y + ((sourceFront.y - rear.y) / sourceLength) * handleLength,
    };
    return {
      front,
      rear,
      lift,
      verticalRear: {
        x: bowlCenter,
        y: bowlBounds.y1 + 1.6 - handleLength,
      },
      handlePath: `M${rear.x - handleLength} ${rear.y}L${rear.x} ${rear.y}`,
    };
  }, [icon.nodes]);
  const sourceSteam = useSteamField(
    icon,
    brothSteamSeconds(seconds),
    motion["모션 강도"],
    3,
  );
  const steamDoneAt = sourceSteam.doneAt / BROTH_STEAM_SPEED;
  const steam = {
    ...sourceSteam,
    doneAt: steamDoneAt,
    opacity: brothSteamOpacity(seconds, steamDoneAt),
  };
  const spoon = brothSpoonPose(
    seconds,
    spoonSource.front,
    spoonSource.rear,
    steam.doneAt,
    spoonSource.lift,
    spoonSource.verticalRear,
    motion["모션 강도"],
  );

  return (
    <>
      <defs>
        <mask
          id={spoonMaskId}
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
          <path
            d={icon.nodes[0][1].d}
            fill="black"
            stroke="black"
            strokeWidth={2}
          />
        </mask>
      </defs>
      <SteamField
        state={steam}
        seconds={seconds}
        iconId={icon.id}
        kind="broth"
      />
      <g mask={`url(#${spoonMaskId})`}>
        <g
          data-broth-part="spoon"
          data-broth-stir-progress={spoon.stirProgress}
          data-broth-motion-phase={spoon.phase}
          transform={`translate(${spoon.x} ${spoon.y}) rotate(${spoon.angle} ${spoonSource.rear.x} ${spoonSource.rear.y}) rotate(${spoon.sipAngle} ${spoon.sipPivot.x} ${spoon.sipPivot.y})`}
        >
          <g data-broth-part="spoon-handle">
            {createElement(icon.nodes[2][0], {
              ...icon.nodes[2][1],
              d: spoonSource.handlePath,
              "data-icon-part": `${icon.id}-2`,
            })}
          </g>
          <path
            data-broth-part="spoon-bowl"
            d={spoon.bowlPath}
            opacity={spoon.headOpacity}
          />
        </g>
      </g>
      <g data-broth-part="base">
        {icon.nodes.slice(0, 2).map(([tag, attributes], index) =>
          createElement(tag, {
            ...attributes,
            key: `${icon.id}-${index}`,
            "data-icon-part": `${icon.id}-${index}`,
          }),
        )}
      </g>
    </>
  );
};
