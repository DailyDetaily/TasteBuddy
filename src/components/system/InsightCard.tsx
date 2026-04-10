import SectionCard from '../SectionCard';

interface InsightCardProps {
  accentColor?: string;
  className?: string;
  description: string;
  eyebrow?: string;
  indicatorBackground?: string;
}

export default function InsightCard({
  accentColor = 'var(--tb-color-icon-muted)',
  className = '',
  description,
  eyebrow,
  indicatorBackground,
}: InsightCardProps) {
  return (
    <SectionCard hoverEffect={false} className={className}>
      <div className="flex w-full flex-col gap-2">
        {eyebrow ? (
          <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex w-full items-center gap-3">
          <div
            className="h-[36px] w-[8px] shrink-0 rounded-full"
            style={indicatorBackground ? { background: indicatorBackground } : { backgroundColor: accentColor }}
          />
          <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
            {description}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
