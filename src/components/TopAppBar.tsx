import {
  Bell as BellIcon,
  CirclePlus as CirclePlusIcon,
  Menu as MenuIcon,
  Search as SearchIcon
} from 'lucide-react';
import React, { type ReactNode } from 'react';
import { ICON_TOKENS } from '../constants/designTokens';
import PalateBloomAvatar, {
  DEFAULT_PALATE_BLOOM_PROFILE,
  type TasteProfile as PalateBloomTasteProfile,
} from './system/PalateBloomAvatar';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, fontSize, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />
  );
};

const Bell = wrapIcon(BellIcon);
const PlusCircle = wrapIcon(CirclePlusIcon);
const Menu = wrapIcon(MenuIcon);
const Search = wrapIcon(SearchIcon);
const APP_SHELL_ICON_SIZE = ICON_TOKENS.size.lg;
const APP_SHELL_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;

interface TopAppBarProps {
  appearance?: 'default' | 'solid' | 'transparent';
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onStartMeasurement?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
  onOpenProfile?: () => void;
  rightActions?: ReactNode;
  showSearchAction?: boolean;
  userAvatarImageSrc?: string | null;
  userPalateBloomProfile?: PalateBloomTasteProfile;
  userPalateBloomShapeSeed?: string;
}

export default function TopAppBar({
  appearance = 'default',
  title,
  showBack,
  onBack,
  onStartMeasurement,
  onOpenSearch,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
  onOpenProfile,
  rightActions,
  showSearchAction = false,
  userAvatarImageSrc,
  userPalateBloomProfile,
  userPalateBloomShapeSeed,
}: TopAppBarProps) {
  const PrimaryActionIcon = showSearchAction ? Search : PlusCircle;
  const primaryActionLabel = showSearchAction ? '통합 검색 열기' : '미각 측정 시작';
  const primaryActionTitle = showSearchAction ? '검색' : '미각 측정';
  const handlePrimaryAction = showSearchAction ? onOpenSearch : onStartMeasurement;

  return (
    <div
      className={
        appearance === 'transparent'
          ? 'w-full shrink-0 border-b border-transparent bg-transparent'
          : appearance === 'solid'
            ? 'w-full shrink-0 border-b border-transparent bg-[var(--tb-color-bg-page)]'
            : 'w-full shrink-0 border-b border-transparent bg-[var(--tb-color-bg-page)]/85 backdrop-blur-md supports-[backdrop-filter:blur(0px)]:bg-[var(--tb-color-bg-page)]/70'
      }
      style={{ paddingTop: 'var(--tb-safe-area-top)' }}
    >
      <div className="relative flex h-[var(--tb-size-top-app-bar-height)] items-center justify-between px-[20px]">
        {/* Left */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors"
              style={{
                width: APP_SHELL_ICON_BUTTON_SIZE,
                height: APP_SHELL_ICON_BUTTON_SIZE,
              }}
            >
              <svg
                width={APP_SHELL_ICON_SIZE}
                height={APP_SHELL_ICON_SIZE}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="프로필 확인 및 편집"
              className="relative shrink-0 rounded-full size-[32px] transition-transform active:scale-[0.98]"
            >
              <PalateBloomAvatar
                ariaLabel="프로필 확인 및 편집"
                imageSrc={userAvatarImageSrc}
                profile={userPalateBloomProfile ?? DEFAULT_PALATE_BLOOM_PROFILE}
                shapeSeed={userPalateBloomShapeSeed}
                size="sm"
              />
            </button>
          )}
        </div>

        {/* Center Title */}
        {title && (
          <span className="font-bold text-[15px] text-[var(--tb-color-text-primary)] absolute left-1/2 -translate-x-1/2">
            {title}
          </span>
        )}

        {/* Right */}
        {rightActions ? (
          <div className="flex items-center gap-2">{rightActions}</div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="알림"
              className="relative flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
              style={{
                width: APP_SHELL_ICON_BUTTON_SIZE,
                height: APP_SHELL_ICON_BUTTON_SIZE,
              }}
            >
              <Bell size={APP_SHELL_ICON_SIZE} strokeWidth={1.8} />
              {hasUnreadNotifications && (
                <div className="absolute top-[2px] right-[2px] size-[6px] rounded-full bg-[var(--tb-taste-sweet-main)]" />
              )}
            </button>
            <button
              type="button"
              onClick={handlePrimaryAction}
              aria-label={primaryActionLabel}
              title={primaryActionTitle}
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
              style={{
                width: APP_SHELL_ICON_BUTTON_SIZE,
                height: APP_SHELL_ICON_BUTTON_SIZE,
              }}
            >
              <PrimaryActionIcon size={APP_SHELL_ICON_SIZE} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="메뉴 열기"
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
              style={{
                width: APP_SHELL_ICON_BUTTON_SIZE,
                height: APP_SHELL_ICON_BUTTON_SIZE,
              }}
            >
              <Menu size={APP_SHELL_ICON_SIZE} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
