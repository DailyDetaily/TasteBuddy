import {
  parsePath,
  reduceInstructions,
  serializeInstructions,
} from "@remotion/paths";
import type { FoodIconEntry } from "./catalog";
import { iconPrimitivePath } from "./transition-shapes";

const geometries = "path,circle,rect,line,ellipse,polyline,polygon";
const point = (x: number, y: number, matrix: DOMMatrix) =>
  new DOMPoint(x, y).matrixTransform(matrix);
const relativeMatrix = (element: SVGGraphicsElement, root: SVGSVGElement) => {
  const base = root.getCTM(),
    own = element.getCTM();
  if (!base || !own) throw new Error("Cannot read animated icon geometry");
  return base.inverse().multiply(own);
};
const transformedPath = (d: string, matrix: DOMMatrix) =>
  serializeInstructions(
    reduceInstructions(parsePath(d)).map((instruction) => {
      if (instruction.type === "Z") return instruction;
      const end = point(instruction.x, instruction.y, matrix);
      if (instruction.type !== "C")
        return { ...instruction, x: end.x, y: end.y };
      const first = point(instruction.cp1x, instruction.cp1y, matrix);
      const second = point(instruction.cp2x, instruction.cp2y, matrix);
      return {
        ...instruction,
        x: end.x,
        y: end.y,
        cp1x: first.x,
        cp1y: first.y,
        cp2x: second.x,
        cp2y: second.y,
      };
    }),
  );

