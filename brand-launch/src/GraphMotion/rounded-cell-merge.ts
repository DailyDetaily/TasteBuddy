type RoundedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};
type Point = { x: number; y: number };
type ContourNode = { point: Point; neighbors: Set<string> };
const step = 0.5,
  columns = 269,
  rows = 117;
const distance = (x: number, y: number, box: RoundedBox) => {
  const qx = Math.abs(x - box.x - box.width / 2) - box.width / 2 + box.radius;
  const qy = Math.abs(y - box.y - box.height / 2) - box.height / 2 + box.radius;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    box.radius
  );
};

/** Smooth the source field once; the final rounded boundary stays analytic. */
function smoothSourceField(
  values: Float32Array,
  width: number,
  height: number,
) {
  const sigma = 4 / step;
  const reach = Math.ceil(sigma * 3);
  const weights = Array.from({ length: reach * 2 + 1 }, (_, i) =>
    Math.exp(-((i - reach) ** 2) / (2 * sigma * sigma)),
  );
  const sum = weights.reduce((total, weight) => total + weight, 0);
  const horizontal = new Float32Array(values.length);
  const output = new Float32Array(values.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let offset = -reach; offset <= reach; offset++)
        value +=
          values[y * width + Math.min(width - 1, Math.max(0, x + offset))] *
          weights[offset + reach];
      horizontal[y * width + x] = value / sum;
    }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let offset = -reach; offset <= reach; offset++)
        value +=
          horizontal[
            Math.min(height - 1, Math.max(0, y + offset)) * width + x
          ] * weights[offset + reach];
      output[y * width + x] = value / sum;
    }
  return output;
}

/** Morph the R2 source cells directly into the final rounded treemap block. */
export function roundedCellMerge(
  source: readonly RoundedBox[],
  target: RoundedBox,
) {
  // Include the whole filter support outside the graph to avoid edge clamping.
  const padding = Math.ceil(12 / step);
  const sampleWidth = columns + padding * 2;
  const sampleHeight = rows + padding * 2;
  const sourceField = new Float32Array(sampleWidth * sampleHeight);
  for (let y = 0; y < sampleHeight; y++)
    for (let x = 0; x < sampleWidth; x++) {
      const px = (x - padding) * step - 1;
      const py = (y - padding) * step - 1;
      sourceField[y * sampleWidth + x] = Math.min(
        ...source.map((box) => distance(px, py, box)),
      );
    }
  const filtered = smoothSourceField(sourceField, sampleWidth, sampleHeight);
  const from = new Float32Array(columns * rows);
  const soft = new Float32Array(from.length);
  const to = new Float32Array(from.length);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const index = y * columns + x;
      const sample = (y + padding) * sampleWidth + x + padding;
      to[index] = distance(x * step - 1, y * step - 1, target);
      from[index] = sourceField[sample] - to[index];
      soft[index] = filtered[sample] - to[index];
    }
  const paths = new Map<number, string>();
  return (progress: number) => {
    const cached = paths.get(progress);
    if (cached !== undefined) return cached;
    const field = new Float32Array(from.length);
    const entrance = Math.min(1, progress / 0.4);
    const smoothing = entrance * entrance * (3 - 2 * entrance);
    // Once smoothing is established, a single fixed residual decays to zero.
    // There is no late filter release or shrunken contour to inflate again.
    for (let i = 0; i < field.length; i++)
      field[i] =
        to[i] + (1 - progress) * (from[i] + (soft[i] - from[i]) * smoothing);
    const nodes = new Map<string, ContourNode>();
    const cross = (a: number, b: number) => {
      const t = field[a] / (field[a] - field[b]);
      const key =
        t < 1e-7
          ? `v${a}`
          : t > 1 - 1e-7
            ? `v${b}`
            : `${Math.min(a, b)}:${Math.max(a, b)}`;
      if (!nodes.has(key))
        nodes.set(key, {
          point: {
            x: ((a % columns) + ((b % columns) - (a % columns)) * t) * step - 1,
            y:
              (Math.floor(a / columns) +
                (Math.floor(b / columns) - Math.floor(a / columns)) * t) *
                step -
              1,
          },
          neighbors: new Set(),
        });
      return key;
    };
    const triangle = (ids: number[]) => {
      const intersections: string[] = [];
      for (let edge = 0; edge < 3; edge++) {
        const a = ids[edge],
          b = ids[(edge + 1) % 3];
        if (field[a] < 0 !== field[b] < 0) intersections.push(cross(a, b));
      }
      if (intersections.length === 2 && intersections[0] !== intersections[1]) {
        nodes.get(intersections[0])!.neighbors.add(intersections[1]);
        nodes.get(intersections[1])!.neighbors.add(intersections[0]);
      }
    };
    for (let y = 0; y < rows - 1; y++)
      for (let x = 0; x < columns - 1; x++) {
        const a = y * columns + x,
          b = a + 1,
          c = b + columns,
          d = a + columns;
        const count =
          Number(field[a] < 0) +
          Number(field[b] < 0) +
          Number(field[c] < 0) +
          Number(field[d] < 0);
        if (count === 0 || count === 4) continue;
        triangle([a, b, c]);
        triangle([a, c, d]);
      }
    const midpoint = (a: Point, b: Point) =>
      `${((a.x + b.x) / 2).toFixed(4)} ${((a.y + b.y) / 2).toFixed(4)}`;
    const pieces: string[] = [],
      visited = new Set<string>();
    for (const [first] of nodes) {
      if (visited.has(first)) continue;
      const points: Point[] = [];
      let current: string | undefined = first;
      while (current && !visited.has(current)) {
        visited.add(current);
        const node: ContourNode = nodes.get(current)!;
        points.push(node.point);
        current = [...node.neighbors].find((next) => !visited.has(next));
      }
      if (points.length < 3) continue;
      pieces.push(
        `M ${midpoint(points.at(-1)!, points[0])} ` +
          points
            .map(
              (p, i) =>
                `Q ${p.x.toFixed(4)} ${p.y.toFixed(4)} ${midpoint(p, points[(i + 1) % points.length])}`,
            )
            .join(" ") +
          " Z",
      );
    }
    const path = pieces.join(" ");
    if (paths.size >= 64) paths.delete(paths.keys().next().value!);
    paths.set(progress, path);
    return path;
  };
}
