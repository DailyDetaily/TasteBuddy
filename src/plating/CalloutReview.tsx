import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Callout, { type CalloutTone } from "../components/system/plating/Callout";
import "./component-review.css";

export const missingComponentReviewOrder = ["callout", "pagination", "slider", "tooltip"];
const tones: { value: CalloutTone; label: string }[] = [{ value: "neutral", label: "중립" }, { value: "informative", label: "정보" }, { value: "positive", label: "성공" }, { value: "warning", label: "주의" }, { value: "critical", label: "오류" }];
const bodyCopy: Record<CalloutTone, string> = { neutral: "기억에 남는 감각을 식사 메모로 남길 수 있어요.", informative: "감각의 강도와 좋아하는 정도를 따로 기록해 주세요.", positive: "기록을 저장했어요. 식사 목록에서 확인할 수 있어요.", warning: "기록을 삭제하면 연결된 사진과 메모도 삭제돼요.", critical: "기록을 저장하지 못했어요. 연결 상태를 확인해 주세요." };
function FilledInfo() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="currentColor" /><path d="M8 7v4M8 4.5v.25" stroke="white" strokeWidth="1.6" strokeLinecap="round" /></svg>; }

export default function CalloutReview() {
  const [tone, setTone] = useState<CalloutTone>("neutral");
  const [title, setTitle] = useState("안내");
  const [icon, setIcon] = useState(true);
  const [long, setLong] = useState(false);
  const [link, setLink] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const copy = bodyCopy[tone] + (long ? " 식사 당시 느낀 감각과 조건을 함께 남기면 나중에 경험을 다시 살펴보기 쉬워요." : "");
  const shared = { title: title || undefined, icon: icon ? <FilledInfo /> : undefined, tone };
  const canDismiss = tone !== "critical" && tone !== "warning";
  return <main className="pl-component-review pl-callout-review">
    <header className="pl-review-header"><a href="/design-system/components">Plating<span>.</span></a><span>컴포넌트 검토 · 1 / {missingComponentReviewOrder.length}</span></header>
    <div className="pl-review-heading"><p>01 / CALLOUT</p><h1>콜아웃</h1><p>중요한 정보나 짧은 팁을 본문 안에서 강조하는 컴포넌트예요.</p></div>
    <div className="pl-review-grid">
      <section className="pl-review-column">
        <div className="pl-review-column-title"><h2>SEED</h2><a href="https://seed-design.io/components/callout" target="_blank" rel="noreferrer">원본 <ArrowUpRight size={14} /></a></div>
        <p className="pl-review-subtitle">Callout · 표시 / 전체 클릭 / 닫기</p>
        <a className="pl-review-reference" href="/plating/review/seed-callout-interaction.png" target="_blank" rel="noreferrer" aria-label="SEED Callout 원본 크게 보기"><img src="/plating/review/seed-callout-interaction.png" alt="SEED 공식 Callout 원본: 정보 표시, 전체 영역 클릭, 닫기 버튼을 포함한 세 가지 구조" /></a>
        <p className="pl-review-caption">짧은 제목과 본문을 같은 줄에 배치해요. 전체 클릭형에는 내부 링크를 함께 넣지 않아요.</p>
        <details className="pl-callout-tone-reference"><summary>SEED의 여섯 가지 톤 보기</summary><a href="/plating/review/seed-callout-tones.png" target="_blank" rel="noreferrer"><img src="/plating/review/seed-callout-tones.png" alt="SEED Callout의 Neutral, Informative, Critical, Positive, Warning, Magic 톤" /></a></details>
      </section>
      <section className="pl-review-column">
        <div className="pl-review-column-title"><h2>Montage</h2><a href="https://www.figma.com/design/cBy8RRtgNuhqgYcW4yM4Jo" target="_blank" rel="noreferrer">원본 <ArrowUpRight size={14} /></a></div>
        <p className="pl-review-subtitle">공개 컴포넌트 목록</p>
        <div className="pl-review-no-reference"><span aria-hidden="true">—</span><strong>독립 Callout 항목 없음</strong><p>공개 원본 목록에서 직접 대응하는 항목을 확인하지 못했어요.</p></div>
        <p className="pl-review-caption">조사 기준 · 2026.10.01</p>
      </section>
      <section className="pl-review-column">
        <div className="pl-review-column-title"><h2>Plating</h2><a href="/design-system/components/callout">네이티브 컴포넌트 <ArrowUpRight size={14} /></a></div>
        <p className="pl-review-subtitle">Callout · 실제 SwiftUI 렌더</p>
        <div className="pl-review-live pl-callout-native">
          {([['default', 'Display · 정보 표시'], ['actionable', 'Actionable · 전체 클릭'], ['dismissible', 'Dismissible · 닫기']] as const).map(([state, label]) => <div key={state}><span className="pl-review-state-label">{label}</span><a href={`/plating/native-component-audit/callout--${state}.png`} target="_blank" rel="noreferrer"><img src={`/plating/native-component-audit/callout--${state}.png`} alt={`SwiftUI Callout · ${label}`} width={390} height={160} /></a></div>)}
        </div>
        <p className="pl-review-caption">제목·본문 14pt · 패딩 14pt · 반경 10pt · 닫기 영역 44pt. iOS 시뮬레이터에서 렌더한 원본이에요.</p>
        <details className="pl-callout-tone-reference"><summary>네이티브 톤과 큰 글자 보기</summary>{(['positive', 'warning', 'critical', 'large'] as const).map(state => <a key={state} href={`/plating/native-component-audit/callout--${state}.png`} target="_blank" rel="noreferrer"><img src={`/plating/native-component-audit/callout--${state}.png`} alt={`SwiftUI Callout · ${state === 'large' ? '큰 글자' : state}`} /></a>)}</details>
        <details className="pl-callout-tone-reference"><summary>웹 시안으로 문구와 구조 바꿔보기</summary>
        <div className="pl-review-live pl-callout-live">
          <div><span className="pl-review-state-label">Display · 정보 표시</span><Callout {...shared} link={link ? { label: "기록 도움말", href: "#callout-help" } : undefined}>{copy}</Callout></div>
          <div ref={actionRef} tabIndex={-1}><span className="pl-review-state-label">Actionable · 전체 클릭</span><Callout {...shared} interaction="actionable" onAction={() => setActionOpen(!actionOpen)}>{copy}</Callout>{actionOpen && <p className="pl-callout-feedback" role="status">전체 영역을 눌렀어요. 실제 사용에서는 연결된 안내나 화면을 열어요.</p>}</div>
          <div><span className="pl-review-state-label">Dismissible · 닫기</span>{canDismiss ? dismissed ? <button ref={restoreRef} className="pl-callout-restore" onClick={() => setDismissed(false)}>닫은 안내 다시 보기</button> : <Callout {...shared} tone={tone as "neutral" | "informative" | "positive"} interaction="dismissible" dismissLabel="안내 닫기" onDismiss={() => { setDismissed(true); requestAnimationFrame(() => restoreRef.current?.focus()); }}>{copy}</Callout> : <p className="pl-callout-feedback">주의·오류 안내는 사용자가 놓치지 않도록 닫기형을 제공하지 않아요.</p>}</div>
        </div>
        <div className="pl-review-edit">
          <label>제목<input aria-label="콜아웃 제목" value={title} onChange={e => setTitle(e.target.value)} placeholder="비우면 제목 없이 표시" /></label>
          <label>톤<select aria-label="콜아웃 톤" value={tone} onChange={e => { setTone(e.target.value as CalloutTone); setDismissed(false); }}>{tones.map(t => <option value={t.value} key={t.value}>{t.label}</option>)}</select></label>
          <label className="pl-review-check"><input type="checkbox" checked={icon} onChange={e => setIcon(e.target.checked)} />앞쪽 아이콘</label>
          <label className="pl-review-check"><input type="checkbox" checked={long} onChange={e => setLong(e.target.checked)} />긴 본문</label>
          <label className="pl-review-check"><input type="checkbox" checked={link} onChange={e => setLink(e.target.checked)} />표시형 링크</label>
        </div>
        <p className="pl-review-caption">이 조작 예제는 웹 시안이에요. 위 이미지는 SwiftUI 원본입니다.</p>
        </details>
      </section>
    </div>
    <section id="callout-help" className="pl-callout-help"><h2>구조와 사용 기준</h2><p>정보 표시형은 짧은 설명과 보조 링크, 전체 클릭형은 연결된 행동, 닫기형은 한 번 읽으면 충분한 안내에 사용해요.</p><p>이 화면의 식사 관련 문구는 구조 검토용 예제입니다. 현재 제품에 적용된 화면은 아니에요.</p><a href="https://seed-design.io/components/callout" target="_blank" rel="noreferrer">SEED 사용 기준 보기 ↗</a></section>
    <footer className="pl-review-footer">검토 순서 · Callout → Pagination → Slider → Tooltip · 이전 <a href="/design-system/review/disclosure">아코디언 비교</a></footer>
  </main>;
}
