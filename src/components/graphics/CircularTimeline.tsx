import type { CSSProperties, HTMLAttributes } from 'react';

import './circular-timeline.css';

interface CircularTimelineProps extends HTMLAttributes<HTMLDivElement> {
  activeNode?: number;
  ariaLabel?: string;
  baseColor?: string;
  labels?: Array<string | number>;
  labelOrbitRadius?: number;
  nodeCount?: number;
  nodeOrbitRadius?: number;
  outerRingInset?: number;
  ringThickness?: number;
  showInnerRing?: boolean;
  showOuterRing?: boolean;
  surfaceColor?: string;
}

const VIEWBOX_SIZE = 100;
const CENTER = VIEWBOX_SIZE / 2;
const NODE_ORBIT_RADIUS = 36;
const LABEL_ORBIT_RADIUS = 42;
const DEFAULT_NODE_COUNT = 10;
const NODE_DIAMETER_PX = 18;
const COMPONENT_MAX_SIZE_PX = 320;
const NODE_RADIUS = (NODE_DIAMETER_PX / COMPONENT_MAX_SIZE_PX) * VIEWBOX_SIZE / 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const value = Number.parseInt(expanded, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function tintColor(hex: string, tintRatio: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = clamp(tintRatio, 0, 1);

  return rgbToHex(
    r + (255 - r) * mix,
    g + (255 - g) * mix,
    b + (255 - b) * mix,
  );
}

function buildGradient(baseColor: string, nodeCount: number) {
  const colors = Array.from({ length: nodeCount }, (_, index) =>
    tintColor(baseColor, (nodeCount - 1 - index) / nodeCount),
  );

  const smoothStops = colors.map((color, index) => `${color} ${(index / nodeCount) * 100}%`);
  smoothStops.push(`${colors[0]} 100%`);

  const steppedStops = colors.flatMap((color, index) => {
    const start = (index / nodeCount) * 100;
    const end = ((index + 1) / nodeCount) * 100;

    return [`${color} ${start}%`, `${color} ${end}%`];
  });

  return {
    colors,
    gradient: `conic-gradient(from 0deg, ${smoothStops.join(', ')})`,
    steppedGradient: `conic-gradient(from 0deg, ${steppedStops.join(', ')})`,
  };
}

export default function CircularTimeline({
  activeNode,
  ariaLabel = 'Circular timeline',
  baseColor = '#FF9900',
  className = '',
  labels,
  labelOrbitRadius = LABEL_ORBIT_RADIUS,
  nodeCount = DEFAULT_NODE_COUNT,
  nodeOrbitRadius = NODE_ORBIT_RADIUS,
  outerRingInset = 23,
  ringThickness = 18,
  showInnerRing = true,
  showOuterRing = true,
  style,
  surfaceColor = '#FFFFFF',
  ...props
}: CircularTimelineProps) {
  const safeNodeCount = Math.max(2, nodeCount);
  const { colors, gradient, steppedGradient } = buildGradient(baseColor, safeNodeCount);
  const safeLabels = labels?.length === safeNodeCount
    ? labels
    : Array.from({ length: safeNodeCount }, (_, index) => index + 1);

  const rootStyle = {
    ...style,
    '--timeline-outer-ring-inset': `${outerRingInset}px`,
    '--timeline-outer-ring-gradient': steppedGradient,
    '--timeline-ring-gradient': gradient,
    '--timeline-ring-thickness': `${ringThickness}px`,
    '--timeline-surface': surfaceColor,
  } as CSSProperties;

  return (
    <div
      className={`circular-timeline ${className}`.trim()}
      role="img"
      aria-label={ariaLabel}
      style={rootStyle}
      {...props}
    >
      {showOuterRing && <div className="circular-timeline__outer-ring" aria-hidden="true" />}
      {showInnerRing && <div className="circular-timeline__ring" aria-hidden="true" />}

      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="circular-timeline__svg"
        aria-hidden="true"
      >
        {Array.from({ length: safeNodeCount }, (_, index) => {
          const angle = ((360 / safeNodeCount) * index - 90) * (Math.PI / 180);
          const nodeX = CENTER + nodeOrbitRadius * Math.cos(angle);
          const nodeY = CENTER + nodeOrbitRadius * Math.sin(angle);
          const labelX = CENTER + labelOrbitRadius * Math.cos(angle);
          const labelY = CENTER + labelOrbitRadius * Math.sin(angle);
          const isActive = activeNode === index + 1;

          return (
            <g key={index + 1}>
              <text
                x={labelX}
                y={labelY}
                className={`circular-timeline__label ${isActive ? 'circular-timeline__label--active' : ''}`.trim()}
              >
                {safeLabels[index]}
              </text>
              <circle
                cx={nodeX}
                cy={nodeY}
                r={NODE_RADIUS}
                fill={colors[index]}
                className={`circular-timeline__node ${isActive ? 'circular-timeline__node--active' : ''}`.trim()}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
