export const PROFILE_AVATAR_SIZE_TOKENS = {
  sm: 32,
  md: 44,
  lg: 68,
  xl: 96,
} as const;

export const PROFILE_AVATAR_SIZE_KEYS = ['sm', 'md', 'lg', 'xl'] as const;

export type ProfileAvatarSize = (typeof PROFILE_AVATAR_SIZE_KEYS)[number];
export type ProfileAvatarSizeValue = ProfileAvatarSize | number;

export function resolveProfileAvatarSize(
  size: ProfileAvatarSizeValue | undefined,
  fallback: ProfileAvatarSize = 'md',
) {
  return typeof size === 'number' ? size : PROFILE_AVATAR_SIZE_TOKENS[size ?? fallback];
}
