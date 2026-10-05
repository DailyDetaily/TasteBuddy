// The wordmark fill uses inscribed circular brushes. Measure the same local
// ink radius here so a moving cut ends in convex caps inside the actual font.
export function titleBrushes(ink: ImageData, scale: number): Float32Array {
  const { width, height, data } = ink;
  const distance = new Float32Array(width * height);
  for (let i = 0; i < distance.length; i++)
    distance[i] = data[i * 4 + 3] >= 8 ? 1e8 : 0;

  const size = Math.max(width, height);
  const values = new Float32Array(size);
  const result = new Float32Array(size);
  const sites = new Int32Array(size);
  const edges = new Float64Array(size + 1);
  const transform = (length: number) => {
    let last = 0;
    sites[0] = 0;
    edges[0] = -Infinity;
    edges[1] = Infinity;
    for (let point = 1; point < length; point++) {
      const crossing = (site: number) =>
        (values[point] + point * point - values[site] - site * site) /
        (2 * (point - site));
      let edge = crossing(sites[last]);
      while (edge <= edges[last]) edge = crossing(sites[--last]);
      sites[++last] = point;
      edges[last] = edge;
      edges[last + 1] = Infinity;
    }
    last = 0;
    for (let point = 0; point < length; point++) {
      while (edges[last + 1] < point) last++;
      result[point] = (point - sites[last]) ** 2 + values[sites[last]];
    }
  };
  for (let y = 0; y < height; y++) {
    values.set(distance.subarray(y * width, (y + 1) * width));
    transform(width);
    distance.set(result.subarray(0, width), y * width);
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) values[y] = distance[y * width + x];
    transform(height);
    for (let y = 0; y < height; y++) distance[y * width + x] = result[y];
  }

  // Keep brushes on the stroke's centerline. Brushes scattered along a
  // counter's inner edge leave small concave bites in curved cut ends.
  const skeleton = new Uint8Array(width * height);
  let candidates: number[] = [];
  for (let pixel = 0; pixel < skeleton.length; pixel++) {
    if (data[pixel * 4 + 3] < 8) continue;
    skeleton[pixel] = 1;
    candidates.push(pixel);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      const remove: number[] = [];
      for (const pixel of candidates) {
        const x = pixel % width, y = Math.floor(pixel / width);
        if (!x || !y || x === width - 1 || y === height - 1) continue;
        const n = [
          skeleton[pixel - width], skeleton[pixel - width + 1],
          skeleton[pixel + 1], skeleton[pixel + width + 1],
          skeleton[pixel + width], skeleton[pixel + width - 1],
          skeleton[pixel - 1], skeleton[pixel - width - 1],
        ];
        const count = n.reduce((sum, value) => sum + value, 0);
        if (count < 2 || count > 6) continue;
        let transitions = 0;
        for (let i = 0; i < 8; i++) if (!n[i] && n[(i + 1) % 8]) transitions++;
        if (transitions !== 1) continue;
        const cornerA = pass ? n[0] * n[2] * n[6] : n[0] * n[2] * n[4];
        const cornerB = pass ? n[0] * n[4] * n[6] : n[2] * n[4] * n[6];
        if (!cornerA && !cornerB) remove.push(pixel);
      }
      if (!remove.length) continue;
      changed = true;
      for (const pixel of remove) skeleton[pixel] = 0;
      candidates = candidates.filter((pixel) => skeleton[pixel]);
    }
  }
  const brushes: number[] = [];
  for (const pixel of candidates) {
    const radius = Math.sqrt(distance[pixel]);
    if (radius < 1) continue;
    brushes.push((pixel % width + 0.5) / scale,
      (Math.floor(pixel / width) + 0.5) / scale, radius / scale);
  }
  return new Float32Array(brushes);
}

export function titleHoverMask(ink: ImageData, brushes: Float32Array, scale: number) {
  const mask = new Uint8Array(ink.width * ink.height);
  for (let i = 0; i < brushes.length; i += 3) {
    const cx = brushes[i] * scale, cy = brushes[i + 1] * scale;
    const radius = Math.max(0.55, brushes[i + 2] * scale * 0.65);
    for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(ink.height - 1, Math.ceil(cy + radius)); y++) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(ink.width - 1, Math.ceil(cx + radius)); x++) {
        const pixel = y * ink.width + x;
        if (ink.data[pixel * 4 + 3] >= 160 && (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= radius ** 2)
          mask[pixel] = 1;
      }
    }
  }
  return mask;
}

