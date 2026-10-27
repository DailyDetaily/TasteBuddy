import { createRequire } from 'node:module';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-chart-render-'));
const out = path.join(dir, 'render.cjs');
await build({ stdin: { contents: "export {default as Panel,RecordChartGraphic} from './src/components/gastronomy/RecordChartsPanel'; export {buildRecordChartData} from './src/lib/gastronomy/recordChartData'; export {default as Bubble} from './src/components/system/plating/MiniBubbleChart'; export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', outfile: out, logLevel: 'silent' });
const { Panel, Bubble, RecordChartGraphic, buildRecordChartData, createElement: h, renderToStaticMarkup: render } = createRequire(import.meta.url)(out);
after(() => fs.rm(dir, { recursive: true, force: true }));
process.env.TZ = 'Asia/Seoul';
const now = new Date('2026-10-08T12:00:00+09:00');
const data = { records: Array.from({ length: 6 }, (_, i) => ({ id: `r${i}`, mealID: `m${i}`, menu: '국수', restaurant: '', foodKinds: [], labels: [], note: '', date: '2026-10-08T10:00:00+09:00', savedAt: '2026-10-08T11:00:00+09:00', source: ['homeCooked', 'restaurant', 'unknown'][i % 3] })), observations: [] };
const chart = buildRecordChartData(data, now);
test('standard product chart modes render account-derived values', () => {
  for (const mode of ['heatmap', 'bar', 'grouped', 'line', 'area', 'stacked', 'pie', 'absolute', 'bubble']) {
    const html = render(h(RecordChartGraphic, { chart, mode }));
    assert.match(html, /<svg/); assert.doesNotMatch(html, /NaN|Infinity|undefined/);
    if (["line", "area"].includes(mode)) assert.match(html, /viewBox="0 0 132 56"/);
    else if (["pie", "absolute"].includes(mode)) assert.match(html, /<svg width="56" height="56"/);
    else assert.match(html, /<svg width="132" height="56"/);
  }
  const heatmap = render(h(RecordChartGraphic, { chart, mode: 'heatmap' }));
  assert.match(heatmap, /data-level="4"/); assert.match(heatmap, /--tb-taste-umami-heatmap-4/);
  assert.equal((heatmap.match(/data-level="padding"/g) ?? []).length, 4);
  assert.equal((heatmap.match(/data-level="missing"/g) ?? []).length, 23);
  const absolute = render(h(RecordChartGraphic, { chart, mode: 'absolute' }));
  assert.match(absolute, /data-remainder="true"/);
});
test('loading or failed requests never render a false all-zero graph', () => {
  for (const props of [{ loading: true }, { error: 'offline', onRetry: () => {} }]) {
    const html = render(h(Panel, { data: { records: [], observations: [] }, now, ...props }));
    assert.doesNotMatch(html, /<svg/);
    assert.match(html, /role="(?:status|alert)"/);
  }
});
test('zero denominator stays empty while known empty days use tint80', () => {
  const empty = buildRecordChartData({ records: [], observations: [] }, now);
  assert.match(render(h(RecordChartGraphic, { chart: empty, mode: 'absolute' })), /계산할 기록이 없어요/);
  assert.match(render(h(RecordChartGraphic, { chart: empty, mode: 'area' })), /이 기간의 기록이 없어요/);
  const heatmap = render(h(RecordChartGraphic, { chart: empty, mode: 'heatmap' }));
  assert.equal((heatmap.match(/data-level="0"/g) ?? []).length, 8);
  assert.match(heatmap, /--tb-taste-umami-heatmap-0/);
});

test('food icon content preserves geometry, labels and count semantics without drawing numbers', () => {
  const items = [{id:'seafood',label:'해산물',value:9,axis:'salty',dishKindId:'seafood'}, {id:'meat',label:'육류',value:16,axis:'umami',dishKindId:'meat'}];
  const numeric = render(h(Bubble,{items})), icons = render(h(Bubble,{items,content:'icon'}));
  assert.match(numeric, /<text/); assert.doesNotMatch(icons, /<text/);
  assert.match(icons, /data-dish-kind="seafood"/); assert.match(icons, /data-dish-kind="meat"/);
  assert.match(icons, /해산물 9/); assert.match(icons, /육류 16/);
  const bubbles = html => [...html.matchAll(/<circle cx="[^>]+fill="[^>]+/g)].map(m => m[0]);
  assert.deepEqual(bubbles(numeric), bubbles(icons));
  const chart = buildRecordChartData({records:data.records.map((r,i)=>({...r,foodKindIDs:[i%2?'meat':'seafood']})),observations:[]},now);
  const product = render(h(RecordChartGraphic,{chart,mode:'bubbleIcon'}));
  assert.match(product,/data-content="icon"/); assert.match(product,/해산물 3/);
});

test('sensory overlays render all measured tastes with the selected tint roles', () => {
  const observations = data.records.flatMap((row, i) => ['taste.umami', ...(i < 4 ? ['taste.sweet'] : []), ...(i < 2 ? ['taste.bitter'] : [])].map((attribute, j) => ({ id: `${row.id}:${j}`, entryID: row.id, facet: 'presence', attribute, value: 'present', label: '', target: 'whole_dish', phase: 'unspecified', selection: `${i}:${j}` })));
  const sensory = buildRecordChartData({ ...data, observations }, now);
  const layered = render(h(RecordChartGraphic, { chart: sensory, mode: 'areaLayered' }));
  assert.equal((layered.match(/data-tint="20"/g) ?? []).length, 3);
  for (const axis of ['umami', 'sweet', 'bitter']) assert.match(layered, new RegExp(`--tb-taste-${axis}-chart-tint-20`));
  const comparison = render(h(RecordChartGraphic, { chart: sensory, mode: 'areaComparison' }));
  assert.match(comparison, /data-series="current" data-tint="80"/);
  assert.match(comparison, /data-series="previous" data-tint="20"/);
  assert.match(comparison, /fill="var\(--tb-taste-umami-chart-tint-20,/);
  assert.match(layered, /width="132" height="56"/);
  assert.match(render(h(RecordChartGraphic, { chart, mode: 'areaLayered' })), /확인된 미각 기록이 없어요/);
});
