import { COMPONENT_TOKENS } from '../../../constants/designTokens';

type Item = { index: number; value: number; share: number };
type Box = { x: number; y: number; width: number; height: number };
type Branch = { indices: number[]; axis?: 'x' | 'y'; first?: Branch; second?: Branch };

export type MiniTreemapCell = Box & { index: number; value: number; radius: number };
export const roundedCellArea = (cell: Pick<MiniTreemapCell, 'width' | 'height' | 'radius'>) =>
  cell.width * cell.height - (4 - Math.PI) * cell.radius ** 2;

function divide(box: Box, axis: 'x' | 'y', fraction: number): [Box, Box] {
  return axis === 'x'
    ? [{ ...box, width: box.width * fraction }, { ...box, x: box.x + box.width * fraction, width: box.width * (1 - fraction) }]
    : [{ ...box, height: box.height * fraction }, { ...box, y: box.y + box.height * fraction, height: box.height * (1 - fraction) }];
}

/** Keep the partition topology fixed while compensating rounded visible areas. */
function buildTree(items: Item[], box: Box): Branch {
  const node: Branch = { indices: items.map(item => item.index) };
  if (items.length === 1) return node;
  const total = items.reduce((sum, item) => sum + item.share, 0);
  let split = 1, subtotal = 0, closest = Infinity, firstTotal = items[0].share;
  for (let i = 1; i < items.length; i++) {
    subtotal += items[i - 1].share;
    const distance = Math.abs(total / 2 - subtotal);
    if (distance < closest) { closest = distance; split = i; firstTotal = subtotal; }
  }
  node.axis = box.width >= box.height ? 'x' : 'y';
  const [firstBox, secondBox] = divide(box, node.axis, firstTotal / total);
  node.first = buildTree(items.slice(0, split), firstBox);
  node.second = buildTree(items.slice(split), secondBox);
  return node;
}

function place(tree: Branch, box: Box, weights: Map<number, number>, output: Map<number, Box>) {
  if (!tree.first || !tree.second || !tree.axis) { output.set(tree.indices[0], box); return; }
  const sum = (branch: Branch) => branch.indices.reduce((total, index) => total + (weights.get(index) ?? 0), 0);
  const a = sum(tree.first), b = sum(tree.second);
  const [firstBox, secondBox] = divide(box, tree.axis, a / (a + b));
  place(tree.first, firstBox, weights, output);
  place(tree.second, secondBox, weights, output);
}

/** Packed pill-shaped cells. Actual colored areas, not just bounds, encode values. */
export function miniTreemapGeometry(values: readonly (number | null)[]): MiniTreemapCell[] {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const positive = values.flatMap((value, index) => value != null && Number.isFinite(value) && value > 0 ? [{ index, value }] : []);
  if (!positive.length) return [];
  const maximum = positive.reduce((max, item) => Math.max(max, item.value), 0);
  // Sub-pixel ratios below floating-point precision cannot form a finite box.
  // Their original values remain available in the component's accessible label.
  const scaled = positive.map(item => ({ ...item, share: item.value / maximum })).filter(item => item.share > Number.EPSILON);
  const total = scaled.reduce((sum, item) => sum + item.share, 0);
  const items = scaled.map(item => ({ ...item, share: item.share / total })).sort((a, b) => b.share - a.share || a.index - b.index);
  const bounds = { x: 0, y: 0, width, height };
  const tree = buildTree(items, bounds);
  let weights = new Map(items.map(item => [item.index, item.share]));
  const initial = new Map<number, Box>();
  place(tree, bounds, weights, initial);
  const gap = Math.min(1, ...Array.from(initial.values(), box => Math.min(box.width, box.height) * 0.2));
  let cells: MiniTreemapCell[] = [];
  for (let iteration = 0; iteration < 80; iteration++) {
    const boxes = new Map<number, Box>();
    place(tree, bounds, weights, boxes);
    cells = items.map(item => {
      const box = boxes.get(item.index)!;
      const inset = Math.min(gap / 2, box.width * 0.2, box.height * 0.2);
      const w = box.width - inset * 2, h = box.height - inset * 2;
      return { index: item.index, value: item.value, x: box.x + inset, y: box.y + inset, width: w, height: h, radius: Math.min(w, h) / 2 };
    });
    const area = cells.reduce((sum, cell) => sum + roundedCellArea(cell), 0);
    const error = Math.max(...cells.map((cell, i) => Math.abs(roundedCellArea(cell) / area / items[i].share - 1)));
    if (error < 1e-7) break;
    const adjusted = items.map((item, i) => (weights.get(item.index) ?? 0) * Math.pow(item.share * area / roundedCellArea(cells[i]), 0.7));
    const sum = adjusted.reduce((a, b) => a + b, 0);
    weights = new Map(items.map((item, i) => [item.index, adjusted[i] / sum]));
  }
  // Put the largest block on the right and the smallest group at the top left.
  return cells.map(cell => ({ ...cell, x: width - cell.x - cell.width, y: height - cell.y - cell.height })).sort((a, b) => a.index - b.index);
}