// Clip and mask definitions use the coordinate system of the referencing group.
const definitionMatrix = (element: SVGGraphicsElement, definition: Element) => {
  let matrix = new DOMMatrix();
  for (
    let current: Element | null = element;
    current && current !== definition;
    current = current.parentElement
  ) {
    if (current instanceof SVGGraphicsElement) {
      const transform = current.transform.baseVal.consolidate()?.matrix;
      if (transform)
        matrix = new DOMMatrix([
          transform.a,
          transform.b,
          transform.c,
          transform.d,
          transform.e,
          transform.f,
        ]).multiply(matrix);
    }
  }
  return matrix;
};
const luminance = (color: string) => {
  const values = color
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number) ?? [0, 0, 0];
  return (values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722) / 255;
};
const visibilityGuards = (element: SVGGraphicsElement, root: SVGSVGElement) => {
  const guards: ((p: DOMPoint) => boolean)[] = [];
  for (
    let owner: Element | null = element;
    owner && owner !== root;
    owner = owner.parentElement
  ) {
    if (!(owner instanceof SVGGraphicsElement)) continue;
    for (const kind of ["clip-path", "mask"]) {
      const reference = owner.getAttribute(kind);
      const id = reference?.match(/#([^)'"\s]+)/)?.[1];
      if (!id) continue;
      const definition = root.querySelector(`[id="${id}"]`);
      if (!definition) throw new Error(`Missing animated icon ${kind}: ${id}`);
      const toOwner = relativeMatrix(owner, root).inverse();
      const shapes = Array.from(
        definition.querySelectorAll<SVGGeometryElement>(geometries),
      ).map((shape) => ({
        shape,
        inverse: definitionMatrix(shape, definition).inverse(),
        style: getComputedStyle(shape),
      }));
      guards.push((p) => {
        const local = p.matrixTransform(toOwner);
        let mask = 0;
        for (const { shape, inverse, style } of shapes) {
          const q = local.matrixTransform(inverse);
          const filled = shape.isPointInFill(q);
          if (kind === "clip-path") {
            if (filled) return true;
            continue;
          }
          const alpha = Number(style.opacity);
          if (style.fill !== "none" && filled) {
            const a = alpha * Number(style.fillOpacity);
            mask = mask * (1 - a) + luminance(style.fill) * a;
          }
          if (style.stroke !== "none" && shape.isPointInStroke(q)) {
            const a = alpha * Number(style.strokeOpacity);
            mask = mask * (1 - a) + luminance(style.stroke) * a;
          }
        }
        return kind === "mask" && mask > 0.5;
      });
    }
  }
  return guards;
};

const strokeRanges = (
  element: SVGGeometryElement,
  length: number,
  style: CSSStyleDeclaration,
) => {
  if (style.strokeDasharray === "none") return [[0, length]];
  let pattern = style.strokeDasharray.split(/[ ,]+/).map(parseFloat);
  if (pattern.some((value) => !Number.isFinite(value)))
    throw new Error("Invalid icon stroke dash");
  if (pattern.length % 2) pattern = [...pattern, ...pattern];
  const declaredLength = Number(element.getAttribute("pathLength"));
  const scale = declaredLength > 0 ? length / declaredLength : 1;
  pattern = pattern.map((value) => value * scale);
  const period = pattern.reduce((sum, value) => sum + value, 0);
  if (period <= 0) return [[0, length]];
  const offset = parseFloat(style.strokeDashoffset) * scale;
  const ranges: number[][] = [];
  for (
    let cycle = Math.floor(offset / period) - 1;
    cycle <= Math.ceil((length + offset) / period);
    cycle++
  ) {
    let position = cycle * period - offset;
    pattern.forEach((size, index) => {
      if (index % 2 === 0 && position < length && position + size > 0)
        ranges.push([Math.max(0, position), Math.min(length, position + size)]);
      position += size;
    });
  }
  return ranges;
};

// Capture only the 26 boundary poses. The full animation continues to use the
// original components; DOM geometry preserves their transformed, clipped rest poses.
export const captureTransitionPose = (
  root: SVGSVGElement,
  icon: FoodIconEntry,
): FoodIconEntry => {
  const nodes: [string, Record<string, string>][] = [];
  for (const element of root.querySelectorAll<SVGGeometryElement>(geometries)) {
    if (element.closest("defs")) continue;
    const style = getComputedStyle(element);
    let opacity = 1;
    for (
      let ancestor: Element | null = element;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const computed = getComputedStyle(ancestor);
      if (computed.display === "none" || computed.visibility === "hidden")
        opacity = 0;
      opacity *= Number(computed.opacity);
      if (ancestor === root) break;
    }
    if (opacity <= 0.00001) continue;
    const matrix = relativeMatrix(element, root);
    const scale = Math.sqrt(
      Math.abs(matrix.a * matrix.d - matrix.b * matrix.c),
    );
    const emit = (d: string, width: number, alpha = opacity) =>
      nodes.push([
        "path",
        {
          d,
          opacity: String(alpha),
          "stroke-width": String(width),
        },
      ]);
    if (style.stroke === "none") {
      if (element.tagName === "circle" && style.fill !== "none") {
        const center = point(
          Number(element.getAttribute("cx")),
          Number(element.getAttribute("cy")),
          matrix,
        );
        emit(
          `M${center.x} ${center.y}L${center.x} ${center.y}`,
          Number(element.getAttribute("r")) * 2 * scale,
          opacity * Number(style.fillOpacity),
        );
      }
      continue;
    }
    opacity *= Number(style.strokeOpacity);
    const width = parseFloat(style.strokeWidth) * scale;
    if (opacity <= 0.00001 || width <= 0) continue;
    const attributes = Object.fromEntries(
      Array.from(element.attributes).map((attribute) => [
        attribute.name,
        attribute.value,
      ]),
    );
    const d = iconPrimitivePath([element.tagName, attributes]);
    const guards = visibilityGuards(element, root);
    if (!guards.length && style.strokeDasharray === "none") {
      emit(transformedPath(d, matrix), width);
      continue;
    }
    const length = element.getTotalLength();
    const sample = (at: number) => {
      const p = element.getPointAtLength(at);
      return point(p.x, p.y, matrix);
    };
    const visible = (p: DOMPoint) => guards.every((guard) => guard(p));
    for (const [start, end] of strokeRanges(element, length, style)) {
      const steps = Math.max(1, Math.ceil((end - start) * 10));
      let run: DOMPoint[] = [];
      const flush = () => {
        if (run.length > 1)
          emit(
            run.map((p, index) => `${index ? "L" : "M"}${p.x} ${p.y}`).join(""),
            width,
          );
        run = [];
      };
      let previousAt = start;
      const first = sample(start);
      let wasVisible = visible(first);
      if (wasVisible) run.push(first);
      for (let index = 1; index <= steps; index++) {
        const at = start + ((end - start) * index) / steps;
        const p = sample(at),
          isVisible = visible(p);
        if (isVisible !== wasVisible) {
          let low = previousAt,
            high = at;
          for (let refine = 0; refine < 10; refine++) {
            const middle = (low + high) / 2;
            if (visible(sample(middle)) === wasVisible) low = middle;
            else high = middle;
          }
          run.push(sample((low + high) / 2));
          if (!isVisible) flush();
        }
        if (isVisible) run.push(p);
        previousAt = at;
        wasVisible = isVisible;
      }
      flush();
    }
  }
  if (!nodes.length) throw new Error(`Empty transition pose: ${icon.id}`);
  return { ...icon, nodes };
};
