import { play, seek } from "@remotion/studio";
import { useId, type ReactNode } from "react";
import {
  AbsoluteFill,
  Freeze,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LiquidPlusButton } from "../TabBarPlusButton/PlusButton";
import { CameraEntryBloom } from "./Bloom";
import { Camera } from "./Camera";
import { NativeFeedbackSync } from "./NativeFeedbackSync";
import { StatusBar } from "./StatusBar";
import { FeedbackFlow, FeedbackResultPreview } from "./FeedbackFlow";
import { feedbackTiming } from "./feedback-timing";
import {
  clamp,
  entryLayout,
  entryTiming,
  randomBeamState,
  resultBackgroundColors,
  springValue,
  smoothStep,
} from "./motion";
import type { CameraEntryProps } from "./settings";
import { IPHONE_SCREEN, IPHONE_SCREEN_PATH } from "./iphone-screen";

const SCREEN_WIDTH = IPHONE_SCREEN.width * IPHONE_SCREEN.scale;
const SCREEN_HEIGHT = IPHONE_SCREEN.height * IPHONE_SCREEN.scale;

const CameraEntryScreen = (props: CameraEntryProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const width = SCREEN_WIDTH;
  const height = SCREEN_HEIGHT;
  const timing = entryTiming(props, fps);
  const layout = entryLayout(
    width,
    height,
    props["하단 여백"],
    props["버튼 크기"],
  );
  const pressed = frame >= timing.clickFrame;
  const elapsed = ((frame - timing.launchFrame) / fps) * props["진입 속도"];
  const finishElapsed =
    ((frame - timing.controlsFrame) / fps) * props["진입 속도"];
  const controlsOpacity = clamp(springValue(finishElapsed, "feedback"));
  const captureFrame = timing.durationInFrames - Math.round(0.22 * fps);
  const captureElapsed = (frame - captureFrame) / fps;
  const state = randomBeamState(
    frame,
    fps,
    props["색 전환 간격"],
    props["랜덤 시드"],
    props["컬러 모드"],
  );
  const click = () => {
    seek(timing.clickFrame);
    play();
  };

  return (
    <AbsoluteFill
      style={{ backgroundColor: props["배경 색"], overflow: "hidden" }}
    >
      <Sequence
        name="하단 중앙 플러스 · 클릭으로 진입"
        durationInFrames={timing.launchFrame}
      >
        <button
          type="button"
          aria-label="플러스 버튼 · 카메라 진입"
          onClick={click}
          style={{
            position: "absolute",
            left: width / 2 - props["버튼 크기"] / 2,
            top: height - props["하단 여백"] - props["버튼 크기"] / 2,
            width: props["버튼 크기"],
            height: props["버튼 크기"],
            padding: 0,
            border: 0,
            borderRadius: "50%",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <LiquidPlusButton
            state={state}
            size={props["버튼 크기"]}
            pressed={pressed}
            glass={props["글래스 강도"]}
          />
        </button>
      </Sequence>
      <Sequence
        name="카메라 화면"
        from={timing.launchFrame}
        durationInFrames={timing.durationInFrames - timing.launchFrame}
      >
        <Camera
          size={layout.size}
          controlsOpacity={controlsOpacity}
          focusElapsed={finishElapsed}
          capturing={captureElapsed >= 0 && captureElapsed < 0.14}
        />
      </Sequence>
      <Sequence
        name="그라데이션 확장 → 카메라 진입"
        from={timing.launchFrame}
        durationInFrames={timing.bloomFrames + timing.fadeFrames}
      >
        <CameraEntryBloom
          elapsed={elapsed}
          size={layout.size}
          origin={layout.origin}
          sourceRadius={layout.sourceRadius}
          background={props["배경 색"]}
          opacity={1 - controlsOpacity}
          buttonState={state}
        />
      </Sequence>
      {captureElapsed >= 0 && frame < timing.durationInFrames && (
        <AbsoluteFill
          style={{
            background: "white",
            opacity: 0.8 * (1 - smoothStep(captureElapsed / 0.2)),
            pointerEvents: "none",
          }}
        />
      )}
      <StatusBar
        size={layout.size}
        light={
          frame < timing.durationInFrames &&
          frame >=
            timing.controlsFrame - Math.round((0.2 * fps) / props["진입 속도"])
        }
      />
    </AbsoluteFill>
  );
};

const Phone = ({
  height,
  children,
  label,
  active,
}: {
  height: number;
  children: ReactNode;
  label: string;
  active: boolean;
}) => {
  const clipId = `iphone-screen-${useId().replace(/:/g, "")}`;
  const scale = height / SCREEN_HEIGHT;
  return (
    <div style={{ position: "relative", width: SCREEN_WIDTH * scale, height }}>
      <div
        style={{
          position: "absolute",
          top: -50,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "Pretendard, -apple-system, sans-serif",
          fontSize: 20,
          fontWeight: 600,
          color: active ? "#0F0F0F" : "#8A929D",
        }}
      >
        {label}
      </div>
      <svg width={0} height={0} aria-hidden style={{ position: "absolute" }}>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={IPHONE_SCREEN_PATH} />
          </clipPath>
        </defs>
      </svg>
      <div
        data-camera-entry-screen
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          clipPath: `url(#${clipId})`,
          overflow: "hidden",
          isolation: "isolate",
          background: "#F3F3F3",
        }}
      >
        <div
          style={{
            position: "relative",
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
const LogicalScreen = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      position: "absolute",
      width: 402,
      height: 874,
      transform: "scale(3)",
      transformOrigin: "top left",
    }}
  >
    {children}
    <StatusBar size={{ width: 402, height: 874 }} light={false} />
  </div>
);

export const TabBarCameraEntryPortrait = (props: CameraEntryProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const capture = entryTiming(props, fps).durationInFrames;
  const flow = feedbackTiming(fps);
  const resultFrom = flow.stages.find((s) => s.id === "result")!.from;
  const capturedColors = resultBackgroundColors(
    randomBeamState(
      capture,
      fps,
      props["색 전환 간격"],
      props["랜덤 시드"],
      props["컬러 모드"],
    ),
  );
  const middleFrame = Math.min(Math.max(frame - capture, 18), resultFrom - 1);
  const screenHeight = Math.min(
    props["화면 높이"],
    height - 250,
    (width - 320) / 3 / (402 / 874),
  );
  return (
    <AbsoluteFill
      style={{
        backgroundColor: props["캔버스 배경"],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <NativeFeedbackSync />
      <div style={{ display: "flex", gap: 74, alignItems: "center" }}>
        <Phone height={screenHeight} label="01  촬영" active={frame < capture}>
          <Freeze frame={Math.min(frame, capture - 1)}>
            <CameraEntryScreen {...props} />
          </Freeze>
        </Phone>
        <Phone
          height={screenHeight}
          label="02  식후 피드백"
          active={frame >= capture && frame < capture + resultFrom}
        >
          <LogicalScreen>
            <Freeze frame={middleFrame}>
              <FeedbackFlow
                excludeResult
                settled={frame >= capture + resultFrom}
              />
            </Freeze>
          </LogicalScreen>
        </Phone>
        <Phone
          height={screenHeight}
          label="03  결과 카드"
          active={frame >= capture + resultFrom}
        >
          <LogicalScreen>
            {frame < capture + resultFrom ? (
              <FeedbackResultPreview
                elapsed={(frame - capture) / fps}
                initialColors={capturedColors}
              />
            ) : (
              <Sequence from={capture + resultFrom} name="결과 카드 · 저장">
                <FeedbackFlow onlyResult resultFromPreview />
              </Sequence>
            )}
          </LogicalScreen>
        </Phone>
      </div>
    </AbsoluteFill>
  );
};
