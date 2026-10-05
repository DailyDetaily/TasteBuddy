import React, { createElement, useId } from "react";
import { LogoGridElement } from "./geometry";
import { getLogoGridMotion, getOrbitAngle, orbitAngles, ramp } from "./motion";
import { PetalBloom3D } from "./PetalBloom3D";
import {
  getClassicPetalStage,
  isClassicStackGuideVisible,
} from "./shortsOpening";
import { WordmarkTerminalFill } from "./WordmarkTerminalFill";
import { getWordmarkFillProgress } from "./wordmarkMotion";
import type { GridArtworkProps } from "./GridLayer";
import { getGridLineDefs } from "./guideStyle";
import {
  bottomAnchoredCircleTransform,
  classicStackCircles,
  getClassicCircleScale,
} from "./circleGuideMotion";

const around = (x: number, y: number, transform: string) =>
  `translate(${x} ${y}) ${transform} translate(${-x} ${-y})`;

const element = (node: LogoGridElement, prefix: string) => {
  const props = { ...node.props };
  // Construction circles stay transparent during entry, bloom and hold.
  // Preserve the supplied SVG while overriding its gray guide fills here.
  if (node.role === "guide.circles") props.fill = "none";
  if (node.role === "guide.grid") props.strokeOpacity = "1";
  if (props.stroke?.startsWith("url(#")) {
    props.stroke = props.stroke.replace("url(#", `url(#${prefix}`);
  }
  return createElement(node.tag, { ...props, "data-source-index": node.index });
};

export const ClassicElementArtwork: React.FC<GridArtworkProps> = ({
  nodes,
  frame: sourceFrame,
  outputScale,
  logoColor,
  wordmarkFillProgress,
  outlineRef,
}) => {
  const motion = getLogoGridMotion(sourceFrame);
  const petalStage = getClassicPetalStage(sourceFrame);
  const movingPetals =
    petalStage.mode === "opening" || petalStage.mode === "folding";
  const prefix = `logo-grid-${useId().replace(/:/g, "")}-`;
  const defs = getGridLineDefs(prefix);

  return (
    <>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        fill="none"
        aria-label="Taste Buddy Logo Grid — SVG reconstruction"
        style={{ display: "block" }}
      >
        <g dangerouslySetInnerHTML={{ __html: defs }} />
        {/* Registration measured against the reference at 1920 x 1080. */}
        <g
          ref={(element) => {
            if (
              !(
                movingPetals &&
                nodes.some((node) => node.role === "logo.symbol")
              )
            )
              outlineRef.current = element;
            else outlineRef.current = null;
          }}
          transform="translate(278 200) scale(1.36)"
        >
          {nodes.map((node) => {
            const graphic = element(node, prefix);
            const [cx, cy] = node.center;
            if (node.role === "logo.symbol") {
              if (petalStage.mode !== "held") return null;
              return (
                <g key={node.index} data-layer={node.name}>
                  {graphic}
                </g>
              );
            }
            if (node.role === "logo.wordmark") {
              const exit = 1 - ramp(sourceFrame, 220, 229);
              return (
                <g
                  key={node.index}
                  data-layer={node.name}
                  opacity={exit}
                  transform={
                    exit < 1 ? around(cx, cy, `scale(${exit} 1)`) : undefined
                  }
                >
                  <WordmarkTerminalFill
                    node={node}
                    progress={
                      wordmarkFillProgress
                        ? wordmarkFillProgress(sourceFrame, node.index)
                        : getWordmarkFillProgress(
                            sourceFrame,
                            node.index,
                            "classic",
                          )
                    }
                    prefix={prefix}
                  />
                </g>
              );
            }

            const stackCircle = classicStackCircles.find(
              (circle) =>
                circle.circleIndex === node.index ||
                circle.labelIndex === node.index,
            );
            if (stackCircle) {
              if (!isClassicStackGuideVisible(sourceFrame, node.index))
                return null;
              const scale = getClassicCircleScale(
                sourceFrame,
                stackCircle.start,
              );
              if (scale === 0) return null;
              return (
                <g
                  key={node.index}
                  data-layer={node.name}
                  data-circle-diameter={stackCircle.diameter}
                  data-bottom-anchor={stackCircle.bottom}
                  data-circle-scale={scale}
                  opacity={motion.stackOpacity}
                  transform={bottomAnchoredCircleTransform(
                    stackCircle.bottom,
                    scale,
                  )}
                >
                  {graphic}
                </g>
              );
            }

            if (orbitAngles[node.index] !== undefined) {
              const target = orbitAngles[node.index];
              const angle = getOrbitAngle(sourceFrame, target);
              const opacity =
                ramp(sourceFrame, 37 + target / 120, 44 + target / 120) *
                (1 - ramp(sourceFrame, 253, 260)) *
                (0.2 + (0.8 * angle) / target);
              return (
                <g
                  key={node.index}
                  data-layer={`construction.orbit.${target}`}
                  opacity={opacity}
                  transform={`rotate(${angle - target} 308 249)`}
                >
                  {graphic}
                </g>
              );
            }

            if (node.role === "guide.grid") {
              const vertical = /^M[\d.]+ 0L/.test(node.props.d);
              const scale = vertical
                ? `scale(1 ${motion.grid})`
                : `scale(${motion.grid} 1)`;
              return (
                <g
                  key={node.index}
                  data-layer={node.name}
                  opacity={motion.grid}
                  transform={around(308, 249, scale)}
                >
                  {graphic}
                </g>
              );
            }

            const perimeter = node.role === "guide.circles";
            const progress = perimeter ? motion.perimeter : motion.dimensions;
            return (
              <g
                key={node.index}
                data-layer={node.name}
                opacity={progress}
                transform={
                  perimeter
                    ? around(cx, cy, `scale(${0.75 + progress * 0.25})`)
                    : undefined
                }
              >
                {graphic}
              </g>
            );
          })}
        </g>
      </svg>
      {movingPetals && nodes.some((node) => node.role === "logo.symbol") ? (
        <PetalBloom3D
          openingFrame={petalStage.openingFrame}
          outputScale={outputScale}
          color={logoColor}
          leafIndices={nodes
            .filter((node) => node.role === "logo.symbol")
            .map((node) => node.index)}
          outlineRef={outlineRef}
          placement={{ x: 278 + 308 * 1.36, y: 200 + 249 * 1.36, scale: 1.36 }}
        />
      ) : null}
    </>
  );
};
