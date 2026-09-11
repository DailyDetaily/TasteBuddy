import assert from 'node:assert/strict';
import {test} from 'node:test';
import {analysisCircle, analysisLineColorIndex, analysisLineOpacity, analysisPoints, centeredAnalysisCircle, rotationTransitionDuration, feedbackEntry, feedbackMorph, feedbackPaths, feedbackRings, feedbackTransitionDuration, feedbackEndDuration, rotationAlignedTime, analysisTimeScale, analysisMoveStarts, analysisTravelDuration, duration, motionPoints, styles, dotOpacity, insightFrame, insightFillEnd, insightIntroDuration, insightAlignment, insightDragDelta, insightInertia} from '../src/taste-motion.ts';

test('조정은 선이 다시 정렬된 뒤 같은 위치·색 순서로 피드백에 연결된다', () => {
  for (const rayCount of [12, 24, 48]) for (const divisions of [3, 6, 12]) {
    for (const requestedAt of [0, 0.4, 1.1, 1.99, 2, 2.8]) {
      const alignedAt = rotationAlignedTime(requestedAt);
      const entry = feedbackEntry(requestedAt, alignedAt - requestedAt, divisions, rayCount);
      assert(entry.delay >= 0 && entry.delay < 2);
      assert.equal(entry.time, 0);
      const rotating = motionPoints('rotatingLayers', alignedAt, divisions, rayCount);
      const paths = feedbackPaths(0, rayCount, entry.angle);
      for (let layer = 0; layer < 3; layer++) for (let ray = 0; ray < rayCount; ray++) {
        const path = paths[layer * rayCount + ray];
        const start = rotating[(layer * divisions / 3 * rayCount + ray) * 2];
        const end = rotating[(((layer + 1) * divisions / 3 - 1) * rayCount + ray) * 2 + 1];
        assert(Math.hypot(path[0].x - start.x, path[0].y - start.y) < 1e-9);
        assert(Math.hypot(path[24].x - end.x, path[24].y - end.y) < 1e-9);
      }
    }
    const paths = feedbackPaths(feedbackTransitionDuration, rayCount);
    for (let layer = 0; layer < 3; layer++) for (let ray = 0; ray < rayCount; ray++) {
      const path = paths[layer * rayCount + ray];
      const next = paths[layer * rayCount + (ray + 1) % rayCount];
      assert(Math.hypot(path[0].x - next[24].x, path[0].y - next[24].y) < 1e-9);
    }
  }
  for (let frame = 0; frame <= 51; frame++) {
    const time = frame / 30;
    const morph = feedbackMorph(time);
    assert(morph.rotation >= -Math.PI / 2 && morph.rotation <= 0);
    for (const path of feedbackPaths(time)) for (const point of path) {
      assert(point.x >= 0 && point.x <= 640 && point.y >= 0 && point.y <= 640);
    }
  }
});

test('세 원의 파동은 첫 전환을 유지하고 겹침 없이 반복하며 종료 신호 뒤에만 수축한다', () => {
  const initial = feedbackRings(feedbackTransitionDuration);
  initial.forEach((ring, i) => {
    assert(Math.abs(ring.radius - [118.5, 197.5, 276.5][i]) < 1e-9);
    assert.equal(ring.opacity, 1);
  });
  for (let frame = 0; frame < 360; frame++) {
    const time = 4.51 + frame / 30;
    const rings = feedbackRings(time), loop = feedbackRings(time + 3);
    rings.forEach((ring, i) => {
      assert(ring.radius >= 79 && ring.radius <= 316 && ring.opacity >= 0 && ring.opacity <= 1);
      assert(Math.abs(ring.radius - loop[i].radius) < 1e-9);
      assert(Math.abs(ring.opacity - loop[i].opacity) < 1e-9);
    });
    const ordered = [...rings].sort((a, b) => a.radius - b.radius);
    assert(Math.abs(ordered[1].radius - ordered[0].radius - 79) < 1e-9);
    assert(Math.abs(ordered[2].radius - ordered[1].radius - 79) < 1e-9);
  }
  for (const requestedAt of [0, 0.2, 1.7, 4.3, 9.1]) {
    const end = Math.max(feedbackTransitionDuration, requestedAt);
    const before = feedbackRings(end).sort((a, b) => a.radius - b.radius);
    assert.deepEqual(feedbackRings(end, requestedAt), before);
    let previous = before;
    for (let frame = 1; frame <= 42; frame++) {
      const rings = feedbackRings(end + frame / 30, requestedAt);
      rings.forEach((ring, i) => assert(ring.radius <= previous[i].radius + 1e-9));
      const visible = rings.filter(ring => ring.opacity > 0.001);
      visible.slice(1).forEach((ring, i) => assert(ring.radius - visible[i].radius > 4));
      previous = rings;
    }
    feedbackRings(end + feedbackEndDuration + 0.01, requestedAt).forEach(ring => assert.deepEqual(ring, {radius: 0, opacity: 0}));
  }
});

