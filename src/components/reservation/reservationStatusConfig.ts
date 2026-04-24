import type { ReservationStatus } from '../../constants/reservationCatalog';

export const reservationStatusConfig: Record<
  ReservationStatus,
  { label: string; color: string; bg: string }
> = {
  upcoming: {
    label: '예약 확정',
    color: 'var(--tb-color-text-secondary)',
    bg: 'var(--tb-color-surface-muted)',
  },
  preparing: {
    label: 'TCS 준비 중',
    color: 'var(--tb-color-text-secondary)',
    bg: 'var(--tb-color-surface-muted)',
  },
  ready: {
    label: '준비 완료',
    color: 'var(--tb-color-text-primary)',
    bg: 'var(--tb-color-surface-muted)',
  },
  completed: {
    label: '완료',
    color: 'var(--tb-color-text-disabled)',
    bg: 'var(--tb-color-surface-muted)',
  },
};
