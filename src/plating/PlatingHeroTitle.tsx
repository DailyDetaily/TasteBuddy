import { useEffect, useRef } from "react";
import { TASTE_IDS, TASTE_TOKENS } from "../constants/designTokens";
import { paintTitleRefill, titleBrushes, titleColorDistances, titleColorPath, titleHoverMask, titleRefillCaps, titleRefillPath, titleStrokeDistances, titleStrokeMap, traceTitleSegment, type TitleRefillCap } from "./platingTitleBrush";

const RECOVERY_MS = 1800;
const HOLD_MS = 90;
const OPEN_MS = 60;
const MAX_TRAIL = 96;
const MAX_CACHED_FIELDS = 128;
const MAX_CACHED_FIELD_BYTES = 8 * 1024 * 1024;
const COLOR_RADIUS_RATIO = 4;
const COLOR_FADE_START = 0.75;
const palette = TASTE_IDS.map((id) => TASTE_TOKENS[id].palette.main);
type FlowField = { cut: Float32Array; color: Float32Array; centers: Float32Array };
const paletteRGB = new Map<string, number[]>(palette.map((color) => [
  color, [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16)),
]));
const inverseSmooth = Float32Array.from({ length: 257 }, (_, i) =>
  0.5 - Math.sin(Math.asin(1 - 2 * i / 256) / 3),
);
type TrailPoint = {
  x: number;
  y: number;
  angle: number;
  inkRadius: number;
  field?: FlowField;
};
type StrokeGroup = {
  stroke: number;
  points: TrailPoint[];
  main: string;
  accent: string;
  from: number;
  target: number;
  strength: number;
  start: number;
  duration: number;
  appliedHole?: number;
};
type StrokeLayer = {
  inkIndices: Uint32Array;
  canvasPixels: Uint32Array;
  colorPath: ReturnType<typeof titleColorPath>;
  nodeRadii: Float32Array;
  nodeGap: Float32Array;
  nodeBase: Float32Array;
  inkMask: Uint8Array;
  stampCenters: Uint32Array;
  stampPixels: Uint32Array;
  stampEdges: Float32Array;
  cuts: StrokeGroup[];
  width: number;
  removed: Float32Array;
  blocked: Uint8Array;
  refill: Float32Array | null;
  refillStart: number;
  refillRate: number;
  held: StrokeGroup | null;
  hasHole: boolean;
};

type PlatingTitleProps = {
  as?: "h1" | "span";
  lines?: readonly string[];
};

