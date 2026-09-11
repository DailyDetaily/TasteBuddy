// 영상 참조를 코드로 재구성한 장식용 모션. 실제 사용자 취향 수치가 아닙니다.
// SwiftUI TasteMotionGeometry와 같은 640 단위 좌표 및 주기를 사용합니다.
export type MotionStyle = "analysis" | "detailMatrix" | "insightRing" | "rotatingLayers" | "feedbackRings";
export type RotationDivisions = 3 | 6 | 12;
export type RotationRayCount = 12 | 24 | 48;
export const styles: MotionStyle[] = ["analysis", "detailMatrix", "insightRing", "rotatingLayers", "feedbackRings"];
export const palette = ["#FF9900", "#FBC02D", "#95C900", "#7299FF", "#B372B4", "#95867A"];
export const analysisTimeScale = 1.7;
export const rotationTransitionDuration = 1.2;
export const feedbackTransitionDuration = 1.7;
export const feedbackEndDuration = 0.8;
export const analysisMoveStarts = [0, 1.25, 3.1, 4.15, 5.75, 7.75, 8.9, 10.6, 12];
export const duration = (style: MotionStyle, divisions: RotationDivisions = 12, rayCount: RotationRayCount = 12) => style === "analysis" ? 12 * analysisTimeScale : style === "rotatingLayers" ? ({3: 24, 6: 96, 12: 192})[divisions] * rayCount / 12 : style === "insightRing" ? 251 / 5 : 8;
export type Point = {x: number; y: number};
export type FeedbackRing = {radius: number; opacity: number};
const polar = (angle: number, radius: number): Point => ({x: 320 + Math.cos(angle) * radius, y: 320 + Math.sin(angle) * radius});
const insightCloud = (() => {
  let seed = 42;
  const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
  const order = Array.from({length: 126}, (_, i) => i);
  for (let i = 125; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const points: (Point | undefined)[] = Array(126);
  order.forEach((index, n) => {
    for (let attempt = 0; attempt < 2000; attempt++) {
      const angle = (n < 42 ? (Math.floor(n / 2) + random()) / 21 : random()) * Math.PI * 2;
      const low = n < 42 ? n % 2 === 0 ? 244 : 293 : 249;
      const high = n < 42 ? n % 2 === 0 ? 253 : 302 : 297;
      const point = polar(angle, Math.sqrt(low * low + (high * high - low * low) * random()));
      if (points.every((other, j) => !other || Math.hypot(point.x - other.x, point.y - other.y) >= (j % 6 === index % 6 ? 54 : 22))) {
        points[index] = point; break;
      }
    }
    if (!points[index]) throw new Error('인사이트 링 점 배치 실패');
  });
  return points as Point[];
})();
const insightGroupedCloud = (() => {
  const points = insightCloud.map(point => ({
    angle: (Math.atan2(point.y - 320, point.x - 320) + Math.PI * 2) % (Math.PI * 2),
    radius: Math.hypot(point.x - 320, point.y - 320),
  })).sort((a, b) => a.angle - b.angle);
  for (let start = 0; start < points.length; start += 4) {
    const group = points.slice(start, start + 4).sort((a, b) => a.radius - b.radius);
    const inner = group[0], outer = group[group.length - 1];
    inner.radius = Math.min(inner.radius, 250 + 3 * Math.sin(inner.angle * 17));
    outer.radius = Math.max(outer.radius, 295 + 3 * Math.sin(outer.angle * 13));
  }
  return points;
})();
const radarRadii = [278, 130, 235, 178, 250, 155, 270, 200, 242, 162, 260, 190, 280, 205, 255, 170, 238, 275, 182, 240, 158, 265, 215, 190];

// 6층 상태 사이에 각 선을 다시 반으로 나누는 12층 분할·결합을 끼웁니다.
const rotationAngles = (() => {
  const base = [
    [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 15, 15], [0, 0, 15, 15, 30, 30],
    [0, 0, 15, 15, 30, 37.5], [0, 0, 15, 22.5, 30, 37.5], [0, 7.5, 15, 22.5, 30, 37.5],
    [7.5, 7.5, 15, 22.5, 30, 37.5], [7.5, 7.5, 22.5, 22.5, 30, 37.5], [7.5, 7.5, 22.5, 22.5, 37.5, 37.5],
    [22.5, 22.5, 22.5, 22.5, 37.5, 37.5], [37.5, 37.5, 37.5, 37.5, 37.5, 37.5],
  ];
  const states = base.slice(0, 6).map(angles => angles.flatMap(angle => [angle, angle]));
  for (let step = 1; step <= 6; step++) {
    states.push(base[5].flatMap((angle, layer) => [angle, angle + (layer >= 6 - step ? 3.75 : 0)]));
  }
  for (let step = 1; step <= 6; step++) {
    states.push(base[5].flatMap((angle, layer) => [angle + (layer < step ? 3.75 : 0), angle + 3.75]));
  }
  return {
    3: [[0, 0, 0], [0, 0, 15], [0, 15, 30], [15, 15, 30], [30, 30, 30]],
    6: base,
    12: [...states, ...base.slice(6).map(angles => angles.flatMap(angle => [angle + 3.75, angle + 3.75]))],
  };
})();

// 고정 시드로 프레임 탐색과 네이티브 재생에서 같은 불규칙한 경로를 만듭니다.
const random = (index: number) => {
  let value = 42;
  for (let i = 0; i < index + 3; i++) value = value * 16807 % 2147483647;
  return value / 2147483647;
};
const analysisStops = Array.from({length: 8}, (_, index) => ({
  ...polar(random(index * 3) * Math.PI * 2, 55 + 105 * Math.sqrt(random(index * 3 + 1))),
  radius: 316 / 4,
}));
const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const analysisTravelDuration = (step: number) => (0.4 + 0.18 * random(24 + step)) / 0.75;

export const analysisCircle = (time: number) => {
  const t = (Math.max(0, time) % duration("analysis")) / analysisTimeScale;
  let step = 0;
  while (step < analysisStops.length - 1 && t >= analysisMoveStarts[step + 1]) step++;
  const local = (t - analysisMoveStarts[step]) / analysisTravelDuration(step);
  const from = analysisStops[step];
  const to = analysisStops[(step + 1) % analysisStops.length];
  const travel = smooth(local);
  const expanded = from.radius + (Math.max(from.radius, to.radius) + 48 - from.radius) * smooth(local / 0.3);
  // 이동 후반의 62~92% 구간에서 수축하고, 도착 전에 작은 크기에 도달합니다.
  const radius = expanded + (to.radius - expanded) * smooth((local - 0.62) / 0.3);
  const beat = t / 0.75 * Math.PI * 2;
  return {
    x: from.x + (to.x - from.x) * travel,
    y: from.y + (to.y - from.y) * travel,
    radius: radius + 2.6 * Math.sin(beat) + 1.2 * Math.sin(beat * 2),
    lineDensity: 1 - smooth(local / 0.3) * (1 - smooth((local - 0.62) / 0.3)),
  };
};

export const centeredAnalysisCircle = (from: ReturnType<typeof analysisCircle>, time: number, rayCount: RotationRayCount = 12) => {
  const progress = smooth(time / rotationTransitionDuration);
  return {
    x: from.x + (320 - from.x) * progress,
    y: from.y + (320 - from.y) * progress,
    radius: from.radius + (316 / 4 - from.radius) * progress,
    lineDensity: from.lineDensity + ((rayCount === 12 ? 0 : rayCount === 24 ? 0.5 : 1) - from.lineDensity) * progress,
  };
};

export const analysisPoints = (circle: ReturnType<typeof analysisCircle>, collapseFromDensity: number | null = null): Point[] =>
  Array.from({length: 48}, (_, i) => {
    const angle = i / 48 * Math.PI * 2;
    const inner = {x: circle.x + circle.radius * Math.cos(angle), y: circle.y + circle.radius * Math.sin(angle)};
    const outer = polar(angle, 316);
    if (collapseFromDensity === null) return [inner, outer];
    const initial = analysisLineOpacity(i, collapseFromDensity);
    const length = initial > 0 ? Math.min(1, analysisLineOpacity(i, circle.lineDensity) / initial) : analysisLineOpacity(i, circle.lineDensity);
    return [inner, {x: inner.x + (outer.x - inner.x) * length, y: inner.y + (outer.y - inner.y) * length}];
  }).flat();

// 기존 선 사이를 동시에 나눠 12 → 24 → 48개로 늘리고, 확대 시 역순으로 줄입니다.
export const analysisLineOpacity = (index: number, density: number) =>
  index % 4 === 0 ? 1 : smooth(density * 2 - (index % 2 === 0 ? 0 : 1));
export const analysisLineColorIndex = (index: number, density: number) =>
  Math.floor(index / (density <= 0 ? 4 : density <= 0.5 ? 2 : 1)) % 6;

const feedbackEase = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

export const feedbackMorph = (time: number) => {
  const progress = feedbackEase(time / feedbackTransitionDuration);
  const bend = feedbackEase((progress - 0.72) / 0.28);
  return {rotation: -Math.PI / 2 * feedbackEase(progress / 0.72), bend, gradientBlend: feedbackEase((bend - 0.55) / 0.45)};
};

export const feedbackRings = (time: number, endingAt: number | null = null): FeedbackRing[] => {
  if (endingAt !== null && time >= Math.max(feedbackTransitionDuration, endingAt)) {
    const end = Math.max(feedbackTransitionDuration, endingAt);
    return feedbackRings(end).sort((a, b) => a.radius - b.radius).map((ring, index) => {
      const remaining = 1 - feedbackEase((time - end) * 1.4 / feedbackEndDuration - index * 0.2);
      return {radius: ring.radius * remaining, opacity: ring.opacity * remaining};
    });
  }
  const flowTime = Math.max(0, time - feedbackTransitionDuration);
  const ramp = Math.min(1, flowTime / 0.3);
  const travel = flowTime < 0.3 ? 0.3 * (ramp ** 3 - ramp ** 4 / 2) : flowTime - 0.15;
  const fade = (phase: number) => feedbackEase(phase / 0.12) * (1 - feedbackEase((phase - 0.75) / 0.25));
  return Array.from({length: 3}, (_, layer) => {
    const initial = 1 / 6 + layer / 3;
    const unwrapped = initial + travel / 3;
    const phase = unwrapped % 1;
    return {radius: 79 + 237 * phase, opacity: unwrapped < 1 ? Math.min(1, fade(phase) / fade(initial)) : fade(phase)};
  });
};

export const feedbackPaths = (time: number, rayCount: RotationRayCount = 24, angle = 0): Point[][] => {
  const {rotation, bend} = feedbackMorph(time);
  const rings = feedbackRings(time);
  const halfSector = Math.PI / rayCount;
  return Array.from({length: 3 * rayCount}, (_, index) => {
    const radius = rings[Math.floor(index / rayCount)].radius;
    const direction = index % rayCount / rayCount * Math.PI * 2 + angle;
    const center = polar(direction, radius);
    const fittingHalf = radius * Math.sin(halfSector) / (Math.abs(Math.sin(rotation)) * Math.cos(halfSector) + Math.abs(Math.cos(rotation)) * Math.sin(halfSector));
    const halfLength = Math.min(39.5, fittingHalf);
    return Array.from({length: 25}, (_, sample) => {
      const u = sample / 12 - 1;
      const straight = {x: center.x + Math.cos(direction + rotation) * halfLength * u, y: center.y + Math.sin(direction + rotation) * halfLength * u};
      const arc = polar(direction - u * halfSector, radius);
      return {x: straight.x + (arc.x - straight.x) * bend, y: straight.y + (arc.y - straight.y) * bend};
    });
  });
};

// 다음 2초 분할·결합 주기가 끝나 선이 정렬된 순간에 피드백으로 이어집니다.
export const rotationAlignedTime = (time: number) => Math.max(0, Math.ceil(Math.max(0, time) / 2 - 1e-9) * 2);
export const feedbackEntry = (rotationTime: number, time: number, divisions: RotationDivisions = 12, rayCount: RotationRayCount = 12) => {
  const alignedTime = rotationAlignedTime(rotationTime);
  const delay = alignedTime - rotationTime;
  const point = motionPoints("rotatingLayers", alignedTime, divisions, rayCount)[0];
  return {delay, time: Math.max(0, time - delay), angle: Math.atan2(point.y - 320, point.x - 320)};
};

export const motionPoints = (style: MotionStyle, time: number, divisions: RotationDivisions = 12, rayCount: RotationRayCount = 12): Point[] => {
  const phase = (time % duration(style)) / duration(style) * Math.PI * 2;
  if (style === "feedbackRings") return feedbackPaths(time, rayCount).flat();
  if (style === "rotatingLayers") {
    // 분할부터 결합까지 60프레임(2초). 정지를 줄여 각 회전의 감쇠 구간을 확보합니다.
    const angles = rotationAngles[divisions];
    const stageCount = angles.length - 1;
    const cycleLength = 15 + stageCount * 22;
    const advance = angles[stageCount][0];
    const elapsed = (time % duration(style, divisions, rayCount)) * 30;
    const cycle = Math.floor(elapsed / 60);
    const cycleFrame = (elapsed - cycle * 60) * cycleLength / 60;
    const starts = [0, ...Array.from({length: stageCount}, (_, i) => 37 + i * 22)];
    let stage = 0;
    while (stage < stageCount - 1 && cycleFrame >= starts[stage + 1]) stage++;
    const t = Math.min(1, Math.max(0, (cycleFrame - starts[stage + 1] + 14) / 14));
    // 임계 감쇠: 역회전 없이 목표 각도에 부드럽게 안착합니다.
    const progress = (1 - (1 + 6 * t) * Math.exp(-6 * t)) / (1 - 7 * Math.exp(-6));
    // 선 간격에 비례해 회전각을 줄여 다른 색의 옆 선과 결합하지 않게 합니다.

    return Array.from({length: divisions * rayCount}, (_, i) => {
      const layer = Math.floor(i / rayCount);
      const from = angles[stage][layer], to = angles[stage + 1][layer];
      const angle = i % rayCount / rayCount * Math.PI * 2 + (cycle * advance + from + (to - from) * progress) * 12 / rayCount * Math.PI / 180;
      return [polar(angle, 79 + 237 / divisions * layer), polar(angle, 79 + 237 / divisions * (layer + 1))];
    }).flat();
  }
  if (style === "analysis") {
    return analysisPoints(analysisCircle(time));
  }
  if (style === "detailMatrix") {
    return radarRadii.map((radius, i) => polar(i / 24 * Math.PI * 2, radius + 26 * Math.sin(phase + i * 1.7)));
  }
  return insightCloud.map((point, i) => {
    const baseAngle = Math.atan2(point.y - 320, point.x - 320);
    const wavePhase = phase * 3;
    const angle = baseAngle + phase + 0.02 * Math.sin(wavePhase + i * 1.618);
    const radius = Math.hypot(point.x - 320, point.y - 320) + 3 * Math.sin(wavePhase + baseAngle * 3) + 2 * Math.sin(wavePhase * 2 + i * 2.414);
    return polar(angle, radius);
  });
};

export const dotOpacity = (index: number, time: number) =>
  0.45 + 0.5 * (0.5 + 0.5 * Math.sin(time % duration("insightRing") / duration("insightRing") * Math.PI * 6 + index * 1.7));
export const dotColorIndex = (index: number) => (index * 5 + Math.floor(index / 6)) % 9;

// 여섯 갈래가 같은 박자로 증식해 회전 모션의 빈 원(반지름 79)을 채웁니다.
export const insightFillEnd = 0.1 + 20 * 0.025;
export const insightIntroDuration = insightFillEnd + 0.2 + 1.1;
const insightPackedDots: {point: Point; parent: number; startsAt: number; duration: number}[] = [];
for (let layer = 1; layer <= 6; layer++) {
  const slots = Array.from({length: layer}, (_, slot) => slot).sort((a, b) => Math.abs(a - (layer - 1) / 2) - Math.abs(b - (layer - 1) / 2) || a - b);
  const duration = layer === 1 ? 0 : layer * 0.025 / Math.ceil(layer / 2);
  for (const slot of slots) {
    const startsAt = layer === 1 ? 0 : 0.1 + (layer * (layer - 1) / 2 - 1) * 0.025 + Math.floor(Math.abs(slot - (layer - 1) / 2)) * duration;
    for (let sector = 0; sector < 6; sector++) {
      const angle = -2 * Math.PI / 3 + sector * Math.PI / 3 + slot / layer * Math.PI / 3;
      const point = polar(angle, (79 - 4.8) * layer / 6);
      let parent = 0, closest = Infinity;
      insightPackedDots.forEach((candidate, index) => {
        if (index % 6 !== sector || candidate.startsAt + candidate.duration > startsAt + 1e-8) return;
        const distance = Math.hypot(point.x - candidate.point.x, point.y - candidate.point.y);
        if (distance < closest) { parent = index; closest = distance; }
      });
      insightPackedDots.push({point, parent, startsAt, duration});
    }
  }
}
export const insightExpansion = (time: number) => {
  if (time <= insightFillEnd + 0.2) return 0;
  if (time >= insightIntroDuration) return 1;
  return smooth((time - (insightFillEnd + 0.2)) / 1.1);
};
export const insightAlignment = (elapsed: number, from: number, to: number) => from + (to - from) * smooth(elapsed / 0.5);
export const insightDragDelta = (from: Point, to: Point) => Math.hypot(from.x, from.y) < 40 || Math.hypot(to.x, to.y) < 40 ? 0 : Math.atan2(from.x * to.y - from.y * to.x, from.x * to.x + from.y * to.y);
export const insightInertia = (velocity: number, elapsed: number) => {
  const duration = Math.min(1.8, 0.35 + Math.abs(velocity) * 0.15);
  const progress = Math.min(1, Math.max(0, elapsed / duration));
  return velocity * duration / 3 * (1 - (1 - progress) ** 3);
};
export const insightFrame = (time: number, settled = false, alignment = 0, alignmentElapsed = 0, rotation = 0) => {
  const expansion = settled ? 1 : insightExpansion(time);
  const freeTime = settled ? 0 : Math.max(0, time - insightIntroDuration);
  const free = motionPoints("insightRing", freeTime);
  const anchorTime = Math.max(0, freeTime - alignmentElapsed);
  const anchor = alignment > 0 ? motionPoints("insightRing", anchorTime) : free;
  const dots = insightPackedDots.map((entry, index) => {
    const target = entry.point;
    const step = Math.floor(index / 6), sector = index % 6;
    const progress = step === 0 || settled || time >= insightFillEnd ? 1 : Math.min(1, smooth((time - entry.startsAt) / entry.duration));
    const parent = insightPackedDots[entry.parent].point;
    const packed = step === 0 ? target : {x: parent.x + (target.x - parent.x) * progress, y: parent.y + (target.y - parent.y) * progress};
    const mixed = free[index];
    const freeAngle = Math.atan2(mixed.y - 320, mixed.x - 320);
    const anchorAngle = Math.atan2(anchor[index].y - 320, anchor[index].x - 320);
    const turn = Math.PI * 2;
    const angle = freeAngle + turn * Math.round((anchorAngle + turn * (freeTime - anchorTime) / duration("insightRing") - freeAngle) / turn);
    const sorted = insightGroupedCloud[sector * 21 + step];
    const wavePhase = freeTime % duration("insightRing") / duration("insightRing") * turn * 3;
    const sortedAngle = Math.min(insightGroupedCloud[sector * 21 + 20].angle, Math.max(insightGroupedCloud[sector * 21].angle, sorted.angle + 0.012 * Math.sin(wavePhase + index * 1.618)));
    const delta = anchorAngle + Math.atan2(Math.sin(sorted.angle - anchorAngle), Math.cos(sorted.angle - anchorAngle)) + sortedAngle - sorted.angle - angle;
    const mixedRadius = Math.hypot(mixed.x - 320, mixed.y - 320), sortedRadius = sorted.radius + 3 * Math.sin(wavePhase + index * 2.414);
    const destination = polar(angle + delta * alignment - 2 * Math.PI / 3 + rotation, mixedRadius + (sortedRadius - mixedRadius) * alignment);
    const packedOpacity = Math.min(1, Math.max(0.35, 1 - 0.65 * (Math.hypot(target.x - 320, target.y - 320) / (79 - 4.8) * 6 - 1) / 5));
    return {
      x: packed.x + (destination.x - packed.x) * expansion,
      y: packed.y + (destination.y - packed.y) * expansion,
      radius: (4.8 + (9.5 - 4.8) * expansion) * progress,
      opacity: progress * (packedOpacity + (dotOpacity(index, freeTime) - packedOpacity) * expansion),
      colorIndex: sector, progress,
    };
  });
  const bridges: {points: Point[]; colorIndex: number; parent: number; child: number}[] = [];
  if (expansion === 0) dots.forEach((dot, index) => {
    if (index < 6 || dot.progress <= 0 || dot.progress >= 0.95) return;
    const parentIndex = insightPackedDots[index].parent;
    const parent = dots[parentIndex];
    const dx = dot.x - parent.x, dy = dot.y - parent.y, distance = Math.hypot(dx, dy);
    const r1 = parent.radius, r2 = dot.radius;
    if (distance <= Math.abs(r1 - r2)) return;
    // 원의 교점과 접선으로 연결합니다. Paper.js / SATO Hiroyuki의 메타볼 기하 모델.
    const acos = (value: number) => Math.acos(Math.max(-1, Math.min(1, value)));
    const u1 = distance < r1 + r2 ? acos((r1 * r1 + distance * distance - r2 * r2) / (2 * r1 * distance)) : 0;
    const u2 = distance < r1 + r2 ? acos((r2 * r2 + distance * distance - r1 * r1) / (2 * r2 * distance)) : 0;
    const direction = Math.atan2(dy, dx), tangent = acos((r1 - r2) / distance);
    const blend = 0.5 * (1 - smooth((dot.progress - 0.55) / 0.4));
    const a1 = direction + u1 + (tangent - u1) * blend, b1 = 2 * direction - a1;
    const a2 = direction + Math.PI - u2 - (Math.PI - u2 - tangent) * blend, b2 = 2 * direction - a2;
    const at = (center: Point, angle: number, radius: number): Point => ({x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius});
    const p1 = at(parent, a1, r1), p2 = at(dot, a2, r2), p3 = at(dot, b2, r2), p4 = at(parent, b1, r1);
    const handle = Math.min(blend * 2.4, Math.hypot(p1.x - p2.x, p1.y - p2.y) / (r1 + r2)) * Math.min(1, distance * 2 / (r1 + r2));
    bridges.push({
      points: [p1, at(p1, a1 - Math.PI / 2, r1 * handle), at(p2, a2 + Math.PI / 2, r2 * handle), p2,
        p3, at(p3, b2 - Math.PI / 2, r2 * handle), at(p4, b1 + Math.PI / 2, r1 * handle), p4],
      colorIndex: dot.colorIndex, parent: parentIndex, child: index,
    });
  });
  return {dots, bridges, expansion};
};
