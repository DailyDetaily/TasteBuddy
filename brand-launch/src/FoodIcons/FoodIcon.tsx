import { createElement } from "react";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { Wok } from "./Wok";
import { Braised } from "./Braised";
import { Noodle } from "./Noodle";
import { Grilled } from "./Grilled";
import { Seaweed } from "./Seaweed";
import { Smoked } from "./Smoked";
import { Broth } from "./Broth";
import { Pancake } from "./Pancake";
import { Wine } from "./Wine";
import { Fruit } from "./Fruit";
import { Dessert } from "./Dessert";
import { Steamed } from "./Steamed";
import { Spice } from "./Spice";

// Each animation keeps the original SVG primitives. Other icons remain still.
export const FoodIcon = ({
  icon,
  size,
  motion,
}: {
  icon: FoodIconEntry;
  size: number;
  motion: FoodIconMotionProps;
}) => {
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
      {icon.id === "stir_fried_wok" ? (
        <Wok icon={icon} motion={motion} />
      ) : icon.id === "braised" ? (
        <Braised icon={icon} motion={motion} />
      ) : icon.id === "noodle" ? (
        <Noodle icon={icon} motion={motion} />
      ) : icon.id === "grilled" ? (
        <Grilled icon={icon} motion={motion} />
      ) : icon.id === "seaweed" ? (
        <Seaweed icon={icon} motion={motion} />
      ) : icon.id === "smoked" ? (
        <Smoked icon={icon} motion={motion} />
      ) : icon.id === "broth" ? (
        <Broth icon={icon} motion={motion} />
      ) : icon.id === "pancake" ? (
        <Pancake icon={icon} motion={motion} />
      ) : icon.id === "beverage_pairing" ? (
        <Wine icon={icon} motion={motion} />
      ) : icon.id === "fruit" ? (
        <Fruit icon={icon} motion={motion} />
      ) : icon.id === "dessert" ? (
        <Dessert icon={icon} motion={motion} />
      ) : icon.id === "steamed" ? (
        <Steamed icon={icon} motion={motion} />
      ) : icon.id === "spice" ? (
        <Spice icon={icon} motion={motion} />
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