export function titleStrokeMap(ink: ImageData) {
  const { width, height, data } = ink;
  const labels = new Int32Array(width * height);
  const queue = new Int32Array(labels.length);
  const bounds: { x: number; y: number; width: number; height: number }[] = [];
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] < 8) continue;
    const id = bounds.length + 1;
    let read = 0, end = 1;
    queue[0] = start;
    labels[start] = id;
    let left = width, top = height, right = 0, bottom = 0;
    while (read < end) {
      const pixel = queue[read++];
      const x = pixel % width, y = Math.floor(pixel / width);
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          const next = yy * width + xx;
          if (labels[next] || data[next * 4 + 3] < 8) continue;
          labels[next] = id;
          queue[end++] = next;
        }
      }
    }
    bounds.push({ x: left, y: top, width: right - left + 1, height: bottom - top + 1 });
  }
  return { labels, bounds };
}

// Map the full width of the ink to positions along its centerline. A color
// front then crosses the stroke, rather than drawing a circle inside it.
export function titleColorPath(
  width: number,
  height: number,
  inkIndices: Uint32Array,
  centers: Uint32Array,
) {
  const nodes = new Int32Array(width * height).fill(-1);
  centers.forEach((pixel, node) => { nodes[pixel] = node; });
  const links: number[][] = Array.from({ length: centers.length }, () => []);
  const edges: number[] = [];
  const connect = (a: number, b: number) => {
    const edge = edges.length / 2;
    edges.push(a, b);
    links[a].push(edge);
    if (a !== b) links[b].push(edge);
  };
  centers.forEach((pixel, node) => {
    const x = pixel % width, y = Math.floor(pixel / width);
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy >= height || xx >= width) continue;
      const next = nodes[yy * width + xx];
      if (next < 0) continue;
      // Avoid a diagonal shortcut when the centerline already turns a corner.
      if (dx && dy && (nodes[y * width + xx] >= 0 || nodes[yy * width + x] >= 0)) continue;
      connect(node, next);
    }
  });
  centers.forEach((_, node) => { if (!links[node].length) connect(node, node); });
  let x = Float32Array.from(centers, (pixel) => pixel % width + 0.5);
  let y = Float32Array.from(centers, (pixel) => Math.floor(pixel / width) + 0.5);
  for (let pass = 0; pass < 2; pass++) {
    const nextX = new Float32Array(x), nextY = new Float32Array(y);
    links.forEach((adjacent, node) => {
      if (adjacent.length !== 2) return;
      const neighbors = adjacent.map((edge) => edges[edge * 2] === node ? edges[edge * 2 + 1] : edges[edge * 2]);
      nextX[node] = x[node] * 0.5 + (x[neighbors[0]] + x[neighbors[1]]) * 0.25;
      nextY[node] = y[node] * 0.5 + (y[neighbors[0]] + y[neighbors[1]]) * 0.25;
    });
    x = nextX; y = nextY;
  }
  const lengths = Float32Array.from({ length: edges.length / 2 }, (_, edge) =>
    Math.hypot(x[edges[edge * 2 + 1]] - x[edges[edge * 2]], y[edges[edge * 2 + 1]] - y[edges[edge * 2]]),
  );
  const cellSize = 4, columns = Math.ceil(width / cellSize), rows = Math.ceil(height / cellSize);
  const cells: number[][] = Array.from({ length: columns * rows }, () => []);
  const dxs = new Float32Array(lengths.length), dys = new Float32Array(lengths.length);
  const inverseLengths = new Float32Array(lengths.length);
  for (let edge = 0; edge < lengths.length; edge++) {
    const a = edges[edge * 2], b = edges[edge * 2 + 1];
    dxs[edge] = x[b] - x[a]; dys[edge] = y[b] - y[a];
    inverseLengths[edge] = 1 / (dxs[edge] ** 2 + dys[edge] ** 2 || 1);
    const left = Math.floor(Math.min(x[a], x[b]) / cellSize);
    const right = Math.floor(Math.max(x[a], x[b]) / cellSize);
    const top = Math.floor(Math.min(y[a], y[b]) / cellSize);
    const bottom = Math.floor(Math.max(y[a], y[b]) / cellSize);
    for (let yy = top; yy <= bottom; yy++)
      for (let xx = left; xx <= right; xx++) cells[yy * columns + xx].push(edge);
  }
  const edgeAt = new Int32Array(width * height).fill(-1);
  const along = new Float32Array(width * height);
  const checked = new Int32Array(lengths.length);
  let visit = 0;
  for (const pixel of inkIndices) {
    const px = pixel % width + 0.5, py = Math.floor(pixel / width) + 0.5;
    const column = Math.floor(px / cellSize), row = Math.floor(py / cellSize);
    let nearest = Infinity;
    visit++;
    // Search nearby centerline cells and stop as soon as any farther cell
    // is guaranteed to be beyond the closest segment already found.
    for (let ring = 0; ring < Math.max(columns, rows); ring++) {
      const left = Math.max(0, column - ring), right = Math.min(columns - 1, column + ring);
      const top = Math.max(0, row - ring), bottom = Math.min(rows - 1, row + ring);
      for (let yy = top; yy <= bottom; yy++) {
        for (let xx = left; xx <= right; xx++) {
          if (ring && Math.abs(xx - column) !== ring && Math.abs(yy - row) !== ring) continue;
          for (const edge of cells[yy * columns + xx]) {
            if (checked[edge] === visit) continue;
            checked[edge] = visit;
            const a = edges[edge * 2], dx = dxs[edge], dy = dys[edge];
            const t = Math.max(0, Math.min(1, ((px - x[a]) * dx + (py - y[a]) * dy) * inverseLengths[edge]));
            const distance = (px - x[a] - dx * t) ** 2 + (py - y[a] - dy * t) ** 2;
            if (distance >= nearest) continue;
            nearest = distance; edgeAt[pixel] = edge; along[pixel] = t;
          }
        }
      }
      const outside = Math.min(left ? px - left * cellSize : Infinity,
        right < columns - 1 ? (right + 1) * cellSize - px : Infinity,
        top ? py - top * cellSize : Infinity,
        bottom < rows - 1 ? (bottom + 1) * cellSize - py : Infinity);
      if (nearest <= outside * outside) break;
    }
  }
  return { x, y, centers, edges: new Uint32Array(edges), lengths, links, edgeAt, along, inkIndices };
}

