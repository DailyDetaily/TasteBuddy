import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { foodIcons } from "./catalog";
import { FoodIcon } from "./FoodIcon";
import type { FoodIconGridProps, FoodIconSingleProps } from "./settings";

const cellStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const FoodIconGrid = (props: FoodIconGridProps) => (
  <AbsoluteFill
    data-food-icon-board="grid"
    style={{
      backgroundColor: props["배경 색"],
      color: props["아이콘 색"],
      padding: "72px 64px",
      display: "grid",
      gridTemplateColumns: `repeat(${props["열 개수"]}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${Math.ceil(foodIcons.length / props["열 개수"])}, minmax(0, 1fr))`,
    }}
  >
    {foodIcons.map((icon) => (
      <div key={icon.id} style={cellStyle}>
        <FoodIcon icon={icon} size={props["아이콘 크기"]} motion={props} />
      </div>
    ))}
  </AbsoluteFill>
);

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
