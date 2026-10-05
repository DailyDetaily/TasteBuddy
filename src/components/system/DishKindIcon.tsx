import { createElement } from 'react';
import { DISH_KIND_ICON_NODES } from '../../constants/dishKindIcons';

/** Decorative icon: the adjacent chip label supplies the accessible name. */
export default function DishKindIcon({ id, size = 16 }: { id: string; size?: number }) {
  const nodes = Object.hasOwn(DISH_KIND_ICON_NODES, id) ? DISH_KIND_ICON_NODES[id] : undefined;
  if (!nodes) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {nodes.map(([tag, attributes], index) => createElement(tag, { ...attributes, key: index }))}
    </svg>
  );
}
