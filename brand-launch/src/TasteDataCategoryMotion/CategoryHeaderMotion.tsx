import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontReady } from "../fonts";
import {
  categoryFrame,
  categoryIntroDuration,
} from "./geometry";
import { fixture } from "./fixtures";
import type { Category, Mode, Playback, Scenario } from "./types";

export type CategoryHeaderMotionProps = {
  category: Category;
  scenario?: Scenario;
  mode?: Mode;
  domain?: "taste" | "aroma" | "texture";
  backgroundColor?: string;
  playback?: Playback;
};

const mix = (base: string, tint?: string, amount = 0) => {
  if (!tint || amount <= 0) return base;
  if (amount >= 1) return tint;
  const a = parseInt(base.slice(1), 16);
  const b = parseInt(tint.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(
      ((a >> shift) & 255) +
        (((b >> shift) & 255) - ((a >> shift) & 255)) * amount,
    );
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
};

export const CategoryHeaderMotion = ({
  category,
  scenario = "standard",
  mode = "liking",
  domain = "taste",
  backgroundColor = "#F3F3F3",
  playback = "intro",
}: CategoryHeaderMotionProps) => {
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = currentFrame / fps;
  const [fontHandle] = useState(() => delayRender("Category Header · Pretendard"));

  useEffect(() => {
    fontReady
      .then(() => continueRender(fontHandle))
      .catch(() => continueRender(fontHandle));
  }, [fontHandle]);

  const data = useMemo(
    () => fixture(category, scenario, mode, domain),
    [category, scenario, mode, domain],
  );

  const intro = categoryIntroDuration(category);
  const frame = categoryFrame(data, time, {
    playback,
    alignment: 0,
    rotation: 0,
    page: 0,
    rotationTime:
      category === "experienceCluster" && playback === "intro"
        ? Math.max(0, time - intro)
        : undefined,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: "Pretendard, sans-serif",
        color: "#0F0F0F",
      }}
    >
      <svg
        viewBox="0 0 640 640"
        width="100%"
        height="100%"
        aria-label={frame.title + " 상단 데이터 모션"}
      >
        {frame.bridges?.map(({ id, points, color, opacity }) => (
          <path
            key={id}
            d={`M${points[0].x} ${points[0].y} C${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y} ${points[3].x} ${points[3].y} L${points[4].x} ${points[4].y} C${points[5].x} ${points[5].y} ${points[6].x} ${points[6].y} ${points[7].x} ${points[7].y} Z`}
            fill={color}
            opacity={opacity}
          />
        ))}

        {frame.dots.map((dot) => (
          <circle
            key={dot.id}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={mix(dot.color, dot.tintColor, dot.tint)}
            opacity={dot.opacity}
          />
        ))}

        <g
          opacity={frame.summaryOpacity}
          textAnchor="middle"
          fill="#0F0F0F"
        >
          <text
            x={320}
            y={285}
            fontSize={22}
            fontWeight={500}
            fill="#555555"
          >
            {frame.title}
          </text>
          <text
            x={320}
            y={341}
            fontSize={frame.value.length > 6 ? 36 : 42}
            fontWeight={700}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {frame.value}
          </text>
          <text
            x={320}
            y={378}
            fontSize={22}
            fontWeight={500}
            fill="#555555"
          >
            {frame.unit}
          </text>
          {frame.state !== "valid" && frame.notes[0] && (
            <text x={320} y={410} fontSize={19} fill="#8A8A8A">
              {frame.notes[0]}
            </text>
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
