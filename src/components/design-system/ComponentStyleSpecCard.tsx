import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { SourceFileLink } from "./PreviewableSourceText";

import type { ComponentStyleSpec } from "./componentStyleSpecs";

interface ComponentStyleSpecCardProps {
  onCopyPrompt: (spec: ComponentStyleSpec) => void;
  onCopyStyle: (spec: ComponentStyleSpec) => void;
  spec: ComponentStyleSpec;
}

const STATUS_LABELS = {
  "currently-used": "Currently used",
  "defined-but-unused": "Defined but unused",
} as const;

export default function ComponentStyleSpecCard({
  onCopyPrompt,
  onCopyStyle,
  spec,
}: ComponentStyleSpecCardProps) {
  return (
    <div className="grid gap-4 rounded-[24px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold text-[var(--tb-color-text-primary)]">
              {spec.name}
            </p>
            <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[10px] font-semibold text-[var(--tb-color-text-muted)]">
              {spec.group}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {spec.description}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
            spec.status === "currently-used"
              ? "border-[rgba(15,15,15,0.12)] bg-[rgba(15,15,15,0.06)] text-[var(--tb-color-text-primary)]"
              : "border-[rgba(255,153,0,0.2)] bg-[rgba(255,153,0,0.12)] text-[#9A5E00]",
          )}
        >
          {STATUS_LABELS[spec.status]}
        </span>
      </div>

      {spec.selector ? (
        <div className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tb-color-text-muted)]">
            선택자 / 루트
          </p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--tb-color-text-primary)]">
            {spec.selector}
          </p>
        </div>
      ) : null}

      <div className="grid gap-2">
        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
          현재 스타일 값
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {spec.values.map((value) => (
            <div
              key={`${spec.id}-${value.label}`}
              className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--tb-color-text-muted)]">
                {value.label}
              </p>
              <p className="mt-2 font-mono text-[12px] text-[var(--tb-color-text-primary)]">
                {value.value}
              </p>
              {value.note ? (
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                  {value.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
          수정 파일
        </p>
        <div className="grid gap-2">
          {spec.sources.map((source) => (
            <div
              key={`${spec.id}-${source.file}`}
              className="rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3"
            >
              <SourceFileLink
                className="font-mono"
                file={source.file}
                variant="block"
              />
              {source.note ? (
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {source.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => onCopyStyle(spec)}>
          스타일 값 복사
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onCopyPrompt(spec)}>
          코덱스 프롬프트 복사
        </Button>
      </div>
    </div>
  );
}
