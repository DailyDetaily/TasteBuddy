import { useEffect, useId, useState, type CSSProperties } from "react";
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
import { LINE_METRICS, linePose, lineTiming } from "./line-motion";
import {
  pointOnRoundedTrack,
  roundedLineTrack,
  roundedTrackWindow,
} from "./rounded-line-track";
import type { TasteChangeGraphProps } from "./line-settings";

export type TasteChangeGraphScene = {
  poses: (Omit<ReturnType<typeof linePose>, "endpoint"> & {
    endpoint?: ReturnType<typeof linePose>["endpoint"];
  })[];
  starts: number[];
  rowHeight?: number;
  rowStep?: number;
  endpointOpacities?: number[];
  gradientStarts?: number[];
  svgStyle?: CSSProperties;
  phase?: string;
};

export const TasteChangeGraphView: React.FC<{
  graph: TasteChangeGraphProps;
  scene?: TasteChangeGraphScene;
  embedded?: boolean;
}> = ({ graph: props, scene, embedded = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const id = useId().replace(/:/g, "");
  const [handle] = useState(() => delayRender("미각 변화 그래프 Pretendard"));
  useEffect(() => {
    fontReady.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
  const timing = lineTiming(props, fps);
  const labelWidth = props["라벨 표시"] ? 76 : 0;
  const inset = embedded ? 0 : 12;
  const viewWidth = LINE_METRICS.width + inset * 2 + labelWidth;
  const rowHeight = scene?.rowHeight ?? LINE_METRICS.rowHeight;
  const rowStep = scene?.rowStep ?? rowHeight + LINE_METRICS.rowGap;
  const viewHeight =
    (props.데이터.length - 1) * rowStep + rowHeight + inset * 2;
  const scale = embedded
    ? 1
    : Math.min(
        (width * 0.8) / viewWidth,
        (height * (scene?.rowHeight ? 0.8 : 0.6)) / viewHeight,
      );
  const summary = props.데이터
    .map(
      (row) =>
        `${row.미각}: ${row.기록.length ? row.기록.join(" → ") : "비교 기록 없음"}`,
    )
    .join("; ");

  const Container = embedded ? "div" : AbsoluteFill;
  return (
    <Container
      style={{
        display: "flex",
        flexShrink: 0,
        backgroundColor: props["배경 색"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        width={viewWidth * scale}
        height={viewHeight * scale}
        role="img"
        aria-label={`미각 변화 가로 그래프 모션 예시. ${summary}`}
        data-graph="taste-change"
        data-frame={frame}
        data-motion-phase={scene?.phase}
        style={{
          display: "block",
          fontFamily: "Pretendard, sans-serif",
          ...scene?.svgStyle,
        }}
      >
        <title>미각 변화 카드의 가로 그래프 · 합성 예시 데이터</title>
        {props.데이터.map((row, index) => {
          const pose =
            scene?.poses[index] ?? linePose(frame, index, props, fps);
          const taste =
            TASTE_IDS.find((taste) => TASTE_TOKENS[taste].label === row.미각) ??
            "umami";
          const palette = TASTE_TOKENS[taste].palette;
          const empty = pose.state === "empty";
          const main = empty ? "#888888" : palette.main;
          const tint = empty
            ? "rgba(136,136,136,0.12)"
            : palette.tintSoftBorder;
          const coreId = `${id}-core-${index}`,
            trackId = `${id}-track-${index}`;
          const pending = pose.state === "pending";
          const from =
            scene?.starts[index] ??
            (props.재생 === "정지"
              ? 0
              : timing.padding + index * timing.stagger);
          const track = roundedLineTrack(pose.track, LINE_METRICS.nodeRadius);
          const exitProgress =
            "exitProgress" in pose ? Number(pose.exitProgress) : 0;
          const startDistance = !pending ? track.length * exitProgress : 0;
          const endDistance =
            track.length *
            (pending && exitProgress > 0 ? 1 - exitProgress : pose.progress);
          const d = track.path;
          const window = roundedTrackWindow(
            track.length,
            startDistance,
            endDistance,
          );
          const endpoint = pending
            ? pose.endpoint
            : pointOnRoundedTrack(track, endDistance);
          return (
            <Sequence
              key={index}
              from={from}
              layout="none"
              name={`${index + 1} · ${row.미각} 가로 그래프`}
            >
              <g
                transform={`translate(${inset + labelWidth},${inset + index * rowStep})`}
                opacity={scene ? undefined : pose.opacity}
                style={
                  scene && pose.opacity === 0 ? { display: "none" } : undefined
                }
                data-line-index={index}
                data-state={pose.state}
                data-progress={pose.progress}
              >
                <defs>
                  <linearGradient
                    id={coreId}
                    gradientUnits="userSpaceOnUse"
                    x1={
                      scene?.gradientStarts?.[index] ??
                      (pending || empty ? 6 : pose.offset)
                    }
                    x2={pending || empty ? 126 : pose.offset + pose.graphWidth}
                    y1={12}
                    y2={12}
                  >
                    {pending ? (
                      <>
                        <stop offset="0" stopColor={main} />
                        <stop offset="0.6" stopColor={tint} />
                        <stop offset="1" stopColor={main} stopOpacity={0} />
                      </>
                    ) : (
                      <>
                        <stop
                          offset="0"
                          stopColor={empty ? "rgba(136,136,136,0.25)" : tint}
                        />
                        <stop offset="1" stopColor={main} />
                      </>
                    )}
                  </linearGradient>
                  <linearGradient
                    id={trackId}
                    gradientUnits="userSpaceOnUse"
                    x1={6}
                    x2={126}
                    y1={12}
                    y2={12}
                  >
                    <stop offset="0" stopColor={tint} />
                    <stop offset="0.45" stopColor={tint} />
                    <stop offset="1" stopColor={tint} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {pose.visible.length > 1 && (
                  <>
                    <path
                      data-mark="track"
                      d={d}
                      {...window}
                      fill="none"
                      stroke={pending ? `url(#${trackId})` : tint}
                      strokeWidth={LINE_METRICS.trackWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {pose.visible.some(
                      (point) =>
                        point.x !== pose.visible[0].x ||
                        point.y !== pose.visible[0].y,
                    ) && (
                      <path
                        data-mark="core"
                        d={d}
                        {...window}
                        fill="none"
                        stroke={`url(#${coreId})`}
                        strokeWidth={LINE_METRICS.coreWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </>
                )}
                {pose.opacity > 0 && pose.endpoint && endpoint && (
                  <circle
                    data-mark="endpoint"
                    cx={endpoint.x}
                    cy={endpoint.y}
                    r={LINE_METRICS.nodeRadius}
                    fill={main}
                    opacity={scene?.endpointOpacities?.[index] ?? 1}
                  />
                )}
                {props["라벨 표시"] && (
                  <>
                    <text
                      x={-labelWidth}
                      y={14 + (rowHeight - LINE_METRICS.rowHeight) / 2}
                      fontSize={11}
                      fontWeight={500}
                      fill={main}
                    >
                      {row.미각}
                    </text>
                    {pose.state !== "history" && (
                      <text
                        x={-labelWidth}
                        y={23 + (rowHeight - LINE_METRICS.rowHeight) / 2}
                        fontSize={5}
                        fill="#888888"
                      >
                        {empty ? "비교 기록 없음" : "기록 대기"}
                      </text>
                    )}
                  </>
                )}
              </g>
            </Sequence>
          );
        })}
      </svg>
    </Container>
  );
};
