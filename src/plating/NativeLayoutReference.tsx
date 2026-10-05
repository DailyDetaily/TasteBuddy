import { useId, useState } from "react";
import {
  layoutScreenGuides,
  layoutSpacingMeasurements,
  nativeLayoutCaptures,
  nativeLayoutRegion,
  type LayoutRect,
  type NativeLayoutCapture,
} from "./nativeLayoutReferenceData";
import "./native-layout-reference.css";

type Screen = NativeLayoutCapture["screen"];
type Guide = (typeof layoutScreenGuides)[number];
type CaptureState = "large" | "accessibility2" | "keyboard";
type Annotation = Guide["regions"][number] & {
  number: number;
  frame: LayoutRect;
  labelY: number;
  side: "left" | "right";
};

const CAPTION = "실제 iOS 화면 · 문서용 합성 데이터";
const STATE_LABELS: Record<CaptureState, string> = {
  large: "기본 · Large",
  accessibility2: "접근성 · AX2",
  keyboard: "키보드 열림",
};

function captureFor(screen: Screen, state: CaptureState = "large") {
  return nativeLayoutCaptures.find(capture =>
    capture.screen === screen
    && capture.dynamicType === (state === "accessibility2" ? "accessibility2" : "large")
    && capture.keyboardVisible === (state === "keyboard"),
  );
}

function guideFor(screen: Screen) {
  return layoutScreenGuides.find(guide => guide.id === screen);
}

function points(value: number) {
  return `${Number(value.toFixed(1))}pt`;
}

function validRect(rect: LayoutRect | undefined): rect is LayoutRect {
  return !!rect && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
    && rect.width > 0 && rect.height > 0;
}

function captureAnnotations(capture: NativeLayoutCapture, guide?: Guide): Annotation[] {
  const annotations = (guide?.regions ?? []).flatMap((region, index) => {
    const frame = nativeLayoutRegion(capture, region.key);
    if (!validRect(frame) || frame.y >= capture.height || frame.y + frame.height <= 0) return [];
    if (capture.screen === "sheet" && capture.keyboardVisible && region.key !== "keyboard") {
      if (capture.keyboardFrame && frame.y >= capture.keyboardFrame.y) return [];
      const header = nativeLayoutRegion(capture, "sheet-header");
      if (region.key === "auth-primary-action" && header && frame.y + frame.height <= header.y) return [];
    }
    return [{
      ...region,
      number: index + 1,
      frame,
      labelY: Math.max(18, Math.min(capture.height - 18, frame.y + frame.height / 2)),
      side: frame.x + frame.width / 2 < capture.width * 0.45 ? "left" as const : "right" as const,
    }];
  });
  const ordered = [...annotations].sort((a, b) => a.labelY - b.labelY);
  for (let index = 1; index < ordered.length; index += 1) {
    ordered[index].labelY = Math.max(ordered[index].labelY, ordered[index - 1].labelY + 32);
  }
  if (ordered.length) {
    ordered[ordered.length - 1].labelY = Math.min(ordered[ordered.length - 1].labelY, capture.height - 18);
    for (let index = ordered.length - 2; index >= 0; index -= 1) {
      ordered[index].labelY = Math.min(ordered[index].labelY, ordered[index + 1].labelY - 32);
    }
  }
  return annotations;
}

function CaptureUnavailable() {
  return <p className="plnl-empty" role="status">이 상태의 iOS 캡처를 준비하고 있어요.</p>;
}

function ScreenChoices({ value, onChange, includesSheet = true }: {
  value: Screen;
  onChange: (screen: Screen) => void;
  includesSheet?: boolean;
}) {
  return <div className="plnl-screen-choices" role="group" aria-label="살펴볼 화면">
    {layoutScreenGuides.filter(guide => includesSheet || guide.id !== "sheet").map(guide =>
      <button type="button" key={guide.id} aria-pressed={value === guide.id} onClick={() => onChange(guide.id)}>
        {guide.title}
      </button>,
    )}
  </div>;
}

function SourceDetails({ guide }: { guide?: Guide }) {
  if (!guide?.sources.length) return null;
  return <details className="plnl-sources">
    <summary>네이티브 구현 근거</summary>
    <ul>{guide.sources.map(source => <li key={source}><code>ios/TasteBuddy/{source}</code></li>)}</ul>
  </details>;
}

