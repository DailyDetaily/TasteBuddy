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
}

export default function TopAppBar({ title, showBack, onBack }: TopAppBarProps) {
  return (
    <div className="bg-white w-full shrink-0 z-40">
      <div className="flex items-center justify-between px-[20px] py-[12px] max-h-[56px]">
        {/* Left */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center size-[32px] rounded-full hover:bg-gray-100 transition-colors text-[#3F3F3F]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="relative rounded-full shrink-0 size-[32px]">
              <div className="flex items-center justify-center overflow-hidden rounded-full size-[32px] bg-[#FF9900]/20">
                <span className="font-medium text-[14px] text-[#0f0f0f]">JH</span>
              </div>
              <div className="absolute border border-[rgba(15,15,15,0.2)] inset-0 pointer-events-none rounded-full" />
            </div>
          )}
        </div>

        {/* Center Title */}
        {title && (
          <span className="font-bold text-[15px] text-[#0f0f0f] absolute left-1/2 -translate-x-1/2">
            {title}
          </span>
        )}

        {/* Right */}
        <div className="flex items-center gap-[16px]">
          <button className="text-[#3F3F3F] hover:text-[#0f0f0f] transition-colors">
            <Bell size={24} strokeWidth={1.8} />
          </button>
          <button className="text-[#3F3F3F] hover:text-[#0f0f0f] transition-colors">
            <PlusCircle size={24} strokeWidth={1.8} />
          </button>
          <button className="text-[#3F3F3F] hover:text-[#0f0f0f] transition-colors">
            <Menu size={24} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
