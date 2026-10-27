import { useId, type CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FeedbackBackground } from "../DiningFeedbackMotion/Background";
import { foodIcons } from "./catalog";
import { FoodIcon } from "./FoodIcon";
import { foodIconsForGrid } from "./grid-layout";
import { gridGradientPose } from "./grid-gradient-motion";
import type { FoodIconGridProps, FoodIconSingleProps } from "./settings";

const cellStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const FoodIconGrid = (props: FoodIconGridProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const maskId = `food-grid-lines-${useId().replace(/:/g, "")}`;
  const gradient = gridGradientPose(
    frame,
    durationInFrames,
    props.재생 === "정지",
  );
  const arrangedIcons = foodIconsForGrid(foodIcons, props["열 개수"]);
  const columns = props["열 개수"];
  const rows = Math.ceil(arrangedIcons.length / columns);
  const cellWidth = (width - 128) / columns;
  const cellHeight = (height - 144) / rows;
  const size = props["아이콘 크기"];
  // Preserve the result background's logical scale, including its blur radii.
  const gradientScale = width / 1120;
  return (
    <AbsoluteFill
      data-food-icon-board="grid"
      style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}
    >
      <div
        aria-hidden="true"
        data-food-grid-gradient
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
        data-food-grid-line-mask
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`음식 종류 아이콘 ${arrangedIcons.length}개`}
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
            {arrangedIcons.map((icon, index) => (
              <g
                key={icon.id}
                data-food-grid-cell={icon.id}
                transform={`translate(${64 + ((index % columns) + 0.5) * cellWidth - size / 2} ${72 + (Math.floor(index / columns) + 0.5) * cellHeight - size / 2})`}
                style={{ color: "#000000" }}
              >
                <FoodIcon
                  icon={icon}
                  size={size}
                  motion={props}
                  animate={icon.id !== "legume_tofu"}
                />
              </g>
            ))}
          </mask>
        </defs>
        {/* White covers the field everywhere except the live animated strokes.
            Existing icon masks, clips, dots and opacity remain part of the cutout. */}
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

export const FoodIconSingle = (props: FoodIconSingleProps) => {
  const icon = foodIcons.find(({ label }) => label === props.아이콘);
  if (!icon) throw new Error(`Unknown food icon: ${props.아이콘}`);

  return (
    <AbsoluteFill
      data-food-icon-board="single"
      style={{
        ...cellStyle,
        backgroundColor: props["배경 색"],
        color: props["아이콘 색"],
      }}
    >
      <FoodIcon icon={icon} size={props["아이콘 크기"]} motion={props} />
    </AbsoluteFill>
  );
};
