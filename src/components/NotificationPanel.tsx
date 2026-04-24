import {
  X as XIcon
} from 'lucide-react';
import {
  CalendarCheck as CalendarCheckIcon,
  Bell as BellIcon,
  Utensils as UtensilsIcon,
  CircleCheck as CircleCheckIcon
} from 'lucide-react';
import React from 'react';
import {
  formatNotificationRelativeTime,
  type AppNotification,
} from '../lib/notificationsSupabase';
import { ICON_TOKENS } from '../constants/designTokens';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, fontSize, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />
  );
};

const CalendarCheck = wrapIcon(CalendarCheckIcon);
const Bell = wrapIcon(BellIcon);
const Utensils = wrapIcon(UtensilsIcon);
const CheckCircle = wrapIcon(CircleCheckIcon);
const PANEL_ACTION_ICON_SIZE = ICON_TOKENS.size.lg;
const PANEL_ACTION_BUTTON_SIZE = ICON_TOKENS.container.md;
const NOTIFICATION_ITEM_ICON_SIZE = ICON_TOKENS.size.md;
const NOTIFICATION_ITEM_ICON_CONTAINER_SIZE = ICON_TOKENS.container.lg;

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
}

function getNotificationPresentation(notification: AppNotification) {
  switch (notification.type) {
    case 'guidance_ready':
      return {
        icon: CheckCircle,
        iconBg: 'var(--tb-color-success-soft)',
        iconColor: 'var(--tb-color-success)',
      };
    case 'reservation_confirmed':
      return {
        icon: CalendarCheck,
        iconBg: 'var(--tb-taste-salty-bg)',
        iconColor: 'var(--tb-taste-salty-main)',
      };
    case 'feedback_request':
      return {
        icon: Utensils,
        iconBg: 'var(--tb-taste-sweet-bg)',
        iconColor: 'var(--tb-taste-sweet-main)',
      };
    case 'measurement_reminder':
    case 'system':
    default:
      return {
        icon: Bell,
        iconBg: 'var(--tb-color-warning-soft)',
        iconColor: 'var(--tb-color-warning)',
      };
  }
}

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 top-0 z-[70] flex justify-center">
        <div className="w-full max-w-[1440px] relative">
          <div className="absolute top-[56px] right-0 left-0 mx-5 max-h-[70vh] overflow-y-auto no-scrollbar rounded-[var(--tb-radius-20)] bg-white/85 supports-[backdrop-filter:blur(0px)]:bg-white/85 backdrop-blur-xl shadow-[var(--tb-shadow-drawer)] animate-slideIn">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--tb-color-surface-base)] p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[var(--tb-color-text-primary)]">알림</h2>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center rounded-full bg-[var(--tb-color-text-primary)] px-[6px] py-[1px] text-[10px] font-bold text-[var(--tb-color-text-inverse)]">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-[12px] font-semibold text-[var(--tb-color-text-muted)] hover:text-[var(--tb-color-text-primary)] transition-colors"
                  >
                    모두 읽기
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors ]"
                  style={{
                    width: PANEL_ACTION_BUTTON_SIZE,
                    height: PANEL_ACTION_BUTTON_SIZE,
                  }}
                >
                  <XIcon size={PANEL_ACTION_ICON_SIZE} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex flex-col gap-2 p-2">
              {notifications.map((notification) => {
                const { icon: Icon, iconBg, iconColor } = getNotificationPresentation(notification);
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => onMarkAsRead(notification.id)}
                    className={`flex items-start gap-3 rounded-[var(--tb-radius-20)] px-3 py-3 text-left transition-colors ${notification.read
                      ? 'opacity-60'
                      : 'bg-[var(--tb-color-surface-card)]'
                      }`}
                  >
                    <div
                      className="flex shrink-0 items-center justify-center rounded-[var(--tb-radius-8)]"
                      style={{
                        backgroundColor: iconBg,
                        color: iconColor,
                        width: NOTIFICATION_ITEM_ICON_CONTAINER_SIZE,
                        height: NOTIFICATION_ITEM_ICON_CONTAINER_SIZE,
                      }}
                    >
                      <Icon size={NOTIFICATION_ITEM_ICON_SIZE} />
                    </div>
                    <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                      <div className="flex items-top justify-between gap-2">
                        <span className="text-[13px] font-semibold text-[var(--tb-color-text-primary)] truncate">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <div className="size-[6px] shrink-0 rounded-full bg-[var(--tb-taste-sweet-main)]" />
                        )}
                      </div>
                      <span className="text-[12px] leading-relaxed text-[var(--tb-color-text-body)]">
                        {notification.body}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--tb-color-text-faint)] mt-[2px]">
                        {formatNotificationRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