test('분석에서 회전으로 전환할 때 중앙에 도착한 뒤 같은 선으로 이어진다', () => {
  for (const rayCount of [12, 24, 48]) {
    const from = analysisCircle(4);
    const circle = centeredAnalysisCircle(from, rotationTransitionDuration, rayCount);
    const before = analysisPoints(circle, from.lineDensity);
    assert.equal(Array.from({length: 48}, (_, i) => analysisLineOpacity(i, circle.lineDensity)).filter(v => v > 0).length, rayCount);
    for (const divisions of [3, 6, 12]) {
      const after = motionPoints('rotatingLayers', 0, divisions, rayCount);
      assert.equal(after.length, divisions * rayCount * 2);
      for (let i = 0; i < rayCount; i++) {
        const inner = before[i * 48 / rayCount * 2], outer = before[i * 48 / rayCount * 2 + 1];
        const start = after[i * 2], end = after[((divisions - 1) * rayCount + i) * 2 + 1];
        assert(Math.hypot(inner.x - start.x, inner.y - start.y) < 1e-9);
        assert(Math.hypot(outer.x - end.x, outer.y - end.y) < 1e-9);
      }
      const loop = duration('rotatingLayers', divisions, rayCount);
      assert.deepEqual(after, motionPoints('rotatingLayers', loop, divisions, rayCount));
      const tail = motionPoints('rotatingLayers', loop - 1 / 300, divisions, rayCount);
      after.forEach((point, i) => assert(Math.hypot(point.x - tail[i].x, point.y - tail[i].y) < 8));
      for (let frame = 0; frame <= 60; frame++) {
        const points = motionPoints('rotatingLayers', frame / 30, divisions, rayCount);
        for (let layer = 0; layer < divisions - 1; layer++) {
          const a = points[layer * rayCount * 2], b = points[(layer + 1) * rayCount * 2];
          const difference = Math.atan2(b.y - 320, b.x - 320) - Math.atan2(a.y - 320, a.x - 320);
          const gap = Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference)));
          assert(gap <= Math.PI / rayCount + 1e-9, '이웃 색상 선으로 넘어가지 않아야 한다');
        }
      }
      for (const time of [0.5, 1, 1.5, 2]) {
        const points = motionPoints('rotatingLayers', time, divisions, rayCount);
        for (let i = 0; i < points.length; i += 2) assert(Math.abs(Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y) - 237 / divisions) < 1e-9);
      }
    }
  }
  for (const time of [0, 0.5, 3, 4.1]) {
    const from = analysisCircle(time);
    assert.deepEqual(centeredAnalysisCircle(from, 0), from);
    let previousDistance = Math.hypot(from.x - 320, from.y - 320);
    const previousLengths = Array.from({length: 48}, (_, i) => analysisLineOpacity(i, from.lineDensity) > 0 ? 1 : 0);
    for (let frame = 1; frame <= rotationTransitionDuration * 30; frame++) {
      const circle = centeredAnalysisCircle(from, frame / 30);
      const distance = Math.hypot(circle.x - 320, circle.y - 320);
      assert(distance <= previousDistance + 1e-9);
      assert(distance + circle.radius < 316);
      const full = analysisPoints(circle), shrinking = analysisPoints(circle, from.lineDensity);
      for (let i = 0; i < 48; i++) {
        const inner = shrinking[i * 2], end = shrinking[i * 2 + 1], outer = full[i * 2 + 1];
        const length = Math.hypot(end.x - inner.x, end.y - inner.y) / Math.hypot(outer.x - inner.x, outer.y - inner.y);
        assert.deepEqual(inner, full[i * 2]);
        assert(length <= previousLengths[i] + 1e-9);
        if (i % 4 === 0) assert(Math.abs(length - 1) < 1e-9);
        previousLengths[i] = length;
      }
      previousDistance = distance;
    }
    const centered = centeredAnalysisCircle(from, rotationTransitionDuration);
    assert.deepEqual(centered, {x: 320, y: 320, radius: 79, lineDensity: 0});
    const before = analysisPoints(centered, from.lineDensity), after = motionPoints('rotatingLayers', 0);
    for (let i = 0; i < 48; i++) {
      if (i % 4 !== 0) assert.deepEqual(before[i * 2], before[i * 2 + 1]);
    }
    for (let i = 0; i < 12; i++) {
      assert(Math.hypot(before[i * 8].x - after[i * 2].x, before[i * 8].y - after[i * 2].y) < 1e-9);
      assert(Math.hypot(before[i * 8 + 1].x - after[265 + i * 2].x, before[i * 8 + 1].y - after[265 + i * 2].y) < 1e-9);
    }
  }
});