function NativeCapture({ capture, guide, annotated = false, title, crop }: {
  capture?: NativeLayoutCapture;
  guide?: Guide;
  annotated?: boolean;
  title?: string;
  crop?: LayoutRect;
}) {
  const imageTitleId = useId();
  const imageDescriptionId = useId();
  if (!capture) return <CaptureUnavailable />;

  const annotations = annotated && !crop ? captureAnnotations(capture, guide) : [];
  const gutter = annotated ? 54 : 0;
  const viewBox = crop
    ? `${crop.x} ${crop.y} ${crop.width} ${crop.height}`
    : `${-gutter} 0 ${capture.width + gutter * 2} ${capture.height}`;
  const imageTitle = title ?? `${guide?.title ?? "제품"} · ${capture.keyboardVisible ? "키보드 열림" : STATE_LABELS[capture.dynamicType]}`;

  return <figure className={`plnl-capture${crop ? " plnl-capture-crop" : ""}`}>
    {title && <div className="plnl-capture-title"><strong>{title}</strong></div>}
    <svg
      className="plnl-capture-image"
      viewBox={viewBox}
      width={crop?.width ?? capture.width + gutter * 2}
      height={crop?.height ?? capture.height}
      role="img"
      aria-labelledby={imageTitleId}
      aria-describedby={imageDescriptionId}
    >
      <title id={imageTitleId}>{imageTitle}</title>
      <desc id={imageDescriptionId}>{CAPTION}{annotations.length ? ". 번호별 영역은 옆의 설명 목록에서 확인할 수 있어요." : ""}</desc>
      <image key={capture.id} href={`/plating/native-layout/${capture.file}?v=${capture.sha256.slice(0, 12)}`} x={0} y={0} width={capture.width} height={capture.height} />
      <g aria-hidden="true" className="plnl-annotations">
        {annotations.map(annotation => {
          const isLeft = annotation.side === "left";
          const anchorX = isLeft
            ? Math.max(0, annotation.frame.x) - 2
            : Math.min(capture.width, annotation.frame.x + annotation.frame.width) + 2;
          const anchorY = Math.max(2, Math.min(capture.height - 2, annotation.frame.y + annotation.frame.height / 2));
          const labelX = isLeft ? -31 : capture.width + 31;
          return <g key={annotation.key}>
            <line x1={anchorX} y1={anchorY - 4} x2={anchorX} y2={anchorY + 4} />
            <line x1={anchorX} y1={anchorY} x2={labelX + (isLeft ? 11 : -11)} y2={annotation.labelY} />
            <circle cx={labelX} cy={annotation.labelY} r={11} />
            <text x={labelX} y={annotation.labelY} textAnchor="middle" dominantBaseline="central">{annotation.number}</text>
          </g>;
        })}
      </g>
    </svg>
    <figcaption>
      <span>{CAPTION}</span>
      <small>{crop ? "카드 영역 확대" : `${points(capture.width)} × ${points(capture.height)}`}</small>
    </figcaption>
  </figure>;
}

function RegionLegend({ capture, guide }: { capture?: NativeLayoutCapture; guide?: Guide }) {
  if (!capture || !guide) return null;
  const annotations = captureAnnotations(capture, guide);
  return <ol className="plnl-legend" aria-label="화면 영역 설명">
    {annotations.map(annotation => <li key={annotation.key}>
      <span className="plnl-number" aria-hidden="true">{annotation.number}</span>
      <div>
        <h4><span className="plnl-sr-only">{annotation.number}. </span>{annotation.label}</h4>
        <p>{annotation.note}</p>
        <small>{points(annotation.frame.width)} × {points(annotation.frame.height)}</small>
      </div>
    </li>)}
  </ol>;
}

export function NativeLayoutReference() {
  const [screen, setScreen] = useState<Screen>("home");
  const [state, setState] = useState<CaptureState>("large");
  const [original, setOriginal] = useState(false);
  const selectId = useId();
  const guide = guideFor(screen);
  const capture = captureFor(screen, state);
  const states: CaptureState[] = screen === "sheet" ? ["large", "keyboard"] : ["large", "accessibility2"];

  return <div className="plnl-root">
    <div className="plnl-toolbar">
      <ScreenChoices value={screen} onChange={value => { setScreen(value); setState("large"); }} />
      <div className="plnl-display-controls">
        <label htmlFor={selectId}>화면 상태</label>
        <select id={selectId} value={state} onChange={event => setState(event.target.value as CaptureState)}>
          {states.map(value => <option key={value} value={value} disabled={!captureFor(screen, value)}>
            {screen === "sheet" && value === "large" ? "키보드 닫힘" : STATE_LABELS[value]}
          </option>)}
        </select>
        <button type="button" aria-pressed={original} onClick={() => setOriginal(value => !value)}>원본 보기</button>
      </div>
    </div>
    {guide && <div className="plnl-heading"><h3>{guide.title}</h3><p>{guide.description}</p></div>}
    <div className={`plnl-anatomy${original ? " is-original" : ""}`}>
      <NativeCapture capture={capture} guide={guide} annotated={!original} />
      <RegionLegend capture={capture} guide={guide} />
    </div>
    {screen === "sheet" && state === "keyboard" && <KeyboardFinding />}
    <p className="plnl-note">캡처한 화면의 영역과 간격을 보여줘요. 스크롤 위치와 글자 크기에 따라 배치는 달라질 수 있어요.</p>
    <SourceDetails guide={guide} />
  </div>;
}

