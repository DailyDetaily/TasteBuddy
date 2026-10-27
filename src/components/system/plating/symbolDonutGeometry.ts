import { arc, type DefaultArcObject } from 'd3-shape';

/** Reference pie outer corners, with the original 1px-at-32 geometry scaled uniformly to the 56px default.
 * Coordinates are scaled to the existing 184-unit SVG construction space. */
export const SYMBOL_DONUT = {
  diameter: 184,
  gap: 184 / 32,
  outerCorner: 184 * 10 / 86,
  innerCornerArcLength: (184 / 32) * Math.PI / 2 * 3,
  innerCornerMaxSetback: (184 / 32) * 1.4,
} as const;

type Point = readonly [number, number];
type Op = { command: 'M' | 'L' | 'C' | 'Z'; data: number[] };

class ArcRecorder {
  ops: Op[] = [];
  moveTo(x: number, y: number) { this.ops.push({ command: 'M', data: [x, y] }); }
  lineTo(x: number, y: number) { this.ops.push({ command: 'L', data: [x, y] }); }
  closePath() { this.ops.push({ command: 'Z', data: [] }); }
  arc(x: number, y: number, r: number, start: number, end: number, ccw = false) {
    const tau = 2 * Math.PI;
    let delta = end - start;
    if (Math.abs(delta) < 1e-10) return;
    if (ccw) { while (delta > 0) delta -= tau; delta = Math.max(-tau, delta); }
    else { while (delta < 0) delta += tau; delta = Math.min(tau, delta); }
    const steps = Math.ceil(Math.abs(delta) / (Math.PI / 2));
    for (let i = 0; i < steps; i++) {
      const a = start + delta * i / steps;
      const b = start + delta * (i + 1) / steps;
      const k = 4 / 3 * Math.tan((b - a) / 4);
      this.ops.push({ command: 'C', data: [
        x + r * (Math.cos(a) - k * Math.sin(a)), y + r * (Math.sin(a) + k * Math.cos(a)),
        x + r * (Math.cos(b) + k * Math.sin(b)), y + r * (Math.sin(b) - k * Math.cos(b)),
        x + r * Math.cos(b), y + r * Math.sin(b),
      ] });
    }
  }
}

const polar = (p: Point, center: Point = [0, 0]) => Math.atan2(p[1] - center[1], p[0] - center[0]);

type TransitionOpening = { gapProgress: number };

function smallSector(startAngle: number, endAngle: number, radius: number, gap = SYMBOL_DONUT.gap) {
  const datum: DefaultArcObject = {
    innerRadius: 0, outerRadius: radius, startAngle, endAngle,
    padAngle: 2 * Math.asin(Math.min(1, gap / (2 * radius))),
  };
  const recorder = new ArcRecorder();
  arc().padRadius(radius).cornerRadius(SYMBOL_DONUT.outerCorner * radius / (SYMBOL_DONUT.diameter / 2)).context(recorder as unknown as CanvasRenderingContext2D)(datum);
  return recorder.ops;
}

