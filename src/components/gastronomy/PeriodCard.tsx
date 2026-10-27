import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { Category } from "../../lib/gastronomy/engine";
import InsightCategoryIcon from "../system/InsightCategoryIcon";
import SummaryCardFooter, { type SummaryCardLegendItem } from "../system/SummaryCardLegend";
/** HomePeriodInsightCard / TasteInsightSummaryCardLayout geometry shared by home and category cards. */
export default function PeriodCard({
  category,
  label,
  title,
  detail,
  color,
  onOpen,
  footer,
  children,
  visualization,
  legend = [],
}: {
  category: Category;
  label: string;
  title: string;
  detail: string;
  color: string;
  onOpen?: () => void;
  footer?: ReactNode;
  children?: ReactNode;
  visualization?: ReactNode;
  legend?: readonly SummaryCardLegendItem[];
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[14px] font-bold">
          <InsightCategoryIcon category={category} color={color} />
          {label}
        </span>
        {onOpen && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--tb-color-text-hint)]">
            자세히보기
            <ChevronRight size={12} />
          </span>
        )}
      </div>
      <div className={visualization ? "flex flex-wrap items-center justify-between gap-3" : undefined}>
        <div className={visualization ? "min-w-0 flex-1 basis-[140px]" : undefined}>
        <p className="text-[16px] font-bold leading-6">{title}</p>
        <p className="mt-1 whitespace-pre-line text-[12px] leading-[19px] text-[var(--tb-color-text-hint)]">
          {detail}
        </p>
        </div>
        {visualization}
      </div>
      {children}
      <SummaryCardFooter items={legend} />
      {footer && (
        <div className="mt-auto pt-2 text-[11px] text-[var(--tb-color-text-hint)]">
          {footer}
        </div>
      )}
    </>
  );
  const className =
    "flex w-full flex-col gap-3 rounded-[20px] bg-[var(--tb-color-surface-base)] p-3 text-left text-[var(--tb-color-text-primary)]";
  return onOpen ? (
    <button
      type="button"
      className={`${className} transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2`}
      aria-label={[label, title, detail, ...legend.map(item => item.label)].join(", ")}
      onClick={onOpen}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
