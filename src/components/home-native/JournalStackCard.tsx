import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
export const journalButton =
  "min-h-11 rounded-full px-4 py-2 text-[13px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
export default function JournalStackCard({
  title,
  identity,
  subtitle,
  label,
  media,
  showsStack = false,
  expandedStack = false,
  onToggleStack,
  onOpen,
  onExpose,
  children,
}: {
  title: string;
  identity?: string;
  subtitle: string;
  label?: string;
  media?: ReactNode;
  showsStack?: boolean;
  expandedStack?: boolean;
  onToggleStack?: () => void;
  onOpen?: () => void;
  onExpose?: () => Promise<void>;
  children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false),
    [error, setError] = useState<string | null>(null);
  return (
    <div className={`relative isolate ${showsStack ? "pb-4" : ""}`}>
      {showsStack && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10"
        >
          <div className="absolute inset-x-3 bottom-0 top-4 rounded-[20px] bg-white shadow-sm" />
          <div className="absolute inset-x-1.5 bottom-2 top-2 rounded-[20px] bg-white shadow-sm" />
        </div>
      )}
      <article
        data-journal-id={identity}
        className="w-full rounded-[20px] bg-[var(--tb-color-surface-card)] p-3"
      >
        <div className="flex items-start gap-1">
          <button
            type="button"
            aria-label={[label, title, !expanded ? subtitle : null]
              .filter(Boolean)
              .join(" · ")}
            className="flex min-h-[60px] min-w-0 flex-1 items-start gap-3 text-left"
            aria-expanded={onOpen ? undefined : expanded}
            onClick={() => {
              if (onOpen) {
                onOpen();
                return;
              }
              setExpanded((v) => !v);
              if (!expanded)
                void onExpose?.().catch((e) => setError(e.message));
            }}
          >
            {media && (
              <div className="size-[60px] shrink-0 overflow-hidden rounded-xl">
                {media}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {label && (
                <p className="mb-1 text-[11px] text-[var(--tb-color-text-muted)]">
                  {label}
                </p>
              )}
              <h3
                className={`whitespace-pre-line text-[14px] font-semibold ${expanded || onOpen ? "" : "line-clamp-2"}`}
              >
                {title}
              </h3>
              {!expanded && (
                <p
                  className={`mt-1 whitespace-pre-line text-[11px] text-[var(--tb-color-text-hint)] ${onOpen ? "" : "line-clamp-1"}`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </button>
          {onToggleStack && (
            <button
              type="button"
              className="flex size-11 shrink-0 items-start justify-end"
              aria-label={`질문과 발견 카드 ${expandedStack ? "접기" : "펼치기"}`}
              aria-expanded={expandedStack}
              onClick={onToggleStack}
            >
              <ChevronDown
                size={18}
                className={`transition-transform motion-reduce:transition-none ${expandedStack ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
        {expanded && <div className="mt-4">{children}</div>}
        {error && (
          <p role="alert" className="mt-2 text-[12px]">
            {error}
          </p>
        )}
      </article>
    </div>
  );
}
