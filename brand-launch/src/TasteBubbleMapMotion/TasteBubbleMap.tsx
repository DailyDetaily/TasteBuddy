import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { TASTE_TOKENS } from "../../../src/constants/designTokens";
import { fontReady } from "../fonts";
import { FINALE } from "./finale";
import { MAP, bubbleLabelLines } from "./layout";
import {
  BUBBLE_FPS,
  INTRO_SECONDS,
  bubbleMapDuration,
  bubbleMapFrame,
} from "./motion";
import type { BubbleMapProps } from "./settings";

type TimelineLayer = {
  name: string;
  from: number;
  durationInFrames: number;
};

const timelineLayers = (props: BubbleMapProps): TimelineLayer[] => {
  const speed = props["재생 속도"];
  const frameAt = (sourceSeconds: number) =>
    Math.ceil((sourceSeconds * BUBBLE_FPS) / speed);
  const range = (
    name: string,
    sourceStart: number,
    sourceEnd: number,
  ): TimelineLayer => {
    const from = frameAt(sourceStart);
    return {
      name,
      from,
      durationInFrames: Math.max(1, frameAt(sourceEnd) - from),
    };
  };

  if (props.재생 === "대기 루프") {
    return [
      {
        name: "01 · 대기 루프",
        from: 0,
        durationInFrames: bubbleMapDuration(props),
      },
    ];
  }
  if (props.재생 === "모션 줄이기") {
    return [
      {
        name: "01 · 모션 줄이기",
        from: 0,
        durationInFrames: bubbleMapDuration(props),
      },
    ];
  }

  const atMain = (seconds: number) => INTRO_SECONDS + seconds;
  return [
    range("01 · 진입", 0, INTRO_SECONDS),
    range("02 · 오버뷰 이동", atMain(0), atMain(2.4)),
    range("03 · 1차 선택 · 짠맛", atMain(2.4), atMain(5.6)),
    range("04 · 2차 선택 · 감칠맛", atMain(5.6), atMain(8.8)),
    range("05 · 3차 선택 · 지방감", atMain(8.8), atMain(11.8)),
    range("06 · 선택 해제", atMain(11.8), atMain(FINALE.start)),
    range("07 · 전체 맵 축소", atMain(FINALE.start), atMain(FINALE.settled)),
    range("08 · 전체 맵 홀드", atMain(FINALE.settled), atMain(FINALE.exitStart)),
    range("09 · 외곽→중앙 소멸", atMain(FINALE.exitStart), atMain(FINALE.exitEnd)),
    range("10 · 빈 배경 홀드", atMain(FINALE.exitEnd), atMain(FINALE.end)),
  ];
};

