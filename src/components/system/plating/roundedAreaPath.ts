export type AreaPoint = { x: number; y: number };

/** Circular fillets with a wider visual rounding span on the interior top corners. */
export const roundedAreaCornerSegments = (input: AreaPoint[], radius = 6) => {
  const points = input.filter(
    (p, i) => i === 0 || p.x !== input[i - 1].x || p.y !== input[i - 1].y,
  );
  if (points.length < 3) return [];
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const xy = (p: AreaPoint) => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`;
  return points.map((p, i) => {
    const prev = points[(i + points.length - 1) % points.length];
    const next = points[(i + 1) % points.length];
    const a = Math.hypot(prev.x - p.x, prev.y - p.y);
    const b = Math.hypot(next.x - p.x, next.y - p.y);
    const command = i ? "L" : "M";
    if (!a || !b) return `${command} ${xy(p)}`;
    const u = { x: (prev.x - p.x) / a, y: (prev.y - p.y) / a };
    const v = { x: (next.x - p.x) / b, y: (next.y - p.y) / b };
    const angle = Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y)));
    const tangent = Math.tan(angle / 2);
    if (tangent < 1e-6 || Math.abs(Math.PI - angle) < 1e-6)
      return `${command} ${xy(p)}`;
    // A geometric R6 spans only ~1px at a shallow apex, so it looks sharp.
    // Interior corners round over at least 6px of each adjacent edge. The
    // outer corners retain the source's actual R6 and all edge-length limits.
    const interior = p.x > minX && p.x < maxX;
    const distance = Math.min(
      interior ? Math.max(radius / tangent, radius) : radius / tangent,
      a / 2,
      b / 2,
    );
    const start = { x: p.x + u.x * distance, y: p.y + u.y * distance };
    const end = { x: p.x + v.x * distance, y: p.y + v.y * distance };
    const handle =
      (4 / 3) * Math.tan((Math.PI - angle) / 4) * distance * tangent;
    const c1 = { x: start.x - u.x * handle, y: start.y - u.y * handle };
    const c2 = { x: end.x - v.x * handle, y: end.y - v.y * handle };
    return `${command} ${xy(start)} C ${xy(c1)} ${xy(c2)} ${xy(end)}`;
  });
};

export const buildRoundedAreaPath = (points: AreaPoint[], radius = 6) => {
  const segments = roundedAreaCornerSegments(points, radius);
  return segments.length ? segments.join(" ") + " Z" : "";
};
