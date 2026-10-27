import {
  getBoundingBox,
  getLength,
  getPointAtLength,
  getSubpaths,
  interpolatePath,
  parsePath,
  reduceInstructions,
  reversePath,
  serializeInstructions,
  type ReducedInstruction,
} from "@remotion/paths";
import type { FoodIconEntry } from "./catalog";

type Point = { x: number; y: number };
type Contour = {
  path: string;
  length: number;
  center: Point;
  closed: boolean;
  samples: Point[];
  opacity: number;
  strokeWidth: number;
};
export type IconMorphPart = {
  from: string;
  to: string;
  entering: boolean;
  leaving: boolean;
  fromOpacity: number;
  toOpacity: number;
  fromWidth: number;
  toWidth: number;
};
const distance = (a: Point, b: Point) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

// SVG permits adjacent arc flags (e.g. "0 011.5 7"). Expand those tokens for
// the path library without changing the checked-in Lucide geometry.
const spacedPath = (path: string) => {
  const counts: Record<string, number> = {
    M: 2,
    L: 2,
    H: 1,
    V: 1,
    C: 6,
    S: 4,
    Q: 4,
    T: 2,
    A: 7,
    Z: 0,
  };
  const tokens: string[] = [];
  let offset = 0,
    command = "",
    parameter = 0;
  while (offset < path.length) {
    const char = path[offset];
    if (/[\s,]/.test(char)) {
      offset++;
      continue;
    }
    if (/[a-df-z]/i.test(char)) {
      command = char.toUpperCase();
      if (!(command in counts))
        throw new Error(`Unsupported SVG command: ${char}`);
      parameter = 0;
      tokens.push(char);
      offset++;
      continue;
    }
    if (!command || counts[command] === 0)
      throw new Error(`Unexpected SVG coordinate: ${path}`);
    const isFlag = command === "A" && (parameter === 3 || parameter === 4);
    const token = isFlag
      ? /^[01]/.exec(path.slice(offset))?.[0]
      : /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i.exec(
          path.slice(offset),
        )?.[0];
    if (!token)
      throw new Error(`Invalid SVG coordinate: ${path.slice(offset)}`);
    tokens.push(token);
    offset += token.length;
    parameter = (parameter + 1) % counts[command];
  }
  return tokens.join(" ");
};

