import type { CSSProperties, ReactNode } from "react";

import { cn } from "../ui/utils";

interface PlaygroundSectionProps {
  children: ReactNode;
  controls?: ReactNode;
  description: string;
  id: string;
  previewClassName?: string;
  previewStyle?: CSSProperties;
  sources?: Array<{ file: string; note: string }>;
  title: string;
}

export default function PlaygroundSection({
  children,
  controls,
  description,
  id,
  previewClassName,
  previewStyle,
  sources = [],
  title,
}: PlaygroundSectionProps) {
  return (
    <section
      id={id}
      className="grid gap-4 rounded-[32px] border border-[var(--tb-color-border-default)] bg-white p-4 shadow-[0_18px_40px_rgba(15,15,15,0.06)] lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.95fr)]"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="inline-flex w-fit items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tb-color-text-muted)]">
            {title}
          </div>
          <div>
            <h2 className="text-[18px] font-bold tracking-tight text-[var(--tb-color-text-primary)]">
              {title}
            </h2>
            <p className="mt-2 max-w-[72ch] text-[14px] leading-relaxed text-[var(--tb-color-text-subtle)]">
              {description}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden rounded-[28px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] p-4",
            previewClassName,
          )}
          style={previewStyle}
        >
          {children}
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4 rounded-[28px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-4">
        {controls ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
              실시간 컨트롤
            </h3>
            {controls}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
            코드 출처
          </h3>
          <div className="grid gap-2">
            {sources.map((source) => (
              <div
                key={`${id}-${source.file}`}
                className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3"
              >
                <p className="font-mono text-[11px] text-[var(--tb-color-text-primary)]">
                  {source.file}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {source.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