export default function PlatingHeroTitle({
  as: Tag = "h1",
  lines = ["Small sensations.", "A taste of your own."],
}: PlatingTitleProps = {}) {
  const titleRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const text = lines.join("\n");

  useEffect(() => {
    const title = titleRef.current;
    const canvas = canvasRef.current;
    if (!title || !canvas) return;
    // This renderer edits pixel masks every frame. Keep the surfaces on the
    // CPU to avoid repeated GPU uploads/readbacks between small stroke canvases.
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const ink = document.createElement("canvas");
    const inkContext = ink.getContext("2d", { willReadFrequently: true });
    if (!context || !inkContext) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    let width = 0;
    let height = 0;
    let radius = 30;
    let pixelRatio = 1;
    let inkPixels: Uint8ClampedArray = new Uint8ClampedArray();
    let hoverMask: Uint8Array = new Uint8Array();
    let brushes: Float32Array = new Float32Array();
    let strokes: ReturnType<typeof titleStrokeMap> | null = null;
    // Cursor locations have separate lifetimes; they share cached stroke geometry.
    const groups = new Map<number, StrokeGroup>();
    const strokeLayers = new Map<number, StrokeLayer>();
    const distanceCache = new Map<string, FlowField>();
    const brushStencils = new Map<number, Float32Array>();
    let basePixels: Uint8ClampedArray = new Uint8ClampedArray();
    let rendered: ImageData | null = null;
    let inkRGB = [15, 15, 15];
    let cachedFieldBytes = 0;
    let previousClient: { x: number; y: number } | null = null;
    let canvasBounds: DOMRect | null = null;
    let boundsDirty = true;
    let nextCut = 0;
    let pointer: { cut: number; stroke: number; point: TrailPoint } | null = null;
    let latestPointer: PointerEvent | null = null;
    let frame = 0;
    let measureFrame = 0;
    let disposed = false;
    let ready = false;

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      groups.clear();
      strokeLayers.forEach((layer) => {
        layer.removed.fill(0);
        layer.nodeGap.fill(-Infinity);
        layer.nodeBase.fill(-Infinity);
        layer.cuts.length = 0;
        layer.refill = null;
        layer.refillRate = 0;
        layer.held = null;
        layer.hasHole = false;
      });
      pointer = null;
      delete title.dataset.titleActive;
      context.clearRect(0, 0, width, height);
    };
    const prepare = () => {
      measureFrame = 0;
      reset();
      ready = false;
      delete title.dataset.titleReady;
      if (disposed || reducedMotion.matches || !finePointer.matches) return;
      const bounds = title.getBoundingClientRect();
      const style = getComputedStyle(title);
      const fontSize = parseFloat(style.fontSize);
      const scale = Math.min(2, Math.max(window.devicePixelRatio || 1, fontSize < 40 ? 2 : 1));
      const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      inkContext.font = font;
      inkContext.letterSpacing = "0px";
      inkContext.textBaseline = "alphabetic";
      const glyphs: { character: string; x: number; baseline: number }[] = [];
      let inkLeft = bounds.left;
      let inkTop = bounds.top;
      let inkRight = bounds.right;
      let inkBottom = bounds.bottom;
      const rasterGuard = 1 / scale;

      title.querySelectorAll<HTMLElement>(".pl-home-title-line").forEach((line) => {
        const text = line.firstChild;
        const baseline = line.querySelector<HTMLElement>(".pl-home-title-baseline");
        if (!text || !baseline) return;
        const content = text.textContent ?? "";
        const range = document.createRange();
        range.setStart(text, Math.max(0, content.length - 1));
        range.setEnd(text, content.length);
        const baselineOffset = baseline.getBoundingClientRect().top - range.getBoundingClientRect().top;
        // Native character positions retain Kalice's kerning and responsive wrapping.
        for (let i = 0; i < content.length; i++) {
          range.setStart(text, i);
          range.setEnd(text, i + 1);
          const rect = range.getBoundingClientRect();
          const glyphBaseline = rect.top + baselineOffset;
          const metrics = inkContext.measureText(content[i]);
          glyphs.push({ character: content[i], x: rect.left, baseline: glyphBaseline });
          // Descenders can extend below the CSS line box. Include their actual ink
          // so switching to the hover canvas never clips tails such as Kalice's y.
          inkLeft = Math.min(inkLeft, rect.left - metrics.actualBoundingBoxLeft - rasterGuard);
          inkTop = Math.min(inkTop, glyphBaseline - metrics.actualBoundingBoxAscent - rasterGuard);
          inkRight = Math.max(inkRight, rect.left + metrics.actualBoundingBoxRight + rasterGuard);
          inkBottom = Math.max(inkBottom, glyphBaseline + metrics.actualBoundingBoxDescent + rasterGuard);
        }
      });

      const originX = Math.floor(inkLeft * scale) / scale;
      const originY = Math.floor(inkTop * scale) / scale;
      width = Math.ceil(inkRight * scale) / scale - originX;
      height = Math.ceil(inkBottom * scale) / scale - originY;
      if (!width || !height) return;
      radius = Math.max(Tag === "h1" ? 5 : 2, fontSize * 0.09);
      pixelRatio = scale;
      inkRGB = (style.color.match(/[\d.]+/g) ?? ["15", "15", "15"]).slice(0, 3).map(Number);
      [canvas, ink].forEach((surface) => {
        surface.width = Math.ceil(width * scale);
        surface.height = Math.ceil(height * scale);
      });
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.left = `${originX - bounds.left}px`;
      canvas.style.top = `${originY - bounds.top}px`;
      [context, inkContext].forEach((ctx) =>
        ctx.setTransform(scale, 0, 0, scale, 0, 0),
      );
      inkContext.font = font;
      inkContext.letterSpacing = "0px";
      inkContext.textBaseline = "alphabetic";
      inkContext.fillStyle = "#000";
      strokeLayers.clear();
      distanceCache.clear();
      brushStencils.clear();
      cachedFieldBytes = 0;
      previousClient = null;
      canvasBounds = canvas.getBoundingClientRect();
      boundsDirty = false;

      glyphs.forEach(({ character, x, baseline }) => {
        inkContext.fillText(character, x - originX, baseline - originY);
      });
      const sourceInk = inkContext.getImageData(0, 0, ink.width, ink.height);
      inkPixels = sourceInk.data;
      basePixels = new Uint8ClampedArray(sourceInk.data);
      for (let i = 0; i < basePixels.length; i += 4) {
        basePixels[i] = inkRGB[0]; basePixels[i + 1] = inkRGB[1]; basePixels[i + 2] = inkRGB[2];
      }
      rendered = context.createImageData(ink.width, ink.height);
      brushes = titleBrushes(sourceInk, scale);
      hoverMask = titleHoverMask(sourceInk, brushes, scale);
      strokes = titleStrokeMap(sourceInk);
      ready = true;
      title.dataset.titleReady = "true";
      if (latestPointer) move(latestPointer);
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(prepare);
    };

    const advance = (group: StrokeGroup, time: number) => {
      const t = Math.max(0, Math.min(1, (time - group.start) / group.duration));
      const ease = group.target === 1
        ? 1 - (1 - t) ** 3
        : t ** 3 * (10 - 15 * t + 6 * t ** 2);
      group.strength = group.from + (group.target - group.from) * ease;
    };
    const transition = (group: StrokeGroup, target: number, time: number, hold = HOLD_MS) => {
      if (group.target === target) return;
      advance(group, time);
      group.from = group.strength;
      group.target = target;
      group.start = time + (target === 0 ? hold : 0);
      group.duration = target === 1 ? OPEN_MS : RECOVERY_MS;
      if (target === 1) group.appliedHole = 0;
    };
    const stencilFor = (size: number) => {
      const key = Math.round(size * 1000);
      const existing = brushStencils.get(key);
      if (existing) return existing;
      const values: number[] = [];
      const extent = Math.ceil(size);
      for (let y = -extent; y <= extent; y++) {
        for (let x = -extent; x <= extent; x++) {
          const distance = Math.hypot(x, y);
          if (distance > size) continue;
          const edge = 0.75 - 1.5 * inverseSmooth[Math.min(256, Math.round(distance / size * 256))];
          values.push(x, y, edge);
        }
      }
      const stencil = new Float32Array(values);
      brushStencils.set(key, stencil);
      return stencil;
    };
    const layerFor = (stroke: number) => {
      const cached = strokeLayers.get(stroke);
      if (cached) return cached;
      const bounds = strokes!.bounds[stroke - 1];
      const indices: number[] = [], pixels: number[] = [];
      for (let y = 0; y < bounds.height; y++) {
        for (let x = 0; x < bounds.width; x++) {
          const original = (bounds.y + y) * ink.width + bounds.x + x;
          if (strokes!.labels[original] !== stroke) continue;
          indices.push(y * bounds.width + x);
          pixels.push(original * 4);
        }
      }
      const centers: number[] = [], targets: number[] = [], edges: number[] = [], pathCenters: number[] = [], radii: number[] = [];
      for (let i = 0; i < brushes.length; i += 3) {
        const px = Math.floor(brushes[i] * pixelRatio), py = Math.floor(brushes[i + 1] * pixelRatio);
        if (strokes!.labels[py * ink.width + px] !== stroke) continue;
        const cx = px - bounds.x, cy = py - bounds.y;
        pathCenters.push(cy * bounds.width + cx);
        radii.push(brushes[i + 2] * pixelRatio);
        const stencil = stencilFor(brushes[i + 2] * pixelRatio);
        for (let j = 0; j < stencil.length; j += 3) {
          const x = cx + stencil[j], y = cy + stencil[j + 1];
          if (x < 0 || y < 0 || x >= bounds.width || y >= bounds.height) continue;
          if (strokes!.labels[(bounds.y + y) * ink.width + bounds.x + x] !== stroke) continue;
          centers.push(cy * bounds.width + cx);
          targets.push(y * bounds.width + x);
          edges.push(stencil[j + 2]);
        }
      }
      const inkIndices = new Uint32Array(indices);
      const colorPath = titleColorPath(bounds.width, bounds.height, inkIndices, new Uint32Array(pathCenters));
      const nodeRadii = Float32Array.from(radii, (radius, node) => Math.max(0.5, radius - Math.hypot(
        colorPath.x[node] - (pathCenters[node] % bounds.width + 0.5),
        colorPath.y[node] - (Math.floor(pathCenters[node] / bounds.width) + 0.5),
      )));
      const inkMask = new Uint8Array(bounds.width * bounds.height);
      for (const pixel of inkIndices) inkMask[pixel] = 1;
      const layer: StrokeLayer = {
        inkIndices, canvasPixels: new Uint32Array(pixels),
        colorPath, nodeRadii, inkMask,
        nodeGap: new Float32Array(pathCenters.length).fill(-Infinity),
        nodeBase: new Float32Array(pathCenters.length).fill(-Infinity),
        stampCenters: new Uint32Array(centers), stampPixels: new Uint32Array(targets),
        stampEdges: new Float32Array(edges), cuts: [],
        width: bounds.width,
        removed: new Float32Array(bounds.width * bounds.height),
        blocked: new Uint8Array(pathCenters.length),
        refill: null, refillStart: 0, refillRate: 0, held: null, hasHole: false,
      };
      strokeLayers.set(stroke, layer);
      return layer;
    };
    const distancesFor = (group: StrokeGroup, point: TrailPoint) => {
      if (point.field) return point.field;
      const turn = Math.PI * 2;
      const direction = ((point.angle % turn) + turn) % turn;
      const angleKey = Math.round(direction * 20) % Math.round(turn * 20);
      const key = `${group.stroke}:${Math.round(point.x * pixelRatio)}:${Math.round(point.y * pixelRatio)}:${angleKey}:${Math.round(point.inkRadius * pixelRatio)}`;
      const cached = distanceCache.get(key);
      if (cached) {
        distanceCache.delete(key);
        distanceCache.set(key, cached);
        point.field = cached;
        return cached;
      }
      const bounds = strokes!.bounds[group.stroke - 1];
      const distance = titleStrokeDistances(
        strokes!.labels, ink.width, bounds, group.stroke,
        point.x * pixelRatio, point.y * pixelRatio,
        point.angle, point.inkRadius * pixelRatio,
        radius * COLOR_RADIUS_RATIO * pixelRatio,
      );
      for (let i = 0; i < distance.length; i++) distance[i] /= pixelRatio;
      const cut = new Float32Array(distance.length).fill(-Infinity);
      const layer = layerFor(group.stroke);
      // Round disks shape the cut only. Color uses centerline arc length.
      for (let i = 0; i < layer.stampPixels.length; i++) {
        const arrival = distance[layer.stampCenters[i]];
        if (!Number.isFinite(arrival)) continue;
        const pixel = layer.stampPixels[i], edge = layer.stampEdges[i] / pixelRatio;
        cut[pixel] = Math.max(cut[pixel], arrival + edge);
      }
      // Near the cut, only centerline disks define the edge. Keeping the raw
      // distance edge here would reintroduce the counter's concave outline.
      for (let i = 0; i < cut.length; i++)
        if (cut[i] === -Infinity) cut[i] = distance[i];
      const color = titleColorDistances(layer.colorPath,
        point.x * pixelRatio - bounds.x, point.y * pixelRatio - bounds.y,
        point.angle, radius * COLOR_RADIUS_RATIO * pixelRatio);
      for (let i = 0; i < color.length; i++) color[i] /= pixelRatio;
      const centers = Float32Array.from(layer.colorPath.centers, (pixel) => distance[pixel]);
      const field = { cut, color, centers };
      point.field = field;
      distanceCache.set(key, field);
      cachedFieldBytes += cut.byteLength + color.byteLength + centers.byteLength;
      while (distanceCache.size > MAX_CACHED_FIELDS || cachedFieldBytes > MAX_CACHED_FIELD_BYTES) {
        const oldest = distanceCache.keys().next().value!;
        const oldestField = distanceCache.get(oldest)!;
        cachedFieldBytes -= oldestField.cut.byteLength + oldestField.color.byteLength + oldestField.centers.byteLength;
        distanceCache.delete(oldest);
      }
      return field;
    };
    const draw = () => {
      const time = performance.now();
      frame = 0;
      groups.forEach((group, cut) => {
        advance(group, time);
        if (group.target === 0 && group.strength === 0) groups.delete(cut);
      });
      const outputFrame = rendered;
      if (!outputFrame || (!groups.size && !Array.from(strokeLayers.values()).some((layer) => layer.hasHole))) {
        reset(); return;
      }
      strokeLayers.forEach((layer) => { layer.cuts.length = 0; });
      groups.forEach((group) => layerFor(group.stroke).cuts.push(group));
      outputFrame.data.set(basePixels);
      const antialias = 0.5 / pixelRatio;
      let refilling = false;
      const smooth = (value: number) => {
        const t = Math.max(0, Math.min(1, value));
        return t * t * (3 - 2 * t);
      };
      strokeLayers.forEach((layer) => {
        if (!layer.cuts.length && !layer.hasHole) return;
        const crossedNodes: number[] = [];
        // Continue the existing front before adding new openings. Frequent
        // pointer events must not restart recovery of an older section.
        if (layer.refill) {
          const travel = Math.max(0, time - layer.refillStart) * layer.refillRate;
          for (let node = 0; node < layer.nodeGap.length; node++) {
            const next = Number.isFinite(layer.refill[node])
              ? layer.refill[node] - travel : layer.nodeBase[node];
            if (layer.nodeGap[node] > 0 && next <= 0) crossedNodes.push(node);
            layer.nodeGap[node] = next;
          }
        }
        const cuts = layer.cuts.map((group) => {
          const point = group.points[0];
          const hole = radius * group.strength;
          const reach = Math.max(0, hole - point.inkRadius) * COLOR_RADIUS_RATIO;
          return {
            group, field: distancesFor(group, point), hole, reach, strength: group.strength,
            main: paletteRGB.get(group.main)!, accent: paletteRGB.get(group.accent)!,
          };
        });
        const held = cuts.find((cut) => cut.group.target === 1);
        let changed = layer.held !== (held?.group ?? null);
        for (const cut of cuts) {
          const opening = radius * (cut.group.target === 1 ? cut.group.strength : cut.group.from);
          if (opening <= (cut.group.appliedHole ?? 0)) continue;
          for (const pixel of layer.inkIndices) {
            const removed = smooth((opening - cut.field.cut[pixel] + antialias) / (2 * antialias));
            layer.removed[pixel] = Math.max(layer.removed[pixel], removed);
          }
          for (let node = 0; node < layer.nodeGap.length; node++)
            layer.nodeGap[node] = Math.max(layer.nodeGap[node], opening - cut.field.centers[node]);
          cut.group.appliedHole = opening;
          changed = true;
        }
        if (held) {
          for (let node = 0; node < layer.nodeGap.length; node++)
            layer.nodeGap[node] = Math.max(layer.nodeGap[node], held.hole - held.field.centers[node]);
        }
        if (changed) {
          layer.blocked.fill(0);
          if (held) {
            for (let node = 0; node < layer.nodeGap.length; node++)
              if (held.hole > held.field.centers[node]) layer.blocked[node] = 1;
          }
          layer.nodeBase.set(layer.nodeGap);
          layer.refill = titleRefillPath(layer.colorPath, layer.nodeGap, layer.blocked, pixelRatio);
          let farthest = 0;
          for (let node = 0; node < layer.nodeGap.length; node++) {
            if (layer.nodeGap[node] > 0 && Number.isFinite(layer.refill[node]))
              farthest = Math.max(farthest, layer.refill[node]);
          }
          layer.refillRate = Math.max(layer.refillRate, (farthest + antialias) / RECOVERY_MS);
          layer.refillStart = layer.held?.target === 0 && !held
            ? Math.max(time, layer.held.start) : time;
          layer.held = held?.group ?? null;
        }
        const bodies: TitleRefillCap[] = [];
        const dot = layer.nodeGap.length === 1 && !held ? layer.cuts[0] : undefined;
        if (dot) {
          layer.nodeGap[0] = radius * dot.strength;
          bodies.push({ x: layer.colorPath.x[0], y: layer.colorPath.y[0],
            radius: layer.nodeRadii[0] * Math.sqrt(1 - dot.strength), dx: 0, dy: 0 });
        } else {
          for (const node of crossedNodes) {
            if (layer.nodeGap[node] > 0) continue;
            bodies.push({ x: layer.colorPath.x[node], y: layer.colorPath.y[node],
              radius: layer.nodeRadii[node], dx: 0, dy: 0 });
          }
        }
        const hasNodeGap = layer.nodeGap.some((gap) => gap > 0);
        if (!hasNodeGap) layer.removed.fill(0);
        else {
          paintTitleRefill(layer.removed, layer.inkMask, layer.width, bodies,
            titleRefillCaps(layer.colorPath, layer.nodeGap, layer.nodeRadii));
          if (layer.nodeGap.some((gap, node) => gap > 0 && Number.isFinite(layer.refill?.[node]))) refilling = true;
        }
        layer.hasHole = false;
        for (let i = 0; i < layer.inkIndices.length; i++) {
          const pixel = layer.inkIndices[i], output = layer.canvasPixels[i];
          let removed = layer.removed[pixel];
          if (held) removed = Math.max(removed,
            smooth((held.hole - held.field.cut[pixel] + antialias) / (2 * antialias)));
          layer.removed[pixel] = removed;
          if (removed > 0.001) {
            layer.hasHole = true;
          }
          outputFrame.data[output + 3] = Math.round(basePixels[output + 3] * (1 - removed));
          if (removed > 0.998) continue;
          let red = inkRGB[0], green = inkRGB[1], blue = inkRGB[2];
          for (const cut of cuts) {
            if (cut.reach < 0.05) continue;
            const along = cut.field.color[pixel];
            const t = Math.max(0, Math.min(1,
              (Math.abs(along) / cut.reach - COLOR_FADE_START) / (1 - COLOR_FADE_START),
            ));
            if (t >= 1) continue;
            const opacity = (1 - t ** 3 * (10 - 15 * t + 6 * t ** 2)) * cut.strength;
            if (opacity <= 0) continue;
            const position = (along + cut.reach) / (2 * cut.reach);
            const mix = Math.max(0, Math.min(1, (position - 0.6) / 0.12));
            red += (cut.main[0] + (cut.accent[0] - cut.main[0]) * mix - red) * opacity;
            green += (cut.main[1] + (cut.accent[1] - cut.main[1]) * mix - green) * opacity;
            blue += (cut.main[2] + (cut.accent[2] - cut.main[2]) * mix - blue) * opacity;
          }
          outputFrame.data[output] = red;
          outputFrame.data[output + 1] = green;
          outputFrame.data[output + 2] = blue;
        }
        if (!layer.hasHole) {
          layer.refillRate = 0;
          layer.refill = null;
          layer.removed.fill(0);
          layer.nodeGap.fill(-Infinity);
          layer.nodeBase.fill(-Infinity);
        }
      });
      if (!groups.size && !Array.from(strokeLayers.values()).some((layer) => layer.hasHole)) {
        reset(); return;
      }
      context.putImageData(outputFrame, 0, 0);
      if (title.dataset.titleActive !== "true") title.dataset.titleActive = "true";
      if (refilling || Array.from(groups.values()).some((group) => group.strength !== group.target))
        frame = requestAnimationFrame(draw);
    };

    const touchedStroke = (x: number, y: number) => {
      const px = Math.floor(x * pixelRatio), py = Math.floor(y * pixelRatio);
      if (!strokes || px < 0 || py < 0 || px >= ink.width || py >= ink.height) return 0;
      const pixel = py * ink.width + px;
      return inkPixels[pixel * 4 + 3] >= 64 ? strokes.labels[pixel] : 0;
    };
    const hoveredStroke = (x: number, y: number) => {
      const px = Math.floor(x * pixelRatio), py = Math.floor(y * pixelRatio);
      if (!strokes || px < 0 || py < 0 || px >= ink.width || py >= ink.height) return 0;
      const pixel = py * ink.width + px;
      return hoverMask[pixel] ? strokes.labels[pixel] : 0;
    };
    const strokePoint = (x: number, y: number, stroke: number): TrailPoint => {
      // Find the local ink direction and center the cut across the stroke.
      const extent = Math.ceil(radius * 1.7 * pixelRatio);
      const px = Math.round(x * pixelRatio), py = Math.round(y * pixelRatio);
      let weight = 0, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
      for (let yy = Math.max(0, py - extent); yy <= Math.min(ink.height - 1, py + extent); yy++) {
        for (let xx = Math.max(0, px - extent); xx <= Math.min(ink.width - 1, px + extent); xx++) {
          const pixel = yy * ink.width + xx;
          if (strokes!.labels[pixel] !== stroke) continue;
          const xxLocal = (xx + 0.5) / pixelRatio - x;
          const yyLocal = (yy + 0.5) / pixelRatio - y;
          const w = inkPixels[pixel * 4 + 3] / 255;
          weight += w; sx += xxLocal * w; sy += yyLocal * w;
          sxx += xxLocal * xxLocal * w; sxy += xxLocal * yyLocal * w; syy += yyLocal * yyLocal * w;
        }
      }
      if (!weight) return { x, y, angle: Math.PI / 2, inkRadius: 0 };
      const mx = sx / weight, my = sy / weight;
      let angle = Math.atan2(2 * (sxy / weight - mx * my), sxx / weight - mx * mx - syy / weight + my * my) / 2;
      const existingAngle = Array.from(groups.values())
        .find((group) => group.stroke === stroke)?.points[0]?.angle;
      if (existingAngle !== undefined && Math.cos(angle - existingAngle) < 0) angle += Math.PI;
      const nx = -Math.sin(angle), ny = Math.cos(angle);
      const offset = mx * nx + my * ny;
      const centeredX = x + nx * offset, centeredY = y + ny * offset;
      const center = touchedStroke(centeredX, centeredY) === stroke
        ? { x: centeredX, y: centeredY }
        : { x, y };
      const edgeDistance = (sign: number) => {
        let distance = 0;
        while (distance < radius * 2 && touchedStroke(
          center.x + nx * distance * sign,
          center.y + ny * distance * sign,
        ) === stroke) distance += 1 / pixelRatio;
        return distance;
      };
      const inkRadius = Math.max(0, (edgeDistance(1) + edgeDistance(-1)) / 2 - 0.5 / pixelRatio);
      return { ...center, angle, inkRadius };
    };
    const releaseCurrent = (time: number, hold = HOLD_MS) => {
      if (pointer) {
        const group = groups.get(pointer.cut);
        if (group) transition(group, 0, time, hold);
      }
      pointer = null;
    };
    const release = () => {
      latestPointer = null;
      previousClient = null;
      releaseCurrent(performance.now());
      if (groups.size && !frame) frame = requestAnimationFrame(draw);
    };
    const touch = (x: number, y: number, stroke: number, time: number, passed: boolean) => {
      const active = pointer ? groups.get(pointer.cut) : undefined;
      if (active?.stroke === stroke) {
        const anchor = active.points[0];
        const dx = x - anchor.x, dy = y - anchor.y;
        const along = dx * Math.cos(anchor.angle) + dy * Math.sin(anchor.angle);
        const across = -dx * Math.sin(anchor.angle) + dy * Math.cos(anchor.angle);
        if (Math.abs(along) < 2.5 && Math.abs(across) < anchor.inkRadius + 1.5) {
          if (passed) active.from = active.strength = 1;
          return;
        }
      }
      const point = strokePoint(x, y, stroke);
      if (active?.stroke === stroke && Math.hypot(
        active.points[0].x - point.x, active.points[0].y - point.y,
      ) < 2.5) {
        if (passed) active.from = active.strength = 1;
        return;
      }
      if (active) transition(active, 0, time, 0);
      let nearby: [number, StrokeGroup] | undefined;
      let previous: StrokeGroup | undefined;
      for (const entry of groups) {
        const candidate = entry[1];
        if (candidate.stroke !== stroke) continue;
        previous ??= candidate;
        if (Math.hypot(candidate.points[0].x - point.x, candidate.points[0].y - point.y) < 2.5) {
          nearby = entry;
          break;
        }
      }
      let cut: number;
      let group: StrokeGroup;
      if (nearby) {
        [cut, group] = nearby;
        transition(group, 1, time);
        if (passed) group.from = group.strength = 1;
        groups.delete(cut);
      } else {
        const main = Math.floor(Math.random() * palette.length);
        const accent = (main + 1 + Math.floor(Math.random() * (palette.length - 1))) % palette.length;
        cut = nextCut++;
        group = {
          stroke, points: [point],
          main: previous?.main ?? palette[main],
          accent: previous?.accent ?? palette[accent],
          from: passed ? 1 : 0.6, strength: passed ? 1 : 0.6,
          target: 1, start: time, duration: OPEN_MS,
        };
      }
      groups.set(cut, group);
      pointer = { cut, stroke, point: group.points[0] };
      while (groups.size > MAX_TRAIL) groups.delete(groups.keys().next().value!);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedMotion.matches || !finePointer.matches) return;
      latestPointer = event;
      if (!ready) return;
      if (boundsDirty || !canvasBounds) {
        canvasBounds = canvas.getBoundingClientRect();
        boundsDirty = false;
      }
      const bounds = canvasBounds;
      const time = performance.now();
      const coalesced = event.getCoalescedEvents?.() ?? [];
      const samples = coalesced.length ? [...coalesced, event] : [event];
      for (const sample of samples) {
        const current = { x: sample.clientX, y: sample.clientY };
        const from = previousClient ?? current;
        const passed = Math.hypot(current.x - from.x, current.y - from.y) > 1;
        traceTitleSegment(
          (from.x - bounds.left) * pixelRatio, (from.y - bounds.top) * pixelRatio,
          (current.x - bounds.left) * pixelRatio, (current.y - bounds.top) * pixelRatio,
          ink.width, ink.height,
          (px, py) => {
            const pixel = py * ink.width + px;
            const stroke = hoverMask[pixel] ? strokes!.labels[pixel] : 0;
            if (stroke) touch((px + 0.5) / pixelRatio, (py + 0.5) / pixelRatio, stroke, time, passed);
            else releaseCurrent(time, 0);
          },
        );
        previousClient = current;
      }
      // The endpoint alone stays open; every passed section starts recovering.
      if (!hoveredStroke(event.clientX - bounds.left, event.clientY - bounds.top))
        releaseCurrent(time, 0);
      // High-frequency pointer samples share one paint at the next display frame.
      if (groups.size && !frame) frame = requestAnimationFrame(draw);
    };
    const invalidateBounds = () => {
      boundsDirty = true;
      previousClient = null;
      releaseCurrent(performance.now(), 0);
      if (groups.size && !frame) frame = requestAnimationFrame(draw);
    };
    const leaveDocument = (event: PointerEvent) => {
      if (!event.relatedTarget) release();
    };
    const visibility = () => {
      if (document.hidden) {
        reset();
        latestPointer = null;
        previousClient = null;
      }
    };
    const resize = new ResizeObserver(scheduleMeasure);
    resize.observe(title);
    void document.fonts.ready.then(() => { if (!disposed) scheduleMeasure(); });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leaveDocument);
    window.addEventListener("scroll", invalidateBounds, true);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", scheduleMeasure);
    finePointer.addEventListener("change", scheduleMeasure);
    return () => {
      disposed = true;
      reset();
      cancelAnimationFrame(measureFrame);
      resize.disconnect();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leaveDocument);
      window.removeEventListener("scroll", invalidateBounds, true);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", scheduleMeasure);
      finePointer.removeEventListener("change", scheduleMeasure);
    };
  }, [Tag, text]);

  return (
    <Tag ref={(node) => { titleRef.current = node; }} className="pl-home-title" lang="en">
      {lines.map((line) => (
        <span className="pl-home-title-line" key={line}>
          {line}<span className="pl-home-title-baseline" aria-hidden="true" />
        </span>
      ))}
      <canvas ref={canvasRef} className="pl-home-title-canvas" aria-hidden="true" />
    </Tag>
  );
}
