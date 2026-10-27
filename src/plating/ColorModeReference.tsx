import { createContext, useContext, useState, type ReactNode } from 'react';
import { COLOR_TOKENS_BY_MODE, TASTE_PALETTES_BY_MODE } from '../constants/colorModes';
import { TASTE_IDS, TASTE_TINT_BASES, TASTE_TOKENS, type ColorMode } from '../constants/designTokens';
import { colorContrast } from './colorPairings';
import TasteChip from '../components/system/TasteChip';
import TasteTintCard from '../components/system/TasteTintCard';
import CapsuleButton from '../components/system/CapsuleButton';
import Chip from '../components/system/Chip';
import CapsuleTabs from '../components/system/plating/CapsuleTabs';
import { TASTE_TOKENS as UI_TASTE_TOKENS } from '../constants/uiColorTokens';
import { createUserTasteAccentStyle } from '../lib/userTasteAccent';
import './color-style-guide.css';

const ColorModeContext = createContext<{ mode: ColorMode; setMode: (mode: ColorMode) => void }>({ mode: 'light', setMode: () => {} });
export const useColorMode = () => useContext(ColorModeContext);

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'light' ? 'light' : 'dark');
  return <ColorModeContext.Provider value={{ mode, setMode }}>{children}</ColorModeContext.Provider>;
}

export function ColorModePicker() {
  const { mode, setMode } = useColorMode();
  return <div className="pl-color-mode-toolbar">
    <div className="pl-color-guide-picker" role="group" aria-label="컬러 모드">
      {(['light', 'dark'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'light' ? 'Light' : 'Dark'}</button>)}
    </div>
    <p>혼합 기준 <code>{TASTE_TINT_BASES[mode]}</code> · tint/80 = 미각색 20% + 기준색 80%</p>
  </div>;
}

export function ColorModeSpecimen({ mode }: { mode: ColorMode }) {
  const colors = COLOR_TOKENS_BY_MODE[mode];
  const [period, setPeriod] = useState('week');
  const [selected, setSelected] = useState(true);
  const accentStyle = createUserTasteAccentStyle({ tasteId: 'umami', label: '감칠맛', palette: UI_TASTE_TOKENS.umami.palette });
  return <article className="pl-color-mode-specimen" data-tb-theme={mode} aria-label={`${mode === 'dark' ? 'Dark' : 'Light'} 컬러 사용 예`}>
    <header><strong>{mode === 'dark' ? 'Dark' : 'Light'}</strong><span>{colors.background.page}</span></header>
    <div className="pl-color-mode-tastes">{TASTE_IDS.map(id => {
      const p = TASTE_PALETTES_BY_MODE[mode][id];
      return <div key={id} className="pl-color-mode-taste" style={{ background: p.tintSurface, color: p.tintSurfaceText }}>
        <div><strong>{TASTE_TOKENS[id].label}</strong><i aria-hidden="true" style={{ background: p.main }} /></div>
        <span style={{ color: p.tintSurfaceSubText }}>배경 위 글자</span>
        <div className="pl-color-mode-track" aria-hidden="true" style={{ background: p.chartTrack }}><i style={{ background: p.main }} /></div>
        <small>{colorContrast(p.tintSurfaceText, p.tintSurface).toFixed(2)}:1</small>
      </div>;
    })}</div>
    <div className="pl-color-mode-chips" style={{ background: colors.surface.card, padding: 16, borderRadius: 16 }}>
      <strong style={{ color: colors.text.primary, display: 'block', marginBottom: 12 }}>미각·뉴트럴 칩</strong>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TASTE_IDS.map(id => <TasteChip key={id} taste={TASTE_TOKENS[id].label} />)}
        <TasteChip taste="구운 향" tone="neutral" />
      </div>
    </div>
    <section className="pl-color-mode-ui" style={accentStyle} aria-label={`${mode} 공통 미각 채움 예시`}>
      <header><strong>같은 미각색 · 다른 UI</strong><span>채움 tint/{mode === 'light' ? 80 : 70}</span></header>
      <p>실제 웹 컴포넌트의 색상 표본이에요. 선택은 이 예시 안에서만 바뀌어요.</p>
      <div className="pl-color-mode-ui-parts">
        <TasteTintCard tasteId="umami" title="감칠맛 카드" description="옅은 채움과 읽기용 글자" detail="색상 표본" />
        <div className="pl-color-mode-ui-controls">
          <CapsuleButton appearance="tonal" aria-pressed={selected} onClick={() => setSelected(!selected)}>{selected ? '선택 해제' : '감칠맛 선택'}</CapsuleButton>
          <Chip kind="label" label="감칠맛" axis="umami" selected={selected} onClick={() => setSelected(!selected)} />
          <CapsuleTabs label={`${mode} 기간 선택 예시`} axis="umami" value={period} onValueChange={setPeriod} options={[{ value: 'week', label: '이번 주' }, { value: 'month', label: '이번 달' }]} />
        </div>
      </div>
    </section>
    <div className="pl-color-mode-controls">
      <span className="pl-color-mode-field">식사 메모를 남겨 보세요</span>
      <div><span className="pl-color-mode-primary">기록 완료</span><span className="pl-color-mode-disabled">비활성</span></div>
    </div>
    <div className="pl-color-mode-states">{(['success', 'warning', 'destructive'] as const).map((role, index) => <span key={role} style={{ background: colors.state[`${role}Soft`], color: colors.state[`${role}Text`] }}>{['✓ 저장 완료', '! 확인 필요', '× 저장 실패'][index]}</span>)}</div>
  </article>;
}

export function ColorModeComparison() {
  return <div className="pl-color-mode-comparison"><ColorModeSpecimen mode="light" /><ColorModeSpecimen mode="dark" /></div>;
}
