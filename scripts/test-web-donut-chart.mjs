import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';

const dir = await mkdtemp(path.join(tmpdir(), 'tb-donut-'));
const outfile = path.join(dir, 'geometry.mjs');
await build({ entryPoints: ['src/components/system/plating/symbolDonutGeometry.ts'], outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { symbolDonutGeometry, SYMBOL_DONUT } = await import(outfile);
const dataFile = path.join(dir, 'data.mjs');
await build({ entryPoints: ['src/components/system/plating/pieDonutData.ts'], outfile: dataFile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { pieDonutData } = await import(dataFile);
after(() => rm(dir, { recursive: true, force: true }));

test('absolute percentages keep 10/30/20 and leave a neutral 40 percent', () => {
  const data = pieDonutData([10, 30, 20], 'absolute');
  assert.equal(data.remainder, 40);
  const pieces = symbolDonutGeometry(data.values);
  for (const [index, expected] of [0.1, 0.3, 0.2, 0.4].entries()) {
    assert.ok(Math.abs(pieces[index].fraction - expected) < 1e-12);
  }
  assert.deepEqual(pieDonutData([18, 12, 6]).values, [18, 12, 6]);
});

test('absolute zero fills the neutral pie; full values have no remainder', () => {
  assert.deepEqual(pieDonutData([0, 0, 0], 'absolute').values, [0, 0, 0, 100]);
  assert.equal(symbolDonutGeometry(pieDonutData([0, 0, 0], 'absolute').values)[0].fraction, 1);
  assert.equal(pieDonutData([10, 30, 60], 'absolute').remainder, 0);
  for (const values of [[101], [10, 100], [-1, 30], [NaN], [Infinity]]) {
    const result = pieDonutData(values, 'absolute');
    assert.equal(result.valid, false);
    assert.deepEqual(result.values, []);
  }
});

function sample(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/g);
  const points = []; let p, first, i = 0;
  while (i < tokens.length) {
    const c = tokens[i++];
    if (c === 'M' || c === 'L') {
      p = [+tokens[i++], +tokens[i++]];
      first ??= p; points.push(p);
    } else if (c === 'C') {
      const b = [+tokens[i++], +tokens[i++]], z = [+tokens[i++], +tokens[i++]], e = [+tokens[i++], +tokens[i++]];
      for (let k = 1; k <= 64; k++) {
        const t = k / 64, u = 1 - t;
        points.push([0, 1].map(a => u ** 3 * p[a] + 3 * u * u * t * b[a] + 3 * u * t * t * z[a] + t ** 3 * e[a]));
      }
      p = e;
    } else if (c === 'Z') points.push(first);
    else throw new Error(c);
  }
  return points;
}
function area(points) {
  return Math.abs(points.slice(1).reduce((sum, p, i) => sum + points[i][0] * p[1] - p[0] * points[i][1], 0)) / 2;
}

test('symbol ratios are scale invariant', () => {
  for (const size of [32, 64, 132]) {
    assert.ok(Math.abs(SYMBOL_DONUT.gap * size / SYMBOL_DONUT.diameter / size - 1 / 32) < 1e-12);
  }
});
test('six equal pie slices retain rotational symmetry and stay inside the outer circle', () => {
  const shapes = symbolDonutGeometry([1, 1, 1, 1, 1, 1]);
  assert.equal(shapes.length, 6);
  const areas = shapes.map(s => area(sample(s.path)));
  assert.ok(Math.max(...areas) - Math.min(...areas) < 0.05);
  for (const s of shapes) for (const [x, y] of sample(s.path)) {
    const r = Math.hypot(x - 92, y - 92);
    assert.ok(r <= 92.04, `radius ${r}`);
  }
});
test('unequal values preserve angular shares without sorting or minimum-slice inflation', () => {
  const shapes = symbolDonutGeometry([18, 12, 6]);
  for (const [i, expected] of [0.5, 1 / 3, 1 / 6].entries()) {
    assert.ok(Math.abs(shapes[i].fraction - expected) < 1e-12);
    assert.ok(Math.abs((shapes[i].endAngle - shapes[i].startAngle) / (2 * Math.PI) - expected) < 1e-12);
  }
  assert.ok(Math.abs(symbolDonutGeometry([999, 1])[1].fraction - 0.001) < 1e-12);
});
test('empty, invalid, single and very large values remain finite', () => {
  assert.deepEqual(symbolDonutGeometry([0, -1, NaN, Infinity]), []);
  for (const values of [[1], [999, 1], [1e308, 1e308], [0, 2, -1, 3]]) {
    const pieces = symbolDonutGeometry(values);
    assert.ok(Math.abs(pieces.reduce((sum, p) => sum + p.fraction, 0) - 1) < 1e-12);
    assert.ok(pieces.every(p => !/NaN|Infinity/.test(p.path)));
  }
});

test('straight slice edges keep the reference separation', () => {
  const shapes = symbolDonutGeometry([1, 1, 1, 1, 1, 1]);
  assert.ok(shapes.every(s => (s.path.match(/L/g) ?? []).length === 2));
  let gap = Infinity;
  for (const p of sample(shapes[0].path)) for (const q of sample(shapes[1].path)) {
    gap = Math.min(gap, Math.hypot(p[0] - q[0], p[1] - q[1]));
  }
  assert.ok(Math.abs(gap - SYMBOL_DONUT.gap) < 0.01, `gap ${gap}`);
});

test('straight sides meet the rounded corners with matching tangents', () => {
  for (const values of [[1, 1, 1, 1, 1, 1], [18, 12, 6], [10, 30, 20, 40], [3, 1]]) for (const shape of symbolDonutGeometry(values)) {
    const tokens = shape.path.match(/[MLCZ]|-?\d+(?:\.\d+)?/g);
    let i = 0, current, previousTangent, firstTangent;
    const check = (tangent) => {
      if (Math.hypot(...tangent) < 1e-5) return;
      firstTangent ??= tangent;
      if (previousTangent) {
        const cosine = (tangent[0]*previousTangent[0] + tangent[1]*previousTangent[1]) / (Math.hypot(...tangent)*Math.hypot(...previousTangent));
        assert.ok(cosine > 0.999, `corner tangent ${cosine}`);
      }
    };
    while (i < tokens.length) {
      const command = tokens[i++];
      if (command === 'M') current = [+tokens[i++], +tokens[i++]];
      else if (command === 'L') {
        const end = [+tokens[i++], +tokens[i++]];
        const tangent = [end[0] - current[0], end[1] - current[1]];
        check(tangent); if (Math.hypot(...tangent) > 1e-5) previousTangent = tangent; current = end;
      } else if (command === 'C') {
        const first = [+tokens[i++], +tokens[i++]], second = [+tokens[i++], +tokens[i++]], end = [+tokens[i++], +tokens[i++]];
        check([first[0] - current[0], first[1] - current[1]]);
        previousTangent = [end[0] - second[0], end[1] - second[1]]; current = end;
      }
    }
    const cosine = (firstTangent[0]*previousTangent[0] + firstTangent[1]*previousTangent[1]) / (Math.hypot(...firstTangent)*Math.hypot(...previousTangent));
    assert.ok(cosine > 0.999, `closed contour tangent ${cosine}`);
  }
});

test('each arc keeps one curvature direction without pinched S-bends', () => {
  for (const values of [[1, 1, 1, 1, 1, 1], [18, 12, 6]]) for (const shape of symbolDonutGeometry(values)) {
    const tokens = shape.path.match(/[MLCZ]|-?\d+(?:\.\d+)?/g);
    let i = 0, p;
    while (i < tokens.length) {
      const c = tokens[i++];
      if (c === 'M' || c === 'L') p = [+tokens[i++], +tokens[i++]];
      else if (c === 'C') {
        const b = [+tokens[i++], +tokens[i++]], q = [+tokens[i++], +tokens[i++]], e = [+tokens[i++], +tokens[i++]];
        const signs = [0.1, 0.3, 0.5, 0.7, 0.9].map(t => {
          const u = 1 - t;
          const v = [0, 1].map(a => 3*u*u*(b[a]-p[a]) + 6*u*t*(q[a]-b[a]) + 3*t*t*(e[a]-q[a]));
          const w = [0, 1].map(a => 6*u*(q[a]-2*b[a]+p[a]) + 6*t*(e[a]-2*q[a]+b[a]));
          const cross = v[0]*w[1] - v[1]*w[0];
          return Math.abs(cross) < 1e-6 ? 0 : Math.sign(cross);
        });
        assert.ok(!(signs.includes(1) && signs.includes(-1)), `reversed curvature ${signs}`);
        p = e;
      }
    }
  }
});


test('a single value and an all-neutral remainder are solid pies without a center cutout', () => {
  for (const values of [[1], pieDonutData([0, 0, 0], 'absolute').values]) {
    const shape = symbolDonutGeometry(values)[0];
    assert.equal((shape.path.match(/M/g) ?? []).length, 1);
    const expected = Math.PI * (SYMBOL_DONUT.diameter / 2) ** 2;
    assert.ok(Math.abs(area(sample(shape.path)) - expected) / expected < 0.001);
  }
});


test('narrow slice rounding does not pull the tip too far away from center', () => {
  const shapes = symbolDonutGeometry([10, 30, 20, 40]);
  for (const shape of shapes) {
    const span = shape.endAngle - shape.startAngle;
    const sharpTipDistance = SYMBOL_DONUT.gap / 2 / Math.sin(span / 2) * 32 / 184;
    const tipDistance = Math.min(...sample(shape.path).map(([x, y]) => Math.hypot(x - 92, y - 92))) * 32 / 184;
    assert.ok(tipDistance - sharpTipDistance <= 1.41, `rounding setback ${tipDistance - sharpTipDistance}`);
    assert.ok(tipDistance > sharpTipDistance, 'tip is still rounded');
    if (Math.abs(shape.fraction - 0.1) < 1e-6) assert.ok(tipDistance < 3.03, `10% tip distance ${tipDistance}`);
    if (Math.abs(shape.fraction - 0.2) < 1e-6) assert.ok(tipDistance < 2.26, `20% tip distance ${tipDistance}`);
  }
});
