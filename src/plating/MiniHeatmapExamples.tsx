import MiniHeatmap, { miniHeatmapColor } from '../components/system/plating/MiniHeatmap';
import './mini-chart-examples.css';

/** Fixed synthetic data, shared with the Figma specimen. */
export const heatmapExampleValues = Array.from({ length: 31 }, (_, i) => {
  const value = (i * 17 + Math.floor(i / 7) ** 2 * 3 + Math.floor(i / 11) * 5) % 19;
  return value < 6 ? 0 : value < 11 ? 1 : value < 15 ? 2 : value < 18 ? 3 : 4;
});

export function MiniHeatmapSpecimens() {
  return <div className="pl-mini-specimens">
    <div className="pl-mini-specimen" style={{ width: 164, padding: 16 }}>
      <span>미니 히트맵 · 한달</span>
      <MiniHeatmap values={heatmapExampleValues} startDay={3} label="2026년 10월 1–31일 합성 기록량. 한 칸은 하루, 가로 월–일, 세로 주차." />
      <small>10월 1–31일 · 한 칸 = 하루</small>
    </div>
  </div>;
}

export default function MiniHeatmapExamples({ thumbnail = false }: { thumbnail?: boolean }) {
  if (thumbnail) return <MiniHeatmap values={heatmapExampleValues} startDay={3} />;
  return <div className="pl-mini-examples">
    <MiniHeatmapSpecimens />
    <div className="pl-donut-legend">{[0, 1, 2, 3, 4].map(level => <span key={level}>
      <i style={{ background: miniHeatmapColor(level), borderRadius: 2 }} />{level === 4 ? '4개 이상' : `${level}개`}
    </span>)}</div>
    <p className="pl-mini-caption">합성 기록 · 가로 월–일, 세로 주차 · 기록이 많을수록 진한 색</p>
  </div>;
}
