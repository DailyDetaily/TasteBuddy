import { LoaderCircle } from "lucide-react";
import PrimaryButton from "../PrimaryButton";
import "./primitives.css";

export function FlowLoadingState({ message = "미각 설문을 준비하고 있어요" }: { message?: string }) {
  return <div className="tb-pl-flow-state" role="status" aria-live="polite">
    <LoaderCircle className="tb-pl-spinner" size={24} aria-hidden="true" />
    <p>{message}</p>
  </div>;
}

export function FlowRetryState({ title, message, onRetry, busy = false }: { title: string; message: string; onRetry: () => void; busy?: boolean }) {
  return <div className="tb-pl-flow-state is-retry">
    <div role="status"><h3>{title}</h3><p>{message}</p></div>
    <PrimaryButton onClick={onRetry} disabled={busy} aria-busy={busy}>{busy ? "불러오는 중" : "다시 시도"}</PrimaryButton>
  </div>;
}

export function ContentSkeleton({ shape = "card" }: { shape?: "text" | "rectangle" | "circle" | "card" }) {
  return <div className={`tb-pl-skeleton is-${shape}`} role="status" aria-label="콘텐츠를 불러오는 중">
    <span className="tb-pl-sr-only">콘텐츠를 불러오는 중</span>
    <div aria-hidden="true" className="tb-pl-skeleton-shapes">
      {(shape === "circle" || shape === "card") && <span className="tb-pl-skeleton-circle" />}
      {(shape === "text" || shape === "card") && <div className="tb-pl-skeleton-lines"><span /><span /><span /></div>}
      {(shape === "rectangle" || shape === "card") && <span className="tb-pl-skeleton-rectangle" />}
    </div>
  </div>;
}
