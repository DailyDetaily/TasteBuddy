import { useCurrentFrame, useVideoConfig } from "remotion";
import { TasteChangeGraphView } from "./TasteChangeGraph";
import {
  referenceLinePose,
  referencePresentation,
  referenceRowHeight,
  referenceRowStep,
  referenceTiming,
} from "./reference-motion";
import type { ReferenceLineProps } from "./reference-settings";

export const ReferenceTasteChangeGraph: React.FC<ReferenceLineProps> = (
  props,
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timing = referenceTiming(props, fps);
  const poses = props.데이터.map((_, index) =>
    referenceLinePose(frame, index, props, fps),
  );
  const presentation = referencePresentation(frame, props, fps);
  return (
    <TasteChangeGraphView
      graph={props}
      scene={{
        poses,
        rowHeight: referenceRowHeight(props),
        rowStep: referenceRowStep(props),
        starts: props.데이터.map((_, index) =>
          props.재생 === "정지" ? 0 : timing.start + index * timing.stagger,
        ),
        gradientStarts: poses.map((pose) =>
          pose.state === "pending"
            ? 6
            : pose.offset +
              (pose.exitProgress > 0 && pose.visible.length
                ? pose.visible[0].x - pose.track[0].x
                : 0),
        ),
        phase: presentation.phase,
      }}
    />
  );
};
