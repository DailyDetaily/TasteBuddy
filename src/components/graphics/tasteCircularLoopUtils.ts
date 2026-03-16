import { TASTE_CIRCULAR_LOOP_LAYOUT } from './tasteCircularLoopLayout';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

export function mixHex(colorA: string, colorB: string, ratio: number) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const mix = clamp(ratio, 0, 1);

  const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, '0');

  return `#${toHex(a.r + (b.r - a.r) * mix)}${toHex(a.g + (b.g - a.g) * mix)}${toHex(a.b + (b.b - a.b) * mix)}`;
}

export function buildRingGradient(ringBaseColor: string, ringBaseColorSoft: string) {
  return `conic-gradient(from 0deg, ${ringBaseColorSoft} 0%, ${ringBaseColor} 90%, ${ringBaseColorSoft} 100%)`;
}

export function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export function getGuideGradientColor(baseColor: string, progress: number) {
  const clampedProgress = clamp(progress, 0, 1);
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

export function buildGuideDots(baseColor: string) {
  const { center, guideDotDiameter, guideDotGap, guideRadius } = TASTE_CIRCULAR_LOOP_LAYOUT;
  const circumference = 2 * Math.PI * guideRadius;
  const dotCount = Math.max(1, Math.round(circumference / (guideDotDiameter + guideDotGap)));

  return Array.from({ length: dotCount }, (_, index) => {
    const progress = index / dotCount;
    const angle = -90 + progress * 360;
    const { x, y } = polarToCartesian(center, center, guideRadius, angle);

    return {
      color: getGuideGradientColor(baseColor, progress),
      x,
      y,
    };
  });
}

export function getStepGeometry(index: number) {
  const { center, labelOffset, nodeRadius, ringRadius, stepCount } = TASTE_CIRCULAR_LOOP_LAYOUT;
  const angle = ((360 / stepCount) * index - 90) * (Math.PI / 180);
  const nodeX = center + ringRadius * Math.cos(angle);
  const nodeY = center + ringRadius * Math.sin(angle);

  return {
    labelX: nodeX,
    labelY: nodeY - nodeRadius - labelOffset,
    nodeX,
    nodeY,
    step: index + 1,
  };
}
