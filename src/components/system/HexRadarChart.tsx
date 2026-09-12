import React, { useEffect, useRef, useState } from 'react';

import { DATA_VIZ_TOKENS, TASTE_IDS, TASTE_TOKENS } from '../../constants/designTokens';
import { getTasteColor, mixHexColors } from '../../constants/tasteColors';
import type { TasteMeasurementEntry } from '../../constants/tasteMeasurementData';
import { cn } from '../ui/utils';

const RADAR_CHART = DATA_VIZ_TOKENS.radar;

// ── geometry helpers ──

function hexPoint(cx: number, cy: number, r: number, i: number): [number, number] {
  const angle = (Math.PI / 3) * i - Math.PI / 2 - Math.PI / 6;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function hexPolygon(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => hexPoint(cx, cy, r, i))
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
}

function hexagramPolygon(
  outerRadius: number,
  startAngleDeg: number,
) {
  const innerRadius = outerRadius / Math.sqrt(3);

  return Array.from({ length: 12 }, (_, index) => {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = ((startAngleDeg + 30 * index) * Math.PI) / 180;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');
}

function movePointTowardCenter(
  cx: number,
  cy: number,
  x: number,
  y: number,
  offset: number,
): [number, number] {
  const dx = cx - x;
  const dy = cy - y;
  const distance = Math.hypot(dx, dy);
  const safeOffset = Math.min(offset, distance);

  if (distance === 0 || safeOffset === 0) {
    return [x, y];
  }

  return [
    x + (dx / distance) * safeOffset,
    y + (dy / distance) * safeOffset,
  ];
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function solveCubicBezierY(
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const clampedProgress = clampUnit(progress);

  if (clampedProgress === 0 || clampedProgress === 1) {
    return clampedProgress;
  }

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy2 = 3 * y1;
  const by = 3 * (y2 - y1) - cy2;
  const ay = 1 - cy2 - by;
  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy2) * t;
  const sampleCurveDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  let t = clampedProgress;

  for (let iteration = 0; iteration < 5; iteration += 1) {
    const currentX = sampleCurveX(t) - clampedProgress;
    const currentSlope = sampleCurveDerivativeX(t);

    if (Math.abs(currentX) < 0.0001 || Math.abs(currentSlope) < 0.000001) {
      break;
    }

    t -= currentX / currentSlope;
  }

  let lowerBound = 0;
  let upperBound = 1;
  t = clampUnit(t);

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const currentX = sampleCurveX(t);

    if (Math.abs(currentX - clampedProgress) < 0.00001) {
      break;
    }

    if (currentX > clampedProgress) {
      upperBound = t;
    } else {
      lowerBound = t;
    }

    t = (lowerBound + upperBound) / 2;
  }

  return sampleCurveY(t);
}

function getRadarAnimationProgress(progress: number) {
  return solveCubicBezierY(progress, 0.3, 0, 0.1, 1);
}

// ── rounded polygon helpers ──

type RoundedCorner = {
  control: readonly [number, number];
  entry: readonly [number, number];
  exit: readonly [number, number];
};

function computeCornerFromRadii(
  point: readonly [number, number],
  previous: readonly [number, number],
  next: readonly [number, number],
  radius: number,
): RoundedCorner {
  const incomingDx = previous[0] - point[0];
  const incomingDy = previous[1] - point[1];
  const outgoingDx = next[0] - point[0];
  const outgoingDy = next[1] - point[1];
  const incomingDistance = Math.hypot(incomingDx, incomingDy) || 1;
  const outgoingDistance = Math.hypot(outgoingDx, outgoingDy) || 1;
  const safeRadius = Math.min(radius, incomingDistance / 2, outgoingDistance / 2);

  return {
    control: point,
    entry: [
      point[0] + (incomingDx / incomingDistance) * safeRadius,
      point[1] + (incomingDy / incomingDistance) * safeRadius,
    ] as const,
    exit: [
      point[0] + (outgoingDx / outgoingDistance) * safeRadius,
      point[1] + (outgoingDy / outgoingDistance) * safeRadius,
    ] as const,
  };
}

function getRoundedClosedCorners(
  points: ReadonlyArray<readonly [number, number]>,
  cornerRadius: number,
): RoundedCorner[] {
  if (points.length < 3) {
    return [];
  }

  return points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length] ?? point;
    const next = points[(index + 1) % points.length] ?? point;
    return computeCornerFromRadii(point, previous, next, cornerRadius);
  });
}

