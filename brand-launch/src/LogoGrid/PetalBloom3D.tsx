import React from "react";
import { logoGridElements } from "./geometry";
import { petalAngles } from "./motion";
import {
  getShortsOpeningPose,
  GRID_PETAL_PERSPECTIVE,
  GRID_SYMBOL_CENTER,
} from "./shortsOpening";

const leaves = logoGridElements.filter((node) => node.role === "logo.symbol");
const plane = { position: "absolute", width: 1000, height: 500 } as const;
const origin = `${GRID_SYMBOL_CENTER.x}px ${GRID_SYMBOL_CENTER.y}px`;

type Props = {
  openingFrame: number;
  leafIndices?: number[];
  outlineRef?: React.RefObject<SVGGraphicsElement | null>;
  outputScale: number;
  color?: string;
  placement: { x: number; y: number; scale: number };
};

// Same local X-axis articulation as TasteBuddy-Petal-Shorts. The fixed Z angles
// establish each leaf's original orientation; the symbol never spins. Inverse
// SVG rotations keep all six supplied paths and their optical corrections.
export const PetalBloom3D: React.FC<Props> = ({
  openingFrame,
  outputScale,
  color,
  placement,
  leafIndices,
  outlineRef,
}) => {
  const pose = getShortsOpeningPose(openingFrame);
  return (
    <div
      data-petal-bloom="3d"
      data-motion-source="TasteBuddy-Petal-Shorts"
      data-opening-frame={openingFrame}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        transformOrigin: "0 0",
        transform: `scale(${outputScale})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          ...plane,
          transformOrigin: "0 0",
          transform: `translate(${placement.x}px, ${placement.y}px) scale(${placement.scale}) translate(-308px, -249px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {leaves
          .filter(
            (leaf) =>
              leafIndices === undefined || leafIndices.includes(leaf.index),
          )
          .map((leaf) => {
            const angle = petalAngles[leaf.index];
            return (
              <div
                key={leaf.index}
                style={{
                  ...plane,
                  transformOrigin: origin,
                  transform: `rotateZ(${angle}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  style={{
                    ...plane,
                    perspective: GRID_PETAL_PERSPECTIVE,
                    perspectiveOrigin: origin,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div
                    data-petal-plane={leaf.name}
                    data-rotation-x={pose.foldDegrees}
                    data-fold-degrees={pose.foldDegrees}
                    style={{
                      ...plane,
                      transformOrigin: origin,
                      transform: `rotateX(${pose.foldDegrees}deg)`,
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "visible",
                    }}
                  >
                    <svg
                      width="1000"
                      height="500"
                      viewBox="0 0 1000 500"
                      style={{ display: "block", overflow: "visible" }}
                    >
                      <g transform={`rotate(${-angle} 308 249)`}>
                        <path
                          ref={(element) => {
                            if (outlineRef && leafIndices?.length === 1)
                              outlineRef.current = element;
                          }}
                          data-source-index={leaf.index}
                          {...leaf.props}
                          fill={color ?? leaf.props.fill}
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
