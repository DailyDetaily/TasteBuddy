import { useId, type CSSProperties } from 'react';

import { cn } from '../ui/utils';
import {
  resolveProfileAvatarSize,
  type ProfileAvatarSize,
  type ProfileAvatarSizeValue,
} from './profileAvatarSizeTokens';
import './PalateSignatureAvatar.css';

export const TASTE_COLORS = {
  sweet: '#FF9900',
  sour: '#FBC02D',
  bitter: '#95C900',
  salty: '#7299FF',
  umami: '#B372B4',
  fat: '#95867A',
} as const;

export type TasteProfile = Record<keyof typeof TASTE_COLORS, number>;

export type PalateSignatureAvatarVariant = 'soft' | 'ring' | 'halo';

export interface PalateSignatureAvatarProps {
  ariaLabel?: string;
  background?: 'transparent' | 'off-white';
  className?: string;
  initials?: string;
  profile: TasteProfile;
  showInitials?: boolean;
  size?: ProfileAvatarSizeValue;
  style?: CSSProperties;
  variant?: PalateSignatureAvatarVariant;
}

type TasteKey = keyof typeof TASTE_COLORS;

interface SignatureLayer {
  blur: number;
  color: string;
  coreRadius: number;
  id: TasteKey;
  innerRadius: number;
  opacity: number;
  outerRadius: number;
  ratio: number;
  rank: number;
  ringOpacity: number;
  strokeWidth: number;
  value: number;
  visualWeight: number;
}

const TASTE_KEYS = Object.keys(TASTE_COLORS) as TasteKey[];
const DEFAULT_SIZE: ProfileAvatarSize = 'md';
const RANK_WEIGHTS = [1.0, 0.82, 0.66, 0.5, 0.36, 0.24] as const;

function clampTasteValue(value: number | null | undefined) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? Number(value) : 0));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function roundSvgValue(value: number) {
  return Number(value.toFixed(2));
}

