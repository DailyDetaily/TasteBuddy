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
      ? 'border-[#F1D7B7] bg-[linear-gradient(135deg,#FFF4E6_0%,#FFF9F3_100%)]'
      : 'border-[var(--tb-color-border-card)] bg-[var(--tb-color-surface-card)]';
  const iconClass =
    tone === 'alert' ? 'bg-[#0F0F0F] text-white' : 'bg-[#F1F1F1] text-[#3F3F3F]';

  return (
    <div className={`rounded-[18px] border p-4 ${accentClass}`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-[32px] shrink-0 items-center justify-center rounded-[10px] ${iconClass}`}>
          <RefreshCcw size={15} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#0F0F0F]">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[rgba(15,15,15,0.62)]">
            {description}
          </p>
          {meta ? (
            <p className="mt-1 text-[11px] font-medium text-[rgba(15,15,15,0.42)]">{meta}</p>
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
