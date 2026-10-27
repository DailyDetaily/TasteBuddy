import { useId } from "react";
import type { CatalogComponent } from "./catalog";
import { getComponentDocumentation } from "./componentDocumentation";
import { nativeComponentAudit } from "./nativeComponentAudit";
import captureData from "./nativeAuditCaptures.json";
import visualBounds from "./nativeVisualBounds.json";
import "./native-visual-documentation.css";

type Capture = { id: string; state: string; file: string; width: number; height: number };
const captures = captureData as Record<string, Capture[]>;
type Part = [name: string, x: number, y: number];
type AnatomyBounds = { x: number; y: number; width: number; height: number };
export const anatomyNumberStyle = { color: "#FFFFFF", backgroundColor: "#505159", borderColor: "#505159" };
export function AnatomyAnnotations({ labels, markerId, left = 195, top = 115, width = 390, height = 160, contentBounds, partBounds }: { labels: Part[]; markerId: string; left?: number; top?: number; width?: number; height?: number; contentBounds?: AnatomyBounds; partBounds?: AnatomyBounds[] }) {
  const bounds = contentBounds ?? { x: left, y: top, width, height };
  const dotRadius = 2.5;
  const gap = 1.5 + dotRadius;
  const points = labels.slice(0, 6).map(([name, px, py], index) => ({ name, index, x: left + width * px, y: top + height * py }));
  const topPoints = points.filter(p => p.index === 0 || p.index === 2).sort((a, b) => a.x - b.x);
  const bottomPoints = points.filter(p => p.index === 3 || p.index === 4).sort((a, b) => a.x - b.x);
  const numberX = (point: typeof points[number], group: typeof points) => group.length === 2 && group[1].x - group[0].x < 40
    ? (group[0].x + group[1].x) / 2 + (group.indexOf(point) === 0 ? -20 : 20) : point.x;
  return <g id={markerId}>
    {points.map(p => {
      const targetBounds = partBounds?.[p.index] ?? bounds;
      let x: number, y: number, endX = p.x, endY = p.y;
      if (topPoints.includes(p)) {
        x = numberX(p, topPoints); endY = Math.min(p.y - gap, targetBounds.y - gap); y = Math.max(20, endY - 44);
      } else if (bottomPoints.includes(p)) {
        x = numberX(p, bottomPoints); endY = Math.max(p.y + gap, targetBounds.y + targetBounds.height + gap); y = Math.min(410, endY + 44);
      } else {
        const isLeft = p.index === 1;
        endX = isLeft ? Math.min(p.x - gap, targetBounds.x - gap) : Math.max(p.x + gap, targetBounds.x + targetBounds.width + gap);
        x = endX + (isLeft ? -44 : 44); y = p.y;
      }
      const length = Math.hypot(endX - x, endY - y);
      const startX = x + (endX - x) * 13 / length;
      const startY = y + (endY - y) * 13 / length;
      return <g key={`${p.name}-${p.index}`} className="pl-native-anatomy-pointer">
        <path d={`M${startX} ${startY} L${endX} ${endY}`} fill="none" />
        <circle cx={endX} cy={endY} r={dotRadius} fill="currentColor" />
        <circle cx={x} cy={y} r={13} fill="currentColor" />
        <text className="pl-native-anatomy-number" x={x} y={y} textAnchor="middle" dominantBaseline="central">{p.index + 1}</text>
      </g>;
    })}
  </g>;
}
const parts: Record<string, Part[]> = {
  callout: [["Container", .92, .32], ["Prefix Icon · 선택", .11, .5], ["Title · 선택", .194, .43], ["Description", .51, .43], ["Link Text · 선택", .25, .56]],
  "primary-button": [["Button Container", .9, .35], ["Label", .5, .5]],
  "icon-button": [["Touch Area", .54, .42], ["Icon", .5, .5]],
  "text-input": [["Input Container", .9, .4], ["Label · 선택", .14, .31], ["Value / Placeholder", .3, .5], ["Helper / Error · 선택", .3, .66]],
  "inline-error": [["Input Container", .9, .4], ["Label", .14, .31], ["Value", .3, .5], ["Error Text", .3, .66]],
  "search-field": [["Search Shell", .84, .18], ["TextField", .35, .09], ["Submit Button", .73, .09], ["Cancel", .84, .09], ["Results Slot", .45, .24]],
  "selection-card": [["Button Container", .91, .33], ["Indicator", .1, .5], ["Title", .36, .45], ["Description · 선택", .4, .58]],
  chip: [["Chip Surface", .58, .27], ["Label", .5, .32], ["Selectable Chip", .5, .62]],
  checkbox: [["Indicator", .33, .5], ["Label", .53, .5]],
  radio: [["Options", .66, .38], ["Radio Indicator", .1, .4], ["Label", .2, .4]],
  switch: [["Track", .52, .5], ["Thumb", .53, .5]],
  "top-bar": [["TopAppBar", .88, .44], ["Leading Control", .08, .5], ["Title", .5, .5], ["Actions", .87, .5]],
  "back-button": [["Leading Control", .08, .5], ["Back Icon", .08, .5]],
  "bottom-tab": [["Navigation Bar", .9, .4], ["Destination", .12, .53], ["Create Action", .5, .46], ["Label", .13, .61]],
  "step-indicator": [["Step Group", .55, .5], ["Current Step", .48, .5], ["Other Steps", .54, .5]],
  card: [["Card Surface", .92, .32], ["Media Slot", .12, .5], ["Heading", .36, .43], ["Metadata · 선택", .4, .58]],
  "expandable-card": [["Card Surface", .91, .35], ["Square Media", .16, .37], ["Header", .56, .33], ["Body · 펼침", .55, .67]],
  "stack-card": [["Front Card", .5, .35], ["Decorative Stack", .5, .78], ["Stack Toggle", .9, .32]],
  "list-row": [["Row", .9, .4], ["Title", .16, .5], ["Value", .84, .5], ["Chevron · 선택", .9, .5]],
  badge: [["Badge Surface", .57, .43], ["Label", .5, .5]],
  "tcs-badge": [["Weighted Gradient", .52, .52], ["Label", .5, .5]],
  avatar: [["Avatar", .55, .4], ["Initials", .5, .5]],
  divider: [["Divider", .5, .5], ["Content Above", .5, .37], ["Content Below", .5, .63]],
  toast: [["Toast Surface", .91, .33], ["Icon", .1, .5], ["Title", .35, .43], ["Message · 선택", .4, .57], ["Action · 선택", .84, .5]],
  "empty-state": [["Content Group", .68, .52], ["Icon · 선택", .5, .34], ["Title", .5, .44], ["Description", .5, .5], ["Action · 선택", .5, .62]],
  progress: [["Track", .87, .5], ["Value", .4, .5]],
  "bottom-sheet": [["Sheet Container", .93, .5], ["Grabber", .5, .28], ["Header", .5, .33], ["Content Slot", .5, .44], ["Footer Slot", .5, .65]],
  dialog: [["Overlay Card", .88, .43], ["Title", .5, .42], ["Description", .5, .46], ["Actions", .5, .55]],
  "taste-chip": [["Capsule Surface", .55, .37], ["Label", .49, .37], ["Value · 선택", .56, .63]],
  "sensory-bubble": [["Sensory Bubble", .5, .5]],
  "taste-bloom": [["Bloom Shape", .5, .35], ["Taste Layers", .5, .5]],
  "dining-result": [["Result Content", .5, .5]],
  "interpretation-card": [["Card Surface", .91, .31], ["Accent", .08, .6], ["Eyebrow", .19, .36], ["Description", .4, .53], ["Supporting Text", .42, .68], ["Detail Label", .85, .36]],
  "taste-graph": [["Chart", .8, .5], ["Axes", .5, .3], ["Reported Values", .5, .5]],
  textarea: [["TextEditor", .5, .5]],
  select: [["Label", .2, .28], ["Value", .35, .5], ["Chevron", .88, .5], ["Message", .4, .7]],
  "capsule-tabs": [["Group", .85, .36], ["Option", .26, .5], ["Selected option", .27, .5]],
  "text-action": [["Button", .68, .5], ["Label", .5, .5]],
  "icon-action-button": [["Action Button", .46, .5], ["Icon", .44, .5], ["Count · 선택", .63, .5]],
  "record-actions": [["Save", .45, .5], ["Bookmark", .55, .5]],
  "social-actions": [["Like", .38, .5], ["Comment", .5, .5], ["Share", .62, .5]],
  "notification-badge": [["Notification Button", .72, .5], ["Unread Dot", .74, .44]],
  skeleton: [["Placeholder Group", .81, .5], ["Placeholder Lines", .5, .42]],
  "image-frame": [["Image Area", .87, .35], ["Image / Fallback", .5, .5]],
  disclosure: [["DisclosureGroup", .9, .35], ["Label", .3, .5], ["Chevron", .9, .5], ["Content · 펼침", .5, .68]],
  "scope-label": [["Text", .5, .5]],
  "chip-group": [["Layout Group", .84, .4], ["Tag Slot", .35, .5], ["Overflow Slot", .73, .5]],
  "flow-loading": [["Content Group", .65, .45], ["ProgressView", .5, .42], ["Message", .5, .62]],
  "flow-retry": [["Content Group", .76, .5], ["Heading", .3, .39], ["Message", .3, .45], ["Retry Button", .5, .57]],
  "action-area": [["CTA Area", .9, .52], ["Step Indicator", .5, .3], ["Step Label · 선택", .5, .36], ["Primary Button", .5, .8]],
  "date-picker": [["DatePicker", .5, .5]],
  "wheel-picker": [["Header", .45, .18], ["System DatePicker", .5, .50], ["Close", .85, .18], ["Apply", .5, .80]],
  menu: [["Menu Trigger", .5, .5]],
};

