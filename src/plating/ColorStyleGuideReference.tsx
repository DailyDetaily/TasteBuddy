import { useState } from "react";
import { COLOR_GUIDE_MIGRATION, COLOR_GUIDE_TINT_STEPS, colorGuideTastes } from "./colorStyleGuideData";
import { COLOR_TOKENS_BY_MODE, TASTE_ROLE_STEPS_BY_MODE } from "../constants/colorModes";
import { useColorMode } from "./ColorModeReference";
import "./color-style-guide.css";

function Swatch({ value, label }: { value: string; label?: string }) {
  return <figure className="pl-color-atomic-swatch"><i style={{ background: value }} aria-hidden="true" /><figcaption>{label && <span>{label}</span>}<code>{value}</code></figcaption></figure>;
}

export function AtomicColorReference() {
  const { mode } = useColorMode();
  const tastes = colorGuideTastes(mode);
  const colors = COLOR_TOKENS_BY_MODE[mode];
  const neutrals = [...new Set(Object.values(colors).flatMap(group => Object.values(group)).filter(value => /^#[\da-f]{6}$/i.test(value) && value.slice(1,3) === value.slice(3,5) && value.slice(3,5) === value.slice(5,7)))].sort((a,b) => parseInt(b.slice(1),16) - parseInt(a.slice(1),16));
  const states = (['success', 'warning', 'destructive'] as const).map(name => ({ name, text: colors.state[`${name}Text`], main: colors.state[name], surface: colors.state[`${name}Soft`] }));
  return <div className="pl-color-guide pl-color-atomic">
    <h3>{mode === 'dark' ? '다크 미각 기본색' : '미각 원색'}</h3>
    <div className="pl-color-atomic-grid">{tastes.map(t => <Swatch key={t.id} value={t.main} label={t.label} />)}</div>
    <h3>{mode === 'dark' ? '차콜 혼합 · #1C1C1C' : '흰색 혼합 · #FFFFFF'}</h3>
    <p className="plfd-note">숫자 = 기준색 비율 · 80% = 미각색 20% + 기준색 80% · 불투명</p>
    {tastes.map(t => <div className="pl-color-atomic-scale" key={t.id}><h4>{t.label}</h4><div className="pl-color-guide-scale">{COLOR_GUIDE_TINT_STEPS.map(step => <figure key={step}><i style={{background:t.tints[step]}} aria-hidden="true" /><figcaption><span>{step}%</span><code>{t.tints[step]}</code></figcaption></figure>)}</div></div>)}
    <h3>미각 글자색</h3>
    <div className="pl-color-atomic-grid">{tastes.map(t => <Swatch key={t.id} value={t.tintSurfaceText} label={t.label} />)}</div>
    <div className="pl-color-atomic-grid">{tastes.map(t => <Swatch key={t.id} value={t.tintSurfaceSubText} />)}</div>
    <h3>뉴트럴</h3>
    <div className="pl-color-atomic-grid is-neutral">{neutrals.map(value => <Swatch key={value} value={value} />)}</div>
    <h3>상태 팔레트</h3>
    <div className="pl-color-atomic-grid is-state">{states.flatMap((s, i) => [s.text,s.main,s.surface].map((value,index) => <Swatch key={s.name+index} value={value} label={["Green","Amber","Red"][i]+" / "+["Text","Accent","Surface"][index]} />))}</div>
  </div>;
}

export function TasteSemanticReference() {
  const { mode } = useColorMode();
  const tastes = colorGuideTastes(mode);
  const steps = TASTE_ROLE_STEPS_BY_MODE[mode];
  const [selected, setSelected] = useState("sour");
  const taste = tastes.find(t => t.id === selected)!;
  const rows = [
    ["main", "{taste}/main", "강조", taste.main],
    ["tintSurface", `{taste}/tint/${steps.tintSurface}`, "배경", taste.tintSurface],
    ["chartTrack", `{taste}/tint/${steps.chartTrack}`, "그래프 트랙", taste.chartTrack],
    ["border/subtle", `{taste}/tint/${steps.borderSubtle}`, "기본 표면 위 약한 경계", taste.borderSubtle],
    ["border/default", `{taste}/tint/${steps.borderDefault}`, "채워진 카드·칩·탭 경계", taste.borderDefault],
    ["border/strong", `{taste}/tint/${steps.borderStrong}`, "강한 경계 · 선택·추천", taste.borderStrong],
    ["border/accent", "{taste}/main", "강조색 경계 · 아웃라인", taste.borderAccent],
    ["tintSoft", `{taste}/tint/${steps.tintSoft}`, "옅은 채움 호환 역할", taste.tintSoft],
    ["tintSurfaceText", "{taste}/tintSurfaceText", "배경 위 글자", taste.tintSurfaceText],
    ["tintSurfaceSubText", "{taste}/tintSurfaceSubText", "보조 글자", taste.tintSurfaceSubText],
  ];
  return <div className="pl-color-guide">
    <div className="pl-color-guide-picker" role="group" aria-label="미각 역할 예시 선택">{tastes.map(t => <button type="button" key={t.id} aria-pressed={t.id===selected} onClick={() => setSelected(t.id)}><i style={{background:t.main}} aria-hidden="true" />{t.label}</button>)}</div>
    <div className="pl-color-guide-migration" role="region" aria-label="미각 역할 연결표" tabIndex={0}><table><thead><tr><th scope="col">역할</th><th scope="col">Atomic</th><th scope="col">용도·현재 값</th></tr></thead><tbody>{rows.map(([role,ref,use,value]) => <tr key={role}><th scope="row"><code>{role}</code></th><td><code>{ref}</code></td><td><i className="pl-color-role-dot" style={{background:value}} aria-hidden="true" />{use}<code className="pl-color-role-value">{value}</code></td></tr>)}</tbody></table></div>
    <div className="pl-color-guide-reading" style={{background:taste.tintSurface,color:taste.tintSurfaceText}}><span>{taste.label} · 배경 + 글자</span><strong>{taste.contrast.toFixed(2)}:1</strong></div>
  </div>;
}

export function ColorStyleMigration() {
  return <div className="pl-color-guide"><div className="pl-color-guide-migration" role="region" aria-label="기존 TB 컬러 비교" tabIndex={0}><table><thead><tr><th scope="col">항목</th><th scope="col">이전</th><th scope="col">현재 기준</th></tr></thead><tbody>{COLOR_GUIDE_MIGRATION.map(row => <tr key={row.subject}><th scope="row">{row.subject}</th><td>{row.legacy}</td><td>{row.decision}</td></tr>)}</tbody></table></div></div>;
}
