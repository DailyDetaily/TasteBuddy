import { roundedLineCorners, roundedLineMarkers, type LinePathPoint } from './roundedLinePath';

export interface DataAlignedLineLayout {
  controls: LinePathPoint[];
  radius: number;
}

/** Invert the existing circular-fillet layout, without changing source samples.
 * X stays fixed. Only virtual corner heights are adjusted until the original R
 * path crosses every measured point. Track/core share that one resulting path.
 * Dense layouts may reduce R; coincident dates remain an exact straight path. */
export function dataAlignedLineLayout(points: readonly LinePathPoint[], radius = 12): DataAlignedLineLayout {
  const source = points.map(point => ({ ...point }));
  if (source.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return { controls: [], radius: 0 };
  if (source.length < 3 || radius <= 0 || source.some((point, index) => index > 0 && point.x <= source[index - 1].x)) {
    return { controls: source, radius: 0 };
  }
  let effectiveRadius = radius;
  for (let attempt = 0; attempt < 8; attempt++) {
    let controls = source.map(point => ({ ...point }));
    for (let iteration = 0; iteration < 160; iteration++) {
      const markers = roundedLineMarkers(controls, effectiveRadius);
      const errors = markers.map((marker, index) => source[index].y - marker.y);
      if (errors.some(error => !Number.isFinite(error))) break;
      if (Math.max(...errors.map(Math.abs)) < 1e-7) return { controls, radius: effectiveRadius };
      controls = controls.map((point, index) => index === 0 || index === controls.length - 1 ? point
        : { x: point.x, y: point.y + errors[index] * .85 });
    }
    effectiveRadius /= 2;
  }
  return { controls: source, radius: 0 };
}

export type AlignedLineCommand = { kind: 'line'; to: LinePathPoint } |
  { kind: 'curve'; control1: LinePathPoint; control2: LinePathPoint; to: LinePathPoint };

/** Cubic-only consumers (Recharts/Figma) split each circular corner at its actual
 * measured point. This keeps the knot exact as well as sharing the same R shape. */
export function dataAlignedLineCubicCommands(points: readonly LinePathPoint[], radius = 12): AlignedLineCommand[] {
  const layout = dataAlignedLineLayout(points, radius);
  if (!layout.controls.length) return [];
  const corners = roundedLineCorners(layout.controls, layout.radius), commands: AlignedLineCommand[] = [];
  const arc = (from: LinePathPoint, to: LinePathPoint, corner: NonNullable<typeof corners[number]>) => {
    const sign = corner.sweep ? 1 : -1, { center, radius: r } = corner;
    let angle = Math.atan2(to.y - center.y, to.x - center.x) - Math.atan2(from.y - center.y, from.x - center.x);
    if (sign > 0 && angle < 0) angle += 2 * Math.PI;
    if (sign < 0 && angle > 0) angle -= 2 * Math.PI;
    const handle = 4 / 3 * Math.tan(Math.abs(angle) / 4) * r;
    commands.push({ kind: 'curve', to,
      control1: { x: from.x - sign * (from.y - center.y) / r * handle, y: from.y + sign * (from.x - center.x) / r * handle },
      control2: { x: to.x + sign * (to.y - center.y) / r * handle, y: to.y - sign * (to.x - center.x) / r * handle } });
  };
  for (let index = 1; index < points.length - 1; index++) {
    const corner = corners[index];
    if (!corner) commands.push({ kind: 'line', to: points[index] });
    else {
      commands.push({ kind: 'line', to: corner.entry });
      arc(corner.entry, points[index], corner);
      arc(points[index], corner.exit, corner);
    }
  }
  if (points.length > 1) commands.push({ kind: 'line', to: points[points.length - 1] });
  return commands;
}

export function buildDataAlignedCubicPath(points: readonly LinePathPoint[], radius = 12): string {
  if (!points.length || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return '';
  return `M ${points[0].x} ${points[0].y}` + dataAlignedLineCubicCommands(points, radius).map(command => command.kind === 'line'
    ? ` L ${command.to.x} ${command.to.y}`
    : ` C ${command.control1.x} ${command.control1.y} ${command.control2.x} ${command.control2.y} ${command.to.x} ${command.to.y}`).join('');
}