export function nativeVisualParts(component: CatalogComponent): Part[] {
  if (nativeComponentAudit[component.id]?.kind === "missing") return getComponentDocumentation(component.id).anatomy.map(([name], index) => [name, .5, .3 + index * .12]);
  return parts[component.id] ?? [[nativeComponentAudit[component.id]?.nativeType ?? component.name, .5, .5]];
}
const imageURL = (capture: Capture) => `/plating/native-component-audit/${capture.file}`;
export function nativeCaptureLabel(id: string, state: string) {
  if (id === "tcs-badge") return ({ default: "두 가지 맛", single: "단색", triple: "세 가지 맛", empty: "빈 데이터", disabled: "비활성", dark: "Dark · 두 가지 맛" } as Record<string,string>)[state] ?? state;
  if (id === "stack-card") return state === "expanded" ? "스택 펼침 · 질문 나열" : "스택 쌓임";
  if (id === "expandable-card") return state === "expanded" ? "본문 펼침 · 답변 예제" : "본문 접힘";
  const labels: Record<string, string> = { default: "기본", "leap-day": "윤년 말일", "no-count": "숫자 없음", disabled: "비활성", actionable: "전체 클릭", dismissible: "닫기", informative: "정보", positive: "성공", warning: "주의", critical: "오류", large: "큰 글자", intrinsic: "내용 너비", tint: "미각색", "visual-disabled": "조건 안내", busy: "처리 중 조합", auth: "Auth", error: "오류", anatomy: "구조 · 보조 링크", value: "값 포함", neutral: "중립", unchecked: "미선택", off: "Off", first: id === 'radio' ? '첫 항목 선택' : '첫 단계', last: "마지막 단계", analysis: "나의 입맛", dining: "다이닝", profile: "프로필", checkbox: "Checkbox", "single-line": "Single Line", plain: id === 'toast' ? 'Text Only' : '정보 행', "size-xs": "XS", "size-sm": "SM", "size-md": "MD", "size-32": "32pt", "size-48": "48pt", "size-64": "64pt", "variant-soft": "Soft", "variant-outline": "Outline", "variant-solid": "Solid", "variant-text": "Text", "appearance-default": "Default", "appearance-solid": "Solid", "appearance-transparent": "Transparent", "appearance-glass": "Glass", "usage-home": "홈 · Transparent + 프로필·기본 액션" };
  return state === "selected" ? id === "primary-button" ? "Compact" : ["text-input", "textarea"].includes(id) ? "입력됨" : "선택" : labels[state] ?? state;
}

