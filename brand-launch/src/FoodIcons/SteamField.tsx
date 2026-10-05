import { getLength, reversePath } from "@remotion/paths";
import { useMemo } from "react";
import type { FoodIconEntry } from "./catalog";
import {
  BROTH_STEAM_RESUME_SECONDS,
  brothSteamOpacity,
} from "./broth-spoon-motion";
import { SMOKE_LANES, smokedLane } from "./smoked-motion";

const STEAM_SCALE = 0.5;
const STEAM_GAP_SCALE = 1.5;

export const useSteamField = (
  icon: FoodIconEntry,
  seconds: number,
  strength: number,
  sourceOffset: number,
  continuous = false,
) => {
  const lanes = useMemo(
    () =>
      SMOKE_LANES.map((lane) => {
        const sourceIndex = lane.sourceIndex + sourceOffset;
        const path = reversePath(icon.nodes[sourceIndex][1].d);
        const length = getLength(path);
        if (length <= 0) throw new Error(`Empty steam path: ${lane.name}`);
        return { ...lane, sourceIndex, path, length };
      }),
    [icon.nodes, sourceOffset],
  );
  const laneStates = lanes.map((lane) => {
    const patternLength = lane.length / STEAM_SCALE;
    return {
      ...lane,
      patternLength,
      ...smokedLane(
        seconds,
        lane.start,
        patternLength,
        strength,
        STEAM_GAP_SCALE,
      ),
    };
  });
  const doneAt = Math.max(
    ...laneStates.map((lane) => lane.followingStrokeEndsAt),
  );
  return {
    lanes: laneStates,
    doneAt,
    continuous,
    opacity: continuous ? 1 : brothSteamOpacity(seconds, doneAt),
  };
};

export const SteamField = ({
  state,
  seconds,
  iconId,
  kind,
}: {
  state: ReturnType<typeof useSteamField>;
  seconds: number;
  iconId: string;
  kind: "broth" | "steamed";
}) => (
  <g {...{ [`data-${kind}-part`]: "steam-field" }} opacity={state.opacity}>
    {state.opacity > 0 &&
      state.lanes.map((lane) => (
        <g key={lane.name} {...{ [`data-${kind}-lane`]: lane.name }}>
          {lane.lines
            .filter(
              (line) =>
                line.visible &&
                (state.continuous ||
                  seconds >= BROTH_STEAM_RESUME_SECONDS ||
                  line.index === lane.precedingStrokeIndex ||
                  line.index === lane.precedingStrokeIndex - 1),
            )
            .map((line) => (
              <path
                key={line.index}
                data-icon-part={`${iconId}-${lane.sourceIndex}`}
                {...{
                  [`data-${kind}-part`]: "steam",
                  [`data-${kind}-wave-cycle`]: state.continuous
                    ? "repeat"
                    : seconds >= BROTH_STEAM_RESUME_SECONDS
                      ? "next"
                      : line.index === lane.precedingStrokeIndex
                        ? 1
                        : 2,
                }}
                d={lane.path}
                pathLength={1}
                strokeDasharray={`${line.length / lane.patternLength} 2`}
                strokeDashoffset={-line.start / lane.patternLength}
                strokeWidth={line.width}
                opacity={line.opacity}
              />
            ))}
        </g>
      ))}
  </g>
);
