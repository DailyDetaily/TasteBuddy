import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { FeedbackCardReveal } from "../DiningFeedbackMotion/Card";
import { resultCardBloom, type ResultCardPhase } from "./result-card-motion";
import {
  mergedPetalPath,
  resultFrameGeometry,
  resultSymbolPetals,
  roundedFramePath,
} from "./result-card-geometry";

export const ResultCardReveal = ({
  elapsed,
  phase = "entrance",
  children,
}: {
  elapsed: number;
  phase?: ResultCardPhase;
  children: (reveal: FeedbackCardReveal) => ReactNode;
}) => {
  const root = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(440);
  useLayoutEffect(() => {
    const card = root.current?.querySelector<HTMLElement>(
      "[data-feedback-card]",
    );
    if (!card) return;
    const measured = Number.parseFloat(getComputedStyle(card).height);
    if (Number.isFinite(measured) && Math.abs(measured - height) > 0.01)
      setHeight(measured);
  }, [children, height]);
  const bloom = resultCardBloom(elapsed, phase);
  const geometry = resultFrameGeometry(height, bloom.outer, bloom.inner);
  const symbolSize = 96 * bloom.symbolScale;
  // Round the exposed sector corners while the petals widen. The stroke
  // returns to zero at both ends, preserving the source symbol and final O.
  const petalStrokeWidth = 12 * Math.sin(Math.PI * bloom.merge);
  return (
    <div
      ref={root}
      data-result-card-motion={phase}
      data-result-card-elapsed={elapsed}
      style={{
        position: "absolute",
        left: 50,
        top: "50%",
        width: 302,
        transform: "translateY(-50%)",
      }}
    >
      <svg
        data-result-card-bloom
        width={302}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          opacity: bloom.opacity,
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        {bloom.merge < 1 ? (
          <svg
            data-result-symbol
            x={(302 - symbolSize) / 2}
            y={(height - symbolSize) / 2}
            width={symbolSize}
            height={symbolSize}
            viewBox="216 157 184 184"
            overflow="visible"
          >
            {resultSymbolPetals.map((petal, index) => (
              <path
                key={petal.name}
                data-result-petal={petal.name}
                d={mergedPetalPath(index, bloom.merge)}
                fill="white"
                stroke="white"
                strokeWidth={petalStrokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </svg>
        ) : (
          <path
            data-result-card-frame
            d={`${roundedFramePath(geometry.outer)} ${roundedFramePath(geometry.inner)}`}
            fill="white"
            fillRule="evenodd"
          />
        )}
      </svg>
      <div style={{ position: "relative" }}>{children(bloom.reveal)}</div>
    </div>
  );
};
