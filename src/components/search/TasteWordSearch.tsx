import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react';

import SearchOverlayShell from './SearchOverlayShell';

type TasteAxisId = 'sweet' | 'sour' | 'salty' | 'bitter' | 'umami' | 'fat';

interface TasteWordSearchAxis {
  id: TasteAxisId;
  label: string;
}

interface TasteWordSearchWord {
  axis: TasteAxisId;
  description: string;
  id: string;
  intensity: number;
  label: string;
}

interface TasteWordSearchProps {
  axes: readonly TasteWordSearchAxis[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (word: TasteWordSearchWord) => void;
  words: readonly TasteWordSearchWord[];
}

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[()'".,/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAxisLabel(axes: readonly TasteWordSearchAxis[], axisId: TasteAxisId) {
  return axes.find((axis) => axis.id === axisId)?.label ?? axisId;
}

export default function TasteWordSearch({
  axes,
  isOpen,
  onClose,
  onSelect,
  words,
}: TasteWordSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeAxisId, setActiveAxisId] = useState<TasteAxisId | null>(null);
  const normalizedQuery = normalizeSearchValue(query);
  const visibleWords = words.filter((word) => {
    const matchesAxis = activeAxisId ? word.axis === activeAxisId : true;
    const matchesQuery = normalizedQuery
      ? normalizeSearchValue(`${word.label} ${word.description} ${getAxisLabel(axes, word.axis)}`).includes(
          normalizedQuery,
        )
      : true;

    return matchesAxis && matchesQuery;
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setQuery('');
    setActiveAxisId(null);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (visibleWords[0]) {
      onSelect(visibleWords[0]);
    }
  };

  return (
    <SearchOverlayShell
      ariaLabel="미각 단어 검색"
      inputRef={inputRef}
      onClearQuery={() => setQuery('')}
      onClose={onClose}
      onQueryChange={setQuery}
      onSubmit={handleSubmit}
      placeholder="미각 단어 검색"
      query={query}
    >
      <div className="tb-section-stack">
        <section className="tb-card-stack">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
              미각 축
            </h3>
            {activeAxisId ? (
              <button
                type="button"
                onClick={() => setActiveAxisId(null)}
                className="text-[11px] font-medium text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-body)]"
              >
                전체 보기
              </button>
            ) : null}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="미각 축">
            {axes.map((axis) => {
              const isSelected = activeAxisId === axis.id;

              return (
                <button
                  key={axis.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveAxisId((current) => (current === axis.id ? null : axis.id))}
                  className="tb-taste-axis-tab shrink-0"
                  style={
                    {
                      '--tb-taste-axis-tab-bg': isSelected
                        ? `var(--tb-taste-${axis.id}-tint-surface)`
                        : 'var(--tb-color-surface-base)',
                      '--tb-taste-axis-tab-border': `var(--tb-taste-${axis.id}-main)`,
                      '--tb-taste-axis-tab-text': isSelected
                        ? `var(--tb-taste-${axis.id}-tint-surface-text)`
                        : `var(--tb-taste-${axis.id}-main)`,
                    } as CSSProperties
                  }
                >
                  {axis.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="tb-card-stack">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
              {activeAxisId ? `${getAxisLabel(axes, activeAxisId)} 단어` : '전체 미각 단어'}
            </h3>
            <span className="text-[11px] font-medium text-[var(--tb-color-text-faint)]">
              {visibleWords.length}개
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {visibleWords.map((word) => (
              <button
                key={word.id}
                type="button"
                onClick={() => onSelect(word)}
                className="rounded-[20px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-4 text-left transition-colors hover:border-[var(--tb-color-border-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-[15px] font-semibold leading-tight"
                      style={{ color: `var(--tb-taste-${word.axis}-main)` }}
                    >
                      {word.label}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      {word.description}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: `var(--tb-taste-${word.axis}-tint-surface)`,
                      color: `var(--tb-taste-${word.axis}-tint-surface-text)`,
                    }}
                  >
                    {getAxisLabel(axes, word.axis)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </SearchOverlayShell>
  );
}
