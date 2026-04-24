import {
  Bell as BellIcon,
  CirclePlus as CirclePlusIcon,
  Menu as MenuIcon
} from 'lucide-react';
import React from 'react';
import { ICON_TOKENS } from '../constants/designTokens';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, fontSize, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />
  );
};

const Bell = wrapIcon(BellIcon);
const PlusCircle = wrapIcon(CirclePlusIcon);
const Menu = wrapIcon(MenuIcon);
const APP_SHELL_ICON_SIZE = ICON_TOKENS.size.lg;
const APP_SHELL_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onStartMeasurement?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  hasUnreadNotifications?: boolean;
}

export default function TopAppBar({
  title,
  showBack,
  onBack,
  onStartMeasurement,
  onOpenNotifications,
  onOpenMenu,
  hasUnreadNotifications,
}: TopAppBarProps) {
  return (
    <div
      className="w-full shrink-0 border-b border-transparent bg-[var(--tb-color-bg-page)]/85 backdrop-blur-md supports-[backdrop-filter:blur(0px)]:bg-[var(--tb-color-bg-page)]/70"
      style={{ paddingTop: 'var(--tb-safe-area-top)' }}
    >
      <div className="relative flex min-h-[var(--tb-size-top-app-bar-height)] items-center justify-between px-[20px] py-[12px]">
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
            <div className="relative rounded-full shrink-0 size-[32px]">
              <div className="flex items-center justify-center overflow-hidden rounded-full size-[32px] bg-[color:rgba(255,153,0,0.2)]">
                <span className="font-medium text-[14px] text-[var(--tb-color-text-primary)]">JH</span>
              </div>
              <div className="absolute border border-[var(--tb-color-border-avatar)] inset-0 pointer-events-none rounded-full" />
            </div>
          )}
        </div>

        {/* Center Title */}
        {title && (
          <span className="font-bold text-[15px] text-[var(--tb-color-text-primary)] absolute left-1/2 -translate-x-1/2">
            {title}
          </span>
        )}

        {/* Right */}
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
            onClick={onStartMeasurement}
            aria-label="미각 측정 시작"
            title="미각 측정"
            className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
            style={{
              width: APP_SHELL_ICON_BUTTON_SIZE,
              height: APP_SHELL_ICON_BUTTON_SIZE,
            }}
          >
            <PlusCircle size={APP_SHELL_ICON_SIZE} strokeWidth={1.8} />
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
      </div>
    </div>
  );
}
