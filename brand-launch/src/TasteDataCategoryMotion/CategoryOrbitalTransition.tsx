import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
} from "remotion";
import { fontReady } from "../fonts";
import { categoryFrame } from "./geometry";
import { fixture } from "./fixtures";
import {
  CATEGORY_TRANSITION_FRAMES,
  makeParticlePlan,
  particleTransitionAt,
} from "./particle-morph";
import type { Category, Frame } from "./types";

export { CATEGORY_TRANSITION_FRAMES } from "./particle-morph";

const settledFrame = (category: Category, time: number): Frame =>
  categoryFrame(fixture(category, "standard", "liking", "taste"), time, {
    playback: "idle",
    alignment: 0,
    rotation: 0,
    page: 0,
  });

const Summary = ({ frame, opacity }: { frame: Frame; opacity: number }) => (
  <g
    opacity={opacity * frame.summaryOpacity}
    textAnchor="middle"
    fill="#0F0F0F"
  >
    <text x={320} y={285} fontSize={22} fontWeight={500} fill="#555555">
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
    <text x={320} y={378} fontSize={22} fontWeight={500} fill="#555555">
      {frame.unit}
    </text>
    {frame.state !== "valid" && frame.notes[0] && (
      <text x={320} y={410} fontSize={19} fill="#8A8A8A">
        {frame.notes[0]}
      </text>
    )}
  </g>
);

export const CategoryParticleTransition = ({
  from,
  to,
  fromIdleTime,
  durationInFrames = CATEGORY_TRANSITION_FRAMES,
  backgroundColor = "#F3F3F3",
}: {
  from: Category;
  to: Category;
  fromIdleTime: number;
  durationInFrames?: number;
  backgroundColor?: string;
}) => {
  const currentFrame = useCurrentFrame();
  const [fontHandle] = useState(() =>
    delayRender("Category particle reassembly · Pretendard"),
  );
  useEffect(() => {
    fontReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);

  const fromFrame = useMemo(
    () => settledFrame(from, fromIdleTime),
    [from, fromIdleTime],
  );
  const toFrame = useMemo(() => settledFrame(to, 0), [to]);
  const plan = useMemo(
    () => makeParticlePlan(fromFrame, toFrame, `${from}:${to}`),
    [fromFrame, toFrame, from, to],
  );
  // Use the handoff's explicit local duration, independent of enclosing composition length.
  const state = particleTransitionAt(plan, currentFrame, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        fontFamily: "Pretendard, sans-serif",
        color: "#0F0F0F",
      }}
      durationInFrames={48}
    >
      <svg
        viewBox="0 0 640 640"
        width="100%"
        height="100%"
        aria-label={`${fromFrame.title} → ${toFrame.title} 개별 점 전환`}
        data-particle-transition={`${from}:${to}`}
        data-progress={state.progress}
        data-particle-count={state.dots.length}
      >
        {/* One circle per track: matched dots remain visible throughout the handoff. */}
        {state.dots.map((dot) => (
          <circle
            key={dot.id}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={dot.color}
            opacity={dot.opacity}
          />
        ))}
        <Summary frame={fromFrame} opacity={state.outgoingText} />
        <Summary frame={toFrame} opacity={state.incomingText} />
      </svg>
    </AbsoluteFill>
  );
};

// Preserve existing imports; the original clockwise two-layer orbital effect is replaced.
export const CategoryOrbitalTransition = CategoryParticleTransition;
