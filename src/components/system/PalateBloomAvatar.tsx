import { useId, type ReactElement } from 'react';

import {
  DEFAULT_TASTE_MEASUREMENT_RESULTS,
  isBroadStarterMeasurementSnapshot,
  resolveTasteMeasurementValue,
  type TasteMeasurementSnapshot,
} from '../../constants/tasteMeasurementData';
import { cn } from '../ui/utils';
import {
  resolveProfileAvatarSize,
  type ProfileAvatarSize,
  type ProfileAvatarSizeValue,
} from './profileAvatarSizeTokens';
import './PalateBloomAvatar.css';

export type TasteProfile = {
  sweet: number;
  sour: number;
  bitter: number;
  salty: number;
  umami: number;
  fat: number;
};

type TasteKey = keyof TasteProfile;

export const TASTE_COLORS: Record<TasteKey, string> = {
  sweet: 'color-mix(in srgb, var(--tb-taste-sweet-main) 85%, white 15%)',
  sour: 'color-mix(in srgb, var(--tb-taste-sour-main) 85%, white 15%)',
  bitter: 'color-mix(in srgb, var(--tb-taste-bitter-main) 85%, white 15%)',
  salty: 'color-mix(in srgb, var(--tb-taste-salty-main) 85%, white 15%)',
  umami: 'color-mix(in srgb, var(--tb-taste-umami-main) 85%, white 15%)',
  fat: 'color-mix(in srgb, var(--tb-taste-fat-main) 85%, white 15%)',
};

export const RANK_WEIGHTS = [1.0, 0.82, 0.66, 0.5, 0.36, 0.24] as const;

export type SortedTasteProfileEntry = {
  color: string;
  rank: number;
  taste: TasteKey;
  value: number;
};

export type PalateBloomAvatarProps = {
  ariaLabel?: string;
  className?: string;
  coreShape?: PalateBloomCoreShape;
  imageSrc?: string | null;
  petalShape?: PalateBloomPetalShape;
  profile: TasteProfile;
  shapeCountOverride?: number;
  shapeSeed?: string;
  showFrame?: boolean;
  size?: ProfileAvatarSizeValue;
  starShape?: PalateBloomStarShape;
};

export type PalateBloomShapeCountKey = 'largePetal' | 'smallPetal' | 'largeStar' | 'smallStar';

export type PalateBloomShapeCounts = Record<PalateBloomShapeCountKey, number>;

export type PalateBloomPetalShape =
  | 'roundPetal'
  | 'capsulePetal'
  | 'softDiamondPetal'
  | 'serratedTipPetal';

export type PalateBloomStarShape = 'thinStar' | 'roundedSpokeStar' | 'dottedRayStar';

export type PalateBloomCoreShape = 'solidCore' | 'diamondCore' | 'seedCluster';

export type PalateBloomShapeVariant = {
  coreShape: PalateBloomCoreShape;
  petalShape: PalateBloomPetalShape;
  starShape: PalateBloomStarShape;
};

type RankedBloomLayer = SortedTasteProfileEntry & {
  relationshipWeight: number;
  ratio: number;
  visualWeight: number;
};

type PetalLayerOptions = {
  centerDistance: number;
  color: string;
  count: number;
  cx?: number;
  cy?: number;
  keyPrefix: string;
  petalRadius?: number;
  petalRx?: number;
  petalRy?: number;
  rotationOffset?: number;
  shape?: PalateBloomPetalShape | 'ellipse';
};

type StarLayerOptions = {
  color: string;
  count: number;
  innerRadius: number;
  keyPrefix: string;
  outerRadius: number;
  rotation: number;
  shape: PalateBloomStarShape;
};

