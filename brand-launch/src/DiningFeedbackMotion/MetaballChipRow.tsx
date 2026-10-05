import { useId, useLayoutEffect, useRef, useState } from "react";
import { fontReady } from "../fonts";
import {
  ResultChip,
  RESULT_CHIP_HEIGHT,
  resultChipColors,
  resultChipStyle,
  type ResultChipItem,
} from "./ResultChip";
import { chipBridge, chipRowDuration, chipRowPoses } from "./chip-motion";

/** Sauce Splatter (소스 스플래터): connected circle-to-chip entrance. */
export const MetaballChipRow = ({
  items,
  elapsed,
}: {
  items: ResultChipItem[];
  elapsed: number;
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
  }, [items]);

  const height = RESULT_CHIP_HEIGHT;
  const rowWidth =
    widths.reduce((sum, width) => sum + width, 0) +
    Math.max(0, widths.length - 1) * 6;
  const poses = chipRowPoses(elapsed, widths, height);
  const settled = elapsed >= chipRowDuration(items.length);
  const ready = widths.length === items.length;
  const colors = items.map((item) => resultChipColors(item.axis));
  let cursor = 0;
  const boundaries = widths.slice(0, -1).map((width) => {
    cursor += width + 6;
    return cursor - 3;
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
          offset={(boundary - 3) / rowWidth}
          stopColor={colors[i][key]}
        />,
        <stop
          key={`${i}-b`}
          offset={(boundary + 3) / rowWidth}
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
          gap: 6,
          position: "absolute",
          width: "100%",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {items.map((item, i) => (
          <span key={i} style={resultChipStyle(item.axis)}>
            {item.label}
          </span>
        ))}
      </div>
      {settled ? (
        <div style={{ display: "flex", gap: 6 }}>
          {items.map((item, i) => (
            <ResultChip key={i} {...item} />
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
                    d={chipBridge(poses[i], pose, height)}
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
                <feMorphology operator="erode" radius={1} />
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
                paddingInline: 8,
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                overflow: "hidden",
                whiteSpace: "nowrap",
                color: colors[i].text,
                fontSize: 10,
                fontWeight: 500,
                opacity: pose.visible ? pose.textOpacity : 0,
              }}
            >
              {items[i].label}
            </span>
          ))}
        </>
      ) : null}
    </div>
  );
};
