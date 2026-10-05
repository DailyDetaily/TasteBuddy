import { nativeBubble as native } from "./native-ui";
// TasteExperienceBubbleView: distance is measured before the camera zoom.
export const nativeBubbleOpacity = (
  highlighted: boolean,
  distance?: number,
) => {
  const fillOpacity = highlighted
    ? 1
    : distance === undefined
      ? native.unfocusedOpacity
      : (100 -
          Math.min(
            native.maximumWhiteMix,
            Math.max(1, Math.round(distance / native.spacing)) *
              native.whiteMixStep,
          )) /
        100;
  return {
    fillOpacity,
    textOpacity: highlighted
      ? 1
      : Math.max(
          native.minimumTextOpacity,
          fillOpacity + native.textOpacityBoost,
        ),
  };
};

// Keep native endpoint values; interpolate them with the same frame-driven
// progress as the camera pan, rather than switching the distant focus instantly.
export const blendBubbleOpacity = (
  from: ReturnType<typeof nativeBubbleOpacity>,
  to: ReturnType<typeof nativeBubbleOpacity>,
  progress: number,
) => ({
  fillOpacity:
    from.fillOpacity + (to.fillOpacity - from.fillOpacity) * progress,
  textOpacity:
    from.textOpacity + (to.textOpacity - from.textOpacity) * progress,
});