export function NativeLayoutDynamicReference() {
  const [screen, setScreen] = useState<Screen>("home");
  const guide = guideFor(screen);
  return <div className="plnl-root">
    <ScreenChoices value={screen} onChange={setScreen} includesSheet={false} />
    <div className="plnl-comparison">
      <NativeCapture capture={captureFor(screen, "large")} guide={guide} title="기본 · Large" />
      <NativeCapture capture={captureFor(screen, "accessibility2")} guide={guide} title="접근성 · AX2" />
    </div>
    <p className="plnl-note">{screen === "home"
      ? "홈의 본문은 글자 크기에 따라 높이가 늘어나요. 현재 132pt 고정 높이의 인사이트 카드는 AX2에서 하단 안내가 잘려요. 카드 높이와 말줄임은 추가 개선이 필요한 상태예요."
      : "식사 기록은 큰 글자에서 질문·설명·메뉴 카드가 여러 줄로 늘어나고 하단 행동 영역은 유지돼요. 이 표본은 목록의 처음 위치이며 마지막 항목까지의 스크롤 조작은 별도 확인이 필요해요."}</p>
    <SourceDetails guide={guide} />
  </div>;
}

export function NativeLayoutKeyboardReference() {
  const guide = guideFor("sheet");
  return <div className="plnl-root">
    <div className="plnl-comparison">
      <NativeCapture capture={captureFor("sheet", "large")} guide={guide} title="키보드 닫힘" />
      <NativeCapture capture={captureFor("sheet", "keyboard")} guide={guide} title="키보드 열림" />
    </div>
    <KeyboardFinding />
    <SourceDetails guide={guide} />
  </div>;
}

function KeyboardFinding() {
  const closed = captureFor("sheet", "large");
  const open = captureFor("sheet", "keyboard");
  const actionBefore = closed?.frames["auth-primary-action"];
  const actionAfter = open?.frames["auth-primary-action"];
  if (!open) return null;
  return <aside className="plnl-finding">
    <strong>현재 확인된 키보드 대응 문제</strong>
    <p>계정 연결 시트에서 입력칸이 키보드에 가려져요. 위로 이동한 버튼도 시트 경계 밖에서 잘려 보이지 않아요. 시트의 높이·이동·클리핑을 함께 개선해야 해요.</p>
    <dl><div><dt>키보드 높이</dt><dd>{open.keyboardFrame ? points(open.keyboardFrame.height) : "—"}</dd></div>
      <div><dt>버튼의 위쪽 이동</dt><dd>{actionBefore && actionAfter ? points(actionBefore.y - actionAfter.y) : "—"}</dd></div></dl>
  </aside>;
}

function cardCrop(capture: NativeLayoutCapture): LayoutRect | undefined {
  const frame = nativeLayoutRegion(capture, "home-card");
  if (!validRect(frame)) return undefined;
  const x = Math.max(0, frame.x - 12);
  const y = Math.max(0, frame.y - 12);
  const right = Math.min(capture.width, frame.x + frame.width + 12);
  const bottom = Math.min(capture.height, frame.y + frame.height + 12);
  if (right <= x || bottom <= y) return undefined;
  return { x, y, width: right - x, height: bottom - y };
}

export function NativeSpacingReference() {
  const capture = captureFor("home", "large");
  const guide = guideFor("home");
  const measurements = capture ? layoutSpacingMeasurements(capture) : [];
  return <div className="plnl-root">
    <div className="plnl-spacing-preview">
      <NativeCapture capture={capture} guide={guide} crop={capture ? cardCrop(capture) : undefined} />
    </div>
    {capture && <div className="plnl-table-scroll" role="region" aria-label="홈 화면의 실측 간격과 소스 규격" tabIndex={0}>
      <table>
        <caption>홈 화면의 간격 · 실측과 소스 규격</caption>
        <thead><tr><th scope="col">구간</th><th scope="col">토큰</th><th scope="col">소스 규격</th><th scope="col">실측</th><th scope="col">설명</th></tr></thead>
        <tbody>{measurements.map((measurement, index) => <tr key={`${measurement.label}-${index}`}>
          <th scope="row">{measurement.label}</th>
          <td><code>{measurement.token}</code></td>
          <td>{measurement.expected}</td>
          <td>{typeof measurement.actual === "number" && Number.isFinite(measurement.actual)
            ? points(measurement.actual)
            : <span aria-label="실측값 없음">—</span>}</td>
          <td>{measurement.note}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    <p className="plnl-note">실측값은 위 화면에서 측정한 pt 단위의 간격이에요.</p>
    <SourceDetails guide={guide} />
  </div>;
}
