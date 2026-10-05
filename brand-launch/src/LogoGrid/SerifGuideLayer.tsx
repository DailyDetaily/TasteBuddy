import React, { useRef } from "react";
import {
  Interactive,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  type InteractiveBaseProps,
  type SequenceControls,
} from "remotion";
import { useGridScene } from "./GridLayer";
import { dynamicBaseScale, getDynamicCamera } from "./dynamicMotion";
import {
  serifGuides,
  getSerifGuideOpacity,
  getSerifGuideWindow,
  getSerifGuideLabel,
  serifGuideLabelIds,
  SERIF_GUIDE_STROKE_WIDTH,
} from "./serifGuides";

type Props = InteractiveBaseProps & { elementIndices: number[] };

const SerifGuideArtwork: React.FC<{
  elementIndices: number[];
  outlineRef: React.RefObject<SVGGraphicsElement | null>;
}> = ({ elementIndices, outlineRef }) => {
  const scene = useGridScene();
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = scene.animate
    ? (localFrame * 30) / fps + getSerifGuideWindow(scene.variant).from
    : 210;
  const camera = getDynamicCamera(scene.cameraFrame);
  const dynamic = scene.variant === "dynamic";
  const transform = dynamic
    ? `translate(960 540) scale(${dynamicBaseScale * camera.scale}) translate(${-camera.x} ${-camera.y})`
    : "translate(278 200) scale(1.36)";
  if (!scene.showConstruction) return null;
  return (
    <div
      data-grid-element-indices={elementIndices.join(",")}
      data-grid-role="guide.serif-terminals"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        fill="none"
        aria-label="로고타입 세리프 원 가이드"
        style={{ display: "block" }}
      >
        <g ref={outlineRef} transform={transform}>
          {serifGuides.map((guide) => {
            const opacity = getSerifGuideOpacity(frame, guide, scene.variant);
            if (opacity <= 0) return null;
            const label = serifGuideLabelIds.has(guide.id)
              ? getSerifGuideLabel(guide.r)
              : undefined;
            return (
              <g key={guide.id} opacity={opacity} data-guide-progress={opacity}>
                <circle
                  data-terminal-guide={guide.id}
                  data-source-index={guide.sourceCircleIndex}
                  cx={guide.cx}
                  cy={guide.cy}
                  r={guide.r}
                  fill="none"
                  stroke="#BCBCBC"
                  strokeWidth={
                    SERIF_GUIDE_STROKE_WIDTH / (dynamic ? camera.scale : 1)
                  }
                />
                {label ? (
                  <text
                    data-terminal-guide-label={guide.id}
                    data-guide-diameter={label.diameter}
                    x={guide.cx}
                    y={guide.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="Arial, Helvetica, sans-serif"
                    fontSize={label.fontSize}
                    fontWeight={400}
                    fill="#808080"
                    stroke="none"
                  >
                    {label.text}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const SerifGuideInner: React.FC<Props & { controls?: SequenceControls }> = (
  props,
) => {
  const scene = useGridScene();
  const outlineRef = useRef<SVGGraphicsElement | null>(null);
  return (
    <Sequence
      from={scene.animate ? props.from : 0}
      durationInFrames={scene.animate ? props.durationInFrames : 300}
      name={props.name}
      hidden={props.hidden || !scene.showConstruction}
      showInTimeline={props.showInTimeline}
      trimBefore={props.trimBefore}
      freeze={props.freeze}
      controls={props.controls}
      outlineRef={outlineRef}
      layout="none"
    >
      <SerifGuideArtwork
        elementIndices={props.elementIndices}
        outlineRef={outlineRef}
      />
    </Sequence>
  );
};

export const SerifGuideLayer = Interactive.withSchema({
  Component: SerifGuideInner,
  componentName: "세리프 원 가이드",
  componentIdentity: null,
  supportsEffects: false,
  schema: { ...Interactive.baseSchema },
});