test('3·6·12층으로 분할하고 12·6·3층을 거쳐 2초 안에 결합한다', () => {
  const angle = p => Math.atan2(p.y - 320, p.x - 320);
  for (const [divisions, advance, cycleLength, splitAt] of [[3, 30, 103, 59], [6, 37.5, 235, 125], [12, 41.25, 499, 257]]) {
    const start = motionPoints('rotatingLayers', 0, divisions);
    assert.equal(start.length, divisions * 24);
    assert.deepEqual(start, motionPoints('rotatingLayers', duration('rotatingLayers', divisions), divisions));
    const split = motionPoints('rotatingLayers', splitAt / cycleLength * 2, divisions);
    assert.equal(new Set(Array.from({length: divisions}, (_, layer) => angle(split[layer * 24]).toFixed(6))).size, divisions);
    for (let frame = 0; frame <= 60; frame++) {
      const points = motionPoints('rotatingLayers', frame / 30, divisions);
      for (let i = 0; i < points.length; i += 2) {
        assert(Math.abs(Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y) - 237 / divisions) < 1e-9);
      }
    }
    const joined = motionPoints('rotatingLayers', 2, divisions);
    for (let layer = 0; layer < divisions; layer++) assert(Math.abs(angle(joined[layer * 24]) - advance * Math.PI / 180) < 1e-9);
  }
  let previous = motionPoints('rotatingLayers', 0);
  for (let frame = 1; frame <= duration('rotatingLayers') * 30; frame++) {
    const points = motionPoints('rotatingLayers', frame / 30);
    assert.equal(points.length, 288);
    for (let i = 0; i < 144; i++) {
      const start = points[i * 2], end = points[i * 2 + 1];
      const layer = Math.floor(i / 12);
      assert(Math.abs(Math.hypot(start.x - 320, start.y - 320) - (79 + 19.75 * layer)) < 1e-9);
      assert(Math.abs(Math.hypot(end.x - start.x, end.y - start.y) - 19.75) < 1e-9);
      const difference = angle(start) - angle(previous[i * 2]);
      const delta = Math.atan2(Math.sin(difference), Math.cos(difference));
      assert(delta >= -1e-9 && delta <= Math.PI / 12 + 1e-9);
    }
    previous = points;
  }
  const settling = [0.3, 0.5, 0.7, 0.9].map(t => angle(motionPoints('rotatingLayers', (23 + 14 * t) / 499 * 2)[264]));
  assert(settling[1] - settling[0] > settling[2] - settling[1]);
  assert(settling[2] - settling[1] > settling[3] - settling[2]);
  const pairs = values => values.flatMap(angle => [angle, angle]);
  const milestones = [
    [0, Array(12).fill(0)], [59, pairs([0, 0, 15, 15, 30, 30])],
    [125, pairs([0, 7.5, 15, 22.5, 30, 37.5])],
    [147, [0, 0, 7.5, 7.5, 15, 15, 22.5, 22.5, 30, 30, 37.5, 41.25]],
    [169, [0, 0, 7.5, 7.5, 15, 15, 22.5, 22.5, 30, 33.75, 37.5, 41.25]],
    [257, Array.from({length: 12}, (_, i) => i * 3.75)],
    [389, pairs([3.75, 11.25, 18.75, 26.25, 33.75, 41.25])],
    [455, pairs([11.25, 11.25, 26.25, 26.25, 41.25, 41.25])],
    [499, Array(12).fill(41.25)],
  ];
  for (const [frame, angles] of milestones) {
    const time = frame / 499 * 2, points = motionPoints('rotatingLayers', time);
    for (let layer = 0; layer < 12; layer++) {
      assert(Math.abs(angle(points[layer * 24]) - angles[layer] * Math.PI / 180) < 1e-9);
      if (layer < 11 && angles[layer] === angles[layer + 1]) {
        assert(Math.hypot(points[layer * 24 + 1].x - points[(layer + 1) * 24].x, points[layer * 24 + 1].y - points[(layer + 1) * 24].y) < 1e-9);
      }
    }
    const hold = (frame % 499 === 0 ? 23 : 8) / 499 * 2;
    assert.deepEqual(motionPoints('rotatingLayers', time + hold * 0.2), motionPoints('rotatingLayers', time + hold * 0.8));
    assert.notDeepEqual(motionPoints('rotatingLayers', time + hold * 0.2), motionPoints('rotatingLayers', time + hold + 0.03));
  }
});

