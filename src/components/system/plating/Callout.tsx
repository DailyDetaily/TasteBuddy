import { ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";
import "./callout.css";

export type CalloutTone = "neutral" | "informative" | "positive" | "warning" | "critical";
type Copy = { title?: string; children: string; icon?: ReactNode; tone?: CalloutTone; className?: string };
type Display = { interaction?: "display"; link?: { label: string; href: string }; onAction?: never; onDismiss?: never; dismissLabel?: never };
type Actionable = { interaction: "actionable"; onAction: () => void; link?: never; onDismiss?: never; dismissLabel?: never };
type Dismissible = { interaction: "dismissible"; onDismiss: () => void; dismissLabel: string; link?: never; onAction?: never; tone?: "neutral" | "informative" | "positive" };
export type CalloutProps = Copy & (Display | Actionable | Dismissible);

/** Inline information. The caller owns action and dismissal state. */
export default function Callout(props: CalloutProps) {
  const { title, children, icon, tone = "neutral", className = "" } = props;
  const content = <>
    {icon && <span className="tb-pl-callout-icon" aria-hidden="true">{icon}</span>}
    <span className="tb-pl-callout-copy">
      {title && <><strong>{title}</strong>{"\u00a0\u00a0"}</>}{children}
      {props.interaction !== "actionable" && props.link && <>{"\u00a0\u00a0"}<a href={props.link.href}>{props.link.label}</a></>}
    </span>
  </>;
  const classes = `tb-pl-callout is-${tone} ${className}`;
  if (props.interaction === "actionable") return <button type="button" className={`${classes} is-actionable`} onClick={props.onAction}>
    {content}<ChevronRight size={16} aria-hidden="true" />
  </button>;
  return <div className={classes}>
    {content}
    {props.interaction === "dismissible" && <button type="button" className="tb-pl-callout-close" aria-label={props.dismissLabel} onClick={props.onDismiss}><X size={16} aria-hidden="true" /></button>}
  </div>;
}
