import { DismissRegular } from '@fluentui/react-icons';
import {
  CalendarCheckmarkRegular,
  AlertRegular,
  FoodRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons';
import React from 'react';
import {
  formatNotificationRelativeTime,
  type AppNotification,
} from '../lib/notificationsSupabase';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const CalendarCheck = wrapIcon(CalendarCheckmarkRegular);
const Bell = wrapIcon(AlertRegular);
const Utensils = wrapIcon(FoodRegular);
const CheckCircle = wrapIcon(CheckmarkCircleRegular);

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
            <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--tb-color-surface-card)] px-5 pt-5 pb-3">
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
                  className="flex items-center justify-center size-[28px] rounded-full hover:bg-[var(--tb-color-surface-muted)] transition-colors text-[var(--tb-color-icon-primary)]"
                >
                  <DismissRegular className="text-[16px]" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex flex-col px-3 pb-4">
              {notifications.map((notification) => {
                const { icon: Icon, iconBg, iconColor } = getNotificationPresentation(notification);
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => onMarkAsRead(notification.id)}
                    className={`flex items-start gap-3 rounded-[var(--tb-radius-14)] px-3 py-3 text-left transition-colors ${
                      notification.read
                        ? 'opacity-60'
                        : 'bg-[var(--tb-color-surface-muted)]'
                    }`}
                  >
                    <div
                      className="flex size-[36px] shrink-0 items-center justify-center rounded-[var(--tb-radius-10)]"
                      style={{
                        backgroundColor: iconBg,
                        color: iconColor,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
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
