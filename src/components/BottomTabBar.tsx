import { HomeRegular, DataBarVerticalRegular, CalendarCheckmarkRegular, PersonRegular } from '@fluentui/react-icons';
import React from 'react';
import { ICON_TOKENS } from '../constants/designTokens';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const Home = wrapIcon(HomeRegular);
const BarChart3 = wrapIcon(DataBarVerticalRegular);
const CalendarCheck = wrapIcon(CalendarCheckmarkRegular);
const User = wrapIcon(PersonRegular);

export type TabType = 'home' | 'analysis' | 'reservation' | 'profile';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'analysis', label: '나의 미각', icon: BarChart3 },
  { id: 'reservation', label: '다이닝', icon: CalendarCheck },
  { id: 'profile', label: '프로필', icon: User },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="w-full bg-[var(--tb-color-bg-page)]/85 backdrop-blur-md border-t border-[var(--tb-color-border-default)] relative shrink-0 z-50 supports-[backdrop-filter:blur(0px)]:bg-[var(--tb-color-bg-page)]/70">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center gap-[2px] py-[6px] px-4 relative group transition-all duration-200 active:scale-[0.92]"
            >
              <div className={`relative transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
                <Icon
                  size={ICON_TOKENS.size.lg}
                  className={`transition-colors duration-300 ${
                    isActive
                      ? 'text-[var(--tb-color-text-primary)]'
                      : 'text-[var(--tb-color-icon-muted)] group-hover:text-[var(--tb-color-icon-hover)]'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </div>
              <span
                className={`text-[10px] tracking-[0.14px] transition-colors duration-300 ${
                  isActive
                    ? 'font-semibold text-[var(--tb-color-text-primary)]'
                    : 'font-medium text-[var(--tb-color-icon-muted)] group-hover:text-[var(--tb-color-icon-hover)]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Home Indicator */}
      <div className="flex justify-center pb-1">
        <div className="w-[134px] h-[5px] bg-[var(--tb-color-text-primary)] rounded-full" />
      </div>
    </div>
  );
}
