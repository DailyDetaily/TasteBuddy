import { TASTE_CIRCULAR_LOOP_LAYOUT } from './tasteCircularLoopLayout';
import {
  buildGuideDots,
  buildRingGradient,
  getStepGeometry,
} from './tasteCircularLoopUtils';

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

interface OuterRingProps {
  outerRingInset: number;
  outerRingThickness: number;
  ringGradient: string;
}

interface InnerGlowProps {
  glowTransparentColor: string;
  outerRingInset: number;
  outerRingThickness: number;
  ringBaseColorSoft: string;
}

interface GuideDotsProps {
  guideDotDiameter: number;
  ringGuideBaseColor: string;
}

interface StepMarkersProps {
  activeLevel: number;
  nodeColors: readonly string[];
  nodeRadius: number;
  stepCount: number;
}

function OuterRing({ outerRingInset, outerRingThickness, ringGradient }: OuterRingProps) {
  return (
    <div
      className="absolute rounded-full"
      aria-hidden="true"
      style={{
        inset: `${outerRingInset}px`,
        background: ringGradient,
        boxShadow: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.42)',
      }}
    >
      <div
        className="absolute rounded-full bg-white"
        style={{
          inset: `${outerRingThickness}px`,
        }}
      />
    </div>
  );
}

function InnerGlow({
  glowTransparentColor,
  outerRingInset,
  outerRingThickness,
  ringBaseColorSoft,
}: InnerGlowProps) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      aria-hidden="true"
      style={{
        inset: `${outerRingInset + outerRingThickness + 2}px`,
        background: `radial-gradient(circle, ${ringBaseColorSoft} 0%, ${glowTransparentColor} 44%, ${glowTransparentColor.slice(0, -2)}00 72%)`,
      }}
    />
  );
}

function GuideDots({ guideDotDiameter, ringGuideBaseColor }: GuideDotsProps) {
  const guideDots = buildGuideDots(ringGuideBaseColor);

  return (
    <>
      {guideDots.map(({ color, x, y }, index) => (
        <circle
          key={`guide-dot-${index}`}
          cx={x}
          cy={y}
          r={guideDotDiameter / 2}
          fill={color}
          opacity="0.9"
        />
      ))}
    </>
  );
}

function StepMarkers({ activeLevel, nodeColors, nodeRadius, stepCount }: StepMarkersProps) {
  return (
    <>
      {Array.from({ length: stepCount }, (_, index) => {
        const { labelX, labelY, nodeX, nodeY, step } = getStepGeometry(index);
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
              r={nodeRadius}
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
    </>
  );
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
  const {
    guideDotDiameter,
    outerRingInset,
    outerRingThickness,
    size,
    stepCount,
    nodeRadius,
  } = TASTE_CIRCULAR_LOOP_LAYOUT;
  const ringGradient = buildRingGradient(ringBaseColor, ringBaseColorSoft);
  const guideDots = buildGuideDots(ringGuideBaseColor);

  return (
    <div className={`relative aspect-square w-full max-w-[320px] ${className}`}>
      <OuterRing
        outerRingInset={outerRingInset}
        outerRingThickness={outerRingThickness}
        ringGradient={ringGradient}
      />
      <InnerGlow
        glowTransparentColor={glowTransparentColor}
        outerRingInset={outerRingInset}
        outerRingThickness={outerRingThickness}
        ringBaseColorSoft={ringBaseColorSoft}
      />

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10 h-full w-full overflow-visible"
        role="img"
        aria-label={ariaLabel}
      >
        <GuideDots
          guideDotDiameter={guideDotDiameter}
          ringGuideBaseColor={ringGuideBaseColor}
        />
        <StepMarkers
          activeLevel={activeLevel}
          nodeColors={nodeColors}
          nodeRadius={nodeRadius}
          stepCount={stepCount}
        />
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