const BubbleMapScene = ({
  props,
  frameOffset,
}: {
  props: BubbleMapProps;
  frameOffset: number;
}) => {
  const localFrame = useCurrentFrame();
  const currentFrame = localFrame + frameOffset;
  const state = bubbleMapFrame(currentFrame, props);
  const strength = props["주변 감쇠"] * (1 - state.fullMapReveal);
  const visible = state.bubbles.filter(
    (b) =>
      b.renderOpacity > 0.0001 && b.screenRadius > 0.001 &&
      b.screenX + b.screenRadius > -30 &&
      b.screenY + b.screenRadius > -30 &&
      b.screenX - b.screenRadius < MAP.viewport + 30 &&
      b.screenY - b.screenRadius < MAP.viewport + 30,
  );
  // Native selected/focused bubbles are drawn above neighbors; stable ties preserve overlap order.
  visible.sort((a, b) => a.enlarged - b.enlarged || a.id.localeCompare(b.id));
  return (
    <AbsoluteFill
      style={{
        backgroundColor: props["배경 색"],
        overflow: "hidden",
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      <svg
        viewBox={`0 0 ${MAP.viewport} ${MAP.viewport}`}
        width="100%"
        height="100%"
        aria-label="미각 버블 맵 · 진입, 이동, 선택 및 중심 감쇠"
        data-bubble-map
        data-frame={currentFrame}
        data-focus={state.focusID ?? "overview"}
        data-finale-phase={state.finalePhase}
        data-rotation-degrees={state.rotationDegrees}
      >
        <defs>
          <radialGradient
            id="taste-bubble-edge-gradient"
            gradientUnits="userSpaceOnUse"
            cx={360}
            cy={360}
            r={432}
          >
            <stop offset="0" stopColor="white" />
            <stop offset="0.45" stopColor="white" />
            <stop
              offset="0.83"
              stopColor="white"
              stopOpacity={1 - 0.7 * strength}
            />
            <stop offset="1" stopColor="white" stopOpacity={1 - strength} />
          </radialGradient>
          <mask
            id="taste-bubble-edge-mask"
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={720}
            height={720}
          >
            <rect
              width={720}
              height={720}
              fill="url(#taste-bubble-edge-gradient)"
            />
          </mask>
          <filter
            id="taste-bubble-shadow"
            x="-50%"
            y="-50%"
            width="200%"
            height="220%"
          >
            <feDropShadow
              dx="0"
              dy="12"
              stdDeviation="12"
              floodColor="#000000"
              floodOpacity="0.10"
            />
          </filter>
        </defs>
        <g mask="url(#taste-bubble-edge-mask)">
          {visible.map((b) => {
            const palette = TASTE_TOKENS[b.axis].palette;
            const lines = bubbleLabelLines(b.label);
            const labelScale =
              state.zoom * (1 + 0.14 * b.enlarged) * (0.72 + 0.28 * b.entrance) * b.exitScale;
            const labelY = 8 * b.selected * state.zoom;
            return (
              <g
                key={b.id}
                transform={`translate(${b.screenX} ${b.screenY})`}
                opacity={b.renderOpacity}
                data-bubble={b.id}
                data-kind={b.kind}
                data-selected={b.selected}
                data-fill-opacity={b.fillOpacity}
              >
                <circle
                  r={b.screenRadius}
                  fill={palette.tintSurface}
                  opacity={b.fillOpacity}
                />
                {b.highlight > 0.001 && (
                  <circle
                    r={b.screenRadius}
                    fill={palette.tintSurface}
                    opacity={b.highlight}
                    filter="url(#taste-bubble-shadow)"
                  />
                )}
                <circle
                  r={Math.max(0, b.screenRadius - 0.5)}
                  fill="none"
                  stroke={palette.main}
                  strokeWidth={state.zoom}
                  strokeOpacity={0.18 * b.outline}
                />
                {b.priority !== null && b.selected > 0.001 && (
                  <text
                    y={-26 * state.zoom}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={10 * state.zoom}
                    fontWeight={600}
                    fill={palette.tintSurfaceText}
                    opacity={0.7 * b.selected}
                  >
                    {b.priority === 0 ? "메인 미각" : "보조 미각"}
                  </text>
                )}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={14 * labelScale}
                  fontWeight={700}
                  fill={palette.tintSurfaceText}
                  opacity={b.labelOpacity}
                >
                  {lines.map((line, i) => (
                    <tspan
                      key={i}
                      x={0}
                      y={
                        labelY + (i - (lines.length - 1) / 2) * 19 * labelScale
                      }
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
                <title>{b.label}</title>
              </g>
            );
          })}
        </g>
        <rect
          width={MAP.viewport}
          height={MAP.viewport}
          fill="#FFFFFF"
          opacity={state.veilOpacity}
          data-taste-map-veil
        />
      </svg>
    </AbsoluteFill>
  );
};

const IntroLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="01 · 진입 · 키프레임"
      style={{
        position: "absolute",
        inset: 0,
        opacity: interpolate(frame, [0, 51], [1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: interpolate(frame, [0, 51], [1, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          output: "perceptual-scale",
        }),
        translate: interpolate(frame, [0, 51], ["0px 0px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        rotate: interpolate(frame, [0, 51], ["0deg", "0deg"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const OverviewLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="02 · 오버뷰 이동 · 키프레임"
      style={{
        position: "absolute",
        inset: 0,
        opacity: interpolate(frame, [0, 71], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
        scale: interpolate(frame, [0, 71], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}),
        translate: interpolate(frame, [0, 71], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
        rotate: interpolate(frame, [0, 71], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
      }}
    >
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const FirstSelectionLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div name="03 · 1차 선택 · 키프레임" style={{position: "absolute", inset: 0, opacity: interpolate(frame, [0, 95], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), scale: interpolate(frame, [0, 95], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), translate: interpolate(frame, [0, 95], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), rotate: interpolate(frame, [0, 95], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const SecondSelectionLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div name="04 · 2차 선택 · 키프레임" style={{position: "absolute", inset: 0, opacity: interpolate(frame, [0, 95], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), scale: interpolate(frame, [0, 95], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), translate: interpolate(frame, [0, 95], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), rotate: interpolate(frame, [0, 95], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const ThirdSelectionLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div name="05 · 3차 선택 · 키프레임" style={{position: "absolute", inset: 0, opacity: interpolate(frame, [0, 89], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), scale: interpolate(frame, [0, 89], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), translate: interpolate(frame, [0, 89], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), rotate: interpolate(frame, [0, 89], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const DeselectLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div name="06 · 선택 해제 · 키프레임" style={{position: "absolute", inset: 0, opacity: interpolate(frame, [0, 17], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), scale: interpolate(frame, [0, 17], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), translate: interpolate(frame, [0, 17], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), rotate: interpolate(frame, [0, 17], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const ShrinkLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div name="07 · 전체 맵 축소 · 키프레임" style={{position: "absolute", inset: 0, opacity: interpolate(frame, [0, 35], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), scale: interpolate(frame, [0, 35], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), translate: interpolate(frame, [0, 35], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), rotate: interpolate(frame, [0, 35], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const GridHoldLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div name="08 · 전체 맵 홀드 · 키프레임" style={{position: "absolute", inset: 0, opacity: interpolate(frame, [0, 35], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), scale: interpolate(frame, [0, 35], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), translate: interpolate(frame, [0, 35], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), rotate: interpolate(frame, [0, 35], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const ExitLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div name="09 · 외곽→중앙 소멸 · 키프레임" style={{position: "absolute", inset: 0, opacity: interpolate(frame, [0, 35], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), scale: interpolate(frame, [0, 35], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), translate: interpolate(frame, [0, 35], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), rotate: interpolate(frame, [0, 35], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const BlankHoldLayer = (props: BubbleMapProps & { frameOffset: number }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div name="10 · 빈 배경 홀드 · 키프레임" style={{position: "absolute", inset: 0, opacity: interpolate(frame, [0, 17], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), scale: interpolate(frame, [0, 17], [1, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale"}), translate: interpolate(frame, [0, 17], ["0px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), rotate: interpolate(frame, [0, 17], ["0deg", "0deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
      <BubbleMapScene props={props} frameOffset={props.frameOffset} />
    </Interactive.Div>
  );
};

const FullFlowLayers = ({ props }: { props: BubbleMapProps }) => {
  return (
    <>
      {/* Keep timing values literal so Remotion Studio can edit each layer directly. */}
      <Sequence name="01 · 진입" durationInFrames={52} showInTimeline>
        <IntroLayer {...props} frameOffset={0} />
      </Sequence>
      <Sequence name="02 · 오버뷰 이동" from={52} durationInFrames={72} showInTimeline>
        <OverviewLayer {...props} frameOffset={52} />
      </Sequence>
      <Sequence name="03 · 1차 선택 · 짠맛" from={124} durationInFrames={96} showInTimeline>
        <FirstSelectionLayer {...props} frameOffset={124} />
      </Sequence>
      <Sequence name="04 · 2차 선택 · 감칠맛" from={220} durationInFrames={96} showInTimeline>
        <SecondSelectionLayer {...props} frameOffset={220} />
      </Sequence>
      <Sequence name="05 · 3차 선택 · 지방감" from={316} durationInFrames={90} showInTimeline>
        <ThirdSelectionLayer {...props} frameOffset={316} />
      </Sequence>
      <Sequence name="06 · 선택 해제" from={406} durationInFrames={18} showInTimeline>
        <DeselectLayer {...props} frameOffset={406} />
      </Sequence>
      <Sequence name="07 · 전체 맵 축소" from={424} durationInFrames={36} showInTimeline>
        <ShrinkLayer {...props} frameOffset={424} />
      </Sequence>
      <Sequence name="08 · 전체 맵 홀드" from={460} durationInFrames={36} showInTimeline>
        <GridHoldLayer {...props} frameOffset={460} />
      </Sequence>
      <Sequence name="09 · 외곽→중앙 소멸" from={496} durationInFrames={36} showInTimeline>
        <ExitLayer {...props} frameOffset={496} />
      </Sequence>
      <Sequence name="10 · 빈 배경 홀드" from={532} durationInFrames={18} showInTimeline>
        <BlankHoldLayer {...props} frameOffset={532} />
      </Sequence>
    </>
  );
};

export const TasteBubbleMap = (props: BubbleMapProps) => {
  const [fontHandle] = useState(() =>
    delayRender("Taste bubble map · native Pretendard"),
  );
  useEffect(() => {
    fontReady.then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle]);
  const layers = timelineLayers(props);

  if (props.재생 === "전체 흐름") {
    return (
      <AbsoluteFill style={{ backgroundColor: props["배경 색"] }}>
        <FullFlowLayers props={props} />
      </AbsoluteFill>
    );
  }

  const layer = layers[0];
  return (
    <AbsoluteFill style={{ backgroundColor: props["배경 색"] }}>
      <Sequence
        name={layer.name}
        from={layer.from}
        durationInFrames={layer.durationInFrames}
        layout="none"
        showInTimeline
      >
        <BubbleMapScene props={props} frameOffset={layer.from} />
      </Sequence>
    </AbsoluteFill>
  );
};