function SourceStructure({ component }: { component: CatalogComponent }) {
  const audit = nativeComponentAudit[component.id];
  const labels = nativeVisualParts(component);
  return <div className="pl-native-source-diagram"><strong>{audit.kind === "missing" ? component.name : audit.nativeType}</strong><div>{labels.map(([name], index) => <span key={`${name}-${index}`}><b>{index + 1}</b>{name}</span>)}</div></div>;
}

export function NativeAnatomy({ component }: { component: CatalogComponent }) {
  const markerId = `anatomy-${useId().replaceAll(':', '')}`;
  const sample = captures[component.id]?.find(c => c.state === "anatomy")
    ?? (component.id === "expandable-card" ? captures[component.id]?.find(c => c.state === "expanded") : undefined)
    ?? captures[component.id]?.[0];
  const labels = nativeVisualParts(component);
  const height = sample ? Math.min(sample.height, 260) : 160;
  const width = sample ? sample.width * height / sample.height : 390;
  const left = (780 - width) / 2;
  const top = 115;
  const sourceBounds = sample ? (visualBounds as Record<string, AnatomyBounds>)[sample.file] : undefined;
  const scale = sample ? width / sample.width : 1;
  // Display bounds contain 8pt of blank padding; annotations use the visible edge.
  const contentBounds = sourceBounds ? { x: left + (sourceBounds.x + 8) * scale, y: top + (sourceBounds.y + 8) * scale, width: (sourceBounds.width - 16) * scale, height: (sourceBounds.height - 16) * scale } : undefined;
  // Logical bounds measured from the current native captures, in legend order.
  const measuredParts = component.id === "callout" ? [
    [20, 47.33, 350, 65.67], [35.33, 72, 16.34, 16.33], [65.67, 63.67, 22.33, 12.33],
    [96.33, 63.67, 197.67, 12], [65, 84.67, 63.33, 13],
  ] : component.id === "card" ? [
    [20, 48, 350, 64], [36, 64, 32, 32], [83.67, 65.33, 64, 12.33], [84, 85, 74, 10.33],
  ] : undefined;
  const partBounds = measuredParts?.map(([x, y, w, h]) => ({ x: left + x * scale, y: top + y * scale, width: w * scale, height: h * scale }));
  return <figure className="pl-native-anatomy">
    {sample ? <div className="pl-native-anatomy-scroll" role="region" aria-label={`${component.name} Anatomy 도해`} tabIndex={0}><svg viewBox="0 0 780 430" role="img" aria-label={`${component.name}의 부품: ${labels.map(([name]) => name).join(', ')}`}>
      <image href={imageURL(sample)} x={left} y={top} width={width} height={height} />
      <AnatomyAnnotations {...{ labels, markerId, left, top, width, height, contentBounds, partBounds }} />
    </svg></div> : <SourceStructure component={component} />}
    <figcaption>{sample ? "실제 SwiftUI 렌더에 부품 번호와 연결선을 표시했어요." : "현재 소스의 슬롯 구조를 표시한 도해예요. 실행 화면 캡처는 아니에요."}</figcaption>
    <ol className="pl-native-anatomy-parts">{labels.map(([name], index) => <li key={`${name}-${index}`}><span style={anatomyNumberStyle}>{index + 1}</span>{name}</li>)}</ol>
    {component.id === "callout" && captures.callout?.find(c => c.state === 'dismissible') && <div className="pl-native-anatomy-scroll" role="region" aria-label="Callout 끝 아이콘 도해" tabIndex={0}><svg viewBox="0 0 780 240" role="img" aria-label="닫기형의 끝 아이콘과 별도 닫기 터치 영역"><image href={imageURL(captures.callout.find(c => c.state === 'dismissible')!)} x={195} y={35} width={390} height={160} /><g className="pl-native-anatomy-pointer" ><path d="M581.33 115 L550.33 115" fill="none" /><circle cx={550.33} cy={115} r={2.5} fill="currentColor" /><circle cx={594.33} cy={115} r={13} fill="currentColor" /><text className="pl-native-anatomy-number" x={594.33} y={115} textAnchor="middle" dominantBaseline="central">6</text></g></svg></div>}
    {component.id === "callout" && <p className="pl-native-visual-note">6. Suffix Icon · 끝 아이콘은 전체 클릭형의 화살표 또는 닫기형의 44 × 44pt 닫기 버튼이에요. 보조 링크는 표시형에만 넣어요.</p>}
  </figure>;
}