function getLayerBlurRange(variant: PalateSignatureAvatarVariant) {
  if (variant === 'halo') {
    return {
      max: 2.8,
      min: 0.7,
    };
  }

  if (variant === 'ring') {
    return {
      max: 0.85,
      min: 0.12,
    };
  }

  return {
    max: 1.8,
    min: 0.35,
  };
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

function buildSignatureLayers(profile: TasteProfile, variant: PalateSignatureAvatarVariant) {
  const normalizedValues = TASTE_KEYS.map((id) => ({
    id,
    value: clampTasteValue(profile[id]),
  }));
  const hasSignal = normalizedValues.some((entry) => entry.value > 0);
  const safeValues = hasSignal
    ? normalizedValues
    : normalizedValues.map((entry) => ({
      ...entry,
      value: 1,
    }));
  const totalValue = safeValues.reduce((sum, entry) => sum + entry.value, 0);
  const seed = safeValues
    .map((entry) => `${entry.id}:${Math.round(entry.value * 100)}`)
    .join('|');
  const sortedValues = [...safeValues].sort((left, right) => {
    const valueDelta = right.value - left.value;

    return valueDelta === 0
      ? hashString(`${seed}:${left.id}`) - hashString(`${seed}:${right.id}`)
      : valueDelta;
  });
  const fallbackRatio = 1 / TASTE_KEYS.length;
  const ratios = sortedValues.map((entry) =>
    totalValue > 0 ? entry.value / totalValue : fallbackRatio,
  );
  const maxRatio = Math.max(...ratios, fallbackRatio);
  const minRatio = Math.min(...ratios, fallbackRatio);
  const weightedValues = sortedValues.map((entry, rank) => {
    const ratio = ratios[rank] ?? fallbackRatio;
    const relationshipWeight = getRelationshipWeight(ratio, maxRatio, minRatio);
    const valueNorm = entry.value / 100;
    const rankWeight = RANK_WEIGHTS[rank] ?? RANK_WEIGHTS[RANK_WEIGHTS.length - 1];

    return {
      ...entry,
      ratio,
      visualWeight: clamp01(valueNorm * 0.12 + rankWeight * 0.36 + relationshipWeight * 0.52),
    };
  });
  const profileSpread = clamp01(
    weightedValues.reduce((sum, entry) => sum + Math.abs(entry.ratio - fallbackRatio), 0) /
    (2 * (1 - fallbackRatio)),
  );
  const dominanceGap = clamp01(
    ((weightedValues[0]?.ratio ?? fallbackRatio) - (weightedValues[1]?.ratio ?? fallbackRatio)) /
    Math.max(weightedValues[0]?.ratio ?? fallbackRatio, fallbackRatio),
  );
  const dominanceStrength = clamp01(
    Math.pow(dominanceGap, 0.62) * 0.46 + Math.pow(profileSpread, 0.74) * 0.54,
  );
  const areaPower = 1.18 + dominanceStrength * 0.42;
  const areaWeights = weightedValues.map((entry, rank) =>
    Math.pow(entry.visualWeight, areaPower) * (rank === 0 ? 1 + dominanceStrength * 0.24 : 1),
  );
  const totalAreaWeight = areaWeights.reduce((sum, weight) => sum + weight, 0) || 1;
  const maxRadius = variant === 'halo' ? 48.5 : variant === 'ring' ? 46.5 : 47.5;
  const maxArea = maxRadius * maxRadius;
  const blurRange = getLayerBlurRange(variant);
  let remainingArea = maxArea;

  const layers = weightedValues.map((entry, rank): SignatureLayer => {
    const outerRadius = Math.sqrt(remainingArea);
    const areaShare = areaWeights[rank] / totalAreaWeight;
    const nextArea = rank === weightedValues.length - 1
      ? 0
      : Math.max(0, remainingArea - areaShare * maxArea);
    const innerRadius = Math.sqrt(nextArea);
    const areaScale = Math.sqrt(entry.visualWeight);
    const blur =
      blurRange.min + (blurRange.max - blurRange.min) * (1 - areaScale);
    const opacity =
      variant === 'ring'
        ? 0.42 + areaScale * 0.36
        : 0.48 + areaScale * 0.34;

    remainingArea = nextArea;

    return {
      blur: roundSvgValue(blur),
      color: TASTE_COLORS[entry.id],
      coreRadius: 3.4 + areaScale * 7.8,
      id: entry.id,
      innerRadius: roundSvgValue(innerRadius),
      opacity: roundSvgValue(Math.min(0.92, opacity)),
      outerRadius: roundSvgValue(outerRadius),
      ratio: entry.ratio,
      rank,
      ringOpacity: roundSvgValue(Math.min(0.84, 0.36 + areaScale * 0.42)),
      strokeWidth: roundSvgValue(0.9 + Math.max(0.65, outerRadius - innerRadius) * 0.48),
      value: entry.value,
      visualWeight: entry.visualWeight,
    };
  });

  return {
    dominant: layers[0],
    layers,
    renderLayers: layers,
    seed,
  };
}

export default function PalateSignatureAvatar({
  ariaLabel,
  background = 'off-white',
  className,
  initials,
  profile,
  showInitials = false,
  size = DEFAULT_SIZE,
  style,
  variant = 'soft',
}: PalateSignatureAvatarProps) {
  const generatedId = useId().replace(/:/g, '');
  const avatarSize = resolveProfileAvatarSize(size, DEFAULT_SIZE);
  const { dominant, layers, renderLayers, seed } = buildSignatureLayers(profile, variant);
  const clipId = `${generatedId}-palate-clip`;
  const haloFilterId = `${generatedId}-palate-halo-filter`;
  const coreGradientId = `${generatedId}-palate-core`;
  const centerJitter = ((hashString(`${seed}:center`) % 100) - 50) / 100;
  const center = 50 + centerJitter;
  const secondaryLayer = layers[1] ?? dominant;
  const tertiaryLayer = layers[2] ?? secondaryLayer;
  const dominantHaloBlur = dominant
    ? roundSvgValue(dominant.blur + (variant === 'halo' ? 1.1 : 0.7))
    : variant === 'halo'
      ? 2.4
      : 1.6;
  const backgroundFill =
    background === 'off-white' ? 'var(--tb-color-surface-muted)' : 'transparent';
  const resolvedAriaLabel =
    ariaLabel ?? (initials ? `${initials} palate signature avatar` : 'Palate signature avatar');

  return (
    <span
      aria-label={resolvedAriaLabel}
      className={cn('tb-palate-signature-avatar relative', className)}
      role="img"
      style={{
        height: avatarSize,
        width: avatarSize,
        ...style,
      }}
    >
      <svg
        aria-hidden="true"
        className="tb-palate-signature-avatar__svg"
        focusable="false"
        viewBox="0 0 100 100"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="49" />
          </clipPath>
          <filter id={haloFilterId} x="-18%" y="-18%" width="136%" height="136%">
            <feGaussianBlur stdDeviation={dominantHaloBlur} />
          </filter>
          {layers.map((layer) => (
            <filter
              key={`${layer.id}-blur-filter`}
              id={`${generatedId}-${layer.id}-blur`}
              x="-12%"
              y="-12%"
              width="124%"
              height="124%"
            >
              <feGaussianBlur stdDeviation={layer.blur} />
            </filter>
          ))}
          {layers.map((layer) => (
            <radialGradient
              key={`${layer.id}-gradient`}
              id={`${generatedId}-${layer.id}-bloom`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={layer.color} stopOpacity={roundSvgValue(layer.opacity * 0.94)} />
              <stop
                offset={variant === 'halo' ? '74%' : '68%'}
                stopColor={layer.color}
                stopOpacity={roundSvgValue(layer.opacity)}
              />
              <stop offset="100%" stopColor={layer.color} stopOpacity={roundSvgValue(layer.opacity * 0.72)} />
            </radialGradient>
          ))}
          {dominant ? (
            <radialGradient id={coreGradientId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={dominant.color} stopOpacity="0.94" />
              <stop offset="52%" stopColor={dominant.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={dominant.color} stopOpacity="0.64" />
            </radialGradient>
          ) : null}
        </defs>

        <circle cx="50" cy="50" r="50" fill={backgroundFill} />

        <g clipPath={`url(#${clipId})`}>
          {dominant ? (
            <circle
              cx={center}
              cy={center}
              r={variant === 'halo' ? 58 : 53}
              fill={`${dominant.color}`}
              filter={`url(#${haloFilterId})`}
              opacity={variant === 'ring' ? 0.18 : 0.2 + dominant.ratio * 0.28}
            />
          ) : null}

          {renderLayers.map((layer) =>
            variant === 'ring' ? (
              <g key={layer.id}>
                <circle
                  cx={center}
                  cy={center}
                  r={layer.outerRadius}
                  fill={`url(#${generatedId}-${layer.id}-bloom)`}
                  opacity={roundSvgValue(layer.opacity * 0.7)}
                  filter={`url(#${generatedId}-${layer.id}-blur)`}
                />
                <circle
                  cx={center}
                  cy={center}
                  r={roundSvgValue((layer.outerRadius + layer.innerRadius) / 2)}
                  fill="none"
                  stroke={layer.color}
                  strokeLinecap="round"
                  strokeWidth={layer.strokeWidth}
                  opacity={layer.ringOpacity}
                />
              </g>
            ) : (
              <circle
                key={layer.id}
                cx={center}
                cy={center}
                r={layer.outerRadius}
                fill={`url(#${generatedId}-${layer.id}-bloom)`}
                filter={`url(#${generatedId}-${layer.id}-blur)`}
              />
            ),
          )}

          {layers.slice(2).map((layer) => (
            <circle
              key={`${layer.id}-accent`}
              cx={center}
              cy={center}
              r={roundSvgValue(Math.max(1.4, layer.innerRadius + 0.42))}
              fill={layer.color}
              opacity={roundSvgValue(0.1 + (1 - layer.rank / TASTE_KEYS.length) * 0.13)}
            />
          ))}

          {dominant ? (
            <g>
              <circle
                cx={center}
                cy={center}
                r={roundSvgValue(dominant.coreRadius + 5.8)}
                fill={secondaryLayer?.color ?? dominant.color}
                filter={`url(#${haloFilterId})`}
                opacity={variant === 'ring' ? 0.2 : 0.28}
              />
              <circle
                cx={center}
                cy={center}
                r={roundSvgValue(dominant.coreRadius + (variant === 'halo' ? 5.2 : 3.6))}
                fill={`url(#${coreGradientId})`}
                opacity={variant === 'ring' ? 0.78 : 0.9}
              />
              <circle
                cx={center}
                cy={center}
                r={roundSvgValue(dominant.coreRadius + 1.8)}
                fill="none"
                stroke={tertiaryLayer?.color ?? dominant.color}
                strokeWidth={roundSvgValue(1.4 + dominant.ratio * 4.2)}
                opacity={variant === 'soft' ? 0.46 : 0.64}
              />
              <circle
                cx={center}
                cy={center}
                r={roundSvgValue(Math.max(3.6, dominant.coreRadius * 0.48))}
                fill={dominant.color}
                opacity="0.96"
              />
            </g>
          ) : null}
        </g>

        {showInitials && initials ? (
          <text
            aria-hidden="true"
            className="tb-palate-signature-avatar__initials"
            x="50"
            y="51"
          >
            {initials}
          </text>
        ) : null}
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-full border border-white/50 shadow-[inset_0_0_0_1px_rgba(15,15,15,0.08)]" />
    </span>
  );
}