test('선 안쪽 원은 원형을 유지하며 외곽 안에서 이동하고 크기가 변한다', () => {
  assert.equal(analysisCircle(0).radius, 316 / 4);
  const circles = Array.from({length: duration('analysis') * 30 + 1}, (_, frame) => {
    const points = motionPoints('analysis', frame / 30);
    const density = analysisCircle(frame / 30).lineDensity;
    const colors = new Set();
    let visibleCount = 0;
    for (let i = 0; i < points.length / 2; i++) {
      const opacity = analysisLineOpacity(i, density);
      assert(opacity >= 0 && opacity <= 1);
      assert.equal(opacity, analysisLineOpacity((i + 24) % 48, density));
      assert.equal(analysisLineColorIndex(i, density), analysisLineColorIndex((i + 24) % 48, density));
      if (opacity > 0) {
        assert.equal(analysisLineColorIndex(i, density), visibleCount++ % 6);
        colors.add(analysisLineColorIndex(i, density));
      }
    }
    assert.equal(colors.size, 6);
    const inner = points.filter((_, i) => i % 2 === 0);
    const center = inner.reduce((sum, point) => ({x: sum.x + point.x / inner.length, y: sum.y + point.y / inner.length}), {x: 0, y: 0});
    const radius = Math.hypot(inner[0].x - center.x, inner[0].y - center.y);
    inner.forEach((point) => assert(Math.abs(Math.hypot(point.x - center.x, point.y - center.y) - radius) < 1e-9));
    assert(Math.hypot(center.x - 320, center.y - 320) + radius < 316);
    points.filter((_, i) => i % 2 === 1).forEach((point) => assert(Math.abs(Math.hypot(point.x - 320, point.y - 320) - 316) < 1e-9));
    return {center, radius};
  });
  assert(Math.max(...circles.map(c => c.radius)) - Math.min(...circles.map(c => c.radius)) > 24);
  assert(circles.some(c => Math.hypot(c.center.x - circles[0].center.x, c.center.y - circles[0].center.y) > 120));
});