export const iconPrimitivePath = ([
  tag,
  attributes,
]: FoodIconEntry["nodes"][number]) => {
  if (tag === "path") return spacedPath(attributes.d);
  const number = (key: string, fallback = 0) =>
    Number(attributes[key] ?? fallback);
  if (tag === "circle") {
    const x = number("cx"),
      y = number("cy"),
      r = number("r");
    return `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
  }
  if (tag === "rect") {
    const x = number("x"),
      y = number("y"),
      w = number("width"),
      h = number("height");
    const rx = Math.min(number("rx", number("ry")), w / 2);
    const ry = Math.min(number("ry", number("rx")), h / 2);
    if (!rx || !ry) return `M${x} ${y}h${w}v${h}h${-w}Z`;
    return `M${x + rx} ${y}H${x + w - rx}a${rx} ${ry} 0 0 1 ${rx} ${ry}V${y + h - ry}a${rx} ${ry} 0 0 1 ${-rx} ${ry}H${x + rx}a${rx} ${ry} 0 0 1 ${-rx} ${-ry}V${y + ry}a${rx} ${ry} 0 0 1 ${rx} ${-ry}Z`;
  }
  throw new Error(`Unsupported food icon primitive: ${tag}`);
};

const contour = (
  path: string,
  opacity: number,
  strokeWidth: number,
): Contour => {
  const length = getLength(path);
  const box = getBoundingBox(path);
  const samples = Array.from(
    { length: 17 },
    (_, index) =>
      getPointAtLength(path, (length * index) / 16) ?? { x: box.x1, y: box.y1 },
  );
  return {
    path,
    length,
    center: { x: (box.x1 + box.x2) / 2, y: (box.y1 + box.y2) / 2 },
    closed: distance(samples[0], samples[16]) < 0.000001,
    samples,
    opacity,
    strokeWidth,
  };
};

// Rotating a closed contour's existing segment order keeps its geometry intact.
// It lets the next icon start at the closest corresponding edge, avoiding twists.
const rotations = (path: string) => {
  const instructions = reduceInstructions(parsePath(path));
  const first = instructions[0];
  if (first.type !== "M") return [path];
  const origin = { x: first.x, y: first.y };
  let current = origin;
  const segments: { start: Point; instruction: ReducedInstruction }[] = [];
  for (const instruction of instructions.slice(1)) {
    if (instruction.type === "L" || instruction.type === "C") {
      segments.push({ start: current, instruction });
      current = { x: instruction.x, y: instruction.y };
    } else if (
      instruction.type === "Z" &&
      distance(current, origin) > 0.000001
    ) {
      segments.push({ start: current, instruction: { type: "L", ...origin } });
      current = origin;
    }
  }
  if (distance(current, origin) > 0.000001 || segments.length === 0)
    return [path];
  return segments.map(({ start }, index) =>
    serializeInstructions([
      { type: "M", ...start },
      ...segments.slice(index).map((segment) => segment.instruction),
      ...segments.slice(0, index).map((segment) => segment.instruction),
      { type: "Z" },
    ]),
  );
};

const align = (from: Contour, to: Contour) => {
  const candidates = [to.path, reversePath(to.path)].flatMap((path) =>
    from.closed && to.closed ? rotations(path) : [path],
  );
  let best = to.path,
    bestCost = Infinity;
  for (const path of candidates) {
    const length = getLength(path);
    const cost = from.samples.reduce(
      (sum, sample, index) =>
        sum +
        distance(
          sample,
          getPointAtLength(path, (length * index) / 16) ?? to.center,
        ),
      0,
    );
    if (cost < bestCost) {
      best = path;
      bestCost = cost;
    }
  }
  return best;
};

const nearestAnchor = (center: Point, contours: Contour[]) => {
  const points = contours.flatMap((item) => item.samples);
  return points.reduce(
    (best, point) =>
      distance(center, point) < distance(center, best) ? point : best,
    points[0] ?? center,
  );
};
const pointPath = ({ x, y }: Point) => `M${x} ${y}L${x} ${y}`;

export const prepareIconMorph = (
  fromIcon: FoodIconEntry,
  toIcon: FoodIconEntry,
): IconMorphPart[] => {
  const contours = (icon: FoodIconEntry) =>
    icon.nodes.flatMap((node) =>
      getSubpaths(iconPrimitivePath(node)).map((path) =>
        contour(
          path,
          Number(node[1].opacity ?? 1),
          Number(node[1]["stroke-width"] ?? 2),
        ),
      ),
    );
  const source = contours(fromIcon);
  const target = contours(toIcon);
  const unused = new Set(target.map((_, index) => index));
  const parts: IconMorphPart[] = [];
  // Match major outlines first; use position, length and topology for details.
  for (const from of [...source].sort((a, b) => b.length - a.length)) {
    let selected = -1,
      bestCost = Infinity;
    for (const index of unused) {
      const to = target[index];
      const ratio = Math.log((from.length + 0.5) / (to.length + 0.5));
      const cost =
        distance(from.center, to.center) +
        30 * ratio ** 2 +
        (from.closed === to.closed ? 0 : 10);
      if (cost < bestCost) {
        selected = index;
        bestCost = cost;
      }
    }
    if (selected < 0) {
      parts.push({
        from: from.path,
        to: pointPath(nearestAnchor(from.center, target)),
        entering: false,
        leaving: true,
        fromOpacity: from.opacity,
        toOpacity: from.opacity,
        fromWidth: from.strokeWidth,
        toWidth: from.strokeWidth,
      });
    } else {
      unused.delete(selected);
      parts.push({
        from: from.path,
        to: align(from, target[selected]),
        entering: false,
        leaving: false,
        fromOpacity: from.opacity,
        toOpacity: target[selected].opacity,
        fromWidth: from.strokeWidth,
        toWidth: target[selected].strokeWidth,
      });
    }
  }
  for (const index of unused) {
    const to = target[index];
    parts.push({
      from: pointPath(nearestAnchor(to.center, source)),
      to: to.path,
      entering: true,
      leaving: false,
      fromOpacity: to.opacity,
      toOpacity: to.opacity,
      fromWidth: to.strokeWidth,
      toWidth: to.strokeWidth,
    });
  }
  return parts;
};

export const iconMorphPaths = (parts: IconMorphPart[], progress: number) =>
  parts.map((part) => ({
    d: interpolatePath(progress, part.from, part.to),
    // Only unmatched details soften as they grow out of or join an existing line.
    strokeWidth: part.fromWidth + (part.toWidth - part.fromWidth) * progress,
    opacity:
      (part.fromOpacity + (part.toOpacity - part.fromOpacity) * progress) *
      (part.entering
        ? Math.min(1, progress * 4)
        : part.leaving
          ? Math.min(1, (1 - progress) * 4)
          : 1),
  }));
