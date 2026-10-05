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
import { fontReady } from "../fonts";
import { HomePeriodInsightCard } from "./HomePeriodInsightCard";
import { CardTasteChangeGraph } from "./CardTasteChangeGraph";
import { TasteChangeCard } from "./TasteChangeCard";
import { periodCardPose, periodTiming } from "./motion";
import { cardIdentity, type HomePeriodMotionProps } from "./settings";

export const HomePeriodInsightMotion: React.FC<HomePeriodMotionProps> = (
  props,
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [fontHandle] = useState(() =>
    delayRender("HomePeriodInsightCard Pretendard"),
  );
  useEffect(() => {
    fontReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);
  const timing = periodTiming(props, fps);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: props["배경 색"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        aria-label="HomePeriodInsightCard 모션 · 예시 데이터"
        style={{
          width: 362,
          display: "flex",
          flexDirection: "column",
          gap: props["카드 간격"],
          transform: `scale(${props["화면 배율"]})`,
        }}
      >
        {props.카드.map((card, index) => {
          const pose = periodCardPose(frame, index, props, fps);
          return (
            <div key={index} style={{ perspective: 900 }}>
              <Sequence
                name={`${index + 1} · ${cardIdentity[card.종류].label}`}
                layout="none"
              >
                <div
                  data-card-motion={index}
                  data-graph-progress={pose.graph}
                  data-start-frame={index * timing.stagger}
                  style={{
                    visibility: pose.visible ? "visible" : "hidden",
                    transform: `rotateX(${pose.rotateX}deg)`,
                    transformOrigin: "center center",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {card.종류 === "tasteChange" && card["가로 그래프"] ? (
                    <TasteChangeCard
                      title={card.제목}
                      sectionLabel={card.섹션명 || "미각 변화"}
                      period={card.기간}
                      keywords={card.키워드}
                      rows={card["가로 그래프"]}
                      progress={pose.graph}
                    />
                  ) : (
                    <HomePeriodInsightCard
                      kind={card.종류}
                      title={card.제목}
                      detail={card.설명}
                      chartValues={card.기록}
                      labelOverride={card.섹션명 || undefined}
                      accentAxis={card.미각 === "기본" ? undefined : card.미각}
                      graphProgress={pose.graph}
                      showsDetailAction
                      graphContent={
                        card["가로 그래프"]?.some(
                          (row) => row.기록.length > 0,
                        ) ? (
                          <CardTasteChangeGraph
                            rows={card["가로 그래프"]}
                            progress={pose.graph}
                          />
                        ) : undefined
                      }
                    />
                  )}
                </div>
              </Sequence>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
