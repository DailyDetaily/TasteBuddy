import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COMPONENT_TOKENS } from "../../../src/constants/designTokens";
import { fontReady } from "../fonts";
import { HomePeriodInsightCard } from "../HomePeriodInsightMotion/HomePeriodInsightCard";
import { BarGraph } from "../GraphMotion/BarGraph";
import { MiniLineGraphView } from "../GraphMotion/MiniLineGraph";
import { MiniAreaGraphView } from "../GraphMotion/MiniAreaGraph";
import { MiniStackedBarGraphView } from "../GraphMotion/MiniStackedBarGraph";
import { MiniGroupedBarGraphView } from "../GraphMotion/MiniGroupedBarGraph";
import { MiniBubbleGraphView } from "../GraphMotion/MiniBubbleGraph";
import { MiniPieGraphView } from "../GraphMotion/MiniPieGraph";
import { MiniTreemapGraphView } from "../GraphMotion/MiniTreemapGraph";
import { MiniHeatmapGraphView } from "../GraphMotion/MiniHeatmapGraph";
import {
  barExample,
  lineExample,
  areaExample,
  groupedExample,
  stackedExample,
  bubbleExample,
  pieExample,
  treemapExample,
  heatmapExample,
  summaryCardExamples,
  type SummaryGraphKind,
} from "./catalog";
import { summaryGridCardPose, summaryGridTiming } from "./motion";
import {
  SUMMARY_CARD_WIDTH,
  SUMMARY_CARD_HEIGHT,
  SUMMARY_GRID_FPS,
  type SummaryCardGridProps,
} from "./settings";

const SummaryGraph = ({
  kind,
  frame,
  still,
}: {
  kind: SummaryGraphKind;
  frame: number;
  still: boolean;
}) => {
  const 재생 = still ? "정지" : "진입 후 유지";
  switch (kind) {
    case "bar":
      return <BarGraph {...barExample} 재생={재생} />;
    case "grouped":
      return (
        <MiniGroupedBarGraphView
          graph={{ ...groupedExample, 재생 }}
          frame={frame}
        />
      );
    case "stacked":
      return (
        <MiniStackedBarGraphView
          graph={{ ...stackedExample, 재생 }}
          frame={frame}
        />
      );
    case "line":
      return (
        <MiniLineGraphView
          graph={{ ...lineExample, 재생 }}
          frame={frame}
          fps={SUMMARY_GRID_FPS}
        />
      );
    case "area":
      return (
        <MiniAreaGraphView graph={{ ...areaExample, 재생 }} frame={frame} />
      );
    case "bubble":
      return (
        <MiniBubbleGraphView graph={{ ...bubbleExample, 재생 }} frame={frame} />
      );
    case "pie":
      return <MiniPieGraphView graph={{ ...pieExample, 재생 }} frame={frame} />;
    case "treemap":
      return (
        <MiniTreemapGraphView
          graph={{ ...treemapExample, 재생 }}
          frame={frame}
        />
      );
    case "heatmap":
      return (
        <MiniHeatmapGraphView
          graph={{ ...heatmapExample, 재생 }}
          frame={frame}
        />
      );
  }
};

export const SummaryCardGridMotion: React.FC<SummaryCardGridProps> = (
  props,
) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [fontHandle] = useState(() =>
    delayRender("Summary card grid Pretendard"),
  );
  useEffect(() => {
    fontReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);
  const timing = summaryGridTiming(props);
  const gap = props["카드 간격"];
  const gridWidth = SUMMARY_CARD_WIDTH * 3 + gap * 2;
  const gridHeight = SUMMARY_CARD_HEIGHT * 3 + gap * 2;
  const scale = Math.min(
    props["화면 배율"],
    (width - 160) / gridWidth,
    (height - 180) / gridHeight,
  );
  const still = props.재생 === "정지";
  const plot = COMPONENT_TOKENS.miniChart;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: props["배경 색"],
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      <div
        aria-label="요약 카드 미니 그래프 9종 · 합성 데이터"
        data-summary-grid
        style={{
          width: gridWidth,
          display: "grid",
          gridTemplateColumns: `repeat(3, ${SUMMARY_CARD_WIDTH}px)`,
          gridAutoRows: SUMMARY_CARD_HEIGHT,
          gap,
          transform: `scale(${scale})`,
        }}
      >
        {summaryCardExamples.map((card, index) => {
          const pose = summaryGridCardPose(frame, index, props);
          return (
            <div key={card.graph} style={{ perspective: 900 }}>
              <Sequence
                from={still ? 0 : index * timing.stagger}
                name={`${index + 1} · ${card.label}`}
                layout="none"
              >
                <div
                  data-summary-card={card.graph}
                  data-local-frame={pose.localFrame}
                  style={{
                    height: "100%",
                    visibility: pose.visible ? "visible" : "hidden",
                    transform: `rotateX(${pose.rotateX}deg)`,
                    transformOrigin: "center center",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <HomePeriodInsightCard
                    kind={card.kind}
                    category={card.category}
                    accentAxis={card.axis}
                    labelOverride={card.label}
                    title={card.title}
                    detail={card.detail}
                    chartValues={[]}
                    legend={card.legend}
                    showsDetailAction
                    style={{ height: SUMMARY_CARD_HEIGHT }}
                    graphContent={
                      <div
                        style={{
                          position: "relative",
                          width: plot.width,
                          height: plot.height,
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        <SummaryGraph
                          kind={card.graph}
                          frame={pose.localFrame}
                          still={still}
                        />
                      </div>
                    }
                  />
                </div>
              </Sequence>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
