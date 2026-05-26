import type { MouseEventHandler } from 'react';

import type { DiningFriendProfile } from '../../lib/supabase';
import { resolvePublicMediaPath } from '../../lib/mediaAssets';
import { cn } from '../ui/utils';
import PalateBloomAvatar, {
  createPalateBloomProfileFromMeasurementSnapshot,
} from '../system/PalateBloomAvatar';

type DiningFriendProfileCardActionVariant = 'accent' | 'neutral';

interface DiningFriendProfileCardProps {
  actionAriaLabel: string;
  actionDisabled?: boolean;
  actionLabel: string;
  actionVariant?: DiningFriendProfileCardActionVariant;
  friend: DiningFriendProfile;
  onAction: (friend: DiningFriendProfile) => void;
  onOpenProfile?: (friend: DiningFriendProfile) => void;
}

export default function DiningFriendProfileCard({
  actionAriaLabel,
  actionDisabled = false,
  actionLabel,
  actionVariant = 'neutral',
  friend,
  onAction,
  onOpenProfile,
}: DiningFriendProfileCardProps) {
  const displayName = friend.displayName || 'Taste Buddy Guest';
  const nicknameLabel = friend.nickname ? `@${friend.nickname}` : '버디네임 미설정';
  const avatarImageSrc = resolvePublicMediaPath(friend.avatarPath);
  const handleActionClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onAction(friend);
  };

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-[20px] bg-white p-3',
        onOpenProfile ? 'cursor-pointer' : undefined,
      )}
    >
      {onOpenProfile ? (
        <button
          type="button"
          onClick={() => onOpenProfile(friend)}
          className="absolute inset-0 rounded-[20px] transition-colors hover:bg-[var(--tb-color-surface-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-user-accent-tint-soft-border)]"
          aria-label={`${displayName} 프로필 보기`}
        />
      ) : null}

      <div
        aria-hidden={onOpenProfile ? true : undefined}
        className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3"
      >
        <PalateBloomAvatar
          ariaLabel={displayName}
          imageSrc={avatarImageSrc}
          profile={createPalateBloomProfileFromMeasurementSnapshot(
            friend.latestTasteMeasurementSnapshot,
            friend.id,
          )}
          shapeSeed={`${friend.id}|${friend.latestTasteMeasurementSnapshot?.measuredAt ?? 'no-measurement'}`}
          size="md"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
            {displayName}
          </span>
          <span className="block truncate text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
            {nicknameLabel}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={handleActionClick}
        disabled={actionDisabled}
        aria-label={actionAriaLabel}
        className={cn(
          'relative z-20 flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-[11px] font-semibold disabled:opacity-55',
          actionVariant === 'neutral'
            ? 'border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]'
            : 'transition-[filter,opacity] hover:brightness-[0.98]',
        )}
        style={
          actionVariant === 'accent'
            ? {
              background: 'var(--tb-user-accent-tint-surface, var(--tb-taste-sweet-bg))',
              color: 'var(--tb-user-accent-dark, var(--tb-taste-sweet-dark))',
            }
            : undefined
        }
      >
        {actionLabel}
      </button>
    </div>
  );
}
