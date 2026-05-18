import { BatteryFull as BatteryFullIcon, Bluetooth as BluetoothIcon } from 'lucide-react';

import SectionCard from '../SectionCard';
import { ICON_TOKENS } from '../../constants/designTokens';
import { formatMeasurementDate } from '../../constants/tasteMeasurementData';

interface TastickDeviceCardProps {
  batteryPercent?: number;
  connectedLabel?: string;
  lastMeasurementAt: string;
  onClick?: () => void;
}

export default function TastickDeviceCard({
  batteryPercent = 87,
  connectedLabel = '연결됨',
  lastMeasurementAt,
  onClick,
}: TastickDeviceCardProps) {
  return (
    <SectionCard onClick={onClick}>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[var(--tb-color-surface-muted)]">
            <span className="text-[10px] font-bold text-[var(--tb-color-text-primary)]">TB</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">테이스틱</span>
            <span className="text-[11px] text-[var(--tb-color-text-muted)]">Tastick Pro</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <BluetoothIcon size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-primary)]" />
            <span className="text-[11px] font-medium text-[var(--tb-color-text-secondary)]">
              {connectedLabel}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <BatteryFullIcon size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-primary)]" />
            <span className="text-[11px] font-medium text-[var(--tb-color-text-secondary)]">
              {batteryPercent}%
            </span>
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-[var(--tb-color-border-strong)]" />
      <div className="flex w-full items-center justify-between">
        <span className="text-[12px] text-[var(--tb-color-text-muted)]">마지막 측정</span>
        <span className="text-[12px] font-medium text-[var(--tb-color-text-primary)]">
          {formatMeasurementDate(lastMeasurementAt)}
        </span>
      </div>
    </SectionCard>
  );
}
