import { RefreshCcw } from 'lucide-react';

import PrimaryButton from '../system/PrimaryButton';

interface TasteMeasurementMiniCtaProps {
  actionLabel: string;
  description: string;
  meta?: string;
  onAction: () => void;
  title: string;
  tone?: 'alert' | 'neutral';
}

export default function TasteMeasurementMiniCta({
  actionLabel,
  description,
  meta,
  onAction,
  title,
  tone = 'neutral',
}: TasteMeasurementMiniCtaProps) {
  const accentClass =
    tone === 'alert'
      ? 'border-[var(--tb-taste-sweet-light)] bg-[linear-gradient(135deg,var(--tb-taste-sweet-bg)_0%,var(--tb-color-surface-base)_100%)]'
      : 'border-[var(--tb-color-border-card)] bg-[var(--tb-color-surface-card)]';
  const iconClass =
    tone === 'alert'
      ? 'bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)]'
      : 'bg-[var(--tb-color-surface-base)] text-[var(--tb-color-icon-primary)]';

  return (
    <div className={`rounded-[var(--tb-radius-20)] border p-4 ${accentClass}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex size-[32px] shrink-0 items-center justify-center rounded-[var(--tb-radius-10)] ${iconClass}`}
        >
          <RefreshCcw size={14} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {description}
          </p>
          {meta ? (
            <p className="mt-1 text-[11px] font-medium text-[var(--tb-color-text-faint)]">{meta}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <PrimaryButton onClick={onAction} size="compact" fullWidth={false}>
          {actionLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}