export function titleColorDistances(
  path: ReturnType<typeof titleColorPath>,
  startX: number,
  startY: number,
  angle: number,
  limit: number,
) {
  const { x, y, edges, lengths, links, edgeAt, along, inkIndices } = path;
  const color = new Float32Array(edgeAt.length).fill(Infinity);
  let source = -1, sourceT = 0, nearest = Infinity;
  for (let edge = 0; edge < lengths.length; edge++) {
    const a = edges[edge * 2], b = edges[edge * 2 + 1];
    const dx = x[b] - x[a], dy = y[b] - y[a];
    const t = Math.max(0, Math.min(1, ((startX - x[a]) * dx + (startY - y[a]) * dy) / (dx * dx + dy * dy || 1)));
    const distance = (startX - x[a] - dx * t) ** 2 + (startY - y[a] - dy * t) ** 2;
    if (distance >= nearest) continue;
    nearest = distance; source = edge; sourceT = t;
  }
  if (source < 0) return color;
  const distances = new Float32Array(x.length).fill(Infinity);
  const signs = new Int8Array(x.length);
  const heap = new Int32Array(x.length), positions = new Int32Array(x.length).fill(-1);
  let length = 0;
  const offer = (node: number, distance: number, sign: number) => {
    distance = Math.fround(distance);
    if (distance >= distances[node] || distance > limit) return;
    distances[node] = distance; signs[node] = sign;
    let at = positions[node];
    if (at < 0) at = length++;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      if (distances[heap[parent]] <= distance) break;
      heap[at] = heap[parent]; positions[heap[at]] = at; at = parent;
    }
    heap[at] = node; positions[node] = at;
  };
  const a = edges[source * 2], b = edges[source * 2 + 1];
  const direction = (x[b] - x[a]) * Math.cos(angle) + (y[b] - y[a]) * Math.sin(angle) < 0 ? -1 : 1;
  offer(a, sourceT * lengths[source], -direction);
  offer(b, (1 - sourceT) * lengths[source], direction);
  while (length) {
    const node = heap[0], tail = heap[--length];
    positions[node] = -1;
    if (length) {
      let at = 0;
      while (at * 2 + 1 < length) {
        let child = at * 2 + 1;
        if (child + 1 < length && distances[heap[child + 1]] < distances[heap[child]]) child++;
        if (distances[tail] <= distances[heap[child]]) break;
        heap[at] = heap[child]; positions[heap[at]] = at; at = child;
      }
      heap[at] = tail; positions[tail] = at;
    }
    for (const edge of links[node]) {
      const next = edges[edge * 2] === node ? edges[edge * 2 + 1] : edges[edge * 2];
      offer(next, distances[node] + lengths[edge], signs[node]);
    }
  }
  for (const pixel of inkIndices) {
    const edge = edgeAt[pixel];
    if (edge < 0) continue;
    if (edge === source) {
      color[pixel] = (along[pixel] - sourceT) * lengths[edge] * direction;
      continue;
    }
    const a = edges[edge * 2], b = edges[edge * 2 + 1];
    const fromA = distances[a] + along[pixel] * lengths[edge];
    const fromB = distances[b] + (1 - along[pixel]) * lengths[edge];
    if (Number.isFinite(Math.min(fromA, fromB)))
      color[pixel] = fromA <= fromB ? fromA * signs[a] : fromB * signs[b];
  }
  return color;
}

