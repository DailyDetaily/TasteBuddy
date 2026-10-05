import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import "./primitives.css";

export default function Disclosure({ title, children, open, onOpenChange }: { title: string; children: ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) {
  return <details className="tb-pl-disclosure" open={open} onToggle={event => {
    if (event.currentTarget.open !== open) onOpenChange(event.currentTarget.open);
  }}>
    <summary>{title}<ChevronDown size={16} aria-hidden="true" /></summary>
    <div className="tb-pl-disclosure-content">{children}</div>
  </details>;
}

export function ScopeLabel({ children }: { children: ReactNode }) {
  return <p className="tb-pl-scope">{children}</p>;
}
