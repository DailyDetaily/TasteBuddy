import { useState, type ReactNode } from "react";

/** A single card whose body can expand; queue layout is handled by StackCard. */
export default function ExpandableCard({
  title, identity, subtitle, label, media, accessory, onOpen, onExpose, children,
}: {
  title: string; identity?: string; subtitle: string; label?: string;
  media?: ReactNode; accessory?: ReactNode; onOpen?: () => void;
  onExpose?: () => Promise<void>; children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <article data-journal-id={identity} className="w-full rounded-[20px] bg-[var(--tb-color-surface-card)] p-3">
    <div className="flex items-start gap-1">
      <button type="button" aria-label={[label, title, !expanded ? subtitle : null].filter(Boolean).join(" · ")}
        className="flex min-h-[60px] min-w-0 flex-1 items-start gap-3 text-left"
        aria-expanded={onOpen ? undefined : expanded}
        onClick={() => {
          if (onOpen) { onOpen(); return; }
          setExpanded(v => !v);
          if (!expanded) void onExpose?.().catch(e => setError(e.message));
        }}>
        {media && <div className="size-[60px] shrink-0 overflow-hidden rounded-xl">{media}</div>}
        <div className="min-w-0 flex-1">
          {label && <p className="mb-1 text-[11px] text-[var(--tb-color-text-muted)]">{label}</p>}
          <h3 className={`whitespace-pre-line text-[14px] font-semibold ${expanded || onOpen ? "" : "line-clamp-2"}`}>{title}</h3>
          {!expanded && <p className="mt-1 truncate text-[11px] text-[var(--tb-color-text-hint)]">{subtitle.replace(/\s*\n\s*/g, " · ")}</p>}
        </div>
      </button>
      {accessory}
    </div>
    {expanded && <div className="mt-3">{children}</div>}
    {error && <p role="alert" className="mt-2 text-[12px]">{error}</p>}
  </article>;
}