test('불규칙한 템포로 이동하며 도착 전에 수축하고 대기 중에도 박동한다', () => {
  const destinations = [];
  const intervals = [];
  const travels = [];
  for (let step = 0; step < 8; step++) {
    const t = analysisMoveStarts[step];
    const travel = analysisTravelDuration(step);
    intervals.push(analysisMoveStarts[step + 1] - t);
    travels.push(travel);
    const start = analysisCircle(t * analysisTimeScale);
    const expanded = analysisCircle((t + travel * 0.5) * analysisTimeScale);
    const contracted = analysisCircle((t + travel * 0.94) * analysisTimeScale);
    const arrived = analysisCircle((t + travel) * analysisTimeScale);
    const lineCount = circle => Array.from({length: 48}, (_, i) => analysisLineOpacity(i, circle.lineDensity)).filter(opacity => opacity > 0).length;
    assert.equal(lineCount(start), 48);
    assert.equal(lineCount(expanded), 12);
    assert.equal(lineCount(contracted), 48);
    const transition = analysisCircle((t + travel * 0.2) * analysisTimeScale);
    assert(lineCount(transition) > 12 && lineCount(transition) < 48);
    assert(Array.from({length: 48}, (_, i) => analysisLineOpacity(i, transition.lineDensity)).some(opacity => opacity > 0 && opacity < 1));
    assert(expanded.radius > start.radius + 10);
    assert(contracted.radius < expanded.radius - 15);
    assert(Math.hypot(contracted.x - arrived.x, contracted.y - arrived.y) > 0.001);
    assert(Math.abs(contracted.radius - arrived.radius) < 5);
    const holdStep = Math.min(0.045, (analysisMoveStarts[step + 1] - t - travel - 0.04) / 8);
    const hold = Array.from({length: 9}, (_, i) => analysisCircle((t + travel + 0.02 + i * holdStep) * analysisTimeScale));
    hold.forEach(c => assert(Math.hypot(c.x - arrived.x, c.y - arrived.y) < 1e-9));
    const pulseRange = Math.max(...hold.map(c => c.radius)) - Math.min(...hold.map(c => c.radius));
    assert(pulseRange > 1 && pulseRange < 8);
    assert(travel * analysisTimeScale >= 0.9 && travel * analysisTimeScale <= 1.35);
    destinations.push(arrived);
  }
  assert(new Set(intervals.map(v => v.toFixed(3))).size > 4);
  assert(new Set(travels.map(v => v.toFixed(3))).size > 4);
  assert.equal(new Set(destinations.map(c => `${c.x},${c.y}`)).size, 8);
});

test('온보딩 도형은 캔버스 안에서 움직이며 반복 경계가 이어진다', () => {
  for (const [density, spacing] of [[0, 4], [0.5, 2], [1, 1]]) {
    const visible = Array.from({length: 48}, (_, i) => i).filter(i => analysisLineOpacity(i, density) === 1);
    assert.equal(visible.length, 48 / spacing);
    visible.forEach((index, i) => assert.equal(index, i * spacing));
  }
  for (const density of [0.25, 0.75]) {
    const fading = Array.from({length: 48}, (_, i) => i).filter(i => {
      const opacity = analysisLineOpacity(i, density);
      return opacity > 0 && opacity < 1;
    });
    assert.equal(fading.length, density < 0.5 ? 12 : 24);
    fading.forEach(i => assert.equal(analysisLineOpacity(i, density), 0.5));
  }
  for (const style of styles.filter(style => style !== 'feedbackRings')) {
    const start = motionPoints(style, 0);
    assert.deepEqual(start, motionPoints(style, duration(style)));
    assert.notDeepEqual(start, motionPoints(style, duration(style) / 4));
    for (let sample = 0; sample <= 16; sample++) {
      const time = duration(style) * sample / 16;
      for (const {x, y} of motionPoints(style, time)) {
        assert(Number.isFinite(x) && Number.isFinite(y));
        assert(x >= 0 && x <= 640 && y >= 0 && y <= 640);
      }
    }
    const end = motionPoints(style, duration(style) - 1 / (style === 'rotatingLayers' ? 300 : 30));
    start.forEach((point, i) => assert(Math.hypot(point.x - end[i].x, point.y - end[i].y) < 8));
  }
  for (let i = 0; i < 126; i++) {
    assert(dotOpacity(i, 0) >= 0 && dotOpacity(i, 0) <= 1);
    assert.equal(dotOpacity(i, 0), dotOpacity(i, duration('insightRing')));
  }
});


