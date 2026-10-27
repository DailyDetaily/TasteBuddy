import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  Freeze,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FoodIcon } from "./FoodIcon";
import { FeedbackBackground } from "../DiningFeedbackMotion/Background";
import { gridGradientPose } from "./grid-gradient-motion";
import { foodIconGridTiming } from "./timing";
import type { FoodIconEntry } from "./catalog";
import { captureTransitionPose } from "./capture-transition-pose";
import {
  foodIconTransitionPose,
  foodIconTransitionTiming,
  transitionIcons as icons,
} from "./transition-motion";
import { iconMorphPaths, prepareIconMorph } from "./transition-shapes";
import type { FoodIconTransitionProps } from "./transition-settings";

export const FoodIconTransition = (props: FoodIconTransitionProps) => {
  const speed = props["모션 속도"] ?? 1,
    strength = props["모션 강도"] ?? 1;
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const maskId = `food-transition-lines-${useId().replace(/:/g, "")}`;
  const timing = useMemo(
    () => foodIconTransitionTiming(props, fps),
    [props, fps],
  );
  const pose = foodIconTransitionPose(frame, timing, props.재생 === "정지");
  const gradientCycles = Math.max(
    1,
    Math.round(
      (timing.durationInFrames - 1) /
        (foodIconGridTiming(speed, fps).durationInFrames - 1),
    ),
  );
  const gradient = gridGradientPose(
    frame,
    timing.durationInFrames,
    props.재생 === "정지",
    gradientCycles,
  );
  const gradientScale = width / 1120;
  const size = props["아이콘 크기"];
  const captureRoot = useRef<HTMLDivElement>(null);
  const [handle] = useState(() =>
    delayRender("Read animated icon morph boundaries"),
  );
  const completed = useRef(false);
  const [snapshots, setSnapshots] = useState<{
    start: FoodIconEntry[];
    end: FoodIconEntry[];
  } | null>(null);
  // Freeze controls the local clock for every original icon component.
  const motion = useMemo(
    () => ({
      재생: "반복" as const,
      "모션 속도": speed,
      "모션 강도": strength,
    }),
    [speed, strength],
  );
  useLayoutEffect(() => {
    try {
      const svgs = captureRoot.current?.querySelectorAll<SVGSVGElement>(
        "svg[data-food-icon]",
      );
      if (!svgs || svgs.length !== icons.length * 2)
        throw new Error("Missing icon boundary previews");
      setSnapshots({
        start: icons.map((icon, index) =>
          captureTransitionPose(svgs[index * 2], icon),
        ),
        end: icons.map((icon, index) =>
          captureTransitionPose(svgs[index * 2 + 1], icon),
        ),
      });
      if (!completed.current) {
        continueRender(handle);
        completed.current = true;
      }
    } catch (error) {
      cancelRender(error);
    }
  }, [motion, fps, handle]);
  const parts = useMemo(
    () =>
      snapshots
        ? prepareIconMorph(
            snapshots.end[pose.index],
            snapshots.start[pose.next],
          )
        : [],
    [snapshots, pose.index, pose.next],
  );
  const paths = useMemo(
    () => iconMorphPaths(parts, pose.progress),
    [parts, pose.progress],
  );
  const held = pose.progress === 1 ? icons[pose.next] : icons[pose.index];
  const heldFrame = pose.progress === 1 ? 0 : pose.motionFrame;
  const morphing = pose.progress > 0 && pose.progress < 1;
  return (
    <AbsoluteFill
      data-food-icon-transition="square"
      data-transition-phase={pose.phase}
      data-transition-from={icons[pose.index].id}
      data-transition-to={icons[pose.next].id}
      data-transition-local-frame={pose.motionFrame}
      style={{
        backgroundColor: "#FFFFFF",
        color: "#000000",
        overflow: "hidden",
      }}
    >
      <div
        ref={captureRoot}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -10000,
          top: 0,
          width: 24,
          height: 24,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {icons.map((icon, index) => (
          <div key={icon.id}>
            <Freeze frame={0}>
              <FoodIcon icon={icon} size={24} motion={motion} />
            </Freeze>
            <Freeze frame={timing.segments[index].motionFrames - 1}>
              <FoodIcon icon={icon} size={24} motion={motion} />
            </Freeze>
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        data-food-transition-gradient
        style={{
          position: "absolute",
          width: 1120,
          height: height / gradientScale,
          transform: `scale(${gradientScale})`,
          transformOrigin: "top left",
        }}
      >
        <FeedbackBackground
          colors={gradient.colors}
          mainCoverage={gradient.mainCoverage}
          motionRange={gradient.motionRange}
          elapsed={gradient.elapsed}
          width={1120}
          height={height / gradientScale}
        />
      </div>
      <svg
        data-food-transition-line-mask
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          morphing
            ? `${icons[pose.index].label}에서 ${icons[pose.next].label}로 전환`
            : held.label
        }
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={height}
            style={{ maskType: "luminance" }}
          >
            <rect width={width} height={height} fill="white" />
            <g
              data-transition-visible="true"
              transform={`translate(${(width - size) / 2} ${(height - size) / 2})`}
              style={{ color: "#000000" }}
            >
              {morphing ? (
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: "block", overflow: "visible" }}
                >
                  {paths.map((path, index) => (
                    <path key={index} {...path} />
                  ))}
                </svg>
              ) : (
                <Freeze frame={heldFrame}>
                  <FoodIcon icon={held} size={size} motion={motion} />
                </Freeze>
              )}
            </g>
          </mask>
        </defs>
        <rect
          width={width}
          height={height}
          fill="#FFFFFF"
          mask={`url(#${maskId})`}
        />
      </svg>
    </AbsoluteFill>
  );
};