/**
 * 각 꼭짓점의 코너 각도에 따라 적응형 코너 반경을 계산한다.
 * 좁은 각도(높은 점수 축 주변에 낮은 점수 축) → 더 큰 반경 → 더 둥근 코너.
 */
function computeAdaptiveCornerRadii(
  points: ReadonlyArray<readonly [number, number]>,
  baseRadius: number,
  maxRadius: number,
): number[] {
  if (points.length < 3) {
    return points.map(() => baseRadius);
  }

  return points.map((point, index) => {
    const prev = points[(index - 1 + points.length) % points.length] ?? point;
    const next = points[(index + 1) % points.length] ?? point;

    const v1x = prev[0] - point[0];
    const v1y = prev[1] - point[1];
    const v2x = next[0] - point[0];
    const v2y = next[1] - point[1];
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    if (len1 < 1 || len2 < 1) {
      return baseRadius;
    }

    const cosAngle = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (len1 * len2)));
    const angle = Math.acos(cosAngle);

    // 기준 각도 = 140°. 이보다 넓으면 baseRadius,
    // 좁을수록 maxRadius에 선형으로 가까워진다.
    const thresholdAngle = (140 / 180) * Math.PI;

    if (angle >= thresholdAngle) {
      return baseRadius;
    }

    const sharpness = 1 - angle / thresholdAngle;

    return baseRadius + (maxRadius - baseRadius) * sharpness;
  });
}

/**
 * 꼭짓점별 적응형 반경을 적용한 라운드 코너 배열을 반환한다.
 */
function getRoundedClosedCornersAdaptive(
  points: ReadonlyArray<readonly [number, number]>,
  cornerRadii: readonly number[],
): RoundedCorner[] {
  if (points.length < 3) {
    return [];
  }

  return points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length] ?? point;
    const next = points[(index + 1) % points.length] ?? point;
    return computeCornerFromRadii(point, previous, next, cornerRadii[index] ?? 8);
  });
}

function buildRoundedClosedPath(
  points: ReadonlyArray<readonly [number, number]>,
  cornerRadius: number,
) {
  const roundedCorners = getRoundedClosedCorners(points, cornerRadius);
  return buildClosedPathFromCorners(roundedCorners);
}

function buildClosedPathFromCorners(roundedCorners: RoundedCorner[]) {
  const firstCorner = roundedCorners[0];

  if (!firstCorner) {
    return '';
  }

  const commands = [`M ${firstCorner.exit[0]} ${firstCorner.exit[1]}`];

  for (let index = 1; index < roundedCorners.length; index += 1) {
    const corner = roundedCorners[index];

    if (!corner) {
      continue;
    }

    commands.push(`L ${corner.entry[0]} ${corner.entry[1]}`);
    commands.push(`Q ${corner.control[0]} ${corner.control[1]} ${corner.exit[0]} ${corner.exit[1]}`);
  }

  commands.push(`L ${firstCorner.entry[0]} ${firstCorner.entry[1]}`);
  commands.push(
    `Q ${firstCorner.control[0]} ${firstCorner.control[1]} ${firstCorner.exit[0]} ${firstCorner.exit[1]}`,
  );
  commands.push('Z');

  return commands.join(' ');
}

function snapPointToOuterEdge(
  cx: number,
  cy: number,
  x: number,
  y: number,
  radius: number,
): [number, number] {
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.hypot(dx, dy);

  if (distance < 0.001 || radius <= 0) {
    return [x, y];
  }

  return [
    x + (dx / distance) * radius,
    y + (dy / distance) * radius,
  ];
}

type ProfileSegmentPath = {
  d: string;
  gradientEnd: readonly [number, number];
  gradientStart: readonly [number, number];
};

