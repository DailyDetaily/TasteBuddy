import { createElement } from "react";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { Wok, WokFrame } from "./Wok";
import { Braised } from "./Braised";
import { Noodle } from "./Noodle";
import { Grilled } from "./Grilled";
import { Seaweed } from "./Seaweed";
import { Smoked } from "./Smoked";
import { Broth } from "./Broth";
import { Pancake } from "./Pancake";
import { Wine, WineFrame } from "./Wine";
import { Fruit } from "./Fruit";
import { Dessert, DessertFrame } from "./Dessert";
import { Steamed } from "./Steamed";
import { Spice } from "./Spice";
import { Peas } from "./Peas";

// Each animation keeps the original SVG primitives. Other icons remain still.
export const FoodIcon = ({
  icon,
  size,
  motion,
  animate = true,
  clock,
}: {
  icon: FoodIconEntry;
  size: number;
  motion: FoodIconMotionProps;
  animate?: boolean;
  clock?: { frame: number; fps: number };
}) => {
  const motionId = animate ? icon.id : null;
  return (
    <svg
      data-food-icon={icon.id}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={icon.label}
      style={{
        display: "block",
        overflow: "visible",
      }}
    >
      {motionId === "stir_fried_wok" ? (
        clock ? (
          <WokFrame icon={icon} motion={motion} {...clock} />
        ) : (
          <Wok icon={icon} motion={motion} />
        )
      ) : motionId === "braised" ? (
        <Braised icon={icon} motion={motion} />
      ) : motionId === "noodle" ? (
        <Noodle icon={icon} motion={motion} />
      ) : motionId === "grilled" ? (
        <Grilled icon={icon} motion={motion} />
      ) : motionId === "seaweed" ? (
        <Seaweed icon={icon} motion={motion} />
      ) : motionId === "smoked" ? (
        <Smoked icon={icon} motion={motion} />
      ) : motionId === "broth" ? (
        <Broth icon={icon} motion={motion} />
      ) : motionId === "pancake" ? (
        <Pancake icon={icon} motion={motion} />
      ) : motionId === "beverage_pairing" ? (
        clock ? (
          <WineFrame icon={icon} motion={motion} {...clock} />
        ) : (
          <Wine icon={icon} motion={motion} />
        )
      ) : motionId === "fruit" ? (
        <Fruit icon={icon} motion={motion} />
      ) : motionId === "dessert" ? (
        clock ? (
          <DessertFrame icon={icon} motion={motion} {...clock} />
        ) : (
          <Dessert icon={icon} motion={motion} />
        )
      ) : motionId === "steamed" ? (
        <Steamed icon={icon} motion={motion} />
      ) : motionId === "spice" ? (
        <Spice icon={icon} motion={motion} />
      ) : motionId === "legume_tofu" ? (
        <Peas icon={icon} motion={motion} />
      ) : (
        icon.nodes.map(([tag, attributes], index) =>
          createElement(tag, {
            ...attributes,
            key: `${icon.id}-${index}`,
            "data-icon-part": `${icon.id}-${index}`,
          }),
        )
      )}
    </svg>
  );
};