function roundedSector(startAngle: number, endAngle: number, separated: boolean, outerRadius: number, transition?: TransitionOpening) {
  const gap = SYMBOL_DONUT.gap * (transition?.gapProgress ?? 1);
  const halfGap = gap / 2;
  const span = endAngle - startAngle;
  const recorder = new ArcRecorder();
  if (!separated) {
    recorder.moveTo(0, -outerRadius);
    recorder.arc(0, 0, outerRadius, -Math.PI / 2, Math.PI * 3 / 2);
    recorder.closePath();
    return recorder.ops;
  }
  const sine = Math.sin(span / 2);
  const radius = Math.min(SYMBOL_DONUT.outerCorner * outerRadius / (SYMBOL_DONUT.diameter / 2), (outerRadius * sine - halfGap) / (1 + sine) * 0.98);
  if (radius <= 0) return smallSector(startAngle, endAngle, outerRadius, gap);
  const along = Math.sqrt(Math.max(0, (outerRadius - radius) ** 2 - (halfGap + radius) ** 2));
  const cornerTurn = Math.abs(Math.PI - span);
  const cotangent = Math.cos(span / 2) / sine;
  // Match the visible rounding, but also limit how far an acute corner is
  // cut back. Equal arc lengths alone leave narrow slices too far from center.
  const radiusForArc = cornerTurn > 1e-6 ? SYMBOL_DONUT.innerCornerArcLength / cornerTurn : 0;
  const radiusForSpace = Math.abs(cotangent) > 1e-6
    ? Math.max(0, along - halfGap * cotangent) / Math.abs(cotangent) * (transition ? 1 : 0.98) : Infinity;
  const radiusForSetback = 1 - sine > 1e-6
    ? SYMBOL_DONUT.innerCornerMaxSetback * sine / (1 - sine) : Infinity;
  let tipRadius = Math.min(radiusForArc, radiusForSpace, radiusForSetback);
  const reflex = span > Math.PI;
  if (reflex && transition) {
    // The same tangent arc, with its radius bounded so the concave tip cannot
    // cross the center by more than the original half-gap. No overlay/filler.
    tipRadius = Math.min(radiusForSpace, Math.max(tipRadius, halfGap));
  }
  const middle = (startAngle + endAngle) / 2;
  const tipDistance = (halfGap + (reflex ? -tipRadius : tipRadius)) / sine;
  const tipCenter: Point = [tipDistance * Math.sin(middle), -tipDistance * Math.cos(middle)];
  const makeSide = (angle: number, start: boolean) => {
    const sign = start ? 1 : -1;
    const direction: Point = [Math.sin(angle), -Math.cos(angle)];
    const normal: Point = [sign * Math.cos(angle), sign * Math.sin(angle)];
    const center: Point = [along * direction[0] + (halfGap + radius) * normal[0], along * direction[1] + (halfGap + radius) * normal[1]];
    const side: Point = [along * direction[0] + halfGap * normal[0], along * direction[1] + halfGap * normal[1]];
    const ring: Point = [center[0] * outerRadius / (outerRadius - radius), center[1] * outerRadius / (outerRadius - radius)];
    const tip: Point = [tipCenter[0] + (reflex ? tipRadius : -tipRadius) * normal[0], tipCenter[1] + (reflex ? tipRadius : -tipRadius) * normal[1]];
    return { center, side, ring, tip };
  };
  const start = makeSide(startAngle, true), end = makeSide(endAngle, false);
  const draw = (center: Point, r: number, from: Point, to: Point, ccw = false) => recorder.arc(center[0], center[1], r, polar(from, center), polar(to, center), ccw);
  recorder.moveTo(...start.ring);
  draw([0, 0], outerRadius, start.ring, end.ring);
  draw(end.center, radius, end.ring, end.side);
  recorder.lineTo(...end.tip);
  draw(tipCenter, tipRadius, end.tip, start.tip, reflex);
  recorder.lineTo(...start.side);
  draw(start.center, radius, start.side, start.ring);
  recorder.closePath();
  return recorder.ops;
}

/** Angle allocation preserves the actual shares. Optional radius changes only the fill front;
 * the construction center, angular boundaries and gap stay fixed. Product callers use the full default. */
export function symbolDonutGeometry(values: readonly number[], outerRadius = SYMBOL_DONUT.diameter / 2, transition?: TransitionOpening) {
  if (!Number.isFinite(outerRadius) || outerRadius <= 0) return [];
  const radius = outerRadius;
  const maximum = Math.max(0, ...values.filter(v => Number.isFinite(v) && v > 0));
  if (!maximum) return [];
  const weights = values.map(v => Number.isFinite(v) && v > 0 ? v / maximum : 0);
  const total = weights.reduce((a, b) => a + b, 0);
  const separated = weights.filter(v => v > 0).length > 1;
  let angle = 0;
  return weights.flatMap((weight, index) => {
    if (!weight) return [];
    const fraction = weight / total;
    const startAngle = angle;
    angle += fraction * 2 * Math.PI;
    return [{ index, fraction, startAngle, endAngle: angle, path: roundedSector(startAngle, angle, separated, radius, transition).map(op => op.command + op.data.map(n => (n + SYMBOL_DONUT.diameter / 2).toFixed(4)).join(' ')).join(' ') }];
  });
}
