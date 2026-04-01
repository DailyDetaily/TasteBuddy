import { AlertRegular, AddCircleRegular, NavigationRegular } from '@fluentui/react-icons';
import React from 'react';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const Bell = wrapIcon(AlertRegular);
const PlusCircle = wrapIcon(AddCircleRegular);
const Menu = wrapIcon(NavigationRegular);

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
    <div className="bg-[var(--tb-color-bg-page)]/85 backdrop-blur-md border-b border-transparent w-full shrink-0 z-40 supports-[backdrop-filter:blur(0px)]:bg-[var(--tb-color-bg-page)]/70">
      <div className="flex items-center justify-between px-[20px] py-[12px] max-h-[56px]">
        {/* Left */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center size-[32px] rounded-full hover:bg-[var(--tb-color-surface-card)] transition-colors text-[var(--tb-color-icon-primary)]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="flex items-center gap-[16px]">
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="알림"
            className="relative text-[var(--tb-color-icon-primary)] hover:text-[var(--tb-color-text-primary)] transition-colors"
          >
            <Bell size={24} strokeWidth={1.8} />
            {hasUnreadNotifications && (
              <div className="absolute top-[2px] right-[2px] size-[6px] rounded-full bg-[var(--tb-taste-sweet-main)]" />
            )}
          </button>
          <button
            type="button"
            onClick={onStartMeasurement}
            aria-label="미각 측정 시작"
            title="미각 측정"
            className="text-[var(--tb-color-icon-primary)] hover:text-[var(--tb-color-text-primary)] transition-colors"
          >
            <PlusCircle size={24} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="메뉴 열기"
            className="text-[var(--tb-color-icon-primary)] hover:text-[var(--tb-color-text-primary)] transition-colors"
          >
            <Menu size={24} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
