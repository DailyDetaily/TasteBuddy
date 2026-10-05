import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  type SequenceControls,
  type InteractiveBaseProps,
} from "remotion";
import { PetalLines } from "./PetalLines";
import { PetalFeedback } from "./PetalFeedback";
import { PetalSolid } from "./PetalSolid";
import { PETAL_PATH } from "./source";
import { projectedPetalRadii } from "./solidGeometry";
import { PETAL_ANGLES, PETAL_PERSPECTIVE, PETAL_PIVOT } from "./motion";
import { analysisCircle } from "../taste-motion";
import { adjustmentLayers } from "./adjustmentGeometry";
import { analysisRayTransform } from "./analysisGeometry";
import type { PetalLogoProps } from "./settings";

const analysisAnchors = {
  top: analysisCircle(0),
  arrival: analysisCircle(1.5),
};

const plane: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: 1080,
  height: 1920,
  transformOrigin: "540px 960px",
  transformStyle: "preserve-3d",
};

type LayerProps = InteractiveBaseProps & {
  renderMode?: "petals" | "lines";
  from?: number;
  durationInFrames: number;
  name: string;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  shortening?: number;
  thickness?: number;
  analysisTime?: number;
  adjustmentTime?: number;
  feedbackTime?: number;
  feedbackLoopTime?: number;
  sets?: "original" | "copy" | "both";
  symbolColor: string;
  symbolScale: number;
  innerRatio: number;
};

