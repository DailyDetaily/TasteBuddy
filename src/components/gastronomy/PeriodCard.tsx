import { ChevronRight, ChartNoAxesColumn } from "lucide-react";
import type { ReactNode } from "react";
/** HomePeriodInsightCard / TasteInsightSummaryCardLayout geometry shared by home and category cards. */
export default function PeriodCard({
  label,
  title,
  detail,
  color,
  onOpen,
  footer,
  children,
}: {
  label: string;
  title: string;
  detail: string;
  color: string;
  onOpen?: () => void;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[14px] font-bold">
          <ChartNoAxesColumn size={16} style={{ color }} />
          {label}
        </span>
        {onOpen && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--tb-color-text-hint)]">
            자세히보기
            <ChevronRight size={12} />
          </span>
        )}
      </div>
      <div>
        <p className="text-[16px] font-bold leading-6">{title}</p>
        <p className="mt-1 whitespace-pre-line text-[12px] leading-[19px] text-[var(--tb-color-text-hint)]">
          {detail}
        </p>
      </div>
      {children}
      {footer && (
        <div className="mt-auto pt-2 text-[11px] text-[var(--tb-color-text-hint)]">
          {footer}
        </div>
      )}
    </>
  );
  const className =
    "flex w-full flex-col gap-3 rounded-[20px] bg-white p-3 text-left text-[var(--tb-color-text-primary)]";
  return onOpen ? (
    <button
      type="button"
      className={`${className} transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2`}
      aria-label={[label, title, detail].join(", ")}
      onClick={onOpen}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
