import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  COMPONENT_TOKENS,
  TASTE_IDS,
  TASTE_TOKENS,
} from "../../../src/constants/designTokens";
import { barPose, barTiming } from "./motion";
import type { BarGraphProps } from "./settings";

/** Motion specimen of MiniChart; settled geometry comes from the product. */
export const BarGraph: React.FC<BarGraphProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const plot = COMPONENT_TOKENS.miniChart;
  const timing = barTiming(props, fps);
  const taste =
    TASTE_IDS.find((id) => TASTE_TOKENS[id].label === props.색상) ?? "umami";
  const palette = TASTE_TOKENS[taste].palette;
  const scale = Math.min(
    props["확대 배율"],
    (width * 0.9) / plot.width,
    (height * 0.9) / plot.height,
  );
  const summary = props.데이터
    .map(
      (point) =>
        `${point.항목}: ${point.값 === null ? "미확인" : `${point.값}개`}`,
    )
    .join(", ");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: props["배경 색"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox={`0 0 ${plot.width} ${plot.height}`}
        width={plot.width * scale}
        height={plot.height * scale}
        role="img"
        aria-label={`미니 막대 모션 · 합성 요리 기록 수. ${summary}`}
        data-graph="mini-bar"
        data-frame={frame}
        style={{ display: "block" }}
      >
        <title>미니 막대 그래프 · 실제 계정과 연결되지 않은 합성 견본</title>
        {props.데이터.map((point, index) => {
          const pose = barPose(frame, index, props, fps);
          return (
            <Sequence
              key={index}
              name={`${index + 1} · ${point.항목 || "막대"}`}
              from={
                props.재생 === "정지"
                  ? 0
                  : timing.start + index * timing.stagger
              }
              layout="none"
            >
              <g
                data-bar-index={index}
                data-value={point.값 ?? "missing"}
                data-progress={pose.progress}
                opacity={pose.opacity}
              >
                {pose.height > 0 && (
                  <>
                    <rect
                      data-mark="capsule"
                      x={pose.x}
                      y={pose.y}
                      width={pose.width}
                      height={pose.height}
                      rx={pose.radius}
                      fill={palette.chartTrack}
                    />
                    {pose.endpoint && (
                      <circle
                        data-mark="endpoint"
                        cx={pose.x + pose.width / 2}
                        cy={pose.y + pose.radius}
                        r={pose.radius}
                        fill={palette.main}
                      />
                    )}
                  </>
                )}
              </g>
            </Sequence>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
