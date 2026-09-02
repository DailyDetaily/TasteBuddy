import PrimaryButton from '../system/PrimaryButton';

interface TasteMeasurementMiniCtaProps {
  accentTaste?: string;
  actionLabel: string;
  actionFullWidth?: boolean;
  actionPlacement?: 'bottom' | 'right';
  description: string;
  meta?: string;
  onAction: () => void;
  padding?: 'compact' | 'default';
  title: string;
  tone?: 'alert' | 'neutral';
}

export default function TasteMeasurementMiniCta({
  actionLabel,
  actionFullWidth = false,
  actionPlacement = 'bottom',
  description,
  meta,
  onAction,
  padding = 'compact',
  title,
  tone = 'neutral',
}: TasteMeasurementMiniCtaProps) {
  const isRightAction = actionPlacement === 'right';
  const paddingClass = padding === 'compact' ? 'p-3' : 'p-4';
  const accentClass =
    tone === 'alert'
      ? 'border-[var(--tb-taste-sweet-light)] bg-[linear-gradient(135deg,var(--tb-taste-sweet-bg)_0%,var(--tb-color-surface-base)_100%)]'
      : 'border-[var(--tb-color-border-card)] bg-[var(--tb-color-surface-card)]';
  const actionButtonStyle = {
    background: 'var(--tb-user-accent-tint-surface, var(--tb-taste-sweet-bg))',
    border: 'none',
    color: 'var(--tb-user-accent-dark, var(--tb-taste-sweet-dark))',
  };

  return (
    <div className={`rounded-[var(--tb-radius-20)] border ${paddingClass} ${accentClass}`}>
      <div className={isRightAction ? 'flex items-end justify-between gap-3' : undefined}>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">{title}</p>
          <p className="text-[12px] font-normal leading-normal text-[var(--tb-color-text-subtle)]">
            {description}
          </p>
          {meta ? (
            <p className="mt-2 text-[11px] font-medium text-[var(--tb-color-text-faint)]">{meta}</p>
          ) : null}
        </div>

        <div className={isRightAction ? 'shrink-0' : 'mt-3'}>
          <PrimaryButton
            onClick={onAction}
            size="compact"
            fullWidth={actionFullWidth}
            style={actionButtonStyle}
          >
            {actionLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