// Distance travels only through this connected stroke, including around bowls
// and counters. These arrivals drive the same round brushes as the wordmark.
export function titleStrokeDistances(
  labels: Int32Array,
  sourceWidth: number,
  bounds: { x: number; y: number; width: number; height: number },
  stroke: number,
  startX: number,
  startY: number,
  angle: number,
  halfWidth: number,
  limit: number,
) {
  const pixels = bounds.width * bounds.height;
  const distances = new Float32Array(pixels).fill(Infinity);
  // Integer buckets avoid allocating a heap object for every visited pixel.
  // 1/100-pixel costs keep the diagonal approximation below a tenth of a CSS pixel.
  const maxCost = Math.ceil(limit * 100);
  const costs = new Int32Array(pixels).fill(0x7fffffff);
  const heads = new Int32Array(maxCost + 1).fill(-1);
  const next = new Int32Array(pixels).fill(-1);
  const previous = new Int32Array(pixels).fill(-1);
  const queued = new Uint8Array(pixels);
  let pending = 0;
  const offer = (pixel: number, cost: number) => {
    if (queued[pixel]) {
      if (previous[pixel] < 0) heads[costs[pixel]] = next[pixel];
      else next[previous[pixel]] = next[pixel];
      if (next[pixel] >= 0) previous[next[pixel]] = previous[pixel];
    } else { queued[pixel] = 1; pending++; }
    costs[pixel] = cost;
    distances[pixel] = cost / 100;
    previous[pixel] = -1;
    next[pixel] = heads[cost];
    if (heads[cost] >= 0) previous[heads[cost]] = pixel;
    heads[cost] = pixel;
  };
  // Start across the full ink cross-section, rather than at the cursor point.
  // The opening then separates along the stroke axis instead of expanding as
  // a circular hole through its width.
  const axisX = Math.cos(angle), axisY = Math.sin(angle);
  const extent = Math.ceil(halfWidth + 1);
  for (let y = Math.max(bounds.y, Math.floor(startY) - extent); y < Math.min(bounds.y + bounds.height, Math.floor(startY) + extent + 1); y++) {
    for (let x = Math.max(bounds.x, Math.floor(startX) - extent); x < Math.min(bounds.x + bounds.width, Math.floor(startX) + extent + 1); x++) {
      if (labels[y * sourceWidth + x] !== stroke) continue;
      const dx = x + 0.5 - startX, dy = y + 0.5 - startY;
      if (Math.abs(dx * axisX + dy * axisY) > 0.75) continue;
      if (Math.abs(-dx * axisY + dy * axisX) > halfWidth + 1) continue;
      const pixel = (y - bounds.y) * bounds.width + x - bounds.x;
      offer(pixel, 0);
    }
  }
  let cost = 0;
  while (pending) {
    while (cost <= maxCost && heads[cost] < 0) cost++;
    if (cost > maxCost) break;
    const current = heads[cost];
    heads[cost] = next[current];
    if (heads[cost] >= 0) previous[heads[cost]] = -1;
    queued[current] = 0;
    pending--;
    const x = current % bounds.width, y = Math.floor(current / bounds.width);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= bounds.width || yy >= bounds.height) continue;
        if (labels[(bounds.y + yy) * sourceWidth + bounds.x + xx] !== stroke) continue;
        const pixel = yy * bounds.width + xx;
        const distance = cost + (dx && dy ? 141 : 100);
        if (distance >= costs[pixel] || distance > maxCost) continue;
        offer(pixel, distance);
      }
    }
  }
  return distances;
}

