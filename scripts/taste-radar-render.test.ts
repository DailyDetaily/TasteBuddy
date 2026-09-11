import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HexRadarChart from '../src/components/system/HexRadarChart';

const input = [null, null, null, null, null, null];
const render = (values: (number | null)[], referenceValues?: (number | null)[]) => renderToStaticMarkup(createElement(HexRadarChart, { reportedValues: values, referenceValues, maximum: 4 }));
const circles = (svg: string) => [...svg.matchAll(/<circle[^>]+>/g)].map(([tag]) => ({
  radius: Number(tag.match(/r="([^"]+)"/)?.[1]),
  distance: Math.hypot(Number(tag.match(/cx="([^"]+)"/)?.[1]) - 160, Number(tag.match(/cy="([^"]+)"/)?.[1]) - 145),
}));
const empty = render(input);
assert.equal(circles(empty).length, 6, '빈 축도 최소 길이 노드를 표시한다');
assert.ok(circles(empty).every(node => node.radius === 8 && node.distance > 20 && node.distance < 30));
assert.ok(!/NaN|Infinity/.test(empty));
assert.equal((empty.match(/stroke-width="16"/g) ?? []).length, 6, '막대 굵기는 노드 지름과 같다');
assert.deepEqual(input, [null, null, null, null, null, null], '최소 길이는 원응답을 바꾸지 않는다');
const partial = circles(render([4, null, 0, null, null, null]));
assert.ok(partial[0].distance > 70 && partial[1].distance < 30 && partial[2].distance < 30);
const pathCount = (svg: string) => (svg.match(/<path /g) ?? []).length;
assert.equal(pathCount(render(input, [2, 2, 2, 2, 2, 2])), pathCount(empty) + 1);
assert.equal(pathCount(render(input, [2, null, null, null, null, null])), pathCount(empty), '미응답인 기준 축을 이어 평균선처럼 만들지 않는다');
console.log('레이더 렌더 검사 통과: 빈 그래프, 0 보존, 막대·노드 크기, 실제 이전 응답');