test('인사이트는 여섯 점에서 규칙적으로 증식하고 빈 원을 채운 뒤 펼쳐진다', () => {
  const initial = insightFrame(0);
  assert(initial.dots[0].x < 320 && initial.dots[0].y < 320);
  assert.equal(initial.dots[0].colorIndex, 0);
  initial.dots.slice(0, 6).forEach((dot, i) => {
    assert.equal(dot.colorIndex, i);
    const angle = -2 * Math.PI / 3 + i * Math.PI / 3;
    assert(Math.abs(Math.atan2(Math.sin(Math.atan2(dot.y - 320, dot.x - 320) - angle), Math.cos(Math.atan2(dot.y - 320, dot.x - 320) - angle))) < 1e-8);
  });
  assert.equal(initial.dots.filter(dot => dot.opacity > 0).length, 6);
  for (let layer = 2; layer <= 6; layer++) {
    const offset = layer * (layer - 1) / 2 * 6;
    const start = 0.1 + (offset / 6 - 1) * 0.025;
    const interval = layer * 0.025 / Math.ceil(layer / 2);
    const order = Array.from({length: layer}, (_, i) => offset + i * 6).sort((a, b) => {
      const full = insightFrame(insightFillEnd).dots;
      return Math.atan2(full[a].y - 320, full[a].x - 320) - Math.atan2(full[b].y - 320, full[b].x - 320);
    });
    for (let group = 0; group < Math.ceil(layer / 2); group++) {
      const growing = insightFrame(start + (group + 0.5) * interval);
      assert.equal(growing.bridges.length, layer % 2 && group === 0 ? 6 : 12);
      for (let i = 0; i < layer; i++) assert.equal(growing.dots[order[i]].progress, growing.dots[order[layer - 1 - i]].progress);
      for (let i = 1; i <= Math.floor(layer / 2); i++) assert(growing.dots[order[i]].progress >= growing.dots[order[i - 1]].progress);
      growing.bridges.forEach(bridge => {
        assert(bridge.parent < bridge.child);
        assert.equal(growing.dots[bridge.parent].progress, 1);
        assert.equal(bridge.colorIndex, bridge.parent % 6);
      });
    }
    const complete = insightFrame(start + layer * 0.025);
    assert.equal(complete.dots.filter(dot => dot.progress > 1e-8).length, layer * (layer + 1) / 2 * 6);
    for (const dot of complete.dots) assert(Math.hypot(dot.x - 320, dot.y - 320) + dot.radius <= 79 + 1e-8);
  }
  assert.equal(insightFillEnd, 0.6);
  assert(insightFrame(0.6).dots.every(dot => dot.progress === 1));
  assert.deepEqual(insightFrame(insightFillEnd).dots, insightFrame(insightFillEnd + 0.19).dots);
  assert.equal(insightFrame(insightFillEnd + 0.2).expansion, 0);
  assert(insightFrame(insightFillEnd + 0.7).expansion > 0);
  const packed = insightFrame(insightFillEnd).dots;
  let offset = 0;
  for (let ring = 1; ring <= 6; ring++) {
    const points = packed.slice(offset, offset + ring * 6).sort((a, b) => Math.atan2(a.y - 320, a.x - 320) - Math.atan2(b.y - 320, b.x - 320));
    const expected = 2 * (79 - 4.8) * ring / 6 * Math.sin(Math.PI / points.length);
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      const distance = Math.hypot(points[i].x - next.x, points[i].y - next.y);
      assert(Math.abs(distance - expected) < 1e-8);
      assert(distance >= 12.36 && distance <= 12.94);
    }
    offset += points.length;
  }
  const expanded = insightFrame(insightIntroDuration);
  assert.equal(expanded.expansion, 1);
  assert.equal(expanded.bridges.length, 0);
  assert.deepEqual(expanded, insightFrame(0, true));
  assert.notDeepEqual(expanded.dots, insightFrame(insightIntroDuration + 1).dots);
  for (let frame = 0; frame < 420; frame++) {
    const state = insightFrame(frame / 30);
    for (const dot of state.dots) {
      assert(Number.isFinite(dot.x) && Number.isFinite(dot.y));
      assert(dot.radius >= 0 && dot.radius <= 9.5);
      assert(dot.opacity >= 0 && dot.opacity <= 1);
      assert(dot.x - dot.radius >= 0 && dot.x + dot.radius <= 640);
      assert(dot.y - dot.radius >= 0 && dot.y + dot.radius <= 640);
    }
    for (const bridge of state.bridges) {
      for (const point of bridge.points) assert(Number.isFinite(point.x) && Number.isFinite(point.y));
      for (const [endpoint, control, index] of [[0, 1, bridge.parent], [7, 6, bridge.parent], [3, 2, bridge.child], [4, 5, bridge.child]]) {
        const p = bridge.points[endpoint], handle = bridge.points[control], circle = state.dots[index];
        const rx = p.x - circle.x, ry = p.y - circle.y;
        assert(Math.abs(Math.hypot(rx, ry) - circle.radius) < 1e-8, '연결점은 원 둘레에 있어야 한다');
        assert(Math.abs(rx * (handle.x - p.x) + ry * (handle.y - p.y)) < 1e-8, '연결 곡선은 원의 접선 방향으로 이어져야 한다');
      }
    }
  }
});