function getSignedPolygonArea(points: ReadonlyArray<readonly [number, number]>) {
  return points.reduce((area, point, index) => {
    const nextPoint = points[(index + 1) % points.length] ?? point;
    return area + point[0] * nextPoint[1] - point[1] * nextPoint[0];
  }, 0);
}

function normalizeVector(dx: number, dy: number): [number, number] {
  const distance = Math.hypot(dx, dy);

  if (distance < 0.001) {
    return [1, 0];
  }

  return [dx / distance, dy / distance];
}

function getEdgeUnitVector(
  points: ReadonlyArray<readonly [number, number]>,
  fallbackPoints: ReadonlyArray<readonly [number, number]>,
  index: number,
) {
  const nextIndex = (index + 1) % points.length;
  const point = points[index];
  const nextPoint = points[nextIndex];

  if (
    point
    && nextPoint
    && Math.hypot(nextPoint[0] - point[0], nextPoint[1] - point[1]) >= 0.001
  ) {
    return normalizeVector(nextPoint[0] - point[0], nextPoint[1] - point[1]);
  }

  const fallbackPoint = fallbackPoints[index];
  const fallbackNextPoint = fallbackPoints[nextIndex];

  if (fallbackPoint && fallbackNextPoint) {
    return normalizeVector(
      fallbackNextPoint[0] - fallbackPoint[0],
      fallbackNextPoint[1] - fallbackPoint[1],
    );
  }

  return [1, 0] as const;
}

function getOutwardNormal(unitVector: readonly [number, number], isClockwise: boolean): [number, number] {
  return isClockwise
    ? [unitVector[1], -unitVector[0]]
    : [-unitVector[1], unitVector[0]];
}

function getDistanceFromCenter(cx: number, cy: number, point: readonly [number, number]) {
  return Math.hypot(point[0] - cx, point[1] - cy);
}

function shouldSnapProfileNode(
  centers: ReadonlyArray<readonly [number, number]>,
  index: number,
  cx: number,
  cy: number,
  radius: number,
) {
  const center = centers[index];
  const previousCenter = centers[(index - 1 + centers.length) % centers.length];
  const nextCenter = centers[(index + 1) % centers.length];

  if (!center || !previousCenter || !nextCenter) {
    return false;
  }

  const currentDistance = getDistanceFromCenter(cx, cy, center);
  const previousDistance = getDistanceFromCenter(cx, cy, previousCenter);
  const nextDistance = getDistanceFromCenter(cx, cy, nextCenter);
  const valleyDepth = Math.min(previousDistance, nextDistance) - currentDistance;

  return valleyDepth >= radius * 0.5;
}

function buildHybridProfileSegmentPaths(
  centers: ReadonlyArray<readonly [number, number]>,
  radius: number,
  fallbackPoints: ReadonlyArray<readonly [number, number]>,
  cx: number,
  cy: number,
): ProfileSegmentPath[] {
  if (centers.length < 3 || radius <= 0) {
    return [];
  }

  const fallbackArea = getSignedPolygonArea(fallbackPoints);
  const currentArea = getSignedPolygonArea(centers);
  const isClockwise = Math.abs(currentArea) >= 0.001
    ? currentArea > 0
    : fallbackArea >= 0;
  const sweepFlag: 0 | 1 = isClockwise ? 1 : 0;
  const snapPoints = centers.map(([x, y]) => snapPointToOuterEdge(cx, cy, x, y, radius));
  const shouldSnapNodes = centers.map((_, index) =>
    shouldSnapProfileNode(centers, index, cx, cy, radius)
  );
  const tangentSegments = centers.map((center, index) => {
    const nextCenter = centers[(index + 1) % centers.length] ?? center;
    const unitVector = getEdgeUnitVector(centers, fallbackPoints, index);
    const outwardNormal = getOutwardNormal(unitVector, isClockwise);

    return {
      start: [
        center[0] + outwardNormal[0] * radius,
        center[1] + outwardNormal[1] * radius,
      ] as const,
      end: [
        nextCenter[0] + outwardNormal[0] * radius,
        nextCenter[1] + outwardNormal[1] * radius,
      ] as const,
    };
  });

  return tangentSegments.map((segment, index) => {
    const nextIndex = (index + 1) % centers.length;
    const nextSegment = tangentSegments[nextIndex];
    const start = shouldSnapNodes[index]
      ? snapPoints[index] ?? segment.start
      : segment.start;
    const end = shouldSnapNodes[nextIndex]
      ? snapPoints[nextIndex] ?? segment.end
      : segment.end;
    const pathCommands = [
      `M ${start[0]} ${start[1]}`,
      `L ${end[0]} ${end[1]}`,
    ];

    if (!shouldSnapNodes[nextIndex] && nextSegment) {
      pathCommands.push(
        `A ${radius} ${radius} 0 0 ${sweepFlag} ${nextSegment.start[0]} ${nextSegment.start[1]}`,
      );
    }

    return {
      d: pathCommands.join(' '),
      gradientStart: start,
      gradientEnd: !shouldSnapNodes[nextIndex] && nextSegment
        ? nextSegment.start
        : end,
    };
  });
}

