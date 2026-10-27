export type LinePathPoint = { x: number; y: number };

/** Centerline radius. With a 12px track, its inner edge has radius 6px. */
export const LINE_CORNER_RADIUS = 12;

const direction = (a: LinePathPoint, b: LinePathPoint) => {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  return {
    x: length ? (b.x - a.x) / length : 0,
    y: length ? (b.y - a.y) / length : 0,
    length,
  };
};

/** Fixed fillets from the complete, chronological (increasing x) data layout.
 * Trim at most half of either adjacent segment so neighboring rounds cannot overlap.
 */
export function roundedLineCorners(
  points: LinePathPoint[],
  radius = LINE_CORNER_RADIUS,
) {
  return points.map((point, index) => {
    if (!index || index === points.length - 1) return null;
    const incoming = direction(points[index - 1], point);
    const outgoing = direction(point, points[index + 1]);
    const angle = Math.acos(
      Math.max(
        -1,
        Math.min(1, incoming.x * outgoing.x + incoming.y * outgoing.y),
      ),
    );
    if (
      !incoming.length ||
      !outgoing.length ||
      angle < 1e-6 ||
      Math.PI - angle < 1e-6 ||
      radius <= 0
    )
      return null;
    const tangent = Math.tan(angle / 2);
    const trim = Math.min(
      radius * tangent,
      incoming.length / 2,
      outgoing.length / 2,
    );
    const arcRadius = trim / tangent;
    const entry = {
      x: point.x - incoming.x * trim,
      y: point.y - incoming.y * trim,
    };
    const exit = {
      x: point.x + outgoing.x * trim,
      y: point.y + outgoing.y * trim,
    };
    const sign = incoming.x * outgoing.y - incoming.y * outgoing.x > 0 ? 1 : -1;
    const center = {
      x: entry.x - sign * incoming.y * arcRadius,
      y: entry.y + sign * incoming.x * arcRadius,
    };
    const handle = (4 / 3) * Math.tan(angle / 4) * arcRadius;
    return {
      entry,
      exit,
      center,
      radius: arcRadius,
      sweep: sign > 0 ? 1 : 0,
      control1: {
        x: entry.x + incoming.x * handle,
        y: entry.y + incoming.y * handle,
      },
      control2: {
        x: exit.x - outgoing.x * handle,
        y: exit.y - outgoing.y * handle,
      },
      // A historical dot follows the rounded centerline at its original x.
      marker: {
        x: point.x,
        y:
          center.y -
          sign *
            Math.sqrt(Math.max(0, arcRadius ** 2 - (point.x - center.x) ** 2)),
      },
    };
  });
}

/** SVG uses exact arcs; Figma's vector API accepts their cubic representation. */
export function buildRoundedLinePath(
  points: LinePathPoint[],
  radius = LINE_CORNER_RADIUS,
  cubic = false,
) {
  if (!points.length) return "";
  const corners = roundedLineCorners(points, radius);
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const corner = corners[index];
    if (!corner) {
      path += ` L ${points[index].x} ${points[index].y}`;
      continue;
    }
    const { entry, exit, radius: r, sweep, control1: a, control2: b } = corner;
    path += ` L ${entry.x} ${entry.y}`;
    path += cubic
      ? ` C ${a.x} ${a.y} ${b.x} ${b.y} ${exit.x} ${exit.y}`
      : ` A ${r} ${r} 0 0 ${sweep} ${exit.x} ${exit.y}`;
  }
  if (points.length > 1) {
    const end = points[points.length - 1];
    path += ` L ${end.x} ${end.y}`;
  }
  return path;
}

export function roundedLineMarkers(
  points: LinePathPoint[],
  radius = LINE_CORNER_RADIUS,
) {
  const corners = roundedLineCorners(points, radius);
  return points.map((point, index) => corners[index]?.marker ?? point);
}
