import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';

import { COMPONENT_TOKENS } from '../../constants/designTokens';
import { buildRoundedAreaPath as buildRoundedPolygonPath } from './plating/roundedAreaPath';
import { miniAreaPointRuns } from './plating/miniAreaGeometry';
import { buildRoundedLinePath, roundedLineMarkers } from './roundedLinePath';
import { getTasteChartLineEnd, getTasteChartLineStart, getTasteChartNodeStart, getTasteLineChartTrack, getTasteChartArea } from '../../constants/tasteColors';

export { buildRoundedPolygonPath };

export type TasteLineChartEntry = {
  id: string;
  taste: string;
  values: number[];
};

interface TasteLineChartProps {
  className?: string;
  entries: TasteLineChartEntry[];
  maxPointGap?: number;
  /** Optional fixed plot width; points spread across this width. */
  plotWidth?: number;
  /** Total plot height, shared across rows with their existing gap. */
  plotHeight?: number;
  /** Render a rounded filled polygon, without lines or dots. */
  area?: boolean;
  /** Two 26px rows and a 4px gap fit a 56px mini chart. */
  compact?: boolean;
}

const CURRENT_DOT_RADIUS = 6;
const HISTORY_DOT_RADIUS = 2;
const TRACK_STROKE_WIDTH = 12;
const LINE_STROKE_WIDTH = 2;
const GRAPH_HEIGHT = 24;
const AREA_HEIGHT = COMPONENT_TOKENS.miniChart.height;
const AREA_RADIUS = 6;
const GRAPH_INSET_X = 6;

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
  plotWidth,
  plotHeight,
  area = false,
  compact = false,
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

  const isCompactLine = compact && !area;
  const compactMetrics = COMPONENT_TOKENS.miniChart.compactLine;
  const currentRadius = isCompactLine ? compactMetrics.currentDiameter / 2 : CURRENT_DOT_RADIUS;
  const historyRadius = isCompactLine ? compactMetrics.historyDiameter / 2 : HISTORY_DOT_RADIUS;
  const graphInsetX = isCompactLine ? currentRadius : GRAPH_INSET_X;
  const trackWidth = isCompactLine ? compactMetrics.trackWidth : TRACK_STROKE_WIDTH;
  const lineWidth = isCompactLine ? compactMetrics.lineWidth : LINE_STROKE_WIDTH;
  const maxVisiblePoints = Math.max(
    2,
    Math.floor(Math.max((plotWidth ?? availableWidth) - graphInsetX * 2, 0) / maxPointGap) + 1,
  );
  const visibleEntries = entries.map((entry) => ({
    ...entry,
    values: entry.values.slice(-maxVisiblePoints),
  }));
  const lineDomain = buildLineDomain(visibleEntries);
  const areaValues = visibleEntries.flatMap(entry => entry.values);
  const areaMaximum = Math.max(0, ...areaValues.filter(value => Number.isFinite(value) && value >= 0));
  const maxValue = lineDomain.maxValue;
  const minValue = lineDomain.minValue;
  const graphHeight = plotHeight !== undefined
    ? (plotHeight - Math.max(0, entries.length - 1) * compactMetrics.rowGap) / Math.max(1, entries.length)
    : area ? AREA_HEIGHT : isCompactLine ? compactMetrics.rowHeight : GRAPH_HEIGHT;

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={`content-stretch flex w-full shrink-0 flex-col gap-[4px] ${className}`}
      data-name={area ? "Taste Area Chart" : "Taste Line Chart"}
      data-density={isCompactLine ? "compact" : "default"}
      style={isCompactLine ? { rowGap: compactMetrics.rowGap } : undefined}
    >
      {visibleEntries.map((entry, index) => {
        const fillColor = getTasteChartLineEnd(entry.taste);
        const trackColor = area ? getTasteChartArea(entry.taste) : getTasteLineChartTrack(entry.taste);
        const lineStartColor = getTasteChartLineStart(entry.taste);
        const graphWidth = plotWidth ??
          (graphInsetX * 2 + Math.max(entry.values.length - 1, 0) * maxPointGap);
        const pointGap = plotWidth !== undefined && entry.values.length > 1
          ? (graphWidth - graphInsetX * 2) / (entry.values.length - 1)
          : maxPointGap;
        const gradientId = `taste-line-chart-gradient-${chartInstanceId}-${index}`;
        const currentGradientId = `${gradientId}-current`;
        const areaRuns = area ? miniAreaPointRuns(entry.values, areaMaximum, graphWidth, graphHeight) : [];
        const points = entry.values.map((value, pointIndex) => {
          const normalized =
            maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);

          return {
            x: area
              ? (entry.values.length > 1 ? graphWidth * pointIndex / (entry.values.length - 1) : 0)
              : Math.round(entry.values.length === 1 && plotWidth !== undefined
                ? graphWidth - graphInsetX
                : graphInsetX + pointGap * pointIndex),
            y: area ? Math.round((1 - normalized) * graphHeight) : Math.round(isCompactLine || plotHeight !== undefined ? graphHeight - currentRadius - normalized * (graphHeight - 2 * currentRadius) : 18 - normalized * 10),
          };
        });
        const graphPath = area ? '' : buildRoundedLinePath(points, trackWidth);
        const markers = area ? points : roundedLineMarkers(points, trackWidth);
        const currentPoint =
          points[points.length - 1] ?? { x: graphWidth - graphInsetX, y: graphHeight / 2 };

        return (
          <div key={entry.id} className="flex w-full items-center justify-end" style={{ height: graphHeight }}>
            <div className="relative" style={{ width: `${graphWidth}px`, height: graphHeight }}>
              <svg className="absolute inset-0 size-full" viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                style={{ '--tb-mini-chart-track': trackColor, '--tb-mini-line-start': lineStartColor, '--tb-mini-line-end': fillColor, '--tb-mini-line-node-start': getTasteChartNodeStart(entry.taste) } as CSSProperties}>
                <defs>
                  <linearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    x2={graphWidth}
                    y1="0"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="var(--tb-mini-line-start)" />
                    <stop offset="100%" stopColor="var(--tb-mini-line-end)" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id={currentGradientId} gradientUnits="userSpaceOnUse" x1="0" x2={graphWidth} y1="0" y2="0">
                    <stop offset="0%" stopColor="var(--tb-mini-line-node-start)" />
                    <stop offset="100%" stopColor="var(--tb-mini-line-end)" />
                  </linearGradient>
                </defs>
                {area && areaRuns.map((run, runIndex) => (
                  <path
                    key={runIndex}
                    data-name="Rounded area surface"
                    d={buildRoundedPolygonPath([...run, { x: run[run.length - 1].x, y: graphHeight }, { x: run[0].x, y: graphHeight }], AREA_RADIUS)}
                    fill="var(--tb-mini-chart-track)"
                  />
                ))}
                {!area && <path
                  d={graphPath}
                  fill="none"
                  stroke="var(--tb-mini-chart-track)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={trackWidth}
                />}
                {!area && <path
                  d={graphPath}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={lineWidth}
                />}
                {!area && markers.slice(0, -1).map((point, historyIndex) => (
                  <circle
                    key={`${entry.id}-history-${historyIndex}`}
                    cx={point.x}
                    cy={point.y}
                    fill={`url(#${gradientId})`}
                    r={historyRadius}
                  />
                ))}
                {!area && <circle
                  data-name="Current node"
                  cx={currentPoint.x}
                  cy={currentPoint.y}
                  fill={`url(#${currentGradientId})`}
                  r={currentRadius}
                />}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