// ── component ──

export interface HexRadarChartProps {
  /** Array of 6 taste measurement entries with score / averageScore. */
  className?: string;
  myTasteData: Pick<TasteMeasurementEntry, 'label' | 'score' | 'averageScore'>[];
  /** Whether the chart should animate on mount (default true). */
  shouldAnimate?: boolean;
}

type ReportedRadarProps = { reportedValues: (number | null)[]; referenceValues?: (number | null)[]; maximum: 3 | 4; className?: string };
export default function HexRadarChart(props: HexRadarChartProps | ReportedRadarProps) {
  if (!('reportedValues' in props)) return <LegacyHexRadarChart {...props} />;
  const valid = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= props.maximum;
  const data = TASTE_IDS.map((axis, index) => ({
    label: TASTE_TOKENS[axis].label,
    score: valid(props.reportedValues[index]) ? props.reportedValues[index]! / props.maximum * 100 : 0,
    averageScore: valid(props.referenceValues?.[index]) ? props.referenceValues![index]! / props.maximum * 100 : 0,
  }));
  return <LegacyHexRadarChart className={props.className} myTasteData={data} shouldAnimate={false} isReported
    hasReference={props.referenceValues?.filter(valid).length === TASTE_IDS.length} />;
}

function LegacyHexRadarChart({
  className,
  myTasteData,
  shouldAnimate = true,
  isReported = false,
  hasReference = true,
}: HexRadarChartProps & { isReported?: boolean; hasReference?: boolean }) {
  const cx = 160;
  const cy = 145;
  const maxR = 100;
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridStrokeColor = mixHexColors(RADAR_CHART.gridColor, '#FFFFFF', 0.45);
  const profileAnimationDurationMs = (60 / 60) * 1000;
  const centerMaskRadius = 18 * (25 / 27);
  const centerHexagramMask = hexagramPolygon(centerMaskRadius, -90);
  const gradientIdPrefix = React.useId().replace(/:/g, '');
  const radarMotionFrameRef = useRef<number | null>(null);
  const [profileMotionProgress, setProfileMotionProgress] = useState(0);
  const tasteProfileAnimationKey = myTasteData
    .map(({ label, score, averageScore }) => `${label}:${score}:${averageScore}`)
    .join('|');

  useEffect(() => {
    if (radarMotionFrameRef.current !== null) {
      cancelAnimationFrame(radarMotionFrameRef.current);
      radarMotionFrameRef.current = null;
    }

    if (!shouldAnimate) {
      setProfileMotionProgress(0);
      return;
    }

    if (
      typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setProfileMotionProgress(1);
      return;
    }

    setProfileMotionProgress(0);
    let animationStart: number | null = null;
    const animateProfile = (timestamp: number) => {
      if (animationStart === null) {
        animationStart = timestamp;
      }

      const elapsed = timestamp - animationStart;
      const rawProgress = Math.min(elapsed / profileAnimationDurationMs, 1);

      setProfileMotionProgress(rawProgress);

      if (rawProgress < 1) {
        radarMotionFrameRef.current = requestAnimationFrame(animateProfile);
        return;
      }

      radarMotionFrameRef.current = null;
    };

    radarMotionFrameRef.current = requestAnimationFrame(animateProfile);

    return () => {
      if (radarMotionFrameRef.current !== null) {
        cancelAnimationFrame(radarMotionFrameRef.current);
        radarMotionFrameRef.current = null;
      }
    };
  }, [profileAnimationDurationMs, shouldAnimate, tasteProfileAnimationKey]);

  const animatedProfileProgress = isReported ? 1 : getRadarAnimationProgress(profileMotionProgress);

  // 나의 민감도 폴리곤 좌표
  const NODE_RADIUS = 8;
  const PROFILE_OUTLINE_OUTSET = 1;
  const PROFILE_OUTLINE_RADIUS = NODE_RADIUS + PROFILE_OUTLINE_OUTSET;
  const BASE_CORNER_RADIUS = 8;
  const MAX_CORNER_RADIUS = 16;

  const myPoints = myTasteData.map((d, i) => {
    const r = (d.score / 100) * maxR * animatedProfileProgress;
    return hexPoint(cx, cy, r, i);
  });

  // 적응형 코너 반경: 좁은 각도(높은 점수 + 낮은 이웃)일수록 더 둥글게
  const adaptiveRadii = computeAdaptiveCornerRadii(myPoints, BASE_CORNER_RADIUS, MAX_CORNER_RADIUS);
  const adaptiveCorners = getRoundedClosedCornersAdaptive(myPoints, adaptiveRadii);

  // 노드 위치를 적응형 라운드 코너 기하학에 맞춰 동적으로 계산.
  // 각 꼭짓점의 Bezier 곡선 중점(헥사곤 경로에서 원래 꼭짓점에 가장 가까운 점)을 구한 뒤,
  // 거기서 NODE_RADIUS만큼 중심 방향으로 들여서 노드 원이 헥사곤에 접하도록 보장한다.
  const rawNodePoints = myPoints.map((point, index) => {
    const corner = adaptiveCorners[index];

    if (!corner) {
      return movePointTowardCenter(cx, cy, point[0], point[1], NODE_RADIUS);
    }

    // Quadratic Bezier midpoint (t=0.5): 라운드 코너에서 원래 꼭짓점에 가장 근접하는 점
    const bezierMidX = 0.25 * corner.entry[0] + 0.5 * corner.control[0] + 0.25 * corner.exit[0];
    const bezierMidY = 0.25 * corner.entry[1] + 0.5 * corner.control[1] + 0.25 * corner.exit[1];

    // Bezier 중점에서 NODE_RADIUS만큼 안쪽으로 → 헥사곤이 노드 겉면에 접함
    return movePointTowardCenter(cx, cy, bezierMidX, bezierMidY, NODE_RADIUS);
  });
  // 최소 길이는 빈 그래프의 표시만 바꾼다. 원응답은 null 그대로 유지한다.
  const myNodePoints = rawNodePoints.map((point, index) => isReported && Math.hypot(point[0] - cx, point[1] - cy) < centerMaskRadius + NODE_RADIUS
    ? hexPoint(cx, cy, centerMaskRadius + NODE_RADIUS, index) : point);
  const chartOuterPoints = myTasteData.map((_, i) => hexPoint(cx, cy, maxR, i));
  const mySegmentPaths = buildHybridProfileSegmentPaths(
    myNodePoints,
    PROFILE_OUTLINE_RADIUS,
    chartOuterPoints,
    cx,
    cy,
  );

  // 평균 민감도 폴리곤 좌표
  const avgPoints = myTasteData.map((d, i) => {
    const r = (d.averageScore / 100) * maxR;
    return hexPoint(cx, cy, r, i);
  });
  const avgPath = buildRoundedClosedPath(avgPoints, 8);

  // 꼭짓점 (맛 라벨 + 점)
  const vertices = myTasteData.map((d, i) => ({
    ...d,
    point: chartOuterPoints[i] ?? hexPoint(cx, cy, maxR, i),
    labelPoint: hexPoint(cx, cy, maxR + 10, i),
    color: getTasteColor(d.label),
  }));

  // 대각선 (0-3, 1-4, 2-5)
  const diagonals = [
    [vertices[0], vertices[3]],
    [vertices[1], vertices[4]],
    [vertices[2], vertices[5]],
  ];

  return (
    <svg
      width={RADAR_CHART.size}
      height="310"
      viewBox={`0 0 ${RADAR_CHART.size} 310`}
      className={cn('mx-auto w-full max-w-[360px]', className)}
    >
      <defs>
        {vertices.map((vertex, index) => {
          const nextVertex = vertices[(index + 1) % vertices.length];

          if (!nextVertex) {
            return null;
          }

          return (
            <linearGradient
              key={`profile-gradient-${index}`}
              id={`${gradientIdPrefix}-profile-gradient-${index}`}
              x1={mySegmentPaths[index]?.gradientStart[0] ?? cx}
              y1={mySegmentPaths[index]?.gradientStart[1] ?? cy}
              x2={mySegmentPaths[index]?.gradientEnd[0] ?? cx}
              y2={mySegmentPaths[index]?.gradientEnd[1] ?? cy}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={mixHexColors(vertex.color, '#FFFFFF', 0.5)} />
              <stop offset="100%" stopColor={mixHexColors(nextVertex.color, '#FFFFFF', 0.5)} />
            </linearGradient>
          );
        })}
      </defs>

      {/* 배경 6각형 그리드 */}
      {gridLevels.map((level, idx) => (
        <polygon
          key={idx}
          points={hexPolygon(cx, cy, maxR * level)}
          fill="none"
          stroke={gridStrokeColor}
          strokeWidth="1"
        />
      ))}

      {/* 대각선 */}
      {diagonals.map(([a, b], idx) => (
        <line
          key={idx}
          x1={a.point[0]}
          y1={a.point[1]}
          x2={b.point[0]}
          y2={b.point[1]}
          stroke={gridStrokeColor}
          strokeWidth="1"
        />
      ))}

      {/* 평균 민감도 헥사곤 */}
      {hasReference && <path
        d={avgPath}
        fill="none"
        stroke={RADAR_CHART.averageStroke}
        strokeWidth="1.5"
      />}

      {/* 중심점에서 나의 민감도 노드로 연결되는 축 */}
      {myNodePoints.map(([x, y], idx) => (
        <line
          key={`spoke-${idx}`}
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke={mixHexColors(vertices[idx]?.color ?? RADAR_CHART.highlightStroke, '#FFFFFF', 0.6)}
          strokeWidth="16"
          strokeLinecap="round"
        />
      ))}

      <g transform={`translate(${cx} ${cy})`}>
        <polygon points={centerHexagramMask} fill="#FFFFFF" />
      </g>

      {/* 나의 민감도 헥사곤 */}
      {mySegmentPaths.map((segmentPath, index) => (
        <path
          key={`my-segment-${index}`}
          d={segmentPath.d}
          fill="none"
          stroke={`url(#${gradientIdPrefix}-profile-gradient-${index})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* 나의 민감도 꼭짓점 */}
      {myNodePoints.map(([x, y], i) => (
        <circle
          key={`my-${i}`}
          data-perception-axis={isReported ? TASTE_IDS[i] : undefined}
          cx={x}
          cy={y}
          r="8"
          fill={vertices[i]?.color ?? RADAR_CHART.highlightStroke}
        />
      ))}

      {/* 맛 라벨 */}
      {vertices.map((v, i) => {
        const isLeft = i === 5;
        const isRight = i === 2;
        const isTopLabel = i === 0 || i === 1;
        const isBottomLabel = i === 3 || i === 4;

        return (
          <text
            key={`label-${i}`}
            x={v.labelPoint[0]}
            y={v.labelPoint[1]}
            textAnchor={isLeft ? 'end' : isRight ? 'start' : 'middle'}
            dominantBaseline={
              isTopLabel ? 'text-after-edge' : isBottomLabel ? 'text-before-edge' : 'middle'
            }
            className="font-medium"
            fontSize={RADAR_CHART.labelSize}
            fill={RADAR_CHART.labelColor}
          >
            {v.label}
          </text>
        );
      })}
    </svg>
  );
}
