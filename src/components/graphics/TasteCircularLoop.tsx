import type { CSSProperties } from 'react';
import { TASTE_CIRCULAR_LOOP_LAYOUT } from './tasteCircularLoopLayout';
import {
  TASTE_CIRCULAR_LOOP_LABEL_PULSE_SCALE,
  TASTE_CIRCULAR_LOOP_NODE_PULSE_SCALE,
  TASTE_CIRCULAR_LOOP_PULSE_DURATION_MS,
} from './tasteCircularLoopMotion';
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
        height: `${TASTE_CIRCULAR_LOOP_LAYOUT.size - outerRingInset * 2}px`,
        left: `${outerRingInset}px`,
        top: `${outerRingInset}px`,
        width: `${TASTE_CIRCULAR_LOOP_LAYOUT.size - outerRingInset * 2}px`,
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
        height: `${TASTE_CIRCULAR_LOOP_LAYOUT.size - (outerRingInset + outerRingThickness + 2) * 2}px`,
        left: `${outerRingInset + outerRingThickness + 2}px`,
        top: `${outerRingInset + outerRingThickness + 2}px`,
        width: `${TASTE_CIRCULAR_LOOP_LAYOUT.size - (outerRingInset + outerRingThickness + 2) * 2}px`,
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
        const labelColor = isActive ? '#0F0F0F' : 'rgba(15, 15, 15, 0.5)';

        return (
          <g key={step}>
            <text
              x={labelX}
              y={labelY}
              fill={labelColor}
              fontSize={isActive ? '12' : '10'}
              fontWeight={isActive ? 600 : 400}
              textAnchor="middle"
              dominantBaseline="auto"
              style={{
                transition: 'fill 260ms ease, opacity 260ms ease',
                opacity: isActive ? 1 : 0.88,
                transformOrigin: `${labelX}px ${labelY}px`,
                animation: isActive
                  ? `tb-core-loop-label-pulse ${TASTE_CIRCULAR_LOOP_PULSE_DURATION_MS}ms ease-in-out infinite`
                  : undefined,
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
                animation: isActive
                  ? `tb-core-loop-node-pulse ${TASTE_CIRCULAR_LOOP_PULSE_DURATION_MS}ms ease-in-out infinite`
                  : undefined,
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
  const labelLift = nodeRadius * (TASTE_CIRCULAR_LOOP_NODE_PULSE_SCALE - 1);

  return (
    <div
      className={`relative aspect-square w-full max-w-[320px] ${className}`}
      style={
        {
          '--tb-core-loop-label-lift': `${labelLift}px`,
          '--tb-core-loop-label-scale': `${TASTE_CIRCULAR_LOOP_LABEL_PULSE_SCALE}`,
          '--tb-core-loop-node-scale': `${TASTE_CIRCULAR_LOOP_NODE_PULSE_SCALE}`,
        } as CSSProperties
      }
    >
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
            transform: scale(var(--tb-core-loop-node-scale, 1.28));
          }
        }

        @keyframes tb-core-loop-label-pulse {
          0%, 100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(calc(var(--tb-core-loop-label-lift, 0px) * -1))
              scale(var(--tb-core-loop-label-scale, 1.06));
          }
        }
      `}</style>
    </div>
  );
}
