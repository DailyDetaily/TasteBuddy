import { TASTE_TOKENS, type TasteId } from '../../constants/designTokens';
import { getStarterAxisDisplayLabel } from '../../constants/quickTasteCalibrationData';

interface TasteAxisMeterProps {
  absoluteScore: number;
  tasteId: TasteId;
}

export default function TasteAxisMeter({
  absoluteScore,
  tasteId,
}: TasteAxisMeterProps) {
  const taste = TASTE_TOKENS[tasteId];

  return (
    <div className="flex flex-col gap-2 rounded-[20px] border border-[var(--tb-color-border-subtle)] bg-white/84 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: taste.palette.main }}
          />
          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
            {taste.label}
          </p>
        </div>
        <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
          {getStarterAxisDisplayLabel(absoluteScore / 10)}
        </span>
      </div>
      <div className="h-[10px] overflow-hidden rounded-full bg-[rgba(15,15,15,0.07)]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-[var(--tb-motion-ease-entrance)]"
          style={{
            width: `${absoluteScore}%`,
            background: taste.palette.gradient,
          }}
        />
      </div>
      <p className="text-[12px] text-[var(--tb-color-text-muted)]">
        절대 좌표 {absoluteScore}
      </p>
    </div>
  );
}