// The zero crossings are cap centers. Move these centers along the path while
// keeping their radii, rather than expanding a pixel front that flattens caps.
export function titleRefillPath(
  path: ReturnType<typeof titleColorPath>,
  gap: Float32Array,
  blocked: Uint8Array,
  scale: number,
) {
  const { edges, lengths, links } = path;
  const distances = new Float32Array(gap.length).fill(Infinity);
  const heap = new Int32Array(gap.length);
  const positions = new Int32Array(gap.length).fill(-1);
  let length = 0;
  const offer = (pixel: number, distance: number) => {
    distance = Math.fround(distance);
    if (blocked[pixel] || distance >= distances[pixel]) return;
    distances[pixel] = distance;
    let at = positions[pixel];
    if (at < 0) at = length++;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      if (distances[heap[parent]] <= distance) break;
      heap[at] = heap[parent]; positions[heap[at]] = at;
      at = parent;
    }
    heap[at] = pixel; positions[pixel] = at;
  };
  for (let edge = 0; edge < lengths.length; edge++) {
    const a = edges[edge * 2], b = edges[edge * 2 + 1];
    if ((gap[a] > 0) === (gap[b] > 0)) continue;
    const t = Number.isFinite(gap[a]) && Number.isFinite(gap[b])
      ? gap[a] / (gap[a] - gap[b]) : gap[a] > 0 ? 1 : 0;
    offer(a, t * lengths[edge] / scale);
    offer(b, (1 - t) * lengths[edge] / scale);
  }
  const flood = () => { while (length) {
    const pixel = heap[0], tail = heap[--length];
    positions[pixel] = -1;
    if (length) {
      let at = 0;
      while (at * 2 + 1 < length) {
        let child = at * 2 + 1;
        if (child + 1 < length && distances[heap[child + 1]] < distances[heap[child]]) child++;
        if (distances[tail] <= distances[heap[child]]) break;
        heap[at] = heap[child]; positions[heap[at]] = at;
        at = child;
      }
      heap[at] = tail; positions[tail] = at;
    }
    for (const edge of links[pixel]) {
      const next = edges[edge * 2] === pixel ? edges[edge * 2 + 1] : edges[edge * 2];
      offer(next, distances[pixel] + lengths[edge] / scale);
    }
  } };
  flood();
  // A completely erased terminal grows back from its original end.
  const seen = new Uint8Array(gap.length);
  for (let start = 0; start < gap.length; start++) {
    if (seen[start] || blocked[start] || gap[start] <= 0 || Number.isFinite(distances[start])) continue;
    const component = [start]; seen[start] = 1;
    for (let i = 0; i < component.length; i++) {
      for (const edge of links[component[i]]) {
        const next = edges[edge * 2] === component[i] ? edges[edge * 2 + 1] : edges[edge * 2];
        if (seen[next] || blocked[next] || gap[next] <= 0 || Number.isFinite(distances[next])) continue;
        seen[next] = 1; component.push(next);
      }
    }
    const ends = component.filter((node) => links[node].length <= 1);
    if (!ends.length) {
      component.sort((a, b) => path.y[a] - path.y[b] || path.x[a] - path.x[b]);
      ends.push(component[0], component[component.length - 1]);
    }
    for (const node of ends) offer(node, 0);
  }
  flood();
  return Float32Array.from(distances, (distance, node) => gap[node] > 0 ? distance : -distance);
}

export type TitleRefillCap = { x: number; y: number; radius: number; dx: number; dy: number };

export function titleRefillCaps(path: ReturnType<typeof titleColorPath>, gap: Float32Array, radii: Float32Array) {
  const caps: TitleRefillCap[] = [];
  for (let edge = 0; edge < path.lengths.length; edge++) {
    const a = path.edges[edge * 2], b = path.edges[edge * 2 + 1];
    if ((gap[a] > 0) === (gap[b] > 0) || !path.lengths[edge]) continue;
    const t = Number.isFinite(gap[a]) && Number.isFinite(gap[b])
      ? gap[a] / (gap[a] - gap[b]) : gap[a] > 0 ? 1 : 0;
    const sign = gap[b] > 0 ? 1 : -1;
    caps.push({
      x: path.x[a] + (path.x[b] - path.x[a]) * t,
      y: path.y[a] + (path.y[b] - path.y[a]) * t,
      radius: radii[a] + (radii[b] - radii[a]) * t,
      dx: (path.x[b] - path.x[a]) / path.lengths[edge] * sign,
      dy: (path.y[b] - path.y[a]) / path.lengths[edge] * sign,
    });
  }
  return caps;
}

