import type { CSSProperties } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { nativeColorForMode } from "../constants/colorModes";
import { useColorMode } from "./ColorModeReference";
import { colorContrast, documentedColorPairs, stateColorPairs } from "./colorPairings";

const stateIcons = [Info, Info, CircleCheck, TriangleAlert, CircleAlert];

export function StateColorExamples() {
  const { mode } = useColorMode();
  const nativeColor = (name: string) => nativeColorForMode(name, mode);
  return <>
    <div className="pl-color-state-pairs">{stateColorPairs.map((pair, index) => {
      const foreground = nativeColor(pair.foreground);
      const background = nativeColor(pair.background);
      const Icon = stateIcons[index];
      return <figure key={pair.name}>
        <figcaption><strong>{pair.name}</strong><span>{colorContrast(foreground, background).toFixed(2)}:1</span></figcaption>
        <div className="pl-color-message" style={{ color: foreground, background }}><Icon size={18} aria-hidden="true" /><span>{pair.message}</span></div>
        <small><code>{pair.background}</code> + <code>{pair.foreground}</code></small>
      </figure>;
    })}</div>
    <p className="plfd-note">일반 안내에는 neutralSoft, 추가 정보에는 informativeSoft를 사용해요. 비활성 여부는 disabledSurface와 textDisabled로 표현해요. 성공·주의 원색은 아이콘과 표시에, 작은 글자는 successText·warningText에 연결해요.</p>
  </>;
}

export function InteractionColorExamples() {
  const { mode } = useColorMode();
  const nativeColor = (name: string) => nativeColorForMode(name, mode);
  const style = {
    "--pl-example-page": nativeColor("page"), "--pl-example-surface": nativeColor("surface"), "--pl-example-text": nativeColor("textPrimary"),
    "--pl-example-primary": nativeColor("actionPrimary"), "--pl-example-on-primary": nativeColor("actionOnPrimary"),
    "--pl-example-selected": nativeColor("selectionSurface"), "--pl-example-on-selected": nativeColor("selectionText"),
    "--pl-example-focus": nativeColor("focusRing"), "--pl-example-hover": nativeColor("hoverOverlay"),
    "--pl-example-press": nativeColor("pressedOverlay"), "--pl-example-inverse-press": nativeColor("pressedInverseOverlay"),
  } as CSSProperties;
  return <>
    <div className="pl-color-interaction-grid" style={style}>
      {[
        ["primary", "주요 행동", "actionPrimary + actionOnPrimary"],
        ["selected", "선택", "selectionSurface + selectionText"],
        ["hover", "기본 표면 · 호버", mode === 'dark' ? "hoverOverlay · 흰색 6%" : "hoverOverlay · 검정 4%"],
        ["pressed", "기본 표면 · 누름", mode === 'dark' ? "pressedOverlay · 흰색 10%" : "pressedOverlay · 검정 6%"],
        ["inverse-pressed", "주요 행동 · 누름", mode === 'dark' ? "pressedInverseOverlay · 검정 8%" : "pressedInverseOverlay · 흰색 10%"],
        ["focus", "키보드·입력 초점", "focusRing"],
      ].map(([state, label, token]) => <figure key={state}><div className="pl-color-interaction-stage"><div className={`pl-color-control-sample is-${state}`}>기록 완료</div></div><figcaption><strong>{label}</strong><code>{token}</code></figcaption></figure>)}
    </div>
    <p className="plfd-note">누름과 호버는 기존 표면 위에 겹쳐요. 선택은 유지되는 상태이며, 초점은 현재 조작 위치를 표시해요. 색상 표본은 모션이나 실행 동작을 포함하지 않아요.</p>
  </>;
}

export function ContrastColorTable() {
  const { mode } = useColorMode();
  return <>
    <div className="pl-color-contrast-table" role="region" aria-label="글자와 배경 대비 표" tabIndex={0}><table>
      <caption>현재 토큰으로 계산한 작은 글자의 색 조합</caption>
      <thead><tr><th scope="col">용도</th><th scope="col">글자 / 배경</th><th scope="col">대비</th><th scope="col">4.5:1 기준</th></tr></thead>
      <tbody>{documentedColorPairs(mode).map(pair => {
        const contrast = colorContrast(pair.foreground, pair.background);
        return <tr key={pair.name}><th scope="row">{pair.name}</th><td><span className="pl-color-contrast-sample" style={{ color: pair.foreground, background: pair.background }}>가나다 123</span><code>{pair.foreground} / {pair.background}</code></td><td>{contrast.toFixed(2)}:1</td><td>{contrast >= 4.5 ? "통과" : "조정 필요"}</td></tr>;
      })}</tbody>
    </table></div>
    <p className="plfd-note">불투명한 단색의 sRGB 대비를 계산해요. 일반 작은 글자는 <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank" rel="noreferrer">WCAG 4.5:1 기준</a>을 적용해요. 사진·투명도·그라디언트 위에서는 최종 배경을 기준으로 확인하고, 실제 비활성 요소는 별도 기준으로 다뤄요.</p>
  </>;
}
