interface TasteCircularLoopProps {
  activeLevel: number;
  ariaLabel: string;
  className?: string;
  glowTransparentColor: string;
  nodeColors: readonly string[];
  ringBaseColor: string;
  ringBaseColorSoft: string;
  ringGuideBaseColor: string;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const OUTER_RING_INSET = 43;
const OUTER_RING_THICKNESS = 18;
const RING_RADIUS = 108;
const GUIDE_RADIUS = 108;
const GUIDE_DOT_DIAMETER = 1;
const GUIDE_DOT_GAP = 3;
const NODE_RADIUS = 9;
const LABEL_OFFSET = 4;
const STEP_COUNT = 10;

function buildRingGradient(ringBaseColor: string, ringBaseColorSoft: string) {
  return `conic-gradient(from 0deg, ${ringBaseColorSoft} 0%, ${ringBaseColor} 90%, ${ringBaseColorSoft} 100%)`;
}

function normalizeHex(hex: string) {
  const value = hex.replace('#', '');
  return value.length === 3
    ? value
        .split('')
        .map((char) => char + char)
        .join('')
    : value;
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(normalizeHex(hex), 16);

  return {
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
  };
}

function mixHex(colorA: string, colorB: string, ratio: number) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const mix = Math.min(Math.max(ratio, 0), 1);

  const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, '0');

  return `#${toHex(a.r + (b.r - a.r) * mix)}${toHex(a.g + (b.g - a.g) * mix)}${toHex(a.b + (b.b - a.b) * mix)}`;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getGuideGradientColor(baseColor: string, progress: number) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const stops = [
    { color: mixHex(baseColor, '#FFFFFF', 0.78), position: 0 },
    { color: mixHex(baseColor, '#FFFFFF', 0.62), position: 0.35 },
    { color: mixHex(baseColor, '#FFFFFF', 0.38), position: 0.65 },
    { color: mixHex(baseColor, '#FFFFFF', 0.12), position: 0.9 },
    { color: mixHex(baseColor, '#FFFFFF', 0.78), position: 1 },
  ];

  for (let index = 0; index < stops.length - 1; index += 1) {
    const current = stops[index];
    const next = stops[index + 1];

    if (clampedProgress >= current.position && clampedProgress <= next.position) {
      const localProgress = (clampedProgress - current.position) / (next.position - current.position || 1);
      return mixHex(current.color, next.color, localProgress);
    }
  }

  return stops[stops.length - 1].color;
}

export default function TasteCircularLoop({
  activeLevel,
  ariaLabel,
  className = '',
  glowTransparentColor,
  nodeColors,
  ringBaseColor,
  ringBaseColorSoft,
  ringGuideBaseColor,
}: TasteCircularLoopProps) {
  const ringGradient = buildRingGradient(ringBaseColor, ringBaseColorSoft);
  const guideCircumference = 2 * Math.PI * GUIDE_RADIUS;
  const guideDotCount = Math.max(
    1,
    Math.round(guideCircumference / (GUIDE_DOT_DIAMETER + GUIDE_DOT_GAP)),
  );
  const guideDots = Array.from({ length: guideDotCount }, (_, index) => {
    const progress = index / guideDotCount;
    const angle = -90 + progress * 360;
    const { x, y } = polarToCartesian(CENTER, CENTER, GUIDE_RADIUS, angle);

    return {
      color: getGuideGradientColor(ringGuideBaseColor, progress),
      x,
      y,
    };
  });

  return (
    <div className={`relative aspect-square w-full max-w-[320px] ${className}`}>
      <div
        className="absolute rounded-full"
        aria-hidden="true"
        style={{
          inset: `${OUTER_RING_INSET}px`,
          background: ringGradient,
          boxShadow: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.42)',
        }}
      >
        <div
          className="absolute rounded-full bg-white"
          style={{
            inset: `${OUTER_RING_THICKNESS}px`,
          }}
        />
      </div>

      <div
        className="absolute rounded-full pointer-events-none"
        aria-hidden="true"
        style={{
          inset: `${OUTER_RING_INSET + OUTER_RING_THICKNESS + 2}px`,
          background: `radial-gradient(circle, ${ringBaseColorSoft} 0%, ${glowTransparentColor} 44%, ${glowTransparentColor.slice(0, -2)}00 72%)`,
        }}
      />

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative z-10 h-full w-full overflow-visible"
        role="img"
        aria-label={ariaLabel}
      >
        {guideDots.map(({ color, x, y }, index) => (
          <circle
            key={`guide-dot-${index}`}
            cx={x}
            cy={y}
            r={GUIDE_DOT_DIAMETER / 2}
            fill={color}
            opacity="0.9"
          />
        ))}

        {Array.from({ length: STEP_COUNT }, (_, index) => {
          const step = index + 1;
          const angle = ((360 / STEP_COUNT) * index - 90) * (Math.PI / 180);
          const nodeX = CENTER + RING_RADIUS * Math.cos(angle);
          const nodeY = CENTER + RING_RADIUS * Math.sin(angle);
          const labelX = nodeX;
          const labelY = nodeY - NODE_RADIUS - LABEL_OFFSET;
          const isActive = step === activeLevel;
          const nodeFill = nodeColors[index];
          const labelColor = isActive ? nodeFill : '#333333';

          return (
            <g key={step}>
              <text
                x={labelX}
                y={labelY}
                fill={labelColor}
                fontSize="10"
                fontWeight={isActive ? 600 : 400}
                textAnchor="middle"
                dominantBaseline="auto"
                style={{
                  transition: 'fill 260ms ease, opacity 260ms ease',
                  opacity: isActive ? 1 : 0.88,
                  transformOrigin: `${labelX}px ${labelY}px`,
                  animation: isActive ? 'tb-core-loop-label-pulse 0.8s ease-in-out infinite' : undefined,
                }}
              >
                {step}
              </text>
              <circle
                cx={nodeX}
                cy={nodeY}
                r={NODE_RADIUS}
                fill={nodeFill}
                style={{
                  opacity: 1,
                  transformOrigin: `${nodeX}px ${nodeY}px`,
                  animation: isActive ? 'tb-core-loop-node-pulse 0.8s ease-in-out infinite' : undefined,
                  filter: isActive ? `drop-shadow(0 0 12px ${nodeFill}66)` : 'none',
                  transition: 'filter 260ms ease',
                }}
              />
            </g>
          );
        })}
      </svg>

      <style>{`
        @keyframes tb-core-loop-node-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.28);
          }
        }

        @keyframes tb-core-loop-label-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.06);
          }
        }
      `}</style>
    </div>
  );
}