export function paintTitleRefill(
  removed: Float32Array,
  ink: Uint8Array,
  width: number,
  bodies: TitleRefillCap[],
  caps: TitleRefillCap[],
) {
  const height = removed.length / width;
  const paint = (left: number, top: number, right: number, bottom: number, distance: (x: number, y: number) => number) => {
    for (let y = Math.max(0, Math.floor(top)); y <= Math.min(height - 1, Math.ceil(bottom)); y++) {
      for (let x = Math.max(0, Math.floor(left)); x <= Math.min(width - 1, Math.ceil(right)); x++) {
        const pixel = y * width + x;
        if (!ink[pixel] || !removed[pixel]) continue;
        const t = Math.max(0, Math.min(1, 0.5 - distance(x + 0.5, y + 0.5)));
        removed[pixel] = Math.min(removed[pixel], 1 - t * t * (3 - 2 * t));
      }
    }
  };
  for (const cap of [...bodies, ...caps]) {
    if (cap.radius <= 0) continue;
    const extent = cap.radius + 0.5;
    paint(cap.x - extent, cap.y - extent, cap.x + extent, cap.y + extent,
      (x, y) => Math.hypot(x - cap.x, y - cap.y) - cap.radius);
  }
  // Only facing caps interact. The smooth union forms a connected neck near
  // contact while distant caps retain their original circular silhouette.
  for (let i = 0; i < caps.length; i++) {
    for (let j = i + 1; j < caps.length; j++) {
      const a = caps[i], b = caps[j], dx = b.x - a.x, dy = b.y - a.y;
      const blend = Math.min(a.radius, b.radius) * 1.2;
      if (a.dx * b.dx + a.dy * b.dy > -0.35 || dx * a.dx + dy * a.dy <= 0 || dx * b.dx + dy * b.dy >= 0) continue;
      if (dx * dx + dy * dy < 0.25 || Math.hypot(dx, dy) > a.radius + b.radius + blend) continue;
      paint(Math.max(a.x - a.radius - blend, b.x - b.radius - blend),
        Math.max(a.y - a.radius - blend, b.y - b.radius - blend),
        Math.min(a.x + a.radius + blend, b.x + b.radius + blend),
        Math.min(a.y + a.radius + blend, b.y + b.radius + blend), (x, y) => {
          const da = Math.hypot(x - a.x, y - a.y) - a.radius;
          const db = Math.hypot(x - b.x, y - b.y) - b.radius;
          const h = Math.max(0, 1 - Math.abs(da - db) / blend);
          return Math.min(da, db) - h * h * blend * 0.25;
        });
    }
  }
}

// Visit every raster cell crossed by a pointer segment, including thin strokes
// between browser events. Clip first so off-title movement stays inexpensive.
export function traceTitleSegment(
  x0: number, y0: number, x1: number, y1: number,
  width: number, height: number,
  visit: (x: number, y: number) => void,
) {
  const dx = x1 - x0, dy = y1 - y0;
  let from = 0, to = 1;
  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) from = Math.max(from, t);
    else to = Math.min(to, t);
    return from <= to;
  };
  if (!clip(-dx, x0) || !clip(dx, width - 0.0001 - x0) ||
      !clip(-dy, y0) || !clip(dy, height - 0.0001 - y0)) return;
  const startX = x0 + dx * from, startY = y0 + dy * from;
  const endX = Math.min(width - 1, Math.max(0, Math.floor(x0 + dx * to)));
  const endY = Math.min(height - 1, Math.max(0, Math.floor(y0 + dy * to)));
  let x = Math.min(width - 1, Math.max(0, Math.floor(startX)));
  let y = Math.min(height - 1, Math.max(0, Math.floor(startY)));
  const stepX = Math.sign(dx), stepY = Math.sign(dy);
  const stepTimeX = dx ? 1 / Math.abs(dx) : Infinity;
  const stepTimeY = dy ? 1 / Math.abs(dy) : Infinity;
  let nextX = dx ? (x + (stepX > 0 ? 1 : 0) - startX) / dx : Infinity;
  let nextY = dy ? (y + (stepY > 0 ? 1 : 0) - startY) / dy : Infinity;
  for (let step = 0; step <= width + height; step++) {
    if (x < 0 || y < 0 || x >= width || y >= height) break;
    visit(x, y);
    if (x === endX && y === endY) break;
    if (nextX < nextY) { x += stepX; nextX += stepTimeX; }
    else if (nextY < nextX) { y += stepY; nextY += stepTimeY; }
    else { x += stepX; y += stepY; nextX += stepTimeX; nextY += stepTimeY; }
  }
}