test('드래그 각도를 따라 회전하고 빠르게 놓을수록 더 감속한 뒤 자동 회전으로 돌아간다', () => {
  assert.equal(insightDragDelta({x: 300, y: 0}, {x: 0, y: 300}), Math.PI / 2);
  assert.equal(insightDragDelta({x: 0, y: 300}, {x: 300, y: 0}), -Math.PI / 2);
  assert.equal(insightDragDelta({x: 0, y: 0}, {x: 300, y: 0}), 0);
  const nearSeam = angle => ({x: 300 * Math.cos(angle * Math.PI / 180), y: 300 * Math.sin(angle * Math.PI / 180)});
  assert(Math.abs(insightDragDelta(nearSeam(179), nearSeam(-179)) - Math.PI / 90) < 1e-8);
  assert.equal(insightInertia(0, 3), 0);
  assert.equal(insightInertia(4, 0), 0);
  assert.equal(insightInertia(-4, 3), -insightInertia(4, 3));
  assert(insightInertia(4, 3) > insightInertia(1, 3));
  assert(insightInertia(4, 0.1) > insightInertia(4, 0.6) - insightInertia(4, 0.5));
  assert.equal(insightInertia(4, 3), insightInertia(4, 4));
  for (const alignment of [0, 1]) {
    const base = insightFrame(insightIntroDuration + 3, false, alignment).dots;
    const turned = insightFrame(insightIntroDuration + 3, false, alignment, 0, Math.PI / 2).dots;
    turned.forEach((dot, i) => {
      assert(Math.abs(dot.x - (640 - base[i].y)) < 1e-8);
      assert(Math.abs(dot.y - base[i].x) < 1e-8);
    });
  }
  assert.deepEqual(insightFrame(0).dots, insightFrame(0, false, 0, 0, Math.PI / 2).dots);
});

