import type { CSSProperties } from 'react';

import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../../constants/designTokens';
import {
  getTasteMeasurementEntries,
  type TasteMeasurementSnapshot,
} from '../../constants/tasteMeasurementData';
import { cn } from '../ui/utils';

type TasteProfileAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface TasteProfileAvatarProps {
  ariaLabel?: string;
  className?: string;
  imageSrc?: string | null;
  initials: string;
  measurementSnapshot?: TasteMeasurementSnapshot | null;
  size?: TasteProfileAvatarSize;
  style?: CSSProperties;
}

const SIZE_CLASS_BY_KEY: Record<TasteProfileAvatarSize, string> = {
  sm: 'size-10',
  md: 'size-16',
  lg: 'size-24',
  xl: 'size-28',
};

const INITIAL_CLASS_BY_KEY: Record<TasteProfileAvatarSize, string> = {
  sm: 'text-[12px]',
  md: 'text-[18px]',
  lg: 'text-[18px]',
  xl: 'text-[20px]',
};

const HANGUL_INITIAL_ROMAN = [
  'G',
  'K',
  'N',
  'D',
  'T',
  'R',
  'M',
  'B',
  'P',
  'S',
  'S',
  '',
  'J',
  'J',
  'C',
  'K',
  'T',
  'P',
  'H',
] as const;

const HANGUL_VOWEL_ROMAN_INITIAL = [
  'A',
  'A',
  'Y',
  'Y',
  'E',
  'E',
  'Y',
  'Y',
  'O',
  'W',
  'W',
  'W',
  'Y',
  'U',
  'W',
  'W',
  'W',
  'Y',
  'E',
  'I',
  'I',
] as const;

function getRomanizedNameInitial(character: string) {
  const codePoint = character.charCodeAt(0);

  if (codePoint < 0xac00 || codePoint > 0xd7a3) {
    return character;
  }

  const syllableOffset = codePoint - 0xac00;
  const initialIndex = Math.floor(syllableOffset / 588);
  const vowelIndex = Math.floor((syllableOffset % 588) / 28);

  return HANGUL_INITIAL_ROMAN[initialIndex] || HANGUL_VOWEL_ROMAN_INITIAL[vowelIndex] || character;
}

export function createTasteProfileAvatarInitials(
  displayName: string | null | undefined,
  fallback?: string | null,
) {
  const source = displayName?.trim() || fallback?.split('@')[0]?.trim() || '';

  if (!source) {
    return 'TB';
  }

  const nameParts = source
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (nameParts.length >= 2) {
    return nameParts
      .slice(0, 2)
      .map((part) => getRomanizedNameInitial(part[0] ?? ''))
      .join('')
      .toUpperCase();
  }

  const compactName = (nameParts[0] ?? source).replace(/[^a-zA-Z0-9가-힣]/g, '');

  if (!compactName) {
    return 'TB';
  }

  const nameCharacters = Array.from(compactName);
  const initialsSource =
    displayName?.trim() && /^[가-힣]{3,}$/.test(compactName)
      ? nameCharacters.slice(1, 3)
      : nameCharacters.slice(0, 2);

  return initialsSource
    .map(getRomanizedNameInitial)
    .join('')
    .toUpperCase();
}

export function createTasteProfileAvatarStyle(
  snapshot: TasteMeasurementSnapshot | null,
): CSSProperties {
  const entries = snapshot
    ? getTasteMeasurementEntries(snapshot)
    : TASTE_IDS.map((tasteId) => ({
      id: tasteId,
      valueMm: 1,
    }));
  const totalValue = entries.reduce((sum, entry) => sum + Math.max(entry.valueMm, 0.1), 0);
  const positions = [
    ['26%', '24%'],
    ['72%', '22%'],
    ['78%', '70%'],
    ['32%', '78%'],
    ['50%', '42%'],
    ['18%', '58%'],
  ] as const;
  const meshLayers = entries
    .map((entry, index) => {
      const token = TASTE_TOKENS[entry.id as TasteId];
      const ratio = Math.max(entry.valueMm, 0.1) / totalValue;
      const alpha = Math.min(0.72, 0.22 + ratio * 2.6);
      const radius = Math.min(66, 34 + ratio * 150);
      const [x, y] = positions[index] ?? ['50%', '50%'];

      return `radial-gradient(circle at ${x} ${y}, ${token.palette.main}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0')} 0%, transparent ${radius.toFixed(0)}%)`;
    })
    .join(', ');

  return {
    background: `${meshLayers}, var(--tb-color-surface-muted)`,
  };
}

export default function TasteProfileAvatar({
  ariaLabel,
  className,
  imageSrc,
  initials,
  measurementSnapshot,
  size = 'md',
  style,
}: TasteProfileAvatarProps) {
  const avatarStyle = imageSrc
    ? undefined
    : (style ?? createTasteProfileAvatarStyle(measurementSnapshot ?? null));

  return (
    <span
      aria-label={ariaLabel}
      className={cn('relative block shrink-0 rounded-full', SIZE_CLASS_BY_KEY[size], className)}
      role={ariaLabel ? 'img' : undefined}
    >
      <span
        className="flex size-full items-center justify-center overflow-hidden rounded-full"
        style={avatarStyle}
      >
        {imageSrc ? (
          <img
            alt=""
            className="size-full object-cover"
            referrerPolicy="no-referrer"
            src={imageSrc}
          />
        ) : (
          <span
            className={cn(
              'font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.34)]',
              INITIAL_CLASS_BY_KEY[size],
            )}
          >
            {initials}
          </span>
        )}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-full border border-white/50 shadow-[inset_0_0_0_1px_rgba(15,15,15,0.08)]" />
    </span>
  );
}
