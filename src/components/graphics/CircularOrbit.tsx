import type { SVGProps } from 'react';

interface CircularOrbitProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  circleRadius?: number;
  labelOffset?: number;
  nodeCount?: number;
  nodeDiameter?: number;
  showLabels?: boolean;
  size?: number;
  strokeWidth?: number;
}

const DEFAULT_SIZE = 320;
const DEFAULT_NODE_COUNT = 10;
const DEFAULT_BASE_COLOR = '#FF9900';
const RING_SEGMENT_COUNT = 120;

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
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
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

function buildGradientColors(baseColor: string, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const progress = index / count;
    const tint = 0.52 * (1 - Math.sin(progress * Math.PI));
    return tintColor(baseColor, tint);
  });
}

export default function CircularOrbit({
  circleRadius = 108,
  className,
  labelOffset = 4,
  nodeCount = DEFAULT_NODE_COUNT,
  nodeDiameter = 18,
  showLabels = true,
  size = DEFAULT_SIZE,
  strokeWidth = 18,
  ...props
}: CircularOrbitProps) {
  const center = size / 2;
  const circumference = 2 * Math.PI * circleRadius;
  const segmentLength = circumference / RING_SEGMENT_COUNT;
  const dashLength = segmentLength + 0.75;
  const outerRadius = circleRadius + strokeWidth / 2;
  const nodeRadius = nodeDiameter / 2;
  const ringColors = buildGradientColors(DEFAULT_BASE_COLOR, RING_SEGMENT_COUNT);
  const nodeColors = buildGradientColors(DEFAULT_BASE_COLOR, nodeCount);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Circular orbit"
      {...props}
    >
      <circle
        cx={center}
        cy={center}
        r={circleRadius}
        fill="none"
        stroke={tintColor(DEFAULT_BASE_COLOR, 0.55)}
        strokeOpacity="0.28"
        strokeWidth={strokeWidth}
      />

      {ringColors.map((color, index) => (
        <circle
          key={`ring-segment-${index}`}
          cx={center}
          cy={center}
          r={circleRadius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashLength} ${circumference}`}
          strokeDashoffset={-index * segmentLength}
          transform={`rotate(-90 ${center} ${center})`}
        />
      ))}

      {Array.from({ length: nodeCount }, (_, index) => {
        const step = index + 1;
        const angle = ((360 / nodeCount) * index - 90) * (Math.PI / 180);
        const x = center + outerRadius * Math.cos(angle);
        const y = center + outerRadius * Math.sin(angle);
        const labelY = y - nodeRadius - labelOffset;

        return (
          <g key={`node-${step}`}>
            {showLabels && (
              <text
                x={x}
                y={labelY}
                fill="#333333"
                fontSize="10"
                fontWeight="500"
                textAnchor="middle"
              >
                {step}
              </text>
            )}
            <circle
              cx={x}
              cy={y}
              r={nodeRadius}
              fill={nodeColors[index]}
            />
          </g>
        );
      })}
    </svg>
  );
}
