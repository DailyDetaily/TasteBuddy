import { useMemo, type CSSProperties } from "react";
import {
  openingRotationX,
  PETAL_FPS,
  PETAL_PERSPECTIVE,
} from "../PetalLogo/motion";
import { bloomSvgLayers } from "./generated";
import { withBloomColors, type BloomLayerColors } from "./palette";

type BloomId = keyof typeof bloomSvgLayers;

const progressAt = (time: number, delay: number, duration: number) =>
  Math.min(1, Math.max(0, (time - delay) / duration));
const easeOut = (progress: number) => 1 - (1 - progress) ** 3;
const fromCenter = (scale: number) =>
  scale === 1
    ? undefined
    : `translate(50 50) scale(${scale}) translate(-50 -50)`;

const AVATAR_SIZE = 120;
const plane: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  transformOrigin: "50% 50%",
  transformStyle: "preserve-3d",
};
const svgPlane: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  overflow: "visible",
};

const PetalRing = ({
  petals,
  time,
  inner,
  size,
}: {
  petals: readonly string[];
  time: number;
  inner: boolean;
  size: number;
}) => {
  // Reuse TasteBuddy-Petal-Shorts: 90° → 0° in one second, AE Easy Ease.
  // All petals in a ring share the angle; the inner ring starts 330ms later.
  const rotationX = openingRotationX(
    (time - (inner ? 0.45 : 0.12)) * PETAL_FPS,
  );
  const layer = inner ? "inner-petals" : "outer-petals";
  if (rotationX === 0) {
    // Once open, use the untouched source geometry without rotated raster planes.
    return (
      <svg
        viewBox="0 0 100 100"
        style={svgPlane}
        data-bloom-layer={layer}
        data-rotation-x={0}
        dangerouslySetInnerHTML={{ __html: petals.join("") }}
      />
    );
  }
  return (
    <div
      data-bloom-layer={layer}
      data-rotation-x={rotationX}
      style={{ ...plane, transformStyle: "flat" }}
    >
      {petals.map((petal, index) => {
        const angle = 180 / petals.length + (360 / petals.length) * index;
        return (
          <div
            key={index}
            style={{ ...plane, transform: `rotateZ(${angle}deg)` }}
          >
            <div
              style={{
                ...plane,
                perspective: (PETAL_PERSPECTIVE * size) / 1080,
                perspectiveOrigin: "50% 50%",
              }}
            >
              <div
                data-bloom-petal={index}
                data-rotation-x={rotationX}
                style={{ ...plane, transform: `rotateX(${rotationX}deg)` }}
              >
                <svg viewBox="0 0 100 100" style={svgPlane}>
                  {/* Normalize each original petal to point up before X rotation;
                      the outer Z plane returns it to its exact radial position. */}
                  <g
                    transform={`rotate(${-angle} 50 50)`}
                    dangerouslySetInnerHTML={{ __html: petal }}
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CenterLayer = ({
  markup,
  progress,
  name,
}: {
  markup: string;
  progress: number;
  name: string;
}) => (
  <g
    data-bloom-layer={name}
    opacity={Math.min(1, progress * 6)}
    transform={fromCenter(progress === 1 ? 1 : 0.06 + 0.94 * easeOut(progress))}
    dangerouslySetInnerHTML={{ __html: markup }}
  />
);

export const AnimatedBloom = ({
  id,
  index,
  label,
  motionTime,
  backgroundColor,
  size = AVATAR_SIZE,
  colors,
  backgroundProgress = 1,
  interiorVisible = true,
  interiorOpacity = 1,
}: {
  id: BloomId;
  index: number;
  label: string;
  motionTime: number;
  backgroundColor: string;
  size?: number;
  colors?: BloomLayerColors;
  backgroundProgress?: number;
  interiorVisible?: boolean;
  interiorOpacity?: number;
}) => {
  const time = motionTime - index * 0.04;
  const layers = useMemo(
    () =>
      colors ? withBloomColors(bloomSvgLayers[id], colors) : bloomSvgLayers[id],
    [id, colors],
  );
  const interior = (
    <>
      <PetalRing
        petals={layers.outerPetals}
        time={time}
        inner={false}
        size={size}
      />
      <PetalRing petals={layers.innerPetals} time={time} inner size={size} />
      <svg viewBox="0 0 100 100" style={svgPlane}>
        <CenterLayer
          name="outer-stamen"
          markup={layers.outerStamens}
          progress={progressAt(time, 1.03, 0.95)}
        />
        <CenterLayer
          name="inner-stamen"
          markup={layers.innerStamens}
          progress={progressAt(time, 1.27, 1.1)}
        />
        <CenterLayer
          name="pistil"
          markup={layers.pistil}
          progress={progressAt(time, 0.05, 0.85)}
        />
      </svg>
    </>
  );
  return (
    <div
      role="img"
      aria-label={label}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        clipPath: "circle(49% at 50% 50%)",
      }}
    >
      <svg viewBox="0 0 100 100" style={svgPlane}>
        <g
          data-bloom-layer="background"
          data-background-progress={backgroundProgress}
          transform={fromCenter(backgroundProgress)}
          dangerouslySetInnerHTML={{
            __html: layers.background.replace(
              /fill="[^"]+"/,
              `fill="${backgroundColor}"`,
            ),
          }}
        />
      </svg>
      {interiorVisible ? (
        interiorOpacity < 1 ? (
          <div
            data-bloom-interior-fade
            style={{
              ...plane,
              transformStyle: "flat",
              opacity: interiorOpacity,
            }}
          >
            {interior}
          </div>
        ) : (
          interior
        )
      ) : null}
    </div>
  );
};