test('중앙은 진하고 바깥은 연하며, 펼쳐진 색은 누를 때만 미각별로 정렬된다', () => {
  const packed = insightFrame(insightFillEnd).dots;
  let offset = 0, previousOpacity = 1.01;
  for (let ring = 1; ring <= 6; ring++) {
    const dots = packed.slice(offset, offset + ring * 6);
    const opacity = dots[0].opacity;
    assert(opacity < previousOpacity);
    dots.forEach(dot => assert(Math.abs(dot.opacity - opacity) < 1e-8));
    previousOpacity = opacity; offset += dots.length;
  }
  const mixed = insightFrame(insightIntroDuration);
  const grouped = insightFrame(insightIntroDuration, false, 1);
  const colorChanges = dots => {
    const order = [...dots].sort((a, b) => Math.atan2(a.y - 320, a.x - 320) - Math.atan2(b.y - 320, b.x - 320));
    return order.filter((dot, i) => dot.colorIndex !== order[(i + 1) % order.length].colorIndex).length;
  };
  assert(colorChanges(mixed.dots) >= 90);
  assert.equal(colorChanges(grouped.dots), 6);
  for (let sector = 0; sector < 6; sector++) {
    const radialBands = new Set(grouped.dots.filter(dot => dot.colorIndex === sector).map(dot => Math.round(Math.hypot(dot.x - 320, dot.y - 320) / 5)));
    assert(radialBands.size >= 8, '정렬해도 점이 규칙적인 동심원 줄로 모이지 않아야 한다');
  }
  const movedGroup = insightFrame(insightIntroDuration + 1, false, 1).dots;
  const groupedMovement = grouped.dots.map((dot, i) => Math.hypot(dot.x - movedGroup[i].x, dot.y - movedGroup[i].y));
  assert(Math.max(...groupedMovement) > 0.3 && Math.max(...groupedMovement) < 3, '정렬된 점도 자기 자리 주변에서 조금씩 움직여야 한다');
  assert.deepEqual(mixed.dots.map(dot => dot.colorIndex), grouped.dots.map(dot => dot.colorIndex));
  assert.equal(insightAlignment(0, 0, 1), 0);
  assert.equal(insightAlignment(0.5, 0, 1), 1);
  assert.equal(insightAlignment(0.5, 1, 0), 0);
  for (let i = 0; i <= 10; i++) {
    const state = insightFrame(insightIntroDuration, false, i / 10);
    state.dots.forEach(dot => assert(Math.hypot(dot.x - 320, dot.y - 320) > 235));
  }
  for (let sample = 0; sample <= 12; sample++) for (const [from, to] of [[0, 1], [1, 0]]) {
    const start = insightIntroDuration + duration('insightRing') * sample / 12;
    let previous = insightFrame(start, false, from).dots;
    for (let frame = 1; frame <= 30; frame++) {
      const elapsed = frame / 60;
      const dots = insightFrame(start + elapsed, false, insightAlignment(elapsed, from, to), elapsed).dots;
      dots.forEach((dot, i) => assert(Math.hypot(dot.x - previous[i].x, dot.y - previous[i].y) < 80, '회전 중 누르거나 놓아도 점이 반대편으로 튀지 않아야 한다'));
      previous = dots;
    }
  }
  assert.equal(duration('insightRing'), 50.2);
  for (let sample = 0; sample <= 60; sample++) {
    const held = insightFrame(insightIntroDuration + duration('insightRing') * sample / 60, false, 1).dots;
    assert.equal(colorChanges(held), 6);
    for (let sector = 0; sector < 72; sector++) {
      const angle = sector / 72 * Math.PI * 2;
      const radii = held.filter(dot => {
        const delta = Math.atan2(dot.y - 320, dot.x - 320) - angle;
        return Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta))) < Math.PI / 18;
      }).map(dot => Math.hypot(dot.x - 320, dot.y - 320));
      assert(Math.min(...radii) <= 256 && Math.max(...radii) >= 288, '정렬 중에도 링의 안쪽과 바깥쪽 실루엣이 이어져야 한다');
    }
    const points = motionPoints('insightRing', duration('insightRing') * sample / 60);
    const next = motionPoints('insightRing', duration('insightRing') * (sample + 1) / 60);
    const advances = points.map((point, i) => {
      const angle = Math.atan2(next[i].y - 320, next[i].x - 320) - Math.atan2(point.y - 320, point.x - 320);
      return Math.atan2(Math.sin(angle), Math.cos(angle));
    });
    const expected = Math.PI * 2 / 60;
    assert(advances.every(value => value > expected * 0.93 && value < expected * 1.07), '모든 점이 느린 시계방향 회전을 유지해야 한다');
    assert(Math.max(...advances) - Math.min(...advances) > expected * 0.1, '점마다 회전 속도가 조금씩 달라야 한다');
    for (let i = 0; i < points.length; i++) for (let j = i + 6; j < points.length; j += 6) {
      assert(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) >= 42, '같은 미각 컬러는 가까이 뭉치지 않아야 한다');
    }
    for (let sector = 0; sector < 42; sector++) {
      const angle = sector / 42 * Math.PI * 2;
      const radii = points.filter(p => {
        const delta = Math.atan2(p.y - 320, p.x - 320) - angle;
        return Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta))) < Math.PI * 2 / 21;
      }).map(p => Math.hypot(p.x - 320, p.y - 320));
      assert(Math.min(...radii) <= 259 && Math.max(...radii) >= 287, '흩어진 배치에서도 안쪽과 바깥쪽 윤곽이 이어져야 한다');
    }
  }
});
