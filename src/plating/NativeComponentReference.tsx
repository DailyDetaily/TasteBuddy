import type { CatalogComponent } from "./catalog";
import { nativeComponentAudit, nativeAuditKindLabels } from "./nativeComponentAudit";
import captureData from "./nativeAuditCaptures.json";
import { NativeAnatomy, NativePropertyBoards, NativeStateBoard, nativeCaptureLabel } from "./NativeVisualDocumentation";

type Capture = { id: string; state: string; file: string; width: number; height: number; origin?: "user-profile-screen" };
const captures = captureData as Record<string, Capture[]>;
const defaultCaptureLabels: Record<string, string> = {
  "bottom-sheet": "Auto · 본문과 푸터", dialog: "Stack · 두 행동", "search-field": "검색 셸 · 빈 입력",
  "top-bar": "Solid · 제목과 뒤로", "back-button": "TopAppBar · 뒤로", "bottom-tab": "홈 활성 · 중앙 기록",
  avatar: "정적 참고 견본", checkbox: "정적 참고 견본", radio: "정적 참고 견본", switch: "정적 참고 견본", progress: "정적 참고 견본",
  "wheel-picker": "프로필 편집 · 1995년 1월 1일",
  "taste-graph": "보고 강도 · 0과 결측 포함", "taste-bloom": "합성 프로필", "notification-badge": "읽지 않은 알림 점",
  "empty-state": "행동과 아이콘 포함", toast: "되돌리기 포함", chip: "일반·선택형",
};
const calloutCaptureLabels: Record<string, string> = { actionable: "전체 클릭", dismissible: "닫기", positive: "성공", warning: "주의", critical: "오류", large: "큰 글자 · 접근성 2" };
const captureLabel = (id: string, state: string) => state === "default" ? defaultCaptureLabels[id] ?? "기본"
  : id === "callout" ? (calloutCaptureLabels[state] ?? nativeCaptureLabel(id, state))
  : id === "textarea" ? (state === "large" ? "큰 글자 · 접근성 2" : nativeCaptureLabel(id, state))
  : state === "leap-day" ? "윤년 말일"
  : state === "no-count" ? "숫자 없음"
  : state === "disabled" ? "비활성"
  : id === "primary-button" ? "Compact"
  : id === "text-input" ? "입력됨"
  : id === "taste-chip" ? "값 0 포함" : "선택";

export function NativeComponentThumbnail({ id, label }: { id: string; label: string }) {
  const capture = captures[id]?.[0];
  return capture ? <img className="pl-native-thumbnail" src={`/plating/native-component-audit/${capture.file}`}
    alt="" loading="lazy" width={capture.width * 3} height={capture.height * 3} />
    : <span className="pl-native-thumbnail-label">{label}<small>iOS 사용처 소스 확인</small></span>;
}

