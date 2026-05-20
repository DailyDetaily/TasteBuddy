import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

import { ICON_TOKENS } from "../../constants/designTokens";
import { cn } from "../ui/utils";
import { SourceFileLink } from "./PreviewableSourceText";

interface PlaygroundLiveControlsContextValue {
  activeSectionId: string | null;
  portalRootElement: HTMLDivElement | null;
}

const PlaygroundLiveControlsContext = createContext<PlaygroundLiveControlsContextValue | null>(null);

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

interface PlaygroundLiveControlsDockProps {
  activeSectionLabel: string | null;
  onToggleOpen: () => void;
  onPortalRootChange: (node: HTMLDivElement | null) => void;
  visible: boolean;
}

export function PlaygroundLiveControlsProvider({
  activeSectionId,
  children,
  portalRootElement,
}: PlaygroundLiveControlsContextValue & { children: ReactNode }) {
  return (
    <PlaygroundLiveControlsContext.Provider value={{ activeSectionId, portalRootElement }}>
      {children}
    </PlaygroundLiveControlsContext.Provider>
  );
}

export function PlaygroundLiveControlsDock({
  activeSectionLabel,
  onToggleOpen,
  onPortalRootChange,
  visible,
}: PlaygroundLiveControlsDockProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="box-border w-full min-w-0 max-w-full self-stretch overflow-hidden rounded-[28px] border border-[var(--tb-color-border-default)] bg-white/95 p-4 shadow-[0_24px_80px_rgba(15,15,15,0.18)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">실시간 컨트롤</p>
        </div>
        <div className="flex items-center gap-2">
          {activeSectionLabel ? (
            <span className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
              {activeSectionLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onToggleOpen}
            aria-label="플로팅 도크 접기"
            title="플로팅 도크 접기"
            className="inline-flex items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-muted)] transition-colors hover:bg-[var(--tb-color-surface-base)]"
            style={{
              width: 28,
              height: 28,
            }}
          >
            <ChevronRightIcon size={ICON_TOKENS.size.sm} className="rotate-90" />
          </button>
        </div>
      </div>
      <div
        ref={onPortalRootChange}
        className="mt-4 max-h-[min(72vh,560px)] min-w-0 max-w-full overflow-y-auto overflow-x-hidden"
      />
    </div>
  );
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
  const liveControlsContext = useContext(PlaygroundLiveControlsContext);
  const shouldRenderLiveControls =
    Boolean(liveControlsContext?.portalRootElement) &&
    liveControlsContext?.activeSectionId === id;

  const liveControlsPortal = shouldRenderLiveControls && liveControlsContext
    ? createPortal(
        <div className="grid min-w-0 max-w-full gap-4 overflow-hidden">
          {controls ? <div className="box-border grid w-full min-w-0 max-w-full gap-3 overflow-hidden">{controls}</div> : null}
          {sources.length ? (
            <div className="box-border grid w-full min-w-0 max-w-full gap-3">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <h3 className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                  코드 출처
                </h3>
                <span className="rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                  {sources.length}
                </span>
              </div>
              <div className="grid min-w-0 max-w-full gap-2">
                {sources.map((source) => (
                  <div
                    key={`${id}-dock-${source.file}`}
                    className="box-border min-w-0 max-w-full rounded-[18px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-3 py-3"
                  >
                    <SourceFileLink
                      className="font-mono"
                      file={source.file}
                      variant="block"
                    />
                    <p className="mt-1 min-w-0 max-w-full whitespace-normal break-words text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                      {source.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>,
        liveControlsContext.portalRootElement,
      )
    : null;

  return (
    <section
      id={id}
      className={cn(
        "grid gap-4 rounded-[32px] border border-[var(--tb-color-border-default)] bg-white p-4 shadow-[0_18px_40px_rgba(15,15,15,0.06)]",
        liveControlsContext
          ? "grid-cols-1"
          : "lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.95fr)]",
      )}
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

      {!liveControlsContext ? (
        <aside className="flex min-w-0 flex-col gap-4 self-start rounded-[28px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] p-4">
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
                  <SourceFileLink
                    className="font-mono"
                    file={source.file}
                    variant="block"
                  />
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                    {source.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      ) : null}

      {liveControlsPortal}
    </section>
  );
}
