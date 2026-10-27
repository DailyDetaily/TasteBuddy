import { createRequire } from 'node:module';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-detail-chart-'));
const out = path.join(dir, 'render.cjs');
await build({ stdin: { contents: "export * from './src/components/system/DetailCharts'; export {default as MiniPie} from './src/components/system/plating/PieDonutChart'; export {default as Panel,RecordDetailChartGraphic} from './src/components/gastronomy/RecordChartsPanel'; export {buildRecordChartData} from './src/lib/gastronomy/recordChartData'; export {ArchiveMenuDetailGraph} from './src/components/home/ArchiveMenuCards'; export {buildArchiveMenuInsights} from './src/lib/gastronomy/archiveMenuInsights'; export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', outfile: out, logLevel: 'silent' });
const { detailChartScale, detailAreaWeight, DetailCartesianChart, DetailDonutChart, DetailCalendarChart, RecordDetailChartGraphic, MiniPie, Panel, buildRecordChartData, ArchiveMenuDetailGraph, buildArchiveMenuInsights, createElement: h, renderToStaticMarkup: render } = createRequire(import.meta.url)(out);
after(() => fs.rm(dir, { recursive: true, force: true }));
process.env.TZ = 'Asia/Seoul';
const now = new Date('2026-10-25T12:00:00+09:00');
const records = Array.from({ length: 6 }, (_, index) => ({ id: `r${index}`, mealID: `m${index}`, menu: '국수', restaurant: '식당', restaurantID: 'restaurant-1', foodKinds: [], labels: [], note: '', date: '2026-10-24T10:00:00+09:00', savedAt: '2026-10-24T11:00:00+09:00', source: ['homeCooked', 'restaurant', 'unknown'][index % 3] }));
const data = { records, observations: [] };

test('detail count scales use integer zero-baseline ticks and percent has an explicit 100 denominator', () => {
  for (const values of [[0, 1], [null, 9, 21], [0, 0], [NaN, -1, 7]]) {
    const scale = detailChartScale(values);
    assert.equal(scale.ticks[0], 0);
    assert.ok(scale.ticks.every(Number.isInteger));
    assert.ok(scale.maximum >= Math.max(1, ...values.filter(value => Number.isFinite(value) && value >= 0)));
  }
  assert.deepEqual(detailChartScale([10, 25], 100).ticks, [0, 25, 50, 75, 100]);
});

test('paired lines reuse the top two sensory meal aggregates and never invent a missing companion', () => {
  const observations = records.flatMap((record, index) => ['taste.umami', ...(index < 3 ? ['taste.sweet'] : []), ...(index < 2 ? ['taste.bitter'] : [])].map((attribute, i) => ({
    id: `${record.id}-${i}`, entryID: record.id, facet: 'presence', attribute, value: 'present', label: '', target: 'whole_dish', phase: 'first_bite', selection: `${index}:${i}`,
  })));
  const chart = buildRecordChartData({ records, observations }, now);
  const html = render(h(RecordDetailChartGraphic, { chart, mode: 'linePair' }));
  assert.equal((html.match(/data-line-series=/g) ?? []).length, 2);
  assert.match(html, /data-line-series="umami"/); assert.match(html, /data-line-series="sweet"/);
  assert.doesNotMatch(html, /data-line-series="bitter"/);
  assert.match(html, /tb-detail-chart-pair-values/);
  assert.match(html, /감칠맛 0회 · 단맛 0회/);
  assert.match(html, /--tb-taste-umami-line-chart-track/);
  assert.match(html, /--tb-taste-sweet-line-chart-track/);
  const one = buildRecordChartData({ records, observations: observations.filter(item => item.attribute === 'taste.umami') }, now);
  const oneHTML = render(h(RecordDetailChartGraphic, { chart: one, mode: 'linePair' }));
  assert.equal((oneHTML.match(/data-line-series=/g) ?? []).length, 1);
  assert.match(oneHTML, /현재 확인된 미각은 한 가지/);
  assert.doesNotMatch(render(h(RecordDetailChartGraphic, { chart: buildRecordChartData(data, now), mode: 'linePair' })), /<svg/);
  const missing = render(h(DetailCartesianChart, { labels: ['1', '2', '3', '4'], kind: 'line', unit: '회', label: '두 미각', initialIndex: 1,
    series: [{ id: 'umami', axis: 'umami', label: '감칠맛', values: [1, null, 3, 4], color: '#b373b3' }, { id: 'sweet', axis: 'sweet', label: '단맛', values: [3, 2, 1, 0], color: '#f90' }] }));
  assert.match(missing, /감칠맛 미확인 · 단맛 2회/);
  assert.equal((missing.match(/data-mark="line-core"/g) ?? []).length, 2, 'the isolated point is not joined across its missing interval');
});

test('detail area ordering uses plotted trapezoids, and missing intervals contribute no invented area', () => {
  assert.equal(detailAreaWeight([8, 0, 0, 8]), 8);
  assert.equal(detailAreaWeight([0, 5, 5, 0]), 10);
  assert.equal(detailAreaWeight([8, null, 8, null]), 0);
  const html = render(h(DetailCartesianChart, { labels: ['1', '2', '3', '4'], series: [{ id: 'a', label: '감칠맛', values: [2, null, 3, 4], color: '#123456' }], kind: 'area', unit: '회', label: '미각을 기록한 식사' }));
  assert.equal((html.match(/data-series="a"/g) ?? []).length, 1);
  assert.match(html, /미각을 기록한 식사/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test('zero remains a baseline dot while null remains absent and described as unknown', () => {
  const html = render(h(DetailCartesianChart, { labels: ['확인된 날', '미확인'], series: [{ id: 'a', label: '요리 기록', values: [0, null], color: '#123456' }], unit: '개', label: '기록', initialIndex: 1 }));
  assert.match(html, /미확인/);
  assert.match(html, /확인된 값이 없어요/);
  assert.match(html, /<circle[^>]+cy="214"/);
  assert.doesNotMatch(html, /<rect/);
});

test('zero denominator never becomes 100%, and known zero slice remains 0 of a nonzero total', () => {
  const empty = render(h(DetailDonutChart, { items: [{ id: 'a', label: '4점 이상', value: 0 }, { id: 'b', label: '4점 미만', value: 0 }], unit: '가지', label: '첫 별점' }));
  assert.match(empty, /비율을 계산할 기록이 없어요/);
  assert.doesNotMatch(empty, /100%/);
  const zero = render(h(DetailDonutChart, { items: [{ id: 'a', label: '4점 이상', value: 0 }, { id: 'b', label: '4점 미만', value: 4 }], unit: '가지', label: '첫 별점' }));
  assert.match(zero, /전체 4가지 중 0%/);
  const unknown = render(h(DetailDonutChart, { items: [{ id: 'a', label: '확인됨', value: 3 }, { id: 'b', label: '미확인', value: null }], unit: '가지', label: '불완전한 분모' }));
  assert.match(unknown, /확인되지 않은 항목이 있어 비율을 계산하지 않아요/);
  assert.doesNotMatch(unknown, /100%/);
});

test('product detail modes render real prepared aggregates and keep future calendar cells unknown', () => {
  const chart = buildRecordChartData(data, now);
  for (const mode of ['heatmap', 'bar', 'grouped', 'line', 'area', 'stacked', 'pie', 'absolute', 'bubble']) {
    const html = render(h(RecordDetailChartGraphic, { chart, mode }));
    assert.match(html, /data-chart-kind=/);
    assert.doesNotMatch(html, /NaN|Infinity|undefined/);
  }
  const calendar = render(h(DetailCalendarChart, { days: chart.month, startDay: chart.startDay, label: chart.monthLabel }));
  assert.match(calendar, /2026-10-24, 6개 요리 기록/);
  assert.match(calendar, /2026-10-26, 미확인/);
  assert.match(calendar, /2026-10-25, 0개 요리 기록/);
  const foods = buildRecordChartData({ records: records.map(record => ({ ...record, foodKindIDs: ['seafood'] })), observations: [] }, now);
  const icons = render(h(RecordDetailChartGraphic, { chart: foods, mode: 'bubbleIcon' }));
  assert.match(icons, /data-content="icon"/);
  assert.match(icons, /data-dish-kind="seafood"/);
  assert.match(icons, /해산물/);
});

test('account loading and failures suppress full graphs; home menu details reuse aggregate state', () => {
  for (const props of [{ loading: true }, { error: 'offline', onRetry: () => {} }]) {
    const html = render(h(Panel, { data, now, variant: 'detail', ...props }));
    assert.doesNotMatch(html, /data-chart-kind=/);
    assert.match(html, /role="(?:status|alert)"/);
  }
  const insights = buildArchiveMenuInsights(data, now);
  for (const id of ['menu-exploration', 'repeat-menu', 'new-menu-satisfaction']) {
    const html = render(h(ArchiveMenuDetailGraph, { id, data: insights }));
    assert.match(html, /data-chart-kind=/);
    assert.doesNotMatch(html, /NaN|Infinity|undefined/);
  }
});

test('detail retains the mini graph visual language without changing its linear scale', () => {
  const segments = [{ id: 'a', label: 'A', value: 3, axis: 'sweet' }, { id: 'b', label: 'B', value: 7, axis: 'umami' }];
  const mini = render(h(MiniPie, { segments }));
  const detail = render(h(DetailDonutChart, { items: segments, unit: '개', label: '구성' }));
  const paths = html => [...html.matchAll(/<path[^>]* d="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(paths(detail), paths(mini), 'solid rounded sectors use the exact mini geometry');
  assert.doesNotMatch(detail, /stroke-dasharray/);
  const series = [{ id: 'a', label: '기록', values: [1, 3, 2], color: '#123456', axis: 'umami' }];
  const line = render(h(DetailCartesianChart, { labels: ['1', '2', '3'], series, kind: 'line', unit: '개', label: '흐름' }));
  assert.match(line, /line-chart-track/); assert.match(line, /line-chart-start/); assert.match(line, /line-chart-end/);
  assert.match(line, /stroke-width="12"/); assert.match(line, /stroke-width="2"/);
  assert.equal((line.match(/data-mark="current-node"/g) ?? []).length, 1);
  const area = render(h(DetailCartesianChart, { labels: ['1', '2', '3'], series, kind: 'area', unit: '개', label: '영역' }));
  assert.doesNotMatch(area, /<circle|data-mark="line/);
  const bar = render(h(DetailCartesianChart, { labels: ['1', '2', '3'], series, unit: '개', label: '기록' }));
  assert.match(bar, /chart-track/); assert.equal((bar.match(/data-mark="capsule-endpoint"/g) ?? []).length, 1);
  const distribution = render(h(DetailCartesianChart, { labels: ['1', '2', '3'], series: [{ ...series[0], highlightsEachValue: true }], unit: '개', label: '분포' }));
  assert.equal((distribution.match(/data-mark="capsule-endpoint"/g) ?? []).length, 3);
  assert.doesNotMatch(bar, /opacity="0\.48"/);
});
