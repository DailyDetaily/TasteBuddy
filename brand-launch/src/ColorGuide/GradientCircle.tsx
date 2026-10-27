import { useEffect, useId, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontReady } from "../fonts";
import { COLOR_TOKENS } from "../../../src/constants/designTokens";
import {
  guideGeometry as g,
  guideViewport,
  outerDots,
  referenceTone,
} from "./geometry";
import { COLOR_GUIDE_FPS, cyclePose } from "./Original/motion";
import type { ColorGuideProps } from "./settings";
import { sphereFocus } from "./sphereMotion";

// Keep the original soft shading, with only a slightly broader saturated core.
const sphereTones = [
  { offset: 0, strength: 100 },
  { offset: 0.2, strength: 90 },
  { offset: 0.39, strength: 80 },
  { offset: 0.54, strength: 70 },
  { offset: 0.66, strength: 60 },
  { offset: 0.76, strength: 50 },
  { offset: 0.845, strength: 40 },
  { offset: 0.915, strength: 30 },
  { offset: 0.965, strength: 20 },
  { offset: 1, strength: 10 },
];

/** One luminous sphere, driven by the original guide's color timeline. */
export const TasteColorGradientCircle = (props: ColorGuideProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const still = props.재생 === "정지";
  const cycle = cyclePose((frame / fps) * COLOR_GUIDE_FPS * props.속도, still);
  const focus = sphereFocus(frame, durationInFrames, still);
  const progress = cycle.travel;
  const opening = cycle.phase === "intro";
  const resetting = cycle.phase === "reset";
  const closing = cycle.isFinalExit;
  const from = outerDots[opening || resetting ? 0 : cycle.colorFromIndex];
  const to = outerDots[opening || resetting ? 0 : cycle.colorToIndex];
  const visibility = resetting
    ? 0
    : opening
      ? progress
      : closing
        ? 1 - progress
        : 1;
  const radius = g.outerRadius + g.bandWidth / 2;
  const labelGap = (guideViewport.size / 2 - radius) / 2;
  const id = `taste-circle-${useId().replace(/:/g, "")}`;
  const url = (name: string) => `url(#${id}-${name})`;
  const [fontHandle] = useState(() => delayRender("Taste sphere labels"));
  useEffect(() => {
    fontReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);

  // New color enters from its corresponding side of the taste wheel.
  // The gradient endpoints move across the circle, keeping a broad soft blend.
  // The wipe reveals the complete next sphere, including its ten tint levels.
  const direction = ((to.angle + 180) * Math.PI) / 180;
  const dx = Math.cos(direction);
  const dy = Math.sin(direction);
  const start = (4 * progress - 3) * radius;
  const end = (4 * progress - 1) * radius;
  const transitioning = from.color !== to.color && progress > 0 && progress < 1;
  const settled = progress >= 1 ? "to" : "from";
  const label = progress < 0.5 ? from : to;
  const labelOpacity = transitioning ? Math.abs(progress - 0.5) * 2 : 1;

  return (
    <AbsoluteFill
      data-taste-gradient-circle="true"
      data-timing-guide="TasteColor-Guide-Original"
      data-phase={cycle.phase}
      data-from-taste={from.id}
      data-to-taste={to.id}
      data-gradient-progress={progress}
      data-gradient-active={transitioning}
      data-visibility={visibility}
      data-surface="tint-sphere"
      data-focus-x={focus.x}
      data-focus-y={focus.y}
      style={{ backgroundColor: props["배경 색"] }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${guideViewport.x} ${guideViewport.y} ${guideViewport.size} ${guideViewport.size}`}
        role="img"
        style={{ fontFamily: '"Pretendard", sans-serif' }}
        aria-label={
          transitioning
            ? `${from.name}에서 ${to.name}으로 전환되는 밝은 외곽의 미각 구`
            : `${label.name}, ${label.color}, 100부터 10까지의 단계별 틴트로 만든 미각 구`
        }
      >
        <defs>
          <clipPath id={`${id}-outline`}>
            <circle cx={g.cx} cy={g.cy} r={radius} />
          </clipPath>
          <radialGradient
            id={`${id}-backlight-shadow`}
            data-backlight-shadow="true"
            gradientUnits="userSpaceOnUse"
            cx={g.cx}
            cy={g.cy}
            r={radius * 0.95}
            colorInterpolation="sRGB"
          >
            <stop offset="0" stopColor="#000000" stopOpacity={0.12} />
            <stop offset="0.45" stopColor="#000000" stopOpacity={0.085} />
            <stop offset="0.8" stopColor="#000000" stopOpacity={0.03} />
            <stop offset="1" stopColor="#000000" stopOpacity={0} />
          </radialGradient>
          {[
            { name: "from", color: from.color },
            { name: "to", color: to.color },
          ].map(({ name, color }) => (
            <g key={name}>
              <radialGradient
                id={`${id}-${name}-surface`}
                gradientUnits="userSpaceOnUse"
                cx={g.cx}
                cy={g.cy}
                r={radius}
                fx={g.cx + radius * focus.x}
                fy={g.cy + radius * focus.y}
                colorInterpolation="sRGB"
              >
                {sphereTones.map(({ offset, strength }) => (
                  <stop
                    key={`${strength}-${offset}`}
                    offset={offset}
                    stopColor={referenceTone(strength, color)}
                    data-tint-strength={strength}
                  />
                ))}
              </radialGradient>
              <g id={`${id}-${name}-sphere`}>
                <circle
                  cx={g.cx}
                  cy={g.cy}
                  r={radius}
                  fill={url(`${name}-surface`)}
                />
                <circle
                  data-backlight-shadow-layer="diffuse"
                  cx={g.cx}
                  cy={g.cy}
                  r={radius}
                  fill={url("backlight-shadow")}
                />
              </g>
            </g>
          ))}
          <linearGradient
            id={`${id}-transfer`}
            gradientUnits="userSpaceOnUse"
            x1={g.cx + start * dx}
            y1={g.cy + start * dy}
            x2={g.cx + end * dx}
            y2={g.cy + end * dy}
            spreadMethod="pad"
            colorInterpolation="sRGB"
          >
            <stop offset="0" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask
            id={`${id}-reveal`}
            maskUnits="userSpaceOnUse"
            x={g.cx - radius}
            y={g.cy - radius}
            width={radius * 2}
            height={radius * 2}
            style={{ maskType: "luminance" }}
          >
            <rect
              x={g.cx - radius}
              y={g.cy - radius}
              width={radius * 2}
              height={radius * 2}
              fill={url("transfer")}
            />
          </mask>
        </defs>
        <circle
          data-neutral-base="true"
          cx={g.cx}
          cy={g.cy}
          r={radius}
          fill={COLOR_TOKENS.background.page}
          opacity={1 - visibility}
        />
        <g
          data-large-taste-circle="true"
          clipPath={url("outline")}
          opacity={visibility}
        >
          <use href={`#${id}-${transitioning ? "from" : settled}-sphere`} />
          {transitioning && (
            <use href={`#${id}-to-sphere`} mask={url("reveal")} />
          )}
        </g>
        <g
          data-sphere-labels="true"
          data-label-taste={label.id}
          opacity={labelOpacity * visibility}
          fill={label.color}
          textAnchor="middle"
          dominantBaseline="central"
        >
          <text
            data-sphere-taste-name="true"
            x={g.cx}
            y={g.cy - radius - labelGap}
            fontSize={6}
            fontWeight={500}
          >
            {label.name}
          </text>
          <text
            data-sphere-color-code="true"
            x={g.cx}
            y={g.cy + radius + labelGap}
            fontSize={6}
            fontWeight={400}
          >
            {label.color.toUpperCase()}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
