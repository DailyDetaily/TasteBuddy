import React, { createElement, useId } from "react";
import { LogoGridElement } from "./geometry";
import { orbitAngles, ramp } from "./motion";
import { PetalBloom3D } from "./PetalBloom3D";
import {
  BLOOM_START,
  BLOOM_END,
  DYNAMIC_FOLD_START,
  getDynamicOpeningFrame,
  circleEaseOut,
  dynamicBaseScale,
  getDynamicCamera,
  guideExit,
  introCircles,
  introVisibility,
} from "./dynamicMotion";
import { WordmarkTerminalFill } from "./WordmarkTerminalFill";
import { getWordmarkFillProgress } from "./wordmarkMotion";
import type { GridArtworkProps } from "./GridLayer";
import { getGridLineDefs } from "./guideStyle";
import { bottomAnchoredCircleTransform } from "./circleGuideMotion";

const around = (x: number, y: number, transform: string) =>
  `translate(${x} ${y}) ${transform} translate(${-x} ${-y})`;

export const DynamicElementArtwork: React.FC<GridArtworkProps> = ({
  nodes,
  frame,
  cameraFrame,
  outputScale,
  logoColor,
  outlineRef,
}) => {
  const camera = getDynamicCamera(cameraFrame);
  const opening = frame >= BLOOM_START && frame < BLOOM_END;
  const folding = frame >= DYNAMIC_FOLD_START;
  const bloom = opening || folding;
  const prefix = `lg-dynamic-${useId().replace(/:/g, "")}-`;
  const defs = getGridLineDefs(prefix);
  const guides = guideExit(frame);

  const draw = (
    node: LogoGridElement,
    extra: Record<string, string | number> = {},
    localScale = 1,
  ) => {
    const props: Record<string, string | number> = { ...node.props, ...extra };
    if (node.role === "guide.circles") props.fill = "none";
    if (node.role === "guide.grid") props.strokeOpacity = "1";
    if (typeof props.stroke === "string" && props.stroke.startsWith("url(#")) {
      props.stroke = props.stroke.replace("url(#", `url(#${prefix}`);
    }
    // Only compensate construction strokes for the camera zoom. Fill outlines
    // and source geometry are unchanged. HD and 4K retain the same proportions.
    if (props.stroke)
      props.strokeWidth =
        Number(node.props.strokeWidth ?? 1) /
        (camera.scale * Math.max(0.001, localScale));
    return createElement(node.tag, {
      ...props,
      "data-source-index": node.index,
    });
  };

  return (
    <>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        fill="none"
        aria-label="Taste Buddy Logo Grid — dynamic camera version"
        style={{ display: "block" }}
      >
        <g dangerouslySetInnerHTML={{ __html: defs }} />
        <g
          ref={(element) => {
            if (!(bloom && nodes.some((node) => node.role === "logo.symbol")))
              outlineRef.current = element;
            else outlineRef.current = null;
          }}
          data-camera-scale={camera.scale}
          data-camera-x={camera.x}
          data-camera-y={camera.y}
          transform={`translate(960 540) scale(${dynamicBaseScale * camera.scale}) translate(${-camera.x} ${-camera.y})`}
        >
          {nodes.map((node) => {
            const i = node.index;
            const [cx, cy] = node.center;
            const intro = introCircles.find(
              (circle) => circle.circleIndex === i || circle.labelIndex === i,
            );
            if (intro) {
              const scale = circleEaseOut(frame, intro.start);
              const opacity = guides * introVisibility(frame, i);
              if (scale === 0 || opacity === 0) return null;
              return (
                <g
                  key={i}
                  data-layer={node.name}
                  data-circle-diameter={intro.diameter}
                  data-bottom-anchor={intro.bottom}
                  data-circle-scale={scale}
                  opacity={opacity}
                  transform={bottomAnchoredCircleTransform(intro.bottom, scale)}
                >
                  {draw(node, {}, scale)}
                </g>
              );
            }
            // The symbol uses its separate 3D plane. Intro guide overlays above
            // it have already been handled, so they are not hidden here.
            if (opening) return null;
            if (node.role === "logo.symbol") {
              if (frame < BLOOM_END || folding) return null;
              return (
                <g key={i} data-layer={node.name}>
                  {draw(node)}
                </g>
              );
            }
            if (node.role === "logo.wordmark") {
              return (
                <g
                  key={i}
                  data-layer={node.name}
                  opacity={
                    1 - ramp(frame, DYNAMIC_FOLD_START, DYNAMIC_FOLD_START + 20)
                  }
                >
                  <WordmarkTerminalFill
                    node={node}
                    progress={getWordmarkFillProgress(frame, i, "dynamic")}
                    prefix={prefix}
                  />
                </g>
              );
            }

            // The lower 6 circle was not included in the requested upward chain.
            if (i === 23 || i === 80) return null;
            if (orbitAngles[i] !== undefined) {
              const angle = orbitAngles[i];
              const ordinal = angle / 30;
              const start = BLOOM_END + ordinal * 0.8;
              const p = circleEaseOut(frame, start, 12);
              if (p === 0) return null;
              return (
                <g
                  key={i}
                  data-layer={`construction.stationary.${angle}`}
                  opacity={guides}
                  transform={around(cx, cy + 18.75, `scale(${p})`)}
                >
                  {draw(node, {}, p)}
                </g>
              );
            }

            if (node.role === "guide.grid") {
              const bridge = i === 61 || i === 62;
              const typeRule = [67, 68, 69, 70].includes(i);
              const start = bridge ? 108 : typeRule ? 126 : 185;
              const p = ramp(frame, start, start + 27);
              const vertical = /^M[\d.]+ 0L/.test(node.props.d);
              return (
                <g
                  key={i}
                  data-layer={node.name}
                  opacity={guides * p}
                  transform={around(
                    bridge || typeRule ? 438 : 308,
                    249,
                    vertical ? `scale(1 ${p})` : `scale(${p} 1)`,
                  )}
                >
                  {draw(node)}
                </g>
              );
            }

            const bridge = i === 72;
            const typeDetail = [0, 1, 16, 51, 52, 53, 54, 73].includes(i);
            const start = bridge ? 107 : typeDetail ? 133 : 189 + (i % 4) * 2;
            const isCircle = node.role === "guide.circles";
            const p = isCircle
              ? circleEaseOut(frame, start, 20)
              : ramp(frame, start, start + 20);
            if (p === 0) return null;
            const radius =
              node.tag === "circle"
                ? Number(node.props.r)
                : i === 0
                  ? 5.75
                  : 18.75;
            return (
              <g
                key={i}
                data-layer={node.name}
                opacity={guides * (isCircle ? 1 : p)}
                transform={
                  isCircle ? around(cx, cy + radius, `scale(${p})`) : undefined
                }
              >
                {draw(node, {}, isCircle ? p : 1)}
              </g>
            );
          })}
        </g>
      </svg>
      {bloom && nodes.some((node) => node.role === "logo.symbol") ? (
        <PetalBloom3D
          openingFrame={getDynamicOpeningFrame(frame)}
          outputScale={outputScale}
          color={logoColor}
          leafIndices={nodes
            .filter((node) => node.role === "logo.symbol")
            .map((node) => node.index)}
          outlineRef={outlineRef}
          placement={{
            x: 960 + (308 - camera.x) * dynamicBaseScale * camera.scale,
            y: 540 + (249 - camera.y) * dynamicBaseScale * camera.scale,
            scale: dynamicBaseScale * camera.scale,
          }}
        />
      ) : null}
    </>
  );
};
