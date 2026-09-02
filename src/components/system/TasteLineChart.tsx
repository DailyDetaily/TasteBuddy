import { useEffect, useId, useRef, useState } from 'react';

import { getTasteColor, getTasteTint, mixHexColors } from '../../constants/tasteColors';

export type TasteLineChartEntry = {
  id: string;
  taste: string;
  values: number[];
};

interface TasteLineChartProps {
  className?: string;
  entries: TasteLineChartEntry[];
  maxPointGap?: number;
}

const CURRENT_DOT_RADIUS = 6;
const HISTORY_DOT_RADIUS = 2;
const TRACK_STROKE_WIDTH = 12;
const LINE_STROKE_WIDTH = 2;
const GRAPH_HEIGHT = 24;
const GRAPH_INSET_X = 6;
const LINE_START_WHITE_MIX = 0.28;

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return '';
  }

  let path = `M ${points[0]?.x ?? 0} ${points[0]?.y ?? 0}`;

  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];

    if (!current) {
      continue;
    }

    path += ` L ${current.x} ${current.y}`;
  }

  return path;
}

function buildLineDomain(entries: TasteLineChartEntry[]) {
  const values = entries.flatMap((entry) => entry.values);

  if (values.length === 0) {
    return { maxValue: 1, minValue: -1 };
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);

  if (rawMin === rawMax) {
    const padding = Math.max(1, Math.abs(rawMin) * 0.2);
    return {
      maxValue: rawMax + padding,
      minValue: rawMin - padding,
    };
  }

  const padding = Math.max(1, (rawMax - rawMin) * 0.18);

  return {
    maxValue: rawMax + padding,
    minValue: rawMin - padding,
  };
}

export default function TasteLineChart({
  className = '',
  entries,
  maxPointGap = 36,
}: TasteLineChartProps) {
  const chartInstanceId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(128);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateWidth = (nextWidth: number) => {
      setAvailableWidth((previousWidth) => {
        const roundedWidth = Math.max(0, Math.round(nextWidth));
        return previousWidth === roundedWidth ? previousWidth : roundedWidth;
      });
    };

    updateWidth(node.clientWidth);

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((resizeEntries) => {
      const entry = resizeEntries[0];
      if (!entry) {
        return;
      }

      updateWidth(entry.contentRect.width);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const maxVisiblePoints = Math.max(
    2,
    Math.floor(Math.max(availableWidth - GRAPH_INSET_X * 2, 0) / maxPointGap) + 1,
  );
  const visibleEntries = entries.map((entry) => ({
    ...entry,
    values: entry.values.slice(-maxVisiblePoints),
  }));
  const { maxValue, minValue } = buildLineDomain(visibleEntries);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`content-stretch flex w-full shrink-0 flex-col gap-[4px] ${className}`}
      data-name="Taste Line Chart"
    >
      {visibleEntries.map((entry, index) => {
        const fillColor = getTasteColor(entry.taste);
        const trackColor = getTasteTint(entry.taste, 0.18);
        const lineStartColor = mixHexColors(fillColor, '#FFFFFF', LINE_START_WHITE_MIX);
        const graphWidth =
          GRAPH_INSET_X * 2 + Math.max(entry.values.length - 1, 0) * maxPointGap;
        const gradientId = `taste-line-chart-gradient-${chartInstanceId}-${index}`;
        const points = entry.values.map((value, pointIndex) => {
          const normalized =
            maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);

          return {
            x: Math.round(GRAPH_INSET_X + maxPointGap * pointIndex),
            y: Math.round(18 - normalized * 10),
          };
        });
        const graphPath = buildLinePath(points);
        const currentPoint =
          points[points.length - 1] ?? { x: graphWidth - GRAPH_INSET_X, y: GRAPH_HEIGHT / 2 };

        return (
          <div key={entry.id} className="flex h-[24px] w-full items-center justify-end">
            <div className="relative h-[24px]" style={{ width: `${graphWidth}px` }}>
              <svg className="absolute inset-0 size-full" viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`}>
                <defs>
                  <linearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    x2={graphWidth}
                    y1="0"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={lineStartColor} />
                    <stop offset="100%" stopColor={fillColor} />
                  </linearGradient>
                </defs>
                <path
                  d={graphPath}
                  fill="none"
                  stroke={trackColor}
                  strokeLinecap="round"
                  strokeWidth={TRACK_STROKE_WIDTH}
                />
                <path
                  d={graphPath}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeLinecap="round"
                  strokeWidth={LINE_STROKE_WIDTH}
                />
                {points.slice(0, -1).map((point, historyIndex) => (
                  <circle
                    key={`${entry.id}-history-${historyIndex}`}
                    cx={point.x}
                    cy={point.y}
                    fill={`url(#${gradientId})`}
                    r={HISTORY_DOT_RADIUS}
                  />
                ))}
              </svg>
              <span
                aria-hidden="true"
                className="absolute rounded-full"
                style={{
                  backgroundColor: fillColor,
                  height: `${CURRENT_DOT_RADIUS * 2}px`,
                  left: `${currentPoint.x}px`,
                  top: `${currentPoint.y}px`,
                  transform: 'translate(-50%, -50%)',
                  width: `${CURRENT_DOT_RADIUS * 2}px`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
