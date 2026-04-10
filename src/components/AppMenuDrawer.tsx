import { DismissRegular } from '@fluentui/react-icons';
import {
  ArrowSyncRegular,
  AlertRegular,
  QuestionCircleRegular,
  InfoRegular,
  SignOutRegular,
  ShieldCheckmarkRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import React from 'react';
import { ICON_TOKENS } from '../constants/designTokens';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const RefreshCw = wrapIcon(ArrowSyncRegular);
const Bell = wrapIcon(AlertRegular);
const HelpCircle = wrapIcon(QuestionCircleRegular);
const Info = wrapIcon(InfoRegular);
const LogOut = wrapIcon(SignOutRegular);
const Shield = wrapIcon(ShieldCheckmarkRegular);
const ChevronRight = wrapIcon(ChevronRightRegular);
const CARD_TRAILING_ICON_SIZE = ICON_TOKENS.size.md;
const CHROME_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;

interface MenuItem {
  icon: ReturnType<typeof wrapIcon>;
  label: string;
  desc?: string;
  action: string;
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: '미각 관리',
    items: [
      { icon: RefreshCw, label: '미각 재측정', desc: '테이스틱으로 미각 민감도 다시 측정', action: 'remeasure' },
      { icon: Shield, label: '프로필 정확도 향상', desc: '더 정밀한 캘리브레이션', action: 'improve-accuracy' },
      { icon: Bell, label: '보정 알림 설정', desc: '다이닝 전 미각 측정 알림', action: 'notification-settings' },
    ],
  },
  {
    title: '앱 정보',
    items: [
      { icon: HelpCircle, label: '도움말', desc: 'TCS 사용 가이드', action: 'help' },
      { icon: Info, label: '앱 정보', desc: 'Taste Buddy v1.0.0', action: 'about' },
    ],
  },
];

interface AppMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMeasurement?: () => void;
  onImproveAccuracy?: () => void;
}

export default function AppMenuDrawer({
  isOpen,
  onClose,
  onStartMeasurement,
  onImproveAccuracy,
}: AppMenuDrawerProps) {
  const handleAction = (action: string) => {
    switch (action) {
      case 'remeasure':
        onClose();
        onStartMeasurement?.();
        break;
      case 'improve-accuracy':
        onClose();
        onImproveAccuracy?.();
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-[70] w-[300px] max-w-[85vw] bg-white/85 supports-[backdrop-filter:blur(0px)]:bg-white/85 backdrop-blur-xl shadow-[var(--tb-shadow-drawer)] transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h2 className="text-[16px] font-bold text-[var(--tb-color-text-primary)]">메뉴</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
              style={{
                width: CHROME_ICON_BUTTON_SIZE,
                height: CHROME_ICON_BUTTON_SIZE,
              }}
            >
              <DismissRegular fontSize={ICON_TOKENS.size.lg} />
            </button>
          </div>

          {/* Profile Summary */}
          <div className="mx-5 mb-4 flex items-center gap-3 rounded-[var(--tb-radius-14)] bg-[var(--tb-color-surface-muted)] p-3">
            <div className="flex items-center justify-center rounded-full size-[40px] bg-[var(--tb-taste-sweet-bg)]">
              <span className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">JH</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">신준호</span>
              <span className="text-[11px] text-[var(--tb-color-text-muted)]">Building Profile</span>
            </div>
          </div>

          {/* Menu Sections */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5">
            <div className="flex flex-col gap-6">
              {menuSections.map((section) => (
                <div key={section.title}>
                  <p className="text-[11px] font-semibold text-[var(--tb-color-text-faint)] tracking-[0.14px] mb-2 uppercase">
                    {section.title}
                  </p>
                  <div className="flex flex-col gap-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.action}
                          type="button"
                          onClick={() => handleAction(item.action)}
                          className="flex items-center gap-3 rounded-[var(--tb-radius-12)] px-3 py-3 text-left transition-colors hover:bg-[var(--tb-color-surface-muted)]"
                        >
                          <Icon size={18} className="shrink-0 text-[var(--tb-color-icon-primary)]" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                              {item.label}
                            </span>
                            {item.desc && (
                              <span className="text-[11px] text-[var(--tb-color-text-muted)] truncate">
                                {item.desc}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            size={CARD_TRAILING_ICON_SIZE}
                            className="shrink-0 text-[var(--tb-color-icon-muted)]"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[var(--tb-color-border-default)]">
            <button
              type="button"
              className="flex items-center gap-3 rounded-[var(--tb-radius-12)] px-3 py-3 w-full text-left transition-colors hover:bg-[var(--tb-color-surface-muted)]"
            >
              <LogOut size={18} className="shrink-0 text-[var(--tb-color-icon-muted)]" />
              <span className="text-[13px] font-medium text-[var(--tb-color-text-hint)]">로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
