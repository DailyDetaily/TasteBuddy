import { getBoundingBox } from "@remotion/paths";
import { createElement, useId, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import {
  PEA_DESIGN_GRID_SIZE,
  PEA_SEQUENCE,
  peaAperture,
  peaEntranceLift,
  peaMotion,
  peaOpening,
  peaSeam,
  peaSeconds,
} from "./pea-motion";

export const Peas = ({
  icon,
  motion,
}: {
  icon: FoodIconEntry;
  motion: FoodIconMotionProps;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maskId = `pea-front-${useId().replace(/:/g, "")}`;
  const exitClipId = `${maskId}-exit`;
  const centers = useMemo(
    () =>
      icon.nodes.slice(1).map(([, attributes]) => {
        const bounds = getBoundingBox(attributes.d);
        return {
          x: (bounds.x1 + bounds.x2) / 2,
          y: (bounds.y1 + bounds.y2) / 2,
          radius: (bounds.x2 - bounds.x1) / 2,
        };
      }),
    [icon.nodes],
  );
  const seconds = peaSeconds(
    frame,
    fps,
    motion["모션 속도"],
    motion.재생 === "정지",
  );
  const strength = motion["모션 강도"];
  const entrances = centers.map((center, index) => {
    const opening = peaOpening(seconds, index);
    const seam = peaSeam(seconds, index);
    return {
      opening,
      seam,
      lift: peaEntranceLift(seconds, index, strength),
      d:
        opening === 1
          ? icon.nodes[index + 1][1].d
          : peaAperture({ ...center, radius: center.radius * seam }, opening),
    };
  });
  const firstPeaAtExit = peaMotion(
    PEA_SEQUENCE.exitAt,
    0,
    centers[0],
    strength,
  );
  const exitOffset = Math.max(
    0,
    PEA_DESIGN_GRID_SIZE + centers[0].radius + 1.5 - firstPeaAtExit.x,
  );
  const peas = centers.map((center, index) =>
    peaMotion(seconds, index, center, strength, exitOffset),
  );

  return (
    <g
      data-pea-part="animation"
      data-pea-opening={entrances.map((e) => e.opening).join(" ")}
    >
      <defs>
        {entrances.map((entrance, index) => (
          <clipPath
            key={index}
            id={`${maskId}-entrance-${index}`}
            clipPathUnits="userSpaceOnUse"
          >
            <path d={entrance.d} transform={`translate(0 ${entrance.lift})`} />
          </clipPath>
        ))}
        <clipPath id={exitClipId} clipPathUnits="userSpaceOnUse">
          <rect
            x={0}
            y={0}
            width={PEA_DESIGN_GRID_SIZE}
            height={PEA_DESIGN_GRID_SIZE}
          />
        </clipPath>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-40}
          y={-40}
          width={120}
          height={120}
        >
          <rect
            x={-40}
            y={-40}
            width={120}
            height={120}
            fill="white"
            stroke="none"
          />
          {peas.map((pea, index) =>
            pea.popped && pea.opacity > 0 ? (
              <circle
                key={index}
                cx={pea.x}
                cy={pea.y}
                r={centers[index].radius}
                fill="black"
                stroke="none"
                opacity={pea.opacity}
              />
            ) : null,
          )}
        </mask>
      </defs>
      <g data-pea-part="shell" mask={`url(#${maskId})`}>
        {createElement(icon.nodes[0][0], {
          ...icon.nodes[0][1],
          "data-icon-part": `${icon.id}-0`,
        })}
        {entrances.map((entrance, index) => (
          <path
            key={index}
            data-pea-part="opening"
            d={entrance.d}
            transform={`translate(0 ${entrance.lift})`}
            opacity={Math.min(1, entrance.seam * 3)}
          />
        ))}
      </g>
      <g data-pea-part="exit-boundary" clipPath={`url(#${exitClipId})`}>
        {peas.map((pea, index) => {
          const center = centers[index];
          const [tag, attributes] = icon.nodes[index + 1];
          return (
            <g
              key={index}
              clipPath={
                pea.popped ? undefined : `url(#${maskId}-entrance-${index})`
              }
            >
              {createElement(tag, {
                ...attributes,
                key: index,
                "data-icon-part": `${icon.id}-${index + 1}`,
                "data-pea-part": "pea",
                "data-pea-popped": pea.popped,
                opacity: pea.opacity,
                transform: `translate(${pea.x - center.x} ${pea.y - center.y}) rotate(${pea.angle} ${center.x} ${center.y})`,
              })}
            </g>
          );
        })}
      </g>
    </g>
  );
};
