import type { ReactNode } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import TopAppBar from '../components/TopAppBar';
import { ICON_TOKENS } from '../constants/designTokens';

interface TasteChangePageProps {
  children: ReactNode;
  onBack: () => void;
  onOpenMenu?: () => void;
  topSlot?: ReactNode;
}

export default function TasteChangePage({ children, onBack, onOpenMenu, topSlot }: TasteChangePageProps) {
  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
        <div className="pointer-events-auto w-full max-w-[1440px]">
          <TopAppBar
            title="미각 변화"
            showBack
            onBack={onBack}
            rightActions={(
              <button
                type="button"
                onClick={onOpenMenu}
                aria-label="메뉴 열기"
                className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                style={{
                  width: ICON_TOKENS.container.lg,
                  height: ICON_TOKENS.container.lg,
                }}
              >
                <MenuIcon size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
              </button>
            )}
          />
        </div>
      </div>
      {topSlot ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
          style={{ top: 'calc(var(--tb-safe-area-top) + var(--tb-size-top-app-bar-height))' }}
        >
          <div className="pointer-events-auto w-full max-w-[1440px] shrink-0 border-b border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] px-5 pb-4 pt-1">
            {topSlot}
          </div>
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className={`tb-section-stack px-0 pb-20 animate-fadeIn ${topSlot ? 'pt-[53px]' : 'pt-5'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
