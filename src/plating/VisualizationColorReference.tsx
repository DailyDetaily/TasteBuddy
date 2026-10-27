import { useState } from 'react';
import { useColorMode } from './ColorModeReference';
import { TASTE_IDS, TASTE_TOKENS, TASTE_MAIN_COLORS_BY_MODE, type TasteId } from '../constants/designTokens';
import { DATA_VIZ_COLOR_ROLES, dataVizColors, EFFECT_TOKENS_BY_MODE, EFFECT_STYLE_NAMES, effectCSSValue, MEASUREMENT_PALETTES_BY_MODE, NEUTRAL_TASTE_PALETTES_BY_MODE } from '../constants/colorModes';
import HexRadarChart from '../components/system/HexRadarChart';
import TasteCircularLoop from '../components/graphics/TasteCircularLoop';

export default function VisualizationColorReference() {
  const { mode } = useColorMode();
  const [axis, setAxis] = useState<TasteId>('sweet');
  const measurement = MEASUREMENT_PALETTES_BY_MODE[mode][axis];
  const viz = dataVizColors(mode);
  return <div className="pl-color-guide pl-visualization-colors">
    <div className="pl-color-guide-picker" role="group" aria-label="측정 색상 예시 선택">{TASTE_IDS.map(id => <button key={id} type="button" aria-pressed={axis === id} onClick={() => setAxis(id)}><i style={{ background:TASTE_MAIN_COLORS_BY_MODE[mode][id] }} />{TASTE_TOKENS[id].label}</button>)}</div>
    <div className="pl-viz-live" data-tb-theme={mode}>
      <div><HexRadarChart colorMode={mode} myTasteData={TASTE_IDS.map((id,index) => ({label:TASTE_TOKENS[id].label,score:[70,50,35,80,60,45][index],averageScore:50}))} /><span>레이더 · 예시 데이터</span></div>
      <div><TasteCircularLoop colorMode={mode} activeLevel={6} ariaLabel={`${TASTE_TOKENS[axis].label} 6단계 색상 예`} {...measurement.loop} /><span>측정 루프 · 6단계 예시</span></div>
    </div>
    <h3>시각화 역할</h3>
    <div className="pl-viz-swatches">{Object.entries(viz).map(([role,value]) => <figure key={role}><i style={{background:value}} /><figcaption><strong>{role}</strong><code>{value}</code><code>{DATA_VIZ_COLOR_ROLES[role as keyof typeof DATA_VIZ_COLOR_ROLES].css}</code></figcaption></figure>)}</div>
    <h3>미각 측정 단계</h3>
    {TASTE_IDS.map(id => {
      const p=MEASUREMENT_PALETTES_BY_MODE[mode][id];
      return <details className="pl-color-guide-details" key={id} open={axis === id} onToggle={event => { if(event.currentTarget.open && axis !== id) setAxis(id); }}>
        <summary>{TASTE_TOKENS[id].label} · 10단계</summary>
        <div className="pl-color-guide-scale">{p.loop.nodeColors.map((value,index) => <figure key={index}><i style={{background:value}} /><figcaption><span>{index+1}</span><code>{value}</code></figcaption></figure>)}</div>
        <div className="pl-viz-swatches">{Object.entries({accent:p.accent,textColor:p.textColor,...Object.fromEntries(Object.entries(p.loop).filter(([key])=>key!=='nodeColors'))}).map(([role,value]) => <figure key={role}><i style={{background:String(value)}} /><figcaption><strong>{role}</strong><code>{String(value)}</code></figcaption></figure>)}</div>
      </details>;
    })}
    <h3>중립 미각</h3>
    <div className="pl-viz-swatches">{Object.entries(NEUTRAL_TASTE_PALETTES_BY_MODE[mode]).map(([role,value]) => <figure key={role}><i style={{background:value}} /><figcaption><strong>{role}</strong><code>{value}</code></figcaption></figure>)}</div>
    <h3>그림자와 블러</h3>
    <div className="pl-effect-grid" data-tb-theme={mode}>{Object.entries(EFFECT_TOKENS_BY_MODE[mode]).map(([key,effects]) => <figure key={key}><div style={{boxShadow:effectCSSValue(effects),backdropFilter:effects.some(e=>e.type==='BACKGROUND_BLUR')?'blur(12px)':undefined}}><span>{key}</span></div><figcaption>{EFFECT_STYLE_NAMES[key]}</figcaption></figure>)}</div>
    <p>단계색은 측정 순서를 보조합니다. 단계 숫자와 현재 위치를 함께 표시하고, 사진·브랜드 그래픽은 고정 색을 유지합니다.</p>
  </div>;
}
