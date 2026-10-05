import { lazy, Suspense, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Accordion, { AccordionItem, AccordionTrigger, AccordionContent } from "../components/system/plating/Accordion";
import "./component-review.css";

const ProductExamples = lazy(() => import("./DisclosureProductExamples"));

// Review one family at a time; this order follows the confirmed gaps, with Accordion first.
export const componentReviewOrder = ["disclosure", "textarea", "select", "capsule-tabs", "text-action", "icon-action-button", "record-actions", "social-actions", "notification-badge", "skeleton", "image-frame", "chip-group", "scope-label", "flow-loading", "flow-retry", "action-area", "date-picker", "wheel-picker", "attachment-input"];

export default function ComponentReview() {
  const [closedValues, setClosedValues] = useState<string[]>([]);
  const [openValues, setOpenValues] = useState<string[]>(["item-3"]);
  const [title, setTitle] = useState("헤더 타이틀");
  const [format, setFormat] = useState<'bullets' | 'paragraph'>('bullets');
  const [multiple, setMultiple] = useState(false);
  const [long, setLong] = useState(false);
  const lines = ['이 항목의 세부 내용을 작성합니다.', '짧은 정보는 불렛으로 나누고, 이어지는 설명은 문장으로 작성합니다.', ...(long ? ['내용이 길어지면 패널이 아래로 늘어나며 다음 항목과 함께 페이지에서 스크롤됩니다.'] : [])];
  const specimen = (values: string[], onValuesChange: (values: string[]) => void) => <Accordion multiple={multiple} values={values} onValuesChange={onValuesChange}>
    {[1, 2, 3].map(index => <AccordionItem value={`item-${index}`} key={index}>
      <AccordionTrigger title={`${title || '헤더 타이틀'} ${index}`} />
      <AccordionContent><div className="tb-pl-accordion-body">{format === 'bullets'
        ? <ul>{lines.map(line => <li key={line}>{line}</li>)}</ul>
        : <p>{lines.join(' ')}</p>}</div></AccordionContent>
    </AccordionItem>)}
  </Accordion>;
  return <main className="pl-component-review">
    <header className="pl-review-header"><a href="/design-system/components">Plating<span>.</span></a><span>컴포넌트 비교 · 1 / {componentReviewOrder.length}</span></header>
    <div className="pl-review-heading"><p>01 / CONTENT</p><h1>아코디언</h1><p>시드와 플레이팅의 헤더·콘텐츠 패널 구조를 비교해 주세요.</p><a className="pl-review-usage-link" href="#product-examples">구조와 본문 형식 보기 ↓</a></div>
    <div className="pl-review-grid">
      <section className="pl-review-column">
        <div className="pl-review-column-title"><h2>SEED</h2><a href="https://seed-design.io/components/accordion" target="_blank" rel="noreferrer">원본 <ArrowUpRight size={14} /></a></div>
        <p className="pl-review-subtitle">Accordion · 공식 문서의 상태 예시</p>
        <a className="pl-review-reference" href="/plating/review/seed-accordion.png" target="_blank" rel="noreferrer" aria-label="SEED 아코디언 원본 캡처 크게 보기"><img src="/plating/review/seed-accordion.png" alt="SEED 아코디언의 접힘과 펼침 원본. 제목 3개가 목록으로 이어지며 마지막 항목 아래에 본문이 펼쳐집니다." /></a>
        <p className="pl-review-caption">여러 항목을 연결한 목록. 제목·설명·앞쪽 슬롯과 단일/복수 펼침을 제공해요.</p>
      </section>
      <section className="pl-review-column is-montage">
        <div className="pl-review-column-title"><h2>Montage</h2><a href="https://www.figma.com/design/cBy8RRtgNuhqgYcW4yM4Jo" target="_blank" rel="noreferrer" aria-label="Montage Figma 원본">원본 <ArrowUpRight size={14} /></a></div>
        <p className="pl-review-subtitle">공개 컴포넌트 목록</p>
        <div className="pl-review-no-reference"><span aria-hidden="true">—</span><strong>아코디언 항목 없음</strong><p>대조한 공개 컴포넌트 44개에는 대응하는 독립 항목이 없어요.</p></div>
        <p className="pl-review-caption">조사 기준 · 2026.10.01</p>
      </section>
      <section className="pl-review-column is-plating">
        <div className="pl-review-column-title"><h2>Plating</h2><a href="/design-system/components/disclosure" target="_blank" rel="noreferrer">컴포넌트 <ArrowUpRight size={14} /></a></div>
        <p className="pl-review-subtitle">Accordion · 3개 항목으로 이어진 목록</p>
        <div className="pl-review-live">
          <div><span className="pl-review-state-label">접힘 · 헤더 타이틀</span><div className="pl-review-specimen is-accordion" data-accordion-example="collapsed">{specimen(closedValues, setClosedValues)}</div></div>
          <div><span className="pl-review-state-label">펼침 · 헤더 타이틀 + 콘텐츠 패널</span><div className="pl-review-specimen is-accordion" data-accordion-example="expanded">{specimen(openValues, setOpenValues)}</div></div>
        </div>
        <div className="pl-review-edit">
          <label>헤더 타이틀<input value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label>본문 형식<select aria-label="본문 형식" value={format} onChange={e => setFormat(e.target.value as typeof format)}><option value="bullets">불렛 목록</option><option value="paragraph">문장형</option></select></label>
          <label className="pl-review-check"><input type="checkbox" checked={multiple} onChange={e => { setMultiple(e.target.checked); if (!e.target.checked) { setClosedValues(closedValues.slice(0, 1)); setOpenValues(openValues.slice(0, 1)); } }} />복수 펼침</label>
          <label className="pl-review-check"><input type="checkbox" checked={long} onChange={e => setLong(e.target.checked)} />긴 본문</label>
        </div>
        <p className="pl-review-caption">헤더 전체를 눌러 본문을 열고 닫아요. 기본은 한 항목씩, 복수 펼침에서는 여러 항목을 함께 열어요.</p>
      </section>
    </div>
    <Suspense fallback={<p className="pl-review-caption">적용 판단을 불러오고 있어요.</p>}><ProductExamples /></Suspense>
    <footer className="pl-review-footer">플레이팅 제목을 누르면 직접 접고 펼칠 수 있어요. 원본 이미지는 누르면 크게 열립니다.</footer>
  </main>;
}
