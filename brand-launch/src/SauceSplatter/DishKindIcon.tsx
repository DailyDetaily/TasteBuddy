import { createElement } from "react";
import { DISH_KIND_ICON_NODES } from "../../../src/constants/dishKindIcons";
import { DISH_KIND_OPTIONS } from "../../../src/constants/dishKindTags";
import { nativeDishIconSize } from "./native-chip";

export const DishKindIcon = ({
  kind,
  label,
}: {
  kind: string;
  label: string;
}) => {
  const id =
    kind === "자동"
      ? DISH_KIND_OPTIONS.find((option) => option.label === label)?.id
      : kind;
  const nodes = id && DISH_KIND_ICON_NODES[id];
  if (!nodes) return null;
  return (
    <svg
      data-dish-kind-icon={id}
      width={nativeDishIconSize}
      height={nativeDishIconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: nativeDishIconSize,
        height: nativeDishIconSize,
        display: "block",
        overflow: "visible",
        transform: "translateZ(0)",
      }}
    >
      {nodes.map(([tag, attributes], index) =>
        createElement(tag, { ...attributes, key: index }),
      )}
    </svg>
  );
};
