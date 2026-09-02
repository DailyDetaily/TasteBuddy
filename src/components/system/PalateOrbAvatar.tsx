import { useId, type CSSProperties } from 'react';

import { cn } from '../ui/utils';
import {
  resolveProfileAvatarSize,
  type ProfileAvatarSize,
  type ProfileAvatarSizeValue,
} from './profileAvatarSizeTokens';
import './PalateOrbAvatar.css';

export type TasteProfile = {
  sweet: number;
  sour: number;
  bitter: number;
  salty: number;
  umami: number;
  fat: number;
};

type TasteKey = keyof TasteProfile;

export type PalateOrbAvatarProps = {
  ariaLabel?: string;
  className?: string;
  imageSrc?: string | null;
  profile: TasteProfile;
  shapeSeed?: string;
  showFrame?: boolean;
  size?: ProfileAvatarSizeValue;
  style?: CSSProperties;
};

type OrbLayer = {
  color: string;
  id: TasteKey;
  rank: number;
  ratio: number;
  value: number;
  visualWeight: number;
};

type OrbPiece = {
  blur?: number;
  cx: number;
  cy: number;
  fill: string;
  opacity?: number;
  rotation: number;
  rx: number;
  ry: number;
};

const CENTER = 50;
const DEFAULT_SIZE: ProfileAvatarSize = 'md';
const TASTE_KEYS: TasteKey[] = ['sweet', 'sour', 'bitter', 'salty', 'umami', 'fat'];
const RANK_WEIGHTS = [1, 0.82, 0.66, 0.5, 0.36, 0.24] as const;
const RANK_SIZE_WEIGHTS = [1.34, 1.14, 0.98, 0.82, 0.68, 0.56] as const;
const TASTE_COLORS: Record<TasteKey, string> = {
  sweet: 'color-mix(in srgb, var(--tb-taste-sweet-main) 85%, white 15%)',
  sour: 'color-mix(in srgb, var(--tb-taste-sour-main) 85%, white 15%)',
  bitter: 'color-mix(in srgb, var(--tb-taste-bitter-main) 85%, white 15%)',
  salty: 'color-mix(in srgb, var(--tb-taste-salty-main) 85%, white 15%)',
  umami: 'color-mix(in srgb, var(--tb-taste-umami-main) 85%, white 15%)',
  fat: 'color-mix(in srgb, var(--tb-taste-fat-main) 85%, white 15%)',
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

function mapRange(
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

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getSeedUnit(seed: string, salt: string) {
  return hashString(`${seed}|${salt}`) / 0xffffffff;
}

function createProfileSeed(profile: TasteProfile, shapeSeed?: string) {
  const profileSeed = TASTE_KEYS.map((taste) =>
    `${taste}:${Math.round(clampTasteValue(profile[taste]) * 10)}`,
  ).join('|');
  const normalizedShapeSeed = shapeSeed?.trim();

  return normalizedShapeSeed ? `${normalizedShapeSeed}|${profileSeed}` : profileSeed;
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

function buildOrbLayers(profile: TasteProfile, seed: string): OrbLayer[] {
  const sortedProfile = TASTE_KEYS.map((taste) => ({
    color: TASTE_COLORS[taste],
    id: taste,
    value: clampTasteValue(profile[taste]),
  })).sort((left, right) => {
    const valueDelta = right.value - left.value;

    return valueDelta === 0
      ? hashString(`${seed}|${left.id}`) - hashString(`${seed}|${right.id}`)
      : valueDelta;
  });
  const totalValue = sortedProfile.reduce((sum, entry) => sum + entry.value, 0);
  const fallbackRatio = 1 / TASTE_KEYS.length;
  const ratios = sortedProfile.map((entry) =>
    totalValue > 0 ? entry.value / totalValue : fallbackRatio,
  );
  const maxRatio = Math.max(...ratios, fallbackRatio);
  const minRatio = Math.min(...ratios, fallbackRatio);

  return sortedProfile.map((entry, index) => {
    const ratio = ratios[index] ?? fallbackRatio;
    const valueNorm = entry.value / 100;
    const rankWeight = RANK_WEIGHTS[index] ?? RANK_WEIGHTS[RANK_WEIGHTS.length - 1];
    const relationshipWeight = getRelationshipWeight(ratio, maxRatio, minRatio);

    return {
      ...entry,
      rank: index + 1,
      ratio,
      visualWeight: clamp01(valueNorm * 0.14 + rankWeight * 0.34 + relationshipWeight * 0.52),
    };
  });
}

function transformLocalPoint(
  cx: number,
  cy: number,
  rotation: number,
  x: number,
  y: number,
) {
  const radians = toRadians(rotation);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: cx + x * cos - y * sin,
    y: cy + x * sin + y * cos,
  };
}

function createOrbPatchPath({
  cx,
  cy,
  rotation,
  rx,
  ry,
  seedBias,
}: OrbPiece & { seedBias: number }) {
  const bias = (seedBias - 0.5) * 0.42;
  const counterBias = (getSeedUnit(`${cx}:${cy}:${rotation}`, `${seedBias}`) - 0.5) * 0.34;
  const point = (x: number, y: number) => transformLocalPoint(cx, cy, rotation, x, y);
  const move = point(-rx * (0.3 + bias * 0.12), -ry * (0.9 + counterBias * 0.12));
  const c1 = point(rx * (0.02 + counterBias * 0.18), -ry * (1.3 - bias * 0.12));
  const c2 = point(rx * (0.92 + bias * 0.2), -ry * (1.02 + counterBias * 0.14));
  const p2 = point(rx * (1.1 + bias * 0.16), -ry * (0.18 - counterBias * 0.16));
  const c3 = point(rx * (1.24 + counterBias * 0.12), ry * (0.34 + bias * 0.16));
  const c4 = point(rx * (0.62 - bias * 0.1), ry * (0.98 + counterBias * 0.18));
  const p3 = point(rx * (0.02 - bias * 0.22), ry * (1.08 + counterBias * 0.14));
  const c5 = point(-rx * (0.5 + counterBias * 0.18), ry * (0.92 - bias * 0.14));
  const c6 = point(-rx * (1.12 - bias * 0.14), ry * (0.22 + counterBias * 0.18));
  const p4 = point(-rx * (0.98 + counterBias * 0.12), -ry * (0.38 + bias * 0.18));
  const c7 = point(-rx * (0.84 - bias * 0.12), -ry * (0.82 - counterBias * 0.14));
  const c8 = point(-rx * (0.52 + counterBias * 0.12), -ry * (1.02 + bias * 0.18));

  return [
    `M ${roundSvgValue(move.x)} ${roundSvgValue(move.y)}`,
    `C ${roundSvgValue(c1.x)} ${roundSvgValue(c1.y)} ${roundSvgValue(c2.x)} ${roundSvgValue(c2.y)} ${roundSvgValue(p2.x)} ${roundSvgValue(p2.y)}`,
    `C ${roundSvgValue(c3.x)} ${roundSvgValue(c3.y)} ${roundSvgValue(c4.x)} ${roundSvgValue(c4.y)} ${roundSvgValue(p3.x)} ${roundSvgValue(p3.y)}`,
    `C ${roundSvgValue(c5.x)} ${roundSvgValue(c5.y)} ${roundSvgValue(c6.x)} ${roundSvgValue(c6.y)} ${roundSvgValue(p4.x)} ${roundSvgValue(p4.y)}`,
    `C ${roundSvgValue(c7.x)} ${roundSvgValue(c7.y)} ${roundSvgValue(c8.x)} ${roundSvgValue(c8.y)} ${roundSvgValue(move.x)} ${roundSvgValue(move.y)}`,
    'Z',
  ].join(' ');
}

function createOrbPiece(
  layer: OrbLayer,
  seed: string,
  side: 'back' | 'front',
  sideIndex: number,
): OrbPiece {
  const seedRotation = getSeedUnit(seed, `${side}-rotation`) * 360;
  const jitter = (getSeedUnit(seed, `${layer.id}-angle`) - 0.5) * (side === 'back' ? 30 : 24);
  const baseAngles = side === 'back' ? [28, 158, 276] : [332, 96, 216];
  const angle = (baseAngles[sideIndex] ?? 0) + seedRotation * (side === 'back' ? 0.16 : 0.08) + jitter;
  const angleRadians = toRadians(angle);
  const rankSizeWeight =
    RANK_SIZE_WEIGHTS[layer.rank - 1] ?? RANK_SIZE_WEIGHTS[RANK_SIZE_WEIGHTS.length - 1];
  const distance = side === 'back'
    ? mapRange(layer.visualWeight, 0, 1, 39, 44)
    : mapRange(layer.visualWeight, 0, 1, 10, 17);
  const rx = side === 'back'
    ? mapRange(layer.visualWeight, 0, 1, 17, 24) * rankSizeWeight
    : mapRange(layer.visualWeight, 0, 1, 19, 28) * rankSizeWeight;
  const ry = side === 'back'
    ? mapRange(layer.visualWeight, 0, 1, 8.5, 12.5) * (0.78 + rankSizeWeight * 0.22)
    : mapRange(layer.visualWeight, 0, 1, 10.5, 15.5) * (0.82 + rankSizeWeight * 0.18);

  return {
    blur: side === 'back' ? mapRange(layer.visualWeight, 0, 1, 0.6, 0.28) : undefined,
    cx: CENTER + Math.cos(angleRadians) * distance,
    cy: CENTER + Math.sin(angleRadians) * distance,
    fill: layer.color,
    opacity: side === 'back' ? mapRange(layer.visualWeight, 0, 1, 0.86, 0.96) : 1,
    rotation: angle + 90 + (getSeedUnit(seed, `${layer.id}-tilt`) - 0.5) * 34,
    rx,
    ry,
  };
}

export default function PalateOrbAvatar({
  ariaLabel,
  className,
  imageSrc,
  profile,
  shapeSeed,
  showFrame = true,
  size = DEFAULT_SIZE,
  style,
}: PalateOrbAvatarProps) {
  const generatedId = useId().replace(/:/g, '');
  const clipId = `${generatedId}-palate-orb-clip`;
  const backFilterId = `${generatedId}-palate-orb-back-blur`;
  const orbShadeId = `${generatedId}-palate-orb-shade`;
  const seed = createProfileSeed(profile, shapeSeed);
  const layers = buildOrbLayers(profile, seed);
  const frontLayers = layers.slice(0, 3);
  const backLayers = layers.slice(3, 6);
  const avatarSize = resolveProfileAvatarSize(size, DEFAULT_SIZE);

  return (
    <span
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={cn('tb-palate-orb-avatar relative', className)}
      role={ariaLabel ? 'img' : undefined}
      style={{
        height: avatarSize,
        width: avatarSize,
        ...style,
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
          className="tb-palate-orb-avatar__svg"
          focusable="false"
          viewBox="0 0 100 100"
        >
          <defs>
            <clipPath id={clipId}>
              <circle cx={CENTER} cy={CENTER} r="49" />
            </clipPath>
            <filter id={backFilterId} x="-12%" y="-12%" width="124%" height="124%">
              <feGaussianBlur stdDeviation="0.36" />
            </filter>
            <radialGradient id={orbShadeId} cx="32%" cy="24%" r="78%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="82%" stopColor="#111111" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#111111" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            <circle cx={CENTER} cy={CENTER} fill="var(--tb-color-surface-muted)" r="49" />
            <g filter={`url(#${backFilterId})`}>
              {backLayers.map((layer, index) => {
                const piece = createOrbPiece(layer, seed, 'back', index);

                return (
                  <path
                    key={`${layer.id}-back`}
                    d={createOrbPatchPath({
                      ...piece,
                      seedBias: getSeedUnit(seed, `${layer.id}-back-shape`),
                    })}
                    fill={piece.fill}
                    opacity={roundSvgValue(piece.opacity ?? 1)}
                  />
                );
              })}
            </g>
            <circle cx={CENTER} cy={CENTER} fill={`url(#${orbShadeId})`} r="49" />
            {frontLayers.map((layer, index) => {
              const piece = createOrbPiece(layer, seed, 'front', index);

              return (
                <path
                  key={`${layer.id}-front`}
                  d={createOrbPatchPath({
                    ...piece,
                    seedBias: getSeedUnit(seed, `${layer.id}-front-shape`),
                  })}
                  fill={piece.fill}
                />
              );
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