type BoardRow = { state: string; label: string; note?: string };
type Board = { id: string; name: string; rows: BoardRow[]; note?: string };
const row = (state: string, label: string, note?: string): BoardRow => ({ state, label, note });
const boardMap: Record<string, Board[]> = {
  "stack-card": [{ id: "variants", name: "State", rows: [row("default", "스택 쌓임"), row("expanded", "스택 펼침 · 질문 나열", "본문이 접힌 카드 3개 · 카드 간격 12pt")] }],
  "expandable-card": [{ id: "variants", name: "State", rows: [row("default", "본문 접힘"), row("expanded", "본문 펼침 · 답변 예제")] }],
  "primary-button": [
    { id: "sizes", name: "Size", rows: [row("default", "Default", "최소 높이 48pt · 글자 14pt"), row("selected", "Compact", "최소 높이 40pt · 글자 12pt")] },
    { id: "layouts", name: "Layout", rows: [row("selected", "Full Width", "fullWidth = true"), row("intrinsic", "Content Width", "fullWidth = false · Compact")], note: "현재 PrimaryButton은 텍스트 레이블을 사용해요. 아이콘 전용 행동은 IconButton을 사용해요." },
    { id: "variants", name: "Variant", rows: [row("default", "Primary", "appearance = .primary"), row("tint", "Taste Tint", "appearance = .tasteTint(.sweet)")] },
  ],
  callout: [
    { id: "sizes", name: "Size", rows: [row("default", "Default", "최소 높이 50pt · 글자 14pt"), row("large", "Dynamic Type", "접근성 글자 크기 2 · 내용 높이 확장")] },
    { id: "layouts", name: "Interaction", rows: [row("default", "Display"), row("actionable", "Actionable"), row("dismissible", "Dismissible")] },
    { id: "variants", name: "Tone", rows: [row("default", "Neutral"), row("informative", "Informative"), row("positive", "Positive"), row("warning", "Warning"), row("critical", "Critical")] },
  ],
  "text-input": [{ id: "sizes", name: "Profile", rows: [row("default", "기본", "최소 48pt · 반경 12pt"), row("large", "큰 글자", "접근성 2")] }],
  chip: [{ id: "sizes", name: "Size", rows: [row("size-xs", "Extra Small", "글자 10pt"), row("size-sm", "Small", "글자 11pt"), row("size-md", "Medium", "글자 12pt")] }, { id: "variants", name: "Variant", rows: [row("variant-soft", "Soft"), row("variant-outline", "Outline"), row("variant-solid", "Solid"), row("variant-text", "Text")] }],
  "taste-chip": [{ id: "sizes", name: "Size", rows: [row("size-xs", "XS", "10pt"), row("size-sm", "SM", "11pt"), row("size-md", "MD", "12pt")] }, { id: "layouts", name: "Content", rows: [row("size-xs", "Label Only"), row("value", "Label + Value", "0도 표시해요")] }, { id: "variants", name: "Tone", rows: [row("size-xs", "Taste"), row("neutral", "Neutral")] }],
  avatar: [{ id: "sizes", name: "Size", rows: [row("size-32", "32pt"), row("size-48", "48pt", "기본"), row("size-64", "64pt")], note: "size는 수치를 직접 지정하는 속성이에요. 제품 아바타가 아닌 정적 참고 타입의 표본입니다." }],
  "top-bar": [{ id: "variants", name: "Appearance", rows: [row("appearance-default", "Default"), row("appearance-solid", "Solid"), row("appearance-transparent", "Transparent"), row("appearance-glass", "Glass", "40pt · 제목 캡슐·원형 버튼")] }, { id: "layouts", name: "Usage", rows: [row("usage-home", "홈", "Transparent · 프로필 + 알림·측정·메뉴. 검색창은 별도 조합")] }],
  "selection-card": [{ id: "layouts", name: "Layout", rows: [row("default", "Title + Description"), row("single-line", "Single Line", "최소 44pt")] }, { id: "variants", name: "Indicator", rows: [row("default", "Radio"), row("checkbox", "Checkbox")] }],
  "list-row": [{ id: "layouts", name: "Layout", rows: [row("plain", "Value Row"), row("default", "With Chevron"), row("large", "Large Text", "접근성 글자 크기 · 세로 배치")] }],
  toast: [{ id: "layouts", name: "Content", rows: [row("plain", "Text Only"), row("default", "With Action", "actionTitle + action")] }],
};

