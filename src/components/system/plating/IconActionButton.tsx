import { Bookmark, CircleCheck, CirclePlus, Heart, MessageCircle, Send } from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import "./icon-actions.css";

export type IconActionKind = "save" | "bookmark" | "like" | "comment" | "share";
export type IconActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-pressed"> & {
  kind: IconActionKind;
  active?: boolean;
  count?: number;
  label?: string;
  activeColor?: string;
  readOnly?: boolean;
};

const labels: Record<IconActionKind, string> = {
  save: "내 기록에 추가", bookmark: "북마크", like: "좋아요", comment: "댓글", share: "공유",
};

/** State is supplied by the screen; clicking only calls the supplied action. */
export default function IconActionButton({ kind, active = false, count, label, activeColor, readOnly = false, disabled, className = "", style, ...props }: IconActionButtonProps) {
  const selected = active && (kind === "save" || kind === "bookmark" || kind === "like");
  const social = kind === "like" || kind === "comment" || kind === "share";
  const Icon = kind === "save" ? (selected ? CircleCheck : CirclePlus) : kind === "bookmark" ? Bookmark : kind === "like" ? Heart : kind === "comment" ? MessageCircle : Send;
  const actionLabel = label ?? (selected && kind === "save" ? "내 기록에 추가됨" : selected && kind === "bookmark" ? "북마크 편집" : labels[kind]);
  const accessibleLabel = count === undefined ? actionLabel : `${actionLabel} ${count}개`;
  const actionStyle = { ...style, ...(activeColor ? { "--tb-action-active": activeColor } : {}) } as CSSProperties;
  const shared = {
    className: `tb-icon-action ${className}`,
    style: actionStyle,
    "data-kind": kind,
    "data-layout": social ? "social" : "record",
    "data-active": selected,
    "data-count": count !== undefined,
    "aria-label": accessibleLabel,
  };
  const content = <>
    <span className="tb-icon-action-icon" aria-hidden="true"><Icon size={social ? (kind === "share" ? 17 : 18) : 24} strokeWidth={1.8} fill={selected && kind !== "save" ? "currentColor" : "none"} /></span>
    {count !== undefined && <span className="tb-icon-action-count" aria-hidden="true">{count}</span>}
  </>;
  if (readOnly) return <span {...shared} role="img">{content}</span>;
  return <button {...props} {...shared} type="button" disabled={disabled} aria-pressed={kind === "like" ? selected : undefined}>{content}</button>;
}
