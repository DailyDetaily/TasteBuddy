import React from "react";
import { PETAL_PATH } from "./source";
import { getPetalScene, PETAL_PIVOT } from "./motion";
import { petalWalls, sidewallColor } from "./solidGeometry";

const scene = getPetalScene();

export const PetalSolid: React.FC<{
  thickness: number;
  color: string;
  scale?: number;
}> = ({ thickness, color, scale = scene.scale }) => {
  const walls = React.useMemo(
    () => petalWalls(PETAL_PATH, scale, PETAL_PIVOT),
    [scale],
  );
  return (
    <>
      {(thickness > 0 ? [-thickness / 2, thickness / 2] : [0]).map((z) => (
        <svg
          key={z}
          data-petal-face={z < 0 ? "back" : "front"}
          data-depth={z}
          width="1080"
          height="1920"
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            display: "block",
            overflow: "visible",
            transform: `translateZ(${z}px)`,
          }}
        >
          <g
            transform={`translate(540 960) scale(${scale}) translate(${-PETAL_PIVOT.x} ${-PETAL_PIVOT.y})`}
          >
            <path d={PETAL_PATH} fill={color} />
          </g>
        </svg>
      ))}
      {thickness > 0 &&
        walls.map((wall, index) => (
          <div
            key={index}
            data-petal-wall={index}
            style={{
              position: "absolute",
              left: scene.x + wall.x,
              top: scene.y + wall.y,
              width: wall.length + 0.08,
              height: thickness,
              backgroundColor: sidewallColor(color),
              transformOrigin: "0 0",
              transform: `translateZ(${-thickness / 2}px) rotateZ(${wall.angle}deg) rotateX(90deg)`,
            }}
          />
        ))}
    </>
  );
};