export default function NativeComponentReference({ component, idPrefix = "" }: { component: CatalogComponent; idPrefix?: string }) {
  const audit = nativeComponentAudit[component.id];
  if (!audit) return null;
  const images = captures[component.id] ?? [];
  const hasGuide = component.guide?.platform === "ios";
  return <div className="pl-native-reference" data-native-component={component.id} data-platform="ios">
    <section className="pl-doc-section" id={`${idPrefix}native-audit`}>
      <h2>iOS 구현 확인</h2>
      <p className="pl-native-type"><span>{nativeAuditKindLabels[audit.kind]}</span><code>{audit.nativeType}</code></p>
      <p>{audit.specs}</p>
      <div className="pl-native-differences"><h3>대조 결과</h3><ul>
        {audit.differences.map(text => <li key={text}>{text}</li>)}
      </ul></div>
      <p className="pl-guide-caption">{audit.reviewedAt ?? "2026.10.01"} · SwiftUI 선언과 사용처를 대조했어요. 동작·VoiceOver·실기기 확인 범위는 캡처와 별개예요.</p>
      {audit.figmaNodeID && <a className="pl-inline-link" href={`https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=${audit.figmaNodeID.replace(":", "-")}`} target="_blank" rel="noreferrer">iOS 컴포넌트 Figma ↗</a>}
    </section>
    <section id={`${idPrefix}preview`} className="pl-doc-section">
      <h2>실제 iOS 렌더</h2>
      {images.length > 0 ? <>
        <details className="pl-native-capture-originals"><summary>실제 SwiftUI 캡처 원본 {images.length}개 보기</summary><div className="pl-native-captures">{images.map(capture => <figure key={capture.file}>
          <a href={`/plating/native-component-audit/${capture.file}`} target="_blank" rel="noreferrer">
            <img src={`/plating/native-component-audit/${capture.file}`} alt={`${component.korean} · iOS ${captureLabel(component.id, capture.state)}`}
              loading="lazy" width={capture.width * 3} height={capture.height * 3} />
          </a>
          <figcaption>{captureLabel(component.id, capture.state)}</figcaption>
        </figure>)}</div></details>
        <p className="pl-guide-caption">{images.some(image => image.origin === "user-profile-screen") ? "사용자가 제공한 iOS 26.5 프로필 편집 화면에서 생년월일 선택창만 잘라낸 캡처예요. 원본 402pt 화면의 362 × 368pt 카드이며, 선택값은 1995년 1월 1일이에요. 제스처·저장은 이 캡처로 검증하지 않아요." : <>iOS 26.5 시뮬레이터에서 실제 SwiftUI 타입을 렌더한 독립 예제예요. 합성 문구·고정값을 사용했어요. {images.some(image => image.state === "large") ? "기본 글자와 별도로 표시한 큰 글자 표본을 구분해요." : "기본 글자 크기의 표본이에요."} 부모 영역은 390pt이며 캡처는 원본 비율로 표시해요. 제스처·화면 전환·저장은 이 이미지로 검증하지 않아요.</>}</p>
      </> : <p className="pl-native-no-capture">{audit.kind === "missing"
        ? "현재 독립 iOS 타입이 없어 네이티브 렌더를 제공하지 않아요."
        : "이 항목은 실제 사용처의 소스를 대조했어요. 사용처 전체를 실행한 캡처는 아직 없어요."}</p>}
    </section>
    {!hasGuide && <>
      <section className="pl-doc-section" id={`${idPrefix}anatomy`}><h2>Anatomy <span className="pl-heading-translation">구조</span></h2><NativeAnatomy component={component} /><p>{audit.behavior}</p></section>
      <section className="pl-doc-section" id={`${idPrefix}properties`}><h2>iOS 속성</h2>
        <NativePropertyBoards component={component} idPrefix={idPrefix} />
        <div className="pl-property-table-wrap" role="region" aria-label="iOS 속성 표" tabIndex={0}><table className="pl-property-table">
          <caption className="pl-sr">{component.name}의 iOS 속성과 계약</caption>
          <thead><tr><th scope="col">속성</th><th scope="col">기본값 또는 계약</th></tr></thead>
          <tbody>{audit.properties.map(([name,value]) => <tr key={name}><th scope="row"><code>{name}</code></th><td>{value}</td></tr>)}</tbody>
        </table></div>
      </section>
      <section className="pl-doc-section" id={`${idPrefix}states`}><h2>iOS 상태</h2>
        <NativeStateBoard component={component} />
        <div className="pl-property-table-wrap" role="region" aria-label="iOS 상태 표" tabIndex={0}><table className="pl-property-table">
          <caption className="pl-sr">{component.name}의 실제 iOS 상태</caption>
          <thead><tr><th scope="col">상태</th><th scope="col">표현과 책임</th></tr></thead>
          <tbody>{audit.states.map(([name,value]) => <tr key={name}><th scope="row">{name}</th><td>{value}</td></tr>)}</tbody>
        </table></div>
      </section>
      <section className="pl-doc-section" id={`${idPrefix}usage`}><h2>사용 규칙</h2><p>{audit.productUsage ?? component.usage}</p><p>{audit.behavior}</p></section>
      <section className="pl-doc-section" id={`${idPrefix}specs`}><h2>iOS 규격</h2><p>{audit.specs}</p></section>
      <section className="pl-doc-section" id={`${idPrefix}access`}><h2>확인 범위</h2><p>속성·배치·상태는 현재 소스에서 확인한 내용이에요. 시스템 메뉴, 키보드, VoiceOver, 글자 확대, 실제 실행·복귀는 해당 사용 화면에서 추가 확인이 필요해요.</p></section>
    </>}
  </div>;
}
