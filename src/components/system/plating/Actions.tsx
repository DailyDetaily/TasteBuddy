import { forwardRef, type ButtonHTMLAttributes } from "react";
import "./primitives.css";

export const TextAction = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function TextAction({ className = "", ...props }, ref) {
  return <button {...props} ref={ref} type={props.type || "button"} className={`tb-pl-text-action ${className}`} />;
});

/** Keep this inside the labelled trigger; the accessible count belongs to that trigger. */
export function NotificationBadge({ count, dot = false }: { count: number; dot?: boolean }) {
  if (!Number.isFinite(count) || count <= 0) return null;
  return <span className={`tb-pl-notification ${dot ? "is-dot" : ""}`} aria-hidden="true">{dot ? null : count > 99 ? "99+" : Math.floor(count)}</span>;
}
