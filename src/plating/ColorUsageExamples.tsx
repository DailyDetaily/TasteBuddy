import { useState, type CSSProperties } from "react";
import { ChartNoAxesColumn, Check, ChevronRight } from "lucide-react";
import { IOS_FOUNDATIONS, nativeColor, nativeMetric, type NativeTaste } from "./foundationReferenceData";
import "./color-usage-examples.css";

// Documentation specimens only. Values come from the existing SwiftUI snapshot;
// product components and product state are never changed by these examples.
function TokenRoles({ rows }: { rows: [string, string][] }) {
  return <dl className="pl-usage-tokens">{rows.map(([token, role]) => (
    <div key={token}><dt><code>{token}</code></dt><dd>{role}</dd></div>
  ))}</dl>;
}

function NativeHomeExample() {
  const umami = IOS_FOUNDATIONS.tastes.find((taste) => taste.id === "umami")!;
  return <article className="pl-usage-example" aria-labelledby="color-usage-home">
    <header><span className="pl-usage-number">01</span><div><h3 id="color-usage-home">홈에서 정보의 층을 만들어요</h3><p>화면의 바탕, 카드의 표면, 글자의 위계를 함께 읽어요.</p></div></header>
    <div className="pl-usage-home-layout">
      <figure className="pl-usage-figure">
        <div className="pl-usage-native pl-usage-home" style={{ background: nativeColor("page") }}>
          <span className="pl-usage-stage-label">홈 · 기간 인사이트</span>
          <div className="pl-usage-home-card" style={{ background: nativeColor("surface"), borderRadius: nativeMetric("radius", "card"), color: nativeColor("textPrimary") }}>
            <div className="pl-usage-home-heading"><strong><ChartNoAxesColumn size={16} color={umami.main} aria-hidden="true" />식사 기록</strong><span style={{ color: nativeColor("textHint") }}>자세히보기<ChevronRight size={12} aria-hidden="true" /></span></div>
            <div className="pl-usage-home-content"><strong>4번 기록</strong><p style={{ color: nativeColor("textHint") }}>이전 7일보다 2번 더 기록했어요.</p></div>
          </div>
        </div>
        <figcaption><code>HomePeriodInsightCard</code>의 색상 구조 · 예시 데이터</figcaption>
      </figure>
      <TokenRoles rows={[
        ["TBColor.page", "카드 바깥의 화면 배경"],
        ["TBColor.surface", "콘텐츠를 받치는 카드 표면"],
        ["TBColor.textPrimary", "카드 제목과 핵심 기록"],
        ["TBColor.textHint", "이 카드의 보조 설명"],
      ]} />
    </div>
    <p className="pl-usage-note">일반 본문 역할은 <code>TBColor.textBody</code>예요. 이 홈 카드의 설명에는 실제 소스처럼 <code>textHint</code>를 사용해요.</p>
    <details className="pl-usage-source"><summary>네이티브 구현 근거</summary><p><code>HomePeriodInsightComponents.swift · HomePeriodInsightCard</code><br/><code>SystemParityComponents.swift · TasteInsightSummaryCardLayout</code><br/>카드 내부 여백 12pt, 모서리 <code>TBRadius.card</code>, 홈 배경 <code>TBColor.page</code>.</p></details>
  </article>;
}

function TasteBubblePair({ taste }: { taste: NativeTaste }) {
  const [selected, setSelected] = useState(true);
  const style = {
    "--usage-tint": taste.tintSurface,
    "--usage-tint-text": taste.tintText,
    "--usage-tint-border": `var(--tb-taste-${taste.id}-border-strong)`,
  } as CSSProperties;
  return <div className="pl-usage-taste" style={style}>
    <div className="pl-usage-taste-name"><strong>{taste.label}</strong><code>{taste.id}</code></div>
    <div className="pl-usage-bubble-pair">
      <figure><div className="pl-usage-bubble"><span>{taste.label}</span></div><figcaption>기본</figcaption></figure>
      <figure><button type="button" className="pl-usage-bubble" data-selected={selected} aria-pressed={selected} aria-label={`${taste.label} 선택 상태 예시`} onClick={() => setSelected(!selected)}><span>{taste.label}</span></button><figcaption>{selected ? <><Check size={12} aria-hidden="true" />선택</> : "선택 해제"}</figcaption></figure>
    </div>
  </div>;
}