const PetalStage: React.FC<LayerProps & { copy: boolean }> = ({
  copy,
  from = 0,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  shortening = 0,
  thickness = 0,
  analysisTime = 0,
  adjustmentTime = 0,
  symbolColor,
  symbolScale,
  innerRatio,
}) => {
  const frame = useCurrentFrame() + from;
  const { width } = useVideoConfig();
  const radii = React.useMemo(
    () =>
      projectedPetalRadii(
        PETAL_PATH,
        symbolScale,
        PETAL_PIVOT,
        PETAL_PERSPECTIVE,
        rotationY,
      ),
    [symbolScale, rotationY],
  );
  const progress = Math.max(0, Math.min(1, shortening));
  const inner =
    radii.inner + (radii.outer * innerRatio - radii.inner) * progress;
  const scale = (radii.outer - inner) / (radii.outer - radii.inner);
  const offset = -radii.outer * (1 - scale);
  const setRotation = copy ? rotationZ : 0;
  const adjusted = adjustmentLayers(adjustmentTime, inner, radii.outer);
  // Render an unsliced petal at both aligned endpoints, avoiding raster seams.
  const sections =
    adjustmentTime > 0 && adjustmentTime < 3
      ? adjusted
      : [{ layer: -1, inner, outer: radii.outer, angle: adjusted[0].angle }];
  return (
    <div
      role="img"
      aria-label={copy ? "Taste Buddy 복제 라인" : "Taste Buddy 원본 꽃잎"}
      data-logo-frame={frame}
      data-petal-set={copy ? "copy" : "original"}
      data-set-rotation={setRotation}
      data-inner-radius={inner}
      data-outer-radius={radii.outer}
      style={{
        position: "absolute",
        width: 1080,
        height: 1920,
        transformOrigin: "0 0",
        transform: `scale(${width / 1080})`,
      }}
    >
      <div style={{ ...plane, transform: `rotateZ(${setRotation}deg)` }}>
        {PETAL_ANGLES.flatMap((angle, index) =>
          sections.map((section) => {
            const analysis = analysisRayTransform(
              analysisTime,
              analysisCircle(analysisTime),
              angle + setRotation,
              radii.outer,
              inner,
              analysisAnchors,
            );
            return (
              <div
                key={`${index}-${section.layer}`}
                data-adjustment-layer={section.layer}
                data-adjustment-angle={section.angle}
                style={{
                  ...plane,
                  transform: `rotateZ(${angle + section.angle}deg)`,
                }}
              >
                <div
                  data-analysis-time={analysisTime}
                  data-analysis-center={`${analysis.dx},${analysis.dy}`}
                  style={{
                    ...plane,
                    transformStyle: "flat",
                    transform: `matrix(${analysis.matrix.join(",")})`,
                    clipPath:
                      section.layer < 0
                        ? undefined
                        : `inset(${960 - section.outer}px 0 ${960 + section.inner}px 0)`,
                  }}
                >
                  <div
                    data-ray-length-scale={scale}
                    data-ray-offset={offset}
                    style={{
                      ...plane,
                      transformStyle: "flat",
                      transform: `translateY(${offset}px) scaleY(${scale})`,
                    }}
                  >
                    <div
                      style={{
                        ...plane,
                        perspective: PETAL_PERSPECTIVE,
                        perspectiveOrigin: "540px 960px",
                      }}
                    >
                      <div
                        data-petal={index}
                        data-rotation-x={rotationX}
                        data-rotation-y={rotationY}
                        data-thickness={thickness}
                        style={{
                          ...plane,
                          transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
                        }}
                      >
                        <PetalSolid
                          thickness={thickness}
                          color={symbolColor}
                          scale={symbolScale}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};

// Public Remotion interactivity API: the source JSX property values and their
// interpolate() keyframes are editable by Studio, including live drag overrides.
const LayerInner: React.FC<LayerProps & { controls?: SequenceControls }> = (
  props,
) => (
  <Sequence
    from={props.from}
    durationInFrames={props.durationInFrames}
    name={props.name}
    hidden={props.hidden}
    showInTimeline={props.showInTimeline}
    trimBefore={props.trimBefore}
    freeze={props.freeze}
    controls={props.controls}
    layout="none"
  >
    {(props.feedbackTime ?? 0) > 0 ? (
      <PetalFeedback
        from={props.from}
        seconds={props.feedbackTime!}
        loopSeconds={props.feedbackLoopTime}
        symbolScale={props.symbolScale}
        innerRatio={props.innerRatio}
        symbolColor={props.symbolColor}
        thickness={props.thickness ?? 10}
        copyRotation={props.rotationZ ?? 30}
      />
    ) : props.renderMode === "lines" ? (
      <PetalLines {...props} />
    ) : (
      <>
        {props.sets !== "copy" && <PetalStage {...props} copy={false} />}
        {props.sets !== "original" &&
          props.sets !== undefined &&
          (props.sets !== "both" || (props.rotationZ ?? 0) !== 0) && (
            <PetalStage {...props} copy />
          )}
      </>
    )}
  </Sequence>
);

export const PetalLayer = Interactive.withSchema({
  Component: LayerInner,
  componentName: "꽃잎 레이어",
  componentIdentity: null,
  supportsEffects: false,
  schema: {
    ...Interactive.baseSchema,
    rotationX: {
      type: "rotation-degrees",
      default: 0,
      step: 1,
      description: "X축 회전",
      keyframable: true,
    },
    rotationY: {
      type: "rotation-degrees",
      default: 0,
      step: 1,
      description: "Y축 회전",
      keyframable: true,
    },
    rotationZ: {
      type: "rotation-degrees",
      default: 0,
      step: 1,
      description: "복제본 시계방향 회전",
      keyframable: true,
    },
    shortening: {
      type: "number",
      default: 0,
      min: 0,
      max: 1,
      step: 0.01,
      hiddenFromList: false,
      description: "라인 단축 진행",
      keyframable: true,
    },
    feedbackLoopTime: {
      type: "number",
      default: 0,
      min: 0,
      max: 6,
      step: 0.01,
      description: "피드백 루프 진행 (초)",
      hiddenFromList: false,
      keyframable: true,
    },
    feedbackTime: {
      type: "number",
      default: 0,
      min: 0,
      max: 3,
      step: 0.01,
      description: "피드백 움직임 진행 (초)",
      hiddenFromList: false,
      keyframable: true,
    },
    adjustmentTime: {
      type: "number",
      default: 0,
      min: 0,
      max: 3,
      step: 0.01,
      description: "조정 움직임 진행 (초)",
      hiddenFromList: false,
      keyframable: true,
    },
    analysisTime: {
      type: "number",
      default: 0,
      min: 0,
      max: 3,
      step: 0.01,
      description: "분석 움직임 진행 (초)",
      hiddenFromList: false,
      keyframable: true,
    },
    thickness: {
      type: "number",
      default: 0,
      min: 0,
      max: 30,
      step: 1,
      hiddenFromList: false,
      description: "두께",
      keyframable: true,
    },
  },
});

export const PetalLogo: React.FC<PetalLogoProps> = (props) => {
  const frame = useCurrentFrame();
  const shared = {
    symbolColor: props.symbolColor,
    symbolScale: props["심볼 배율"],
    innerRatio: props["중앙 여백 비율"],
  };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: props.backgroundColor,
      }}
    >
      {/* Keep each layer and each interpolate() literal at its own source node.
          Studio writes timeline trims and keyframe moves back to these values. */}
      <PetalLayer
        {...shared}
        durationInFrames={30}
        name="01 · X축 펼침"
        rotationX={interpolate(frame, [0, 30], [90, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1),
        })}
      />
      <PetalLayer
        {...shared}
        from={30}
        durationInFrames={15}
        name="02 · 펴진 상태 유지"
      />
      <PetalLayer
        {...shared}
        from={45}
        durationInFrames={10}
        name="03 · Y축 회전"
        thickness={10}
        rotationY={interpolate(frame, [45, 54], [0, 90], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={55}
        durationInFrames={10}
        name="04 · 회전 후 정지"
        thickness={10}
        rotationY={90}
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={55}
        durationInFrames={10}
        name="05 · 복제본 시계방향 회전"
        thickness={10}
        rotationY={90}
        sets="copy"
        rotationZ={interpolate(frame, [55, 64], [0, 30], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={65}
        durationInFrames={15}
        name="06 · 바깥쪽 기준 라인 단축"
        thickness={10}
        rotationY={90}
        rotationZ={30}
        sets="both"
        shortening={interpolate(frame, [65, 80], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={80}
        durationInFrames={15}
        name="07 · 중앙 빈 원 확대"
        analysisTime={interpolate(frame, [80, 94], [0, 0.18], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
        thickness={10}
        rotationY={90}
        rotationZ={30}
        shortening={1}
        sets="both"
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={95}
        durationInFrames={90}
        name="08 · 분석 이동·복귀 (3초)"
        analysisTime={interpolate(
          frame,
          [95, 113, 129, 143, 145, 167, 184],
          [0.18, 0.55, 0.8, 1.5, 2.125, 2.5, 3],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: [
              Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1),
              Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1),
              Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1),
              Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1),
              Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1),
              Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1),
            ],
          },
        )}
        thickness={10}
        rotationY={90}
        rotationZ={30}
        shortening={1}
        sets="both"
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={185}
        durationInFrames={90}
        name="09 · 조정 움직임 (3초)"
        adjustmentTime={interpolate(frame, [185, 274], [0, 3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
        thickness={10}
        rotationY={90}
        rotationZ={30}
        shortening={1}
        sets="both"
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={275}
        durationInFrames={51}
        name="10 · 조정 → 피드백 전환"
        feedbackTime={interpolate(frame, [275, 325], [0, 1.7], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
        adjustmentTime={3}
        thickness={10}
        rotationY={90}
        rotationZ={30}
        shortening={1}
        sets="both"
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={326}
        durationInFrames={90}
        name="11 · 피드백 루프 (1회)"
        feedbackTime={1.7}
        feedbackLoopTime={interpolate(frame, [326, 416], [0, 3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
        adjustmentTime={3}
        thickness={10}
        rotationY={90}
        rotationZ={30}
        shortening={1}
        sets="both"
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={416}
        durationInFrames={25}
        name="12 · 피드백 → 12개 라인 (역재생)"
        feedbackTime={interpolate(frame, [416, 440], [1.7, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
        adjustmentTime={3}
        thickness={10}
        rotationY={90}
        rotationZ={30}
        shortening={1}
        sets="both"
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={441}
        durationInFrames={10}
        name="13 · 라인 길이 복원 (역재생)"
        shortening={interpolate(frame, [441, 451], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
        thickness={10}
        rotationY={90}
        rotationZ={30}
        sets="both"
      />
      <PetalLayer
        renderMode="lines"
        {...shared}
        from={451}
        durationInFrames={10}
        name="14 · 12개 → 6개 라인 (역재생)"
        rotationZ={interpolate(frame, [451, 460], [30, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
        thickness={10}
        rotationY={90}
        sets="both"
      />
      <PetalLayer
        {...shared}
        from={461}
        durationInFrames={10}
        name="15 · Y축 −90° · 심볼 복원"
        rotationY={interpolate(frame, [461, 470], [90, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
        thickness={interpolate(frame, [461, 470], [10, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
      />
      <PetalLayer
        {...shared}
        from={471}
        durationInFrames={10}
        name="16 · X축 접힘 · 사라짐 (역재생)"
        rotationX={interpolate(frame, [471, 481], [0, 90], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [Easing.bezier(0.3333333333333333, 0, 0.6666666666666666, 1)],
        })}
      />
      <PetalLayer
        {...shared}
        from={481}
        durationInFrames={15}
        name="17 · 접힌 상태"
        rotationX={90}
      />
    </div>
  );
};