const CENTER = 50;
const BACKGROUND_RADIUS = 48.5;
const DEFAULT_SIZE: ProfileAvatarSize = 'md';
const FALLBACK_PALATE_BLOOM_PROFILE_SEED = 'taste-buddy-palate-bloom-fallback';
const FALLBACK_PALATE_BLOOM_VALUE_BANDS = [84, 73, 63, 52, 42, 31] as const;
export const PALATE_BLOOM_SHAPE_COUNT_LIMITS = {
  max: 8,
  min: 4,
} as const;
export const PALATE_BLOOM_PETAL_SHAPES = [
  'roundPetal',
  'capsulePetal',
  'softDiamondPetal',
  'serratedTipPetal',
] as const satisfies readonly PalateBloomPetalShape[];
export const PALATE_BLOOM_STAR_SHAPES = [
  'thinStar',
  'roundedSpokeStar',
  'dottedRayStar',
] as const satisfies readonly PalateBloomStarShape[];
export const PALATE_BLOOM_CORE_SHAPES = [
  'solidCore',
  'diamondCore',
  'seedCluster',
] as const satisfies readonly PalateBloomCoreShape[];
const TASTE_KEYS: TasteKey[] = ['sweet', 'sour', 'bitter', 'salty', 'umami', 'fat'];

export const DEFAULT_PALATE_BLOOM_PROFILE: TasteProfile = {
  sweet: Math.round(DEFAULT_TASTE_MEASUREMENT_RESULTS.sweet * 10),
  sour: Math.round(DEFAULT_TASTE_MEASUREMENT_RESULTS.sour * 10),
  bitter: Math.round(DEFAULT_TASTE_MEASUREMENT_RESULTS.bitter * 10),
  salty: Math.round(DEFAULT_TASTE_MEASUREMENT_RESULTS.salty * 10),
  umami: Math.round(DEFAULT_TASTE_MEASUREMENT_RESULTS.umami * 10),
  fat: Math.round(DEFAULT_TASTE_MEASUREMENT_RESULTS.fat * 10),
};

export function createPalateBloomProfileFromMeasurementSnapshot(
  snapshot: TasteMeasurementSnapshot | null | undefined,
  fallbackSeed?: string | null,
): TasteProfile {
  if (!snapshot || isBroadStarterMeasurementSnapshot(snapshot)) {
    return createPalateBloomFallbackProfile(fallbackSeed);
  }

  return TASTE_KEYS.reduce((profile, taste) => {
    profile[taste] = Math.round(resolveTasteMeasurementValue(snapshot, taste) * 10);
    return profile;
  }, {} as TasteProfile);
}

export function createPalateBloomFallbackProfile(seed?: string | null): TasteProfile {
  const normalizedSeed = seed?.trim() || FALLBACK_PALATE_BLOOM_PROFILE_SEED;
  const rankedTastes = [...TASTE_KEYS].sort((tasteA, tasteB) => {
    const hashA = hashString(`${normalizedSeed}|fallbackRank|${tasteA}`);
    const hashB = hashString(`${normalizedSeed}|fallbackRank|${tasteB}`);

    return hashB - hashA;
  });

  return rankedTastes.reduce((profile, taste, index) => {
    const jitterHash = hashString(`${normalizedSeed}|fallbackValue|${taste}`);
    const jitter = (jitterHash % 11) - 5;
    profile[taste] = clampTasteValue(FALLBACK_PALATE_BLOOM_VALUE_BANDS[index] + jitter);
    return profile;
  }, {} as TasteProfile);
}

export const sampleProfiles: Record<'profileA' | 'profileB' | 'profileC', TasteProfile> = {
  profileA: {
    sweet: 82,
    umami: 75,
    salty: 67,
    fat: 43,
    sour: 31,
    bitter: 24,
  },
  profileB: {
    umami: 79,
    sour: 61,
    bitter: 56,
    fat: 48,
    salty: 34,
    sweet: 29,
  },
  profileC: {
    salty: 84,
    fat: 63,
    umami: 58,
    sour: 42,
    sweet: 38,
    bitter: 21,
  },
};

