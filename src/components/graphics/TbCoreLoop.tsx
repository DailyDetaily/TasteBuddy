interface TbCoreLoopProps {
  activeLevel: number;
  className?: string;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const OUTER_RING_INSET = 43;
const OUTER_RING_THICKNESS = 18;
const RING_RADIUS = 108;
const GUIDE_RADIUS = 108;
const NODE_RADIUS = 9;
const LABEL_RADIUS = 91;
const STEP_COUNT = 10;
const RING_BASE_COLOR = '#FFEBCC';
const RING_BASE_COLOR_SOFT = '#FFEBCC1A';
const RING_GUIDE_COLOR = '#FFEBCC';
const RING_GLOW_SOFT = '#FFEBCC1A';
const RING_GLOW_FAINT = '#FFEBCC08';

const SWEET_SCALE = [
  '#FFF5E5',
  '#FFEBCC',
  '#FFE0B2',
  '#FFD699',
  '#FFCC7F',
  '#FFC266',
  '#FFB74C',
  '#FFAD33',
  '#FFA319',
  '#FF9900',
] as const;

function buildRingGradient() {
  return `conic-gradient(from 0deg, ${RING_BASE_COLOR_SOFT} 0%, ${RING_BASE_COLOR} 90%, ${RING_BASE_COLOR_SOFT} 100%)`;
}

export default function TbCoreLoop({ activeLevel, className = '' }: TbCoreLoopProps) {
  const ringGradient = buildRingGradient();

  return (
    <div
      className={`relative aspect-square w-full max-w-[320px] ${className}`}
      data-name="TB_Core Loop"
      data-node-id="2606:1965"
    >
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
          background:
            `radial-gradient(circle, ${RING_GLOW_SOFT} 0%, ${RING_GLOW_FAINT} 44%, rgba(255, 235, 204, 0) 72%)`,
        }}
      />

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative z-10 h-full w-full overflow-visible"
        role="img"
        aria-label="TB Core Loop"
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={GUIDE_RADIUS}
          fill="none"
          stroke={RING_GUIDE_COLOR}
          strokeWidth="1.5"
          strokeDasharray="1.5 4"
          strokeLinecap="round"
          opacity="0.9"
        />

        {Array.from({ length: STEP_COUNT }, (_, index) => {
          const step = index + 1;
          const angle = ((360 / STEP_COUNT) * index - 90) * (Math.PI / 180);
          const nodeX = CENTER + RING_RADIUS * Math.cos(angle);
          const nodeY = CENTER + RING_RADIUS * Math.sin(angle);
          const labelX = CENTER + LABEL_RADIUS * Math.cos(angle);
          const labelY = CENTER + LABEL_RADIUS * Math.sin(angle);
          const isActive = step === activeLevel;
          const nodeFill = SWEET_SCALE[index];
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
                dominantBaseline="middle"
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
