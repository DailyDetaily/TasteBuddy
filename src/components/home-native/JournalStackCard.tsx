import type { ReactNode } from "react";
import ExpandableCard from "../system/ExpandableCard";
import StackCard from "../system/StackCard";
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
  return (
    <StackCard showsStack={showsStack} expanded={expandedStack}>
      <ExpandableCard
        title={title} identity={identity} subtitle={subtitle} label={label}
        media={media} onOpen={onOpen} onExpose={onExpose}
        accessory={onToggleStack && <button
          type="button"
          className="flex size-11 shrink-0 items-start justify-end"
          aria-label={`질문과 발견 카드 ${expandedStack ? "접기" : "펼치기"}`}
          aria-expanded={expandedStack}
          onClick={onToggleStack}
        >
          <ChevronDown size={18}
            className={`transition-transform motion-reduce:transition-none ${expandedStack ? "rotate-180" : ""}`} />
        </button>}
      >
        {children}
      </ExpandableCard>
    </StackCard>
  );
}
