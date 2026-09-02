import {
  CalendarCheck as CalendarCheckIcon,
  User as UserIcon
} from 'lucide-react';
import React from 'react';
import { ICON_TOKENS } from '../constants/designTokens';
import BottomTabCenterButton from './BottomTabCenterButton';
import AnalysisTabIcon from './system/AnalysisTabIcon';
import HomeTabIcon from './system/HomeTabIcon';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, fontSize, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />
  );
};

const Home = wrapIcon(HomeTabIcon);
const Analysis = wrapIcon(AnalysisTabIcon);
const CalendarCheck = wrapIcon(CalendarCheckIcon);
const User = wrapIcon(UserIcon);

export type TabType = 'home' | 'analysis' | 'reservation' | 'profile';

interface BottomTabBarProps {
  activeTab: TabType;
  onCenterAction?: () => void;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'analysis', label: '나의 입맛', icon: Analysis },
  { id: 'reservation', label: '다이닝', icon: CalendarCheck },
  { id: 'profile', label: '프로필', icon: User },
];

const leadingTabs = tabs.slice(0, 2);
const trailingTabs = tabs.slice(2);

export default function BottomTabBar({ activeTab, onCenterAction, onTabChange }: BottomTabBarProps) {
  const renderTabButton = (tab: (typeof tabs)[number]) => {
    const isActive = activeTab === tab.id;
    const Icon = tab.icon;

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => onTabChange(tab.id)}
        aria-current={isActive ? 'page' : undefined}
        className="relative flex min-w-0 flex-col items-center justify-center gap-[2px] px-2 py-[6px]"
      >
        <div className="relative">
          <Icon
            size={ICON_TOKENS.size.lg}
            className={isActive
              ? 'text-[var(--tb-color-text-primary)]'
              : 'text-[var(--tb-color-icon-muted)]'
            }
            strokeWidth={isActive ? ICON_TOKENS.strokeWidth.medium : ICON_TOKENS.strokeWidth.regular}
          />
        </div>
        <span
          className={`truncate text-[10px] tracking-[0.14px] ${isActive
            ? 'font-semibold text-[var(--tb-color-text-primary)]'
            : 'font-medium text-[var(--tb-color-icon-muted)]'
            }`}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div
      className="relative min-h-[var(--tb-size-bottom-tab-bar-height)] w-full shrink-0 overflow-visible border-t border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)]/85 backdrop-blur-md supports-[backdrop-filter:blur(0px)]:bg-[var(--tb-color-bg-page)]/70"
      style={{ paddingBottom: 'var(--tb-safe-area-bottom)' }}
    >
      <div className="grid grid-cols-5 items-center px-2 py-1">
        {leadingTabs.map(renderTabButton)}
        <BottomTabCenterButton onClick={onCenterAction} />
        {trailingTabs.map(renderTabButton)}
      </div>
    </div>
  );
}
