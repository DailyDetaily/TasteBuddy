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
import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import { fontReady } from "../fonts";
import { barLayout, barPose, barTiming } from "./motion";
import type { BarGraphProps } from "./settings";

export const BarGraph: React.FC<BarGraphProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [fontHandle] = useState(() => delayRender("막대 그래프 Pretendard"));
  useEffect(() => {
    fontReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);
  const layout = barLayout(props);
  const timing = barTiming(props, fps);
  const taste =
    TASTE_IDS.find((id) => TASTE_TOKENS[id].label === props.색상) ?? "umami";
  const palette = TASTE_TOKENS[taste].palette;
  const scale = Math.min(
    (width * 0.8) / layout.viewWidth,
    (height * 0.74) / layout.viewHeight,
  );
  const summary = props.데이터
    .map(
      (point) =>
        `${point.항목} ${point.값 == null ? "미확인" : `${point.값}회`}`,
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
        viewBox={`0 0 ${layout.viewWidth} ${layout.viewHeight}`}
        width={layout.viewWidth * scale}
        height={layout.viewHeight * scale}
        role="img"
        aria-label={`막대 그래프 모션 예시. ${summary}`}
        data-graph="taste-bar"
        data-frame={frame}
        style={{
          display: "block",
          overflow: "visible",
          fontFamily: "Pretendard, sans-serif",
        }}
      >
        <title>기존 캡슐 막대 그래프 · 미리보기 예시 데이터</title>
        {props.데이터.map((point, index) => {
          const pose = barPose(frame, index, props, fps);
          const from =
            props.재생 === "정지" ? 0 : timing.padding + index * timing.stagger;
          return (
            <Sequence
              key={index}
              name={`${index + 1} · ${point.항목 || "막대"}`}
              from={from}
              layout="none"
            >
              <g
                data-bar-index={index}
                data-value={point.값 ?? "missing"}
                data-progress={pose.progress}
              >
                {pose.height > 0 && (
                  <>
                    <rect
                      data-mark="capsule"
                      x={pose.x - pose.width / 2}
                      y={pose.y}
                      width={pose.width}
                      height={pose.height}
                      rx={pose.radius}
                      ry={pose.radius}
                      fill={palette.tintSoftBorder}
                    />
                    {pose.endpointRadius > 0 && (
                      <circle
                        data-mark="endpoint"
                        cx={pose.x}
                        cy={pose.y + pose.endpointRadius}
                        r={pose.endpointRadius}
                        fill={palette.main}
                      />
                    )}
                  </>
                )}
                {props["수치와 라벨"] && (
                  <g opacity={pose.labelOpacity} textAnchor="middle">
                    <text
                      x={pose.x}
                      y={layout.top - 8}
                      fontSize={props.형태 === "홈 미니" ? 6 : 11}
                      fontWeight={500}
                      fill="#0F0F0F"
                      textLength={
                        String(point.값 ?? "—").length *
                          (props.형태 === "홈 미니" ? 6 : 11) *
                          0.6 >
                        layout.column
                          ? layout.column
                          : undefined
                      }
                      lengthAdjust="spacingAndGlyphs"
                    >
                      {point.값 == null ? "—" : point.값}
                    </text>
                    <text
                      x={pose.x}
                      y={layout.baseline + 16}
                      fontSize={layout.labelFontSize}
                      fill="#666666"
                    >
                      {layout.labelLines[index].map((line, lineIndex) => (
                        <tspan
                          key={lineIndex}
                          x={pose.x}
                          dy={lineIndex === 0 ? 0 : layout.labelFontSize * 1.35}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                )}
              </g>
            </Sequence>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