function clampTasteValue(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function roundSvgValue(value: number) {
  return Number(value.toFixed(2));
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function clampShapeCount(value: number) {
  return Math.min(
    PALATE_BLOOM_SHAPE_COUNT_LIMITS.max,
    Math.max(
      PALATE_BLOOM_SHAPE_COUNT_LIMITS.min,
      Number.isFinite(value) ? Math.round(value) : PALATE_BLOOM_SHAPE_COUNT_LIMITS.min,
    ),
  );
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createProfileSeed(profile: TasteProfile) {
  return TASTE_KEYS.map((taste) =>
    `${taste}:${Math.round(clampTasteValue(profile[taste]) * 10)}`,
  ).join('|');
}

function createPalateBloomSeed(profile: TasteProfile, shapeSeed?: string) {
  const profileSeed = createProfileSeed(profile);
  const normalizedShapeSeed = shapeSeed?.trim();

  return normalizedShapeSeed ? `${normalizedShapeSeed}|${profileSeed}` : profileSeed;
}

function getSeededSharedShapeCount(seed: string) {
  const span =
    PALATE_BLOOM_SHAPE_COUNT_LIMITS.max - PALATE_BLOOM_SHAPE_COUNT_LIMITS.min + 1;

  return (
    PALATE_BLOOM_SHAPE_COUNT_LIMITS.min + (hashString(`${seed}|sharedShapeCount`) % span)
  );
}

function getSeededShapeOption<TShape extends string>(
  options: readonly [TShape, ...TShape[]],
  seed: string,
  salt: string,
) {
  return options[hashString(`${seed}|${salt}`) % options.length] ?? options[0];
}

export function getPalateBloomShapeVariant(
  profile: TasteProfile,
  shapeSeed?: string,
): PalateBloomShapeVariant {
  const seed = createPalateBloomSeed(profile, shapeSeed);

  return {
    coreShape: getSeededShapeOption(PALATE_BLOOM_CORE_SHAPES, seed, 'coreShape'),
    petalShape: getSeededShapeOption(PALATE_BLOOM_PETAL_SHAPES, seed, 'petalShape'),
    starShape: getSeededShapeOption(PALATE_BLOOM_STAR_SHAPES, seed, 'starShape'),
  };
}

export function getPalateBloomShapeCounts(
  profile: TasteProfile,
  shapeCountOverride?: number,
  shapeSeed?: string,
): PalateBloomShapeCounts {
  const seed = createPalateBloomSeed(profile, shapeSeed);
  const sharedShapeCount =
    shapeCountOverride === undefined
      ? getSeededSharedShapeCount(seed)
      : clampShapeCount(shapeCountOverride);

  return {
    largePetal: sharedShapeCount,
    largeStar: sharedShapeCount,
    smallPetal: sharedShapeCount,
    smallStar: sharedShapeCount,
  };
}

export function sortTasteProfile(profile: TasteProfile): SortedTasteProfileEntry[] {
  return TASTE_KEYS.map((taste) => ({
    color: TASTE_COLORS[taste],
    rank: 0,
    taste,
    value: clampTasteValue(profile[taste]),
  }))
    .sort((left, right) => {
      const valueDelta = right.value - left.value;

      return valueDelta === 0
        ? TASTE_KEYS.indexOf(left.taste) - TASTE_KEYS.indexOf(right.taste)
        : valueDelta;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function getVisualWeight(value: number, rankIndex: number) {
  const valueNorm = clampTasteValue(value) / 100;
  const rankWeight = RANK_WEIGHTS[rankIndex] ?? RANK_WEIGHTS[RANK_WEIGHTS.length - 1];

  return valueNorm * 0.4 + rankWeight * 0.6;
}

function getRelationshipWeight(ratio: number, maxRatio: number, minRatio: number) {
  if (maxRatio === minRatio) {
    return 0.5;
  }

  const spreadPosition = (ratio - minRatio) / (maxRatio - minRatio);
  const leaderPosition = maxRatio > 0 ? ratio / maxRatio : 0.5;

  return clamp01(
    Math.pow(spreadPosition, 0.72) * 0.62 + Math.pow(leaderPosition, 0.7) * 0.38,
  );
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  if (inMin === inMax) {
    return outMin;
  }

  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export function createStarPoints(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number,
  rotation: number,
) {
  return Array.from({ length: points * 2 }, (_, pointIndex) => {
    const radius = pointIndex % 2 === 0 ? outerRadius : innerRadius;
    const angle = toRadians(rotation - 90 + pointIndex * (180 / points));
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    return `${roundSvgValue(x)},${roundSvgValue(y)}`;
  }).join(' ');
}

function createSerratedTipPetalPath(
  cx: number,
  cy: number,
  length: number,
  width: number,
) {
  const halfWidth = width / 2;
  const innerY = cy + length / 2;
  const outerPeakY = cy - length / 2;
  const centerTriangleBase = width / 2;
  const triangleHeight = (centerTriangleBase * Math.sqrt(3)) / 2;
  const points = [
    [cx - halfWidth, innerY],
    [cx + halfWidth, innerY],
    [cx + halfWidth, outerPeakY],
    [cx + halfWidth * 0.5, outerPeakY + triangleHeight],
    [cx, outerPeakY],
    [cx - halfWidth * 0.5, outerPeakY + triangleHeight],
    [cx - halfWidth, outerPeakY],
  ];

  return `${points
    .map(([x, y], index) => {
      const command = index === 0 ? 'M' : 'L';

      return `${command} ${roundSvgValue(x)} ${roundSvgValue(y)}`;
    })
    .join(' ')} Z`;
}

export function renderPetalLayer({
  centerDistance,
  color,
  count,
  cx = CENTER,
  cy = CENTER,
  keyPrefix,
  petalRadius,
  petalRx,
  petalRy,
  rotationOffset = 0,
  shape = 'ellipse',
}: PetalLayerOptions): ReactElement[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = rotationOffset + (360 / count) * index;
    const angleRadians = toRadians(angle - 90);
    const petalCx = cx + Math.cos(angleRadians) * centerDistance;
    const petalCy = cy + Math.sin(angleRadians) * centerDistance;

    if (shape === 'roundPetal') {
      return (
        <circle
          key={`${keyPrefix}-${index}`}
          cx={roundSvgValue(petalCx)}
          cy={roundSvgValue(petalCy)}
          fill={color}
          r={roundSvgValue(petalRadius ?? petalRx ?? 8)}
        />
      );
    }

    if (shape === 'capsulePetal') {
      const petalWidth = (petalRadius ?? petalRx ?? 8) * 1.36;
      const petalHeight = (petalRadius ?? petalRy ?? 8) * 2.2;

      return (
        <rect
          key={`${keyPrefix}-${index}`}
          fill={color}
          height={roundSvgValue(petalHeight)}
          rx={roundSvgValue(petalWidth / 2)}
          ry={roundSvgValue(petalWidth / 2)}
          transform={`rotate(${roundSvgValue(angle)} ${roundSvgValue(petalCx)} ${roundSvgValue(petalCy)})`}
          width={roundSvgValue(petalWidth)}
          x={roundSvgValue(petalCx - petalWidth / 2)}
          y={roundSvgValue(petalCy - petalHeight / 2)}
        />
      );
    }

    if (shape === 'serratedTipPetal') {
      const petalLength = (petalRadius ?? petalRy ?? 8) * 2.2;
      const petalWidth = (petalRadius ?? petalRx ?? 8) * 1.28;

      return (
        <path
          key={`${keyPrefix}-${index}`}
          d={createSerratedTipPetalPath(petalCx, petalCy, petalLength, petalWidth)}
          fill={color}
          transform={`rotate(${roundSvgValue(angle)} ${roundSvgValue(petalCx)} ${roundSvgValue(petalCy)})`}
        />
      );
    }

    if (shape === 'softDiamondPetal') {
      const majorRadius = (petalRadius ?? petalRy ?? 8) * 1.28;
      const minorRadius = (petalRadius ?? petalRx ?? 8) * 0.82;
      const pathData = [
        `M ${roundSvgValue(petalCx)} ${roundSvgValue(petalCy - majorRadius)}`,
        `Q ${roundSvgValue(petalCx + minorRadius)} ${roundSvgValue(petalCy - majorRadius * 0.52)} ${roundSvgValue(petalCx + minorRadius)} ${roundSvgValue(petalCy)}`,
        `Q ${roundSvgValue(petalCx + minorRadius)} ${roundSvgValue(petalCy + majorRadius * 0.52)} ${roundSvgValue(petalCx)} ${roundSvgValue(petalCy + majorRadius)}`,
        `Q ${roundSvgValue(petalCx - minorRadius)} ${roundSvgValue(petalCy + majorRadius * 0.52)} ${roundSvgValue(petalCx - minorRadius)} ${roundSvgValue(petalCy)}`,
        `Q ${roundSvgValue(petalCx - minorRadius)} ${roundSvgValue(petalCy - majorRadius * 0.52)} ${roundSvgValue(petalCx)} ${roundSvgValue(petalCy - majorRadius)}`,
        'Z',
      ].join(' ');

      return (
        <path
          key={`${keyPrefix}-${index}`}
          d={pathData}
          fill={color}
          transform={`rotate(${roundSvgValue(angle)} ${roundSvgValue(petalCx)} ${roundSvgValue(petalCy)})`}
        />
      );
    }

    return (
      <ellipse
        key={`${keyPrefix}-${index}`}
        cx={roundSvgValue(petalCx)}
        cy={roundSvgValue(petalCy)}
        fill={color}
        rx={roundSvgValue(petalRx ?? petalRadius ?? 12)}
        ry={roundSvgValue(petalRy ?? petalRadius ?? 18)}
        transform={`rotate(${roundSvgValue(angle)} ${roundSvgValue(petalCx)} ${roundSvgValue(petalCy)})`}
      />
    );
  });
}

function createRoundedSpokeStarPath(cx: number, cy: number, outerRadius: number) {
  const baseRadius = Math.max(0.9, outerRadius * 0.05);
  const baseHalfWidth = Math.max(0.24, outerRadius * 0.014);
  const neckHalfWidth = Math.max(0.42, outerRadius * 0.026);
  const capHalfWidth = Math.max(0.45, outerRadius * 0.043);
  const capShoulderRadius = outerRadius - capHalfWidth * 0.72;

  return [
    `M ${roundSvgValue(cx - baseHalfWidth)} ${roundSvgValue(cy - baseRadius)}`,
    `C ${roundSvgValue(cx - neckHalfWidth)} ${roundSvgValue(cy - outerRadius * 0.38)} ${roundSvgValue(cx - capHalfWidth)} ${roundSvgValue(cy - outerRadius * 0.66)} ${roundSvgValue(cx - capHalfWidth)} ${roundSvgValue(cy - capShoulderRadius)}`,
    `Q ${roundSvgValue(cx - capHalfWidth)} ${roundSvgValue(cy - outerRadius)} ${roundSvgValue(cx)} ${roundSvgValue(cy - outerRadius)}`,
    `Q ${roundSvgValue(cx + capHalfWidth)} ${roundSvgValue(cy - outerRadius)} ${roundSvgValue(cx + capHalfWidth)} ${roundSvgValue(cy - capShoulderRadius)}`,
    `C ${roundSvgValue(cx + capHalfWidth)} ${roundSvgValue(cy - outerRadius * 0.66)} ${roundSvgValue(cx + neckHalfWidth)} ${roundSvgValue(cy - outerRadius * 0.38)} ${roundSvgValue(cx + baseHalfWidth)} ${roundSvgValue(cy - baseRadius)}`,
    `Q ${roundSvgValue(cx)} ${roundSvgValue(cy + baseRadius * 0.28)} ${roundSvgValue(cx - baseHalfWidth)} ${roundSvgValue(cy - baseRadius)}`,
    'Z',
  ].join(' ');
}

function renderDottedRayStar({
  color,
  count,
  innerRadius,
  keyPrefix,
  outerRadius,
  rotation,
}: Omit<StarLayerOptions, 'shape'>) {
  const rayStartRadius = Math.max(innerRadius * 0.75, outerRadius * 0.08);
  const dotRadius = Math.max(0.85, outerRadius * 0.07);
  const rayEndRadius = outerRadius - dotRadius * 0.78;
  const strokeWidth = Math.max(0.55, outerRadius * 0.032);

  return (
    <g>
      {Array.from({ length: count }, (_, index) => {
        const angle = rotation + (360 / count) * index - 90;
        const angleRadians = toRadians(angle);
        const startX = CENTER + Math.cos(angleRadians) * rayStartRadius;
        const startY = CENTER + Math.sin(angleRadians) * rayStartRadius;
        const endX = CENTER + Math.cos(angleRadians) * rayEndRadius;
        const endY = CENTER + Math.sin(angleRadians) * rayEndRadius;
        const dotX = CENTER + Math.cos(angleRadians) * outerRadius;
        const dotY = CENTER + Math.sin(angleRadians) * outerRadius;

        return (
          <g key={`${keyPrefix}-dotted-ray-${index}`}>
            <line
              stroke={color}
              strokeLinecap="round"
              strokeWidth={roundSvgValue(strokeWidth)}
              x1={roundSvgValue(startX)}
              x2={roundSvgValue(endX)}
              y1={roundSvgValue(startY)}
              y2={roundSvgValue(endY)}
            />
            <circle
              cx={roundSvgValue(dotX)}
              cy={roundSvgValue(dotY)}
              fill={color}
              r={roundSvgValue(dotRadius)}
            />
          </g>
        );
      })}
    </g>
  );
}

function renderStarLayer({
  color,
  count,
  innerRadius,
  keyPrefix,
  outerRadius,
  rotation,
  shape,
}: StarLayerOptions) {
  if (shape === 'roundedSpokeStar') {
    const spokePath = createRoundedSpokeStarPath(CENTER, CENTER, outerRadius);

    return (
      <g>
        {Array.from({ length: count }, (_, index) => {
          const angle = rotation + (360 / count) * index;

          return (
            <path
              key={`${keyPrefix}-rounded-spoke-${index}`}
              d={spokePath}
              fill={color}
              transform={`rotate(${roundSvgValue(angle)} ${CENTER} ${CENTER})`}
            />
          );
        })}
      </g>
    );
  }

  if (shape === 'dottedRayStar') {
    return renderDottedRayStar({
      color,
      count,
      innerRadius,
      keyPrefix,
      outerRadius,
      rotation,
    });
  }

  return (
    <polygon
      fill={color}
      points={createStarPoints(
        CENTER,
        CENTER,
        outerRadius,
        innerRadius,
        count,
        rotation,
      )}
    />
  );
}

function renderCoreLayer({
  color,
  coreRadius,
  seedCount,
  shape,
}: {
  color: string;
  coreRadius: number;
  seedCount: number;
  shape: PalateBloomCoreShape;
}) {
  const roundedCoreRadius = roundSvgValue(coreRadius);

  if (shape === 'diamondCore') {
    const squareSide = coreRadius * 1.55;

    return (
      <rect
        fill={color}
        height={roundSvgValue(squareSide)}
        transform={`rotate(45 ${CENTER} ${CENTER})`}
        width={roundSvgValue(squareSide)}
        x={roundSvgValue(CENTER - squareSide / 2)}
        y={roundSvgValue(CENTER - squareSide / 2)}
      />
    );
  }

  if (shape === 'seedCluster') {
    const outerSeedCount = Math.min(6, Math.max(4, seedCount));
    const seedRadius = Math.max(1.1, coreRadius * 0.34);
    const seedDistance = coreRadius * 0.78;

    return (
      <g>
        {Array.from({ length: outerSeedCount }, (_, index) => {
          const angle = toRadians((360 / outerSeedCount) * index - 90);
          const seedCx = CENTER + Math.cos(angle) * seedDistance;
          const seedCy = CENTER + Math.sin(angle) * seedDistance;

          return (
            <circle
              key={`core-seed-${index}`}
              cx={roundSvgValue(seedCx)}
              cy={roundSvgValue(seedCy)}
              fill={color}
              r={roundSvgValue(seedRadius)}
            />
          );
        })}
        <circle
          cx={CENTER}
          cy={CENTER}
          fill={color}
          r={roundSvgValue(seedRadius * 1.06)}
        />
      </g>
    );
  }

  return (
    <circle
      cx={CENTER}
      cy={CENTER}
      fill={color}
      r={roundedCoreRadius}
    />
  );
}

function buildBloomLayers(profile: TasteProfile): RankedBloomLayer[] {
  const sortedProfile = sortTasteProfile(profile);
  const totalValue = sortedProfile.reduce((sum, entry) => sum + entry.value, 0);
  const fallbackRatio = 1 / TASTE_KEYS.length;
  const ratios = sortedProfile.map((entry) =>
    totalValue > 0 ? entry.value / totalValue : fallbackRatio,
  );
  const maxRatio = Math.max(...ratios, fallbackRatio);
  const minRatio = Math.min(...ratios, fallbackRatio);

  return sortedProfile.map((entry, rankIndex) => {
    const ratio = ratios[rankIndex] ?? fallbackRatio;
    const relationshipWeight = getRelationshipWeight(ratio, maxRatio, minRatio);
    const valueNorm = entry.value / 100;
    const rankWeight = RANK_WEIGHTS[rankIndex] ?? RANK_WEIGHTS[RANK_WEIGHTS.length - 1];

    return {
      ...entry,
      ratio,
      relationshipWeight,
      visualWeight: clamp01(valueNorm * 0.12 + rankWeight * 0.36 + relationshipWeight * 0.52),
    };
  });
}

export default function PalateBloomAvatar({
  ariaLabel,
  className,
  coreShape,
  imageSrc,
  petalShape,
  profile,
  shapeCountOverride,
  shapeSeed,
  showFrame = true,
  size = DEFAULT_SIZE,
  starShape,
}: PalateBloomAvatarProps) {
  const generatedId = useId().replace(/:/g, '');
  const clipId = `${generatedId}-palate-bloom-clip`;
  const avatarSize = resolveProfileAvatarSize(size, DEFAULT_SIZE);
  const layers = buildBloomLayers(profile);
  const shapeVariant = getPalateBloomShapeVariant(profile, shapeSeed);
  const shapeCounts = getPalateBloomShapeCounts(profile, shapeCountOverride, shapeSeed);
  const resolvedCoreShape = coreShape ?? shapeVariant.coreShape;
  const resolvedPetalShape = petalShape ?? shapeVariant.petalShape;
  const resolvedStarShape = starShape ?? shapeVariant.starShape;
  const [backgroundLayer, largePetalLayer, smallPetalLayer, largeStarLayer, smallStarLayer, coreLayer] =
    layers;

  const uniformRatio = 1 / TASTE_KEYS.length;
  const profileSpread = clamp01(
    layers.reduce((sum, layer) => sum + Math.abs(layer.ratio - uniformRatio), 0) /
    (2 * (1 - uniformRatio)),
  );
  const rankGapWeights = layers.slice(1).map((_, index) => 1 - index * 0.12);
  const rankGapPressureTotal = layers.slice(1).reduce((sum, layer, index) => {
    const previousLayer = layers[index];
    const gap = clamp01(
      previousLayer ? (previousLayer.ratio - layer.ratio) / Math.max(previousLayer.ratio, uniformRatio) : 0,
    );

    return sum + Math.pow(gap, 0.62) * (rankGapWeights[index] ?? 1);
  }, 0);
  const rankGapPressure = rankGapPressureTotal /
    rankGapWeights.reduce((sum, weight) => sum + weight, 0);
  const dominanceGap = clamp01(
    (backgroundLayer.ratio - largePetalLayer.ratio) /
    Math.max(backgroundLayer.ratio, uniformRatio),
  );
  const exaggeratedDominanceGap = Math.pow(dominanceGap, 0.62);
  const dominantValueBias = Math.pow(backgroundLayer.value / 100, 0.8) * 0.06;
  const dominanceStrength = clamp01(
    exaggeratedDominanceGap * 0.42 +
    Math.pow(profileSpread, 0.74) * 0.34 +
    rankGapPressure * 0.18 +
    dominantValueBias,
  );
  const dominantInnerLayerScale = mapRange(dominanceStrength, 0, 1, 1.03, 0.72);
  const largePetalDistance =
    mapRange(largePetalLayer.visualWeight, 0, 1, 16.5, 20.5) * dominantInnerLayerScale;
  const largePetalRadius =
    mapRange(largePetalLayer.visualWeight, 0, 1, 11.5, 15.5) * dominantInnerLayerScale;
  const smallPetalDistance =
    mapRange(smallPetalLayer.visualWeight, 0, 1, 8.5, 11.5) * dominantInnerLayerScale;
  const smallPetalRadius =
    mapRange(smallPetalLayer.visualWeight, 0, 1, 4.5, 6.8) * dominantInnerLayerScale;
  const mainPetalLayerOuterRadius = largePetalDistance + largePetalRadius;
  const subPetalLayerOuterRadius = smallPetalDistance + smallPetalRadius;
  const largeStarOuterRadius =
    mainPetalLayerOuterRadius * mapRange(largeStarLayer.visualWeight, 0, 1, 0.72, 0.84);
  const largeStarInnerRadius = Math.min(
    largeStarOuterRadius * mapRange(largeStarLayer.visualWeight, 0, 1, 0.06, 0.11),
    smallPetalRadius * 0.6,
  );
  const smallStarOuterRadius = Math.min(
    subPetalLayerOuterRadius * mapRange(smallStarLayer.visualWeight, 0, 1, 0.78, 0.9),
    largeStarOuterRadius - 2.8,
  );
  const smallStarInnerRadius = Math.min(
    smallStarOuterRadius * mapRange(smallStarLayer.visualWeight, 0, 1, 0.14, 0.22),
    smallPetalRadius * 0.92,
  );
  const coreRadius =
    mapRange(coreLayer.visualWeight, 0, 1, 3.2, 5.8) * Math.sqrt(dominantInnerLayerScale);

  return (
    <span
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={cn('tb-palate-bloom-avatar relative', className)}
      role={ariaLabel ? 'img' : undefined}
      style={{
        height: avatarSize,
        width: avatarSize,
      }}
    >
      {imageSrc ? (
        <span className="flex size-full items-center justify-center overflow-hidden rounded-full">
          <img
            alt=""
            className="size-full object-cover"
            referrerPolicy="no-referrer"
            src={imageSrc}
          />
        </span>
      ) : (
        <svg
          className="tb-palate-bloom-avatar__svg"
          focusable="false"
          viewBox="0 0 100 100"
        >
        <defs>
          <clipPath id={clipId}>
            <circle cx={CENTER} cy={CENTER} r="49" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            fill={backgroundLayer.color}
            r={BACKGROUND_RADIUS}
          />

          <g>
            {renderPetalLayer({
              centerDistance: largePetalDistance,
              color: largePetalLayer.color,
              count: shapeCounts.largePetal,
              keyPrefix: `${generatedId}-large-petal`,
              petalRadius: largePetalRadius,
              rotationOffset: 180 / shapeCounts.largePetal,
              shape: resolvedPetalShape,
            })}
          </g>

          <g>
            {renderPetalLayer({
              centerDistance: smallPetalDistance,
              color: smallPetalLayer.color,
              count: shapeCounts.smallPetal,
              keyPrefix: `${generatedId}-small-petal`,
              petalRadius: smallPetalRadius,
              rotationOffset: 180 / shapeCounts.smallPetal,
              shape: resolvedPetalShape,
            })}
          </g>

          {renderStarLayer({
            color: largeStarLayer.color,
            count: shapeCounts.largeStar,
            innerRadius: largeStarInnerRadius,
            keyPrefix: `${generatedId}-large-star`,
            outerRadius: largeStarOuterRadius,
            rotation: 0,
            shape: resolvedStarShape,
          })}
          {renderStarLayer({
            color: smallStarLayer.color,
            count: shapeCounts.smallStar,
            innerRadius: smallStarInnerRadius,
            keyPrefix: `${generatedId}-small-star`,
            outerRadius: smallStarOuterRadius,
            rotation: 180 / shapeCounts.smallStar,
            shape: resolvedStarShape,
          })}
          {renderCoreLayer({
            color: coreLayer.color,
            coreRadius,
            seedCount: shapeCounts.smallStar,
            shape: resolvedCoreShape,
          })}
        </g>
        </svg>
      )}
      {showFrame ? (
        <span className="pointer-events-none absolute inset-0 rounded-full border border-white/50 shadow-[inset_0_0_0_1px_rgba(15,15,15,0.08)]" />
      ) : null}
    </span>
  );
}

const SAMPLE_PROFILE_LABELS: Record<keyof typeof sampleProfiles, string> = {
  profileA: 'Profile A',
  profileB: 'Profile B',
  profileC: 'Profile C',
};

export function PalateBloomAvatarDemo({ className }: { className?: string }) {
  return (
    <div className={cn('tb-palate-bloom-avatar-demo', className)}>
      {(Object.keys(sampleProfiles) as Array<keyof typeof sampleProfiles>).map((profileKey) => (
        <div className="tb-palate-bloom-avatar-demo__item" key={profileKey}>
          <PalateBloomAvatar profile={sampleProfiles[profileKey]} />
          <p className="tb-palate-bloom-avatar-demo__label">
            {SAMPLE_PROFILE_LABELS[profileKey]}
          </p>
        </div>
      ))}
    </div>
  );
}
