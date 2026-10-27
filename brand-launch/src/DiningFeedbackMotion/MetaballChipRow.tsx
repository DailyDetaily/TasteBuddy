import { useId, useLayoutEffect, useRef, useState } from "react";
import { fontReady } from "../fonts";
import {
  ResultChip,
  ResultChipContent,
  RESULT_CHIP_HEIGHT,
  resultChipColors,
  resultChipStyle,
  type ResultChipItem,
  type ChipMetrics,
} from "./ResultChip";
import {
  chipBridge,
  chipRowDuration,
  chipRowPoses,
  type ChipSeparation,
} from "./chip-motion";

/** Sauce Splatter (소스 스플래터): connected circle-to-chip entrance. */
export const MetaballChipRow = ({
  items,
  elapsed,
  metrics,
  gap = 6,
  separation,
}: {
  items: ResultChipItem[];
  elapsed: number;
  metrics?: ChipMetrics;
  gap?: number;
  separation?: ChipSeparation;
}) => {
  const measure = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<number[]>([]);
  const id = `chip-${useId().replace(/:/g, "")}`;
  useLayoutEffect(() => {
    let active = true;
    const update = () => {
      const root = measure.current;
      if (!active || !root) return;
      const scale =
        root.getBoundingClientRect().width /
        Number.parseFloat(getComputedStyle(root).width);
      if (!scale) return;
      const next = Array.from(root.children).map(
        (child) => child.getBoundingClientRect().width / scale,
      );
      setWidths((old) =>
        old.length === next.length &&
        old.every((w, i) => Math.abs(w - next[i]) < 0.01)
          ? old
          : next,
      );
    };
    update();
    void fontReady.then(update);
    return () => {
      active = false;
    };
  }, [items, metrics, gap]);

  const height = metrics?.height ?? RESULT_CHIP_HEIGHT;
  const rowWidth =
    widths.reduce((sum, width) => sum + width, 0) +
    Math.max(0, widths.length - 1) * gap;
  const poses = chipRowPoses(elapsed, widths, height, gap, separation);
  const settled = elapsed >= chipRowDuration(items.length);
  const ready = widths.length === items.length;
  const colors = items.map(
    (item) => item.colors ?? resultChipColors(item.axis),
  );
  let cursor = 0;
  const boundaries = widths.slice(0, -1).map((width) => {
    cursor += width + gap;
    return cursor - gap / 2;
  });
  const gradient = (key: "fill" | "border") => (
    <linearGradient
      id={`${id}-${key}`}
      x1={0}
      x2={rowWidth}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor={colors[0]?.[key]} />
      {boundaries.flatMap((boundary, i) => [
        <stop
          key={`${i}-a`}
          offset={(boundary - gap / 2) / rowWidth}
          stopColor={colors[i][key]}
        />,
        <stop
          key={`${i}-b`}
          offset={(boundary + gap / 2) / rowWidth}
          stopColor={colors[i + 1][key]}
        />,
      ])}
      <stop offset={1} stopColor={colors[colors.length - 1]?.[key]} />
    </linearGradient>
  );
  return (
    <div
      data-metaball-chip-row
      data-chip-elapsed={elapsed}
      data-chip-neck-duration={separation?.neckDurationSeconds ?? 0.12}
      style={{
        position: "relative",
        width: "100%",
        height,
        overflow: "visible",
      }}
    >
      <div
        ref={measure}
        aria-hidden
        style={{
          display: "flex",
          gap,
          position: "absolute",
          width: "100%",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            style={resultChipStyle(item.axis, metrics, item.colors)}
          >
            <ResultChipContent {...item} metrics={metrics} />
          </span>
        ))}
      </div>
      {settled ? (
        <div style={{ display: "flex", gap }}>
          {items.map((item, i) => (
            <ResultChip key={i} {...item} metrics={metrics} />
          ))}
        </div>
      ) : ready ? (
        <>
          <svg
            aria-hidden
            width="100%"
            height={height}
            style={{ position: "absolute", overflow: "visible" }}
          >
            <defs>
              <g id={`${id}-shape`}>
                {poses.map((pose, i) =>
                  pose.visible ? (
                    <rect
                      key={i}
                      x={pose.x}
                      y={(height - pose.height) / 2}
                      width={pose.width}
                      height={pose.height}
                      rx={pose.height / 2}
                    />
                  ) : null,
                )}
                {poses.slice(1).map((pose, i) => (
                  <path
                    key={`bridge-${i}`}
                    d={chipBridge(poses[i], pose, height, separation)}
                  />
                ))}
              </g>
              <filter
                id={`${id}-erode`}
                x="-10%"
                y="-100%"
                width="120%"
                height="300%"
              >
                <feMorphology
                  operator="erode"
                  radius={metrics?.borderWidth ?? 1}
                />
              </filter>
              <mask
                id={`${id}-body`}
                maskUnits="userSpaceOnUse"
                x={-16}
                y={-12}
                width={rowWidth + 32}
                height={height + 24}
                style={{ maskType: "luminance" }}
              >
                <use href={`#${id}-shape`} fill="white" />
              </mask>
              <mask
                id={`${id}-edge`}
                maskUnits="userSpaceOnUse"
                x={-16}
                y={-12}
                width={rowWidth + 32}
                height={height + 24}
                style={{ maskType: "luminance" }}
              >
                <use href={`#${id}-shape`} fill="white" />
                <use
                  href={`#${id}-shape`}
                  fill="black"
                  filter={`url(#${id}-erode)`}
                />
              </mask>
              {gradient("fill")}
              {gradient("border")}
            </defs>
            <rect
              x={-16}
              y={-12}
              width={rowWidth + 32}
              height={height + 24}
              fill={`url(#${id}-fill)`}
              mask={`url(#${id}-body)`}
            />
            <rect
              x={-16}
              y={-12}
              width={rowWidth + 32}
              height={height + 24}
              fill={`url(#${id}-border)`}
              mask={`url(#${id}-edge)`}
            />
          </svg>
          {poses.map((pose, i) => (
            <span
              key={i}
              data-animated-chip={i}
              style={{
                position: "absolute",
                boxSizing: "border-box",
                left: pose.x,
                top: (height - pose.height) / 2,
                width: pose.width,
                height: pose.height,
                paddingInline: metrics?.paddingX ?? 8,
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                // Clip the content as one layer: rounded overflow can cut nested
                // SVGs incorrectly in Chromium's headless renderer.
                overflow: items[i].icon ? "visible" : "hidden",
                clipPath: items[i].icon ? "inset(0 round 999px)" : undefined,
                whiteSpace: "nowrap",
                color: colors[i].text,
                fontSize: metrics?.fontSize ?? 10,
                fontWeight: metrics?.fontWeight ?? 500,
                lineHeight: metrics ? `${metrics.lineHeight}px` : undefined,
                opacity: pose.visible ? pose.textOpacity : 0,
              }}
            >
              <ResultChipContent {...items[i]} metrics={metrics} />
            </span>
          ))}
        </>
      ) : null}
    </div>
  );
};
