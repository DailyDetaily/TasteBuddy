import { DISH_KIND_ICON_NODES } from "../../../src/constants/dishKindIcons";
import { DISH_KIND_OPTIONS } from "../../../src/constants/dishKindTags";

// Read the current product catalog directly, including user-edited SVG geometry.
// Historical combined categories are deliberately absent from this new board.
export const foodIcons = DISH_KIND_OPTIONS.map(({ id, label }) => {
  const nodes = DISH_KIND_ICON_NODES[id];
  if (!nodes?.length) throw new Error(`Missing food icon: ${id}`);
  return { id, label, nodes };
});

export type FoodIconEntry = (typeof foodIcons)[number];
