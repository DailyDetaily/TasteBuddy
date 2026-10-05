import { TasteChangeGraphView } from "../GraphMotion/TasteChangeGraph";
import {
  referenceGeometry,
  referenceRowHeight,
  referenceRowStep,
} from "../GraphMotion/reference-motion";
import type { ReferenceLineProps } from "../GraphMotion/reference-settings";
import { trimLine } from "../GraphMotion/line-motion";

export type TasteChangeRows = ReferenceLineProps["데이터"];

export const cardTasteChangeLayout = (rows: TasteChangeRows) => {
  const graph: ReferenceLineProps = {
    재생: "정지",
    "높낮이 배율": 1,
    "시작 대기": 0.36,
    "진입 시간": 1.04,
    "행 간 지연": 0,
    "유지 시간": 0.84,
    "끝 여백": 0.44,
    "배경 색": "transparent",
    "라벨 표시": false,
    "첫 기록 대기선": true,
    데이터: rows.filter((row) => row.기록.length > 0),
  };
  const rowHeight = referenceRowHeight(graph);
  const rowStep = referenceRowStep(graph);
  return {
    graph,
    rowHeight,
    rowStep,
    height: Math.max(0, graph.데이터.length - 1) * rowStep + rowHeight,
    centers: graph.데이터.map((_, index) => {
      const ys = referenceGeometry(graph, index).track.map((point) => point.y);
      return index * rowStep + (Math.min(...ys) + Math.max(...ys)) / 2;
    }),
  };
};

// Native TasteLineChart: 24pt rows + 4pt spacing, unamplified shared domain.
// Card timing owns entrance/exit; the standalone graph remains unchanged.
export const CardTasteChangeGraph: React.FC<{
  rows: TasteChangeRows;
  progress: number;
}> = ({ rows, progress }) => {
  const { graph, rowHeight, rowStep } = cardTasteChangeLayout(rows);
  const data = graph.데이터;
  if (!data.length) return null;
  const growth = Math.max(0, Math.min(1, progress));
  const poses = data.map((_, index) => {
    const geometry = referenceGeometry(graph, index);
    const visible = trimLine(geometry.track, growth);
    return {
      ...geometry,
      progress: growth,
      visible,
      opacity: growth > 0 ? 1 : 0,
      endpoint:
        geometry.state === "pending"
          ? geometry.points[0]
          : visible[visible.length - 1],
    };
  });
  return (
    <TasteChangeGraphView
      embedded
      graph={graph}
      scene={{
        poses,
        starts: data.map(() => 0),
        rowHeight,
        rowStep,
        phase: growth >= 1 ? "holding" : "drawing",
      }}
    />
  );
};