export function nativeVisualSections(id: string) {
  const images = captures[id] ?? [];
  const labels: Record<string, string> = { sizes: "Size · 크기", layouts: "Layout · 배치", variants: "Variant · 변형" };
  return (boardMap[id] ?? []).filter(board => board.rows.some(r => images.some(c => c.state === r.state))).map(board => ({ id: board.id, title: labels[board.id] }));
}

function Sample({ capture, label }: { capture: Capture; label: string }) {
  const bounds = (visualBounds as Record<string, { x: number; y: number; width: number; height: number }>)[capture.file];
  return bounds ? <svg className="pl-native-visual-sample" viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} role="img" aria-label={label} style={{ maxWidth: bounds.width }}><image href={imageURL(capture)} width={capture.width} height={capture.height} /></svg> : <img src={imageURL(capture)} alt={label} width={capture.width} height={capture.height} loading="lazy" />;
}

export function NativePropertyBoards({ component, idPrefix = "" }: { component: CatalogComponent; idPrefix?: string }) {
  const images = captures[component.id] ?? [];
  const configured = boardMap[component.id] ?? [];
  const boards = configured.map(board => ({ ...board, rows: board.rows.filter(r => images.some(c => c.state === r.state)) })).filter(board => board.rows.length);
  if (!boards.length) return <div className="pl-native-visual-contract"><h3>Size & Layout</h3><p>{nativeComponentAudit[component.id].specs}</p><p className="pl-native-visual-note">위 Anatomy와 아래 상태 표본에서 실제 구성을 확인할 수 있어요. 선택 가능한 옵션은 속성 표에 표시합니다.</p></div>;
  return <>{boards.map(board => <section className="pl-native-visual-property" id={`${idPrefix}${board.id}`} key={board.id}>
    <h3>{board.name}</h3>
    <div className="pl-native-property-board">{board.rows.map(r => <div className="pl-native-property-row" key={r.state}>
      <div className="pl-native-property-label"><span>{board.name}</span><strong>{r.label}</strong>{r.note && <small>{r.note}</small>}</div>
      <Sample capture={images.find(c => c.state === r.state)!} label={`${component.name} · ${board.name} ${r.label}`} />
    </div>)}</div>
    {board.note && <p className="pl-native-visual-note">{board.note}</p>}
  </section>)}</>;
}

export function NativeStateBoard({ component }: { component: CatalogComponent }) {
  const images = captures[component.id] ?? [];
  const states = images.filter(c => !c.state.startsWith('size-') && !c.state.startsWith('variant-') && !c.state.startsWith('appearance-') && !['usage-home', 'anatomy', 'auth', 'intrinsic', 'tint', 'value', 'neutral'].includes(c.state) && !(component.id === 'primary-button' && c.state === 'selected'));
  if (!states.length) return <p className="pl-native-visual-note">상태별 실제 iOS 캡처가 없는 항목이에요. 현재 사용처의 상태 계약은 아래 표에서 확인할 수 있어요.</p>;
  return <div className="pl-native-state-board">{states.map(c => <figure key={c.file}><span className="pl-native-state-tag">{nativeCaptureLabel(component.id, c.state)}</span><Sample capture={c} label={`${component.name} · ${nativeCaptureLabel(component.id, c.state)}`} /></figure>)}</div>;
}