function NativeTasteExample() {
  return <article className="pl-usage-example" aria-labelledby="color-usage-tastes">
    <header><span className="pl-usage-number">02</span><div><h3 id="color-usage-tastes">선택해도 미각의 색은 유지해요</h3><p>여섯 미각을 같은 조건에서 비교해요. 오른쪽 버블을 눌러 선택을 바꿔보세요.</p></div></header>
    <div className="pl-usage-native pl-usage-tastes" style={{ background: nativeColor("focus") }}>{IOS_FOUNDATIONS.tastes.map((taste) => <TasteBubblePair key={taste.id} taste={taste} />)}</div>
    <TokenRoles rows={[
      ["TasteAxis.{axis}.tintColor", "기본 채움 56% → 선택 채움 100%"],
      ["TasteAxis.{axis}.tintTextColor", "기본 글자 74% → 선택 글자 100%"],
      ["TasteAxis.{axis}.borderStrongColor", "선택이 안정된 뒤 나타나는 1pt 테두리"],
    ]} />
    <p className="pl-usage-note">현재 초점이 없는 초기 상태와 선택 상태의 색상 표본이에요. 실제 지도에서는 초점과의 거리에 따라 기본 농도가 달라지고, 크기·위치·선택 순위도 함께 바뀌어요. 비교를 위해 크기를 맞추고 문구는 미각 이름으로 줄였어요.</p>
    <details className="pl-usage-source"><summary>네이티브 구현 근거</summary><p><code>DiningView.swift · TasteExperienceBubbleView</code><br/><code>TasteModels.swift · TasteAxis</code><br/>초점이 없을 때 <code>fillOpacity = 0.56</code>, <code>textOpacity = 0.74</code>. 선택하면 두 값 모두 1이 돼요. 이 문서의 토글은 색상 비교용이며 실제 기록을 바꾸지 않아요.</p></details>
  </article>;
}

function NativeSaveExample() {
  const [message, setMessage] = useState("");
  const buttonStyle = {
    "--usage-action": nativeColor("actionPrimary"),
    "--usage-on-action": nativeColor("actionOnPrimary"),
    "--usage-disabled": nativeColor("disabledSurface"),
    "--usage-on-disabled": nativeColor("textDisabled"),
    "--usage-focus": nativeColor("focusRing"),
    borderRadius: nativeMetric("radius", "control"),
    minHeight: nativeMetric("sizes", "primaryButtonHeight"),
  } as CSSProperties;
  return <article className="pl-usage-example" aria-labelledby="color-usage-save">
    <header><span className="pl-usage-number">03</span><div><h3 id="color-usage-save">저장과 실패를 다르게 알려요</h3><p>행동 가능 여부는 버튼으로, 저장 실패의 이유는 시스템 안내로 전달해요.</p></div></header>
    <div className="pl-usage-save-grid">
      <figure className="pl-usage-figure"><div className="pl-usage-native pl-usage-button-stage" style={{ background: nativeColor("focus") }}><button type="button" className="pl-usage-save-button" style={buttonStyle} onClick={() => setMessage("색상 확인용 예시예요. 실제 기록은 저장하지 않아요.")}>저장</button></div><figcaption><strong>활성 · 실제 최종 저장 화면</strong><code>actionPrimary + actionOnPrimary</code></figcaption></figure>
      <figure className="pl-usage-figure"><div className="pl-usage-native pl-usage-button-stage" style={{ background: nativeColor("focus") }}><button type="button" className="pl-usage-save-button" style={buttonStyle} disabled>저장</button></div><figcaption><strong>비활성 · 컴포넌트 규격</strong><code>disabledSurface + textDisabled</code></figcaption></figure>
    </div>
    <p className="pl-usage-status" role="status" aria-live="polite">{message || "버튼을 눌러도 실제 기록은 저장되지 않아요."}</p>
    <p className="pl-usage-note"><code>PrimaryButton</code>은 비활성을 지원해요. 현재 최종 <code>저장</code> 버튼에는 비활성 조건이 연결되어 있지 않아, 오른쪽은 지원 규격으로만 표시해요. 메뉴 선택 단계의 <code>취향까지 기록</code> 버튼은 메뉴 선택 여부에 따라 활성화돼요.</p>
    <div className="pl-usage-error-reference"><span className="pl-usage-reference-label">오류 · 실제 연결된 방식</span><h4>기록을 저장하지 못했어요</h4><p>iOS 시스템 <code>.alert</code>가 실패 사유와 <code>확인</code> 버튼을 표시해요. 저장 버튼 자체를 오류색으로 바꾸는 상태는 현재 없어요.</p><p className="pl-usage-note">시스템 경고창의 색은 iOS가 관리해요. 여기서는 경고창을 모사하지 않고 실제 제목과 처리 방식을 설명해요.</p></div>
    <details className="pl-usage-source"><summary>네이티브 구현 근거</summary><p><code>TBComponents.swift · PrimaryButton</code><br/><code>DiningView.swift · resultSplitCTA / saveFeedback / resultStage</code><br/>저장 실패 시 <code>diningPersistenceError</code>를 확인하고 <code>photoLoadError</code>로 경고창을 열어요. 사진 저장 실패와 기록 저장 실패의 제목도 구분해요.</p></details>
  </article>;
}

export default function ColorUsageExamples() {
  return <section className="pl-doc-section pl-color-usage" id="color-usage-examples" aria-labelledby="color-usage-title">
    <h2 id="color-usage-title">제품에서 색이 쓰이는 모습</h2>
    <p className="pl-usage-intro">iOS의 홈·미각 선택·기록 저장에서 필요한 부분을 크게 살펴봐요. SwiftUI 컴포넌트와 현재 토큰을 바탕으로 만든 문서용 색상 예시예요.</p>
    <div className="pl-usage-scope"><span>iOS · 라이트</span><p>제품의 라이트 값을 그대로 표시해요. 문서의 다크 배경과 별개이며, 제품 다크 모드나 Android의 동일 동작을 뜻하지 않아요.</p></div>
    <NativeHomeExample />
    <NativeTasteExample />
    <NativeSaveExample />
  </section>;
}
