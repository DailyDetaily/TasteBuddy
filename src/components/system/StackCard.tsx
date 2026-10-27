import type { ReactNode } from "react";

/** A collapsed decorated stack or an expanded vertical list of cards. */
export default function StackCard({
  children, showsStack = false, expanded = false,
}: { children: ReactNode; showsStack?: boolean; expanded?: boolean }) {
  const decorated = showsStack && !expanded;
  return <div className={`relative isolate flex flex-col gap-3 ${decorated ? "pb-4" : ""}`}>
    {decorated && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10">
      <div className="absolute inset-x-3 bottom-0 top-4 rounded-[20px] bg-[var(--tb-color-surface-card)] shadow-sm" />
      <div className="absolute inset-x-1.5 bottom-2 top-2 rounded-[20px] bg-[var(--tb-color-surface-card)] shadow-sm" />
    </div>}
    {children}
  </div>;
}
