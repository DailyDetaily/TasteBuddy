import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import InsightCategoryIcon from "../../../src/components/system/InsightCategoryIcon";
import { captureTransitionPose } from "../FoodIcons/capture-transition-pose";
import {
  categoryIconMorphPaths,
  prepareCategoryIconMorph,
  type CategoryIconMorphPart,
} from "./shapes";
import {
  categoryIcons,
  categoryIconTransitionPose,
  categoryIconTransitionTiming,
} from "./motion";
import type { CategoryIconTransitionProps } from "./settings";

export const CategoryIconTransition = (props: CategoryIconTransitionProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timing = categoryIconTransitionTiming(props, fps);
  const pose = categoryIconTransitionPose(frame, timing, props.재생 === "정지");
  const captureRoot = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender("Read product category icons"));
  const completed = useRef(false);
  const [morphs, setMorphs] = useState<CategoryIconMorphPart[][] | null>(null);

  useLayoutEffect(() => {
    try {
      const svgs = captureRoot.current?.querySelectorAll<SVGSVGElement>(
        "svg[data-insight-category]",
      );
      if (!svgs || svgs.length !== categoryIcons.length)
        throw new Error("Missing product category icons");
      // Capture the shared component, including Heart's stronger stroke.
      // No duplicated Lucide path data or alternate category glyphs.
      const snapshots = categoryIcons.map((icon, index) =>
        captureTransitionPose(svgs[index], { ...icon, nodes: [] }),
      );
      setMorphs(
        snapshots.map((icon, index) =>
          prepareCategoryIconMorph(
            icon,
            snapshots[(index + 1) % snapshots.length],
          ),
        ),
      );
      if (!completed.current) {
        continueRender(handle);
        completed.current = true;
      }
    } catch (error) {
      cancelRender(error);
    }
  }, [handle]);

  const paths = useMemo(
    () => categoryIconMorphPaths(morphs?.[pose.index] ?? [], pose.progress),
    [morphs, pose.index, pose.progress],
  );
  const held = categoryIcons[pose.progress === 1 ? pose.next : pose.index];
  const morphing = pose.progress > 0 && pose.progress < 1;
  const iconColor = interpolateColors(
    pose.progress,
    [0, 1],
    [categoryIcons[pose.index].color, categoryIcons[pose.next].color],
  );

  return (
    <AbsoluteFill
      data-category-icon-transition="square"
      data-transition-phase={pose.phase}
      data-transition-from={categoryIcons[pose.index].id}
      data-transition-to={categoryIcons[pose.next].id}
      data-taste-from={categoryIcons[pose.index].taste}
      data-taste-to={categoryIcons[pose.next].taste}
      style={{
        backgroundColor: props["배경 색"],
        color: iconColor,
        justifyContent: "center",
        alignItems: "center",
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
        {categoryIcons.map(({ id }) => (
          <InsightCategoryIcon key={id} category={id} size={24} />
        ))}
      </div>
      <div
        data-transition-visible="true"
        role="img"
        aria-label={
          morphing
            ? `${categoryIcons[pose.index].label}에서 ${categoryIcons[pose.next].label}로 전환`
            : held.label
        }
        style={{ width: props["아이콘 크기"], height: props["아이콘 크기"] }}
      >
        {morphing ? (
          <svg
            width={props["아이콘 크기"]}
            height={props["아이콘 크기"]}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ display: "block", overflow: "visible" }}
          >
            {paths.map((path, index) => (
              <path key={index} {...path} />
            ))}
          </svg>
        ) : (
          <InsightCategoryIcon
            category={held.id}
            size={props["아이콘 크기"]}
            color={iconColor}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
