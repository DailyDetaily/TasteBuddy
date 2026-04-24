import { useState } from 'react';

import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../../constants/designTokens';
import TasteChip from '../system/TasteChip';
import TasteTintCard from '../system/TasteTintCard';
import { cn } from '../ui/utils';

interface TasteTintCardPreviewCardProps {
  activeTasteId: TasteId;
}

interface TasteTintCardPreviewChipsProps {
  activeTasteId: TasteId;
  onChange: (tasteId: TasteId) => void;
  ringOffsetClassName?: string;
}

interface TasteTintCardInteractivePreviewProps {
  initialTasteId?: TasteId;
}

export function TasteTintCardPreviewCard({ activeTasteId }: TasteTintCardPreviewCardProps) {
  const activeTaste = TASTE_TOKENS[activeTasteId];
  const activeTasteIndex = TASTE_IDS.indexOf(activeTasteId);

  return (
    <TasteTintCard
      className="transition-all duration-300"
      description="설명 텍스트"
      detail="보조 텍스트"
      leading={
        <span className="text-[16px] font-bold" style={{ color: activeTaste.palette.dark }}>
          {String(activeTasteIndex + 1).padStart(2, '0')}
        </span>
      }
      leadingClassName="bg-white/80"
      tasteId={activeTasteId}
      title="타이틀"
    />
  );
}

export function TasteTintCardPreviewChips({
  activeTasteId,
  onChange,
  ringOffsetClassName = 'focus-visible:ring-offset-[var(--tb-color-surface-muted)]',
}: TasteTintCardPreviewChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {TASTE_IDS.map((tasteId) => {
        const taste = TASTE_TOKENS[tasteId];
        const selected = tasteId === activeTasteId;

        return (
          <button
            key={tasteId}
            type="button"
            aria-pressed={selected}
            aria-label={`${taste.label} 미각 보기`}
            onClick={() => onChange(tasteId)}
            className={cn(
              'appearance-none rounded-full bg-transparent p-0 outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-[rgba(15,15,15,0.16)] focus-visible:ring-offset-2',
              ringOffsetClassName,
              selected && 'scale-[1.02]',
            )}
          >
            <TasteChip
              className={cn('pointer-events-none', selected && 'shadow-[var(--tb-shadow-hover)]')}
              taste={taste.label}
              value={selected ? '선택' : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function TasteTintCardInteractivePreview({
  initialTasteId = TASTE_IDS[0],
}: TasteTintCardInteractivePreviewProps) {
  const [activeTasteId, setActiveTasteId] = useState<TasteId>(initialTasteId);

  return (
    <div className="flex flex-col items-center gap-4">
      <TasteTintCardPreviewCard activeTasteId={activeTasteId} />
      <TasteTintCardPreviewChips activeTasteId={activeTasteId} onChange={setActiveTasteId} />
    </div>
  );
}
