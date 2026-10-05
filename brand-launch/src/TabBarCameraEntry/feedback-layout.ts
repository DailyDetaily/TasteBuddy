import { nativeBubble as native } from "./native-ui";
import catalog from "./feedback-catalog";

// Mirrors TasteExperienceMapEngine.renderPositions, including nearest-anchor
// displacement and the pairwise relaxation pass for enlarged native bubbles.
export const feedbackBubbleLayout = (ids: string[]) => {
  const selected = catalog.bubbles.filter((b) => ids.includes(b.id));
  const positions = catalog.bubbles.map((b) => {
    if (ids.includes(b.id)) return { ...b, diameter: native.selectedDiameter };
    const nearest = selected.reduce<(typeof selected)[number] | undefined>(
      (best, item) =>
        !best ||
        Math.hypot(b.x - item.x, b.y - item.y) <
          Math.hypot(b.x - best.x, b.y - best.y)
          ? item
          : best,
      undefined,
    );
    if (!nearest) return { ...b, diameter: native.diameter };
    const dx = b.x - nearest.x,
      dy = b.y - nearest.y,
      distance = Math.max(0.001, Math.hypot(dx, dy));
    return {
      ...b,
      x:
        b.x +
        (dx / distance) * ((native.selectedDiameter - native.diameter) / 2),
      y:
        b.y +
        (dy / distance) * ((native.selectedDiameter - native.diameter) / 2),
      diameter: native.diameter,
    };
  });
  for (
    let iteration = 0;
    iteration < native.relaxationIterations;
    iteration++
  ) {
    for (let i = 0; i < positions.length; i++)
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i],
          b = positions[j],
          dx = b.x - a.x,
          dy = b.y - a.y;
        const distance = Math.max(Math.hypot(dx, dy), 0.001);
        const overlap =
          (a.diameter + b.diameter) / 2 +
          (native.spacing - native.diameter) -
          distance;
        if (overlap <= 0) continue;
        a.x -= ((dx / distance) * overlap) / 2;
        a.y -= ((dy / distance) * overlap) / 2;
        b.x += ((dx / distance) * overlap) / 2;
        b.y += ((dy / distance) * overlap) / 2;
      }
  }
  return positions;
};
