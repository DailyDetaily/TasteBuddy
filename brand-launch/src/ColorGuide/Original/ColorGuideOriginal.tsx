import { useEffect, useId, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontReady } from "../../fonts";
import {
  guideGeometry as g,
  guideViewport,
  innerDots,
  innerMaskWedges,
  outerDots,
  outerWedges,
  mixColor,
  polar,
  referenceTone,
} from "../geometry";
import {
  COLOR_GUIDE_FPS,
  cyclePose,
  innerDotPose,
  outerDotExitPose,
} from "./motion";
import type { ColorGuideProps } from "./settings";

export const ColorGuideOriginal = (props: ColorGuideProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const still = props.재생 === "정지";
  const id = useId().replace(/:/g, "");
  const [fontHandle] = useState(() => delayRender("Color guide labels"));
  useEffect(() => {
    fontReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);
  const cycle = cyclePose((frame / fps) * COLOR_GUIDE_FPS * props.속도, still);
  const settledDots = outerDots.slice(0, cycle.settledCount);
  const active = outerDots[cycle.tasteIndex];
  const activeColor = mixColor(
    outerDots[cycle.colorFromIndex].color,
    outerDots[cycle.colorToIndex].color,
    cycle.travel,
  );
  const outerPosition = polar(g.outerRadius, cycle.angle);
  const url = (name: string) => `url(#${id}-${name})`;
  const circle = { cx: g.cx, cy: g.cy, fill: "none" };

  return (
    <AbsoluteFill
      data-color-guide="vector"
      data-phase={cycle.phase}
      data-taste={active.id}
      data-settled-count={cycle.settledCount}
      style={{ backgroundColor: props["배경 색"] }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${guideViewport.x} ${guideViewport.y} ${guideViewport.size} ${guideViewport.size}`}
        role="img"
        aria-label={`${active.name} 컬러 링과 100부터 10까지의 단계별 톤 링`}
        style={{ fontFamily: '"Pretendard", sans-serif', overflow: "hidden" }}
      >
        <defs>
          <g id={`${id}-outer-spectrum`}>
            {outerWedges.map((wedge, index) => (
              <path key={index} d={wedge.d} fill={wedge.color} />
            ))}
          </g>
          <mask
            id={`${id}-inner-strength`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={g.width}
            height={g.height}
            style={{ maskType: "luminance" }}
          >
            {innerMaskWedges.map((wedge, index) => (
              <path key={index} d={wedge.d} fill={wedge.color} />
            ))}
          </mask>
          <mask
            id={`${id}-outer-dashes`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={g.width}
            height={g.height}
          >
            <circle
              {...circle}
              r={g.outerRadius}
              stroke="white"
              strokeWidth={g.dashWidth}
              strokeDasharray={g.dashPattern}
              strokeLinecap="round"
            />
          </mask>
        </defs>

        <g data-guide-ring="outer">
          <use href={`#${id}-outer-spectrum`} opacity={0.2} />
          <g opacity={0.5} mask={url("outer-dashes")}>
            <use href={`#${id}-outer-spectrum`} />
          </g>
        </g>
        <g data-guide-ring="inner">
          <g mask={url("inner-strength")}>
            <circle
              {...circle}
              r={g.innerRadius}
              stroke={activeColor}
              strokeWidth={g.bandWidth}
              opacity={0.2}
            />
            <circle
              {...circle}
              r={g.innerRadius}
              stroke={activeColor}
              strokeWidth={g.dashWidth}
              strokeDasharray={g.dashPattern}
              strokeLinecap="round"
              opacity={0.5}
            />
          </g>
        </g>

        {settledDots.map((dot, index) => {
          const pose = outerDotExitPose(
            cycle.localFrame,
            index,
            cycle.isFinalExit,
          );
          const position = polar(g.outerRadius, dot.angle + pose.angleOffset);
          return (
            <circle
              key={`settled-${dot.id}`}
              data-guide-dot="outer-fixed"
              data-taste={dot.id}
              data-angle-offset={pose.angleOffset}
              cx={position.x}
              cy={position.y}
              r={g.dotRadius}
              fill={dot.color}
              opacity={pose.opacity}
            />
          );
        })}
        <circle
          data-guide-dot="outer-moving"
          data-taste={active.id}
          cx={outerPosition.x}
          cy={outerPosition.y}
          r={g.dotRadius}
          fill={activeColor}
          opacity={cycle.movingOpacity}
        />
        {settledDots.map((dot, index) => {
          const pose = outerDotExitPose(
            cycle.localFrame,
            index,
            cycle.isFinalExit,
          );
          const position = polar(g.outerRadius, dot.angle + pose.angleOffset);
          return (
            <text
              key={dot.id}
              data-guide-label={dot.id}
              x={position.x}
              y={dot.labelY + position.y - dot.y}
              textAnchor="middle"
              fill="#0F0F0F"
              fontSize={6}
              fontWeight={400}
              opacity={pose.opacity}
            >
              <tspan x={position.x}>{dot.name}</tspan>
              <tspan x={position.x} dy={8}>
                {dot.color}
              </tspan>
            </text>
          );
        })}
        {innerDots.map((dot, index) => {
          const pose = innerDotPose(cycle.localFrame, index, still);
          // Outgoing tones retain the current taste until they disappear.
          // The next taste palette begins when its outer point has arrived.
          const color = referenceTone(dot.strength, active.color);
          const position = polar(g.innerRadius, dot.angle + pose.angleOffset);
          return (
            <g
              key={dot.strength}
              data-guide-dot="inner"
              data-strength={dot.strength}
              data-angle-offset={pose.angleOffset}
            >
              <circle
                cx={position.x}
                cy={position.y}
                r={g.dotRadius * pose.scale}
                fill={color}
                opacity={pose.opacity}
              />
              <text
                x={position.x}
                y={position.y - 12}
                textAnchor="middle"
                fill="#0F0F0F"
                fontSize={6}
                fontWeight={400}
                opacity={pose.opacity}
              >
                {dot.strength}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
