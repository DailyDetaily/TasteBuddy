import { type FormEvent, type ReactNode, type RefObject } from 'react';
import { Search, X } from 'lucide-react';

import { ICON_TOKENS } from '../../constants/designTokens';
import { cn } from '../ui/utils';

const SEARCH_BAR_FIELD_CLASS_NAME =
  'flex h-11 min-w-0 flex-1 items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-4 text-left transition-colors hover:bg-[var(--tb-color-surface-disabled)]';
const SEARCH_BAR_ICON_BUTTON_CLASS_NAME =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[#303946] transition-colors hover:bg-[var(--tb-color-surface-disabled)]';
const SEARCH_OVERLAY_TOP_OFFSET =
  'calc(var(--tb-safe-area-top) + var(--tb-size-top-app-bar-height))';
const SEARCH_OVERLAY_BOTTOM_OFFSET =
  'calc(var(--tb-size-bottom-tab-bar-height) + var(--tb-safe-area-bottom))';
const SEARCH_PANEL_HEADER_CLASS_NAME =
  'border-b border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)]/95 px-5 pb-4 pt-1 backdrop-blur-sm';
const SEARCH_PANEL_BODY_CLASS_NAME = 'flex-1 overflow-y-auto no-scrollbar px-5 pb-8 pt-4';

interface SearchOverlayShellProps {
  ariaLabel: string;
  children: ReactNode;
  inputRef: RefObject<HTMLInputElement | null>;
  onClearQuery: () => void;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder: string;
  query: string;
}

export default function SearchOverlayShell({
  ariaLabel,
  children,
  inputRef,
  onClearQuery,
  onClose,
  onQueryChange,
  onSubmit,
  placeholder,
  query,
}: SearchOverlayShellProps) {
  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-[35] bg-[var(--tb-color-bg-page)] animate-fadeIn"
        style={{ bottom: SEARCH_OVERLAY_BOTTOM_OFFSET }}
      />
      <div
        className="fixed inset-x-0 z-[56] flex justify-center"
        style={{
          top: SEARCH_OVERLAY_TOP_OFFSET,
          bottom: SEARCH_OVERLAY_BOTTOM_OFFSET,
        }}
      >
        <div className="flex h-full w-full max-w-[1440px] flex-col">
          <div className={SEARCH_PANEL_HEADER_CLASS_NAME}>
            <form className="flex items-center gap-3" onSubmit={onSubmit}>
              <div
                className={cn(
                  SEARCH_BAR_FIELD_CLASS_NAME,
                  'relative hover:bg-[var(--tb-color-surface-muted)]',
                )}
              >
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  aria-label={ariaLabel}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={placeholder}
                  className="h-full min-w-0 flex-1 border-none bg-transparent pr-8 text-[13px] font-medium text-[var(--tb-color-text-primary)] outline-none placeholder:text-[var(--tb-color-text-muted)] focus:ring-0"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={onClearQuery}
                    aria-label="검색어 지우기"
                    title="검색어 지우기"
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--tb-color-icon-muted)] transition-colors hover:bg-[var(--tb-color-surface-disabled)] hover:text-[var(--tb-color-text-primary)]"
                  >
                    <X size={ICON_TOKENS.size.sm} />
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                aria-label="검색 실행"
                className={SEARCH_BAR_ICON_BUTTON_CLASS_NAME}
              >
                <Search size={ICON_TOKENS.size.md} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 text-[13px] font-semibold text-[var(--tb-color-text-body)] transition-colors hover:text-[var(--tb-color-text-primary)]"
              >
                취소
              </button>
            </form>
          </div>

          <div className={SEARCH_PANEL_BODY_CLASS_NAME}>{children}</div>
        </div>
      </div>
    </>
  );
}
