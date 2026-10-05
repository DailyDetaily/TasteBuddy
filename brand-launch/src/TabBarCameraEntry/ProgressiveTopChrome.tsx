import { nativeFlowUI as ui } from "./native-ui";

// TBTopChromeBackdrop: status inset + header + 8pt extension, 8pt -> 0 blur,
// no tint. Chromium has no variable-radius backdrop filter, so overlapping
// gradient masks interpolate eight blur levels in iPhone logical points.
const height = ui.safeAreaTop + ui.topBarHeight + ui.topChromeFadeExtension;
const bands = 8;
export const ProgressiveTopChrome = () => (
  <div
    data-progressive-top-blur
    aria-hidden
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height,
      zIndex: 2,
      pointerEvents: "none",
    }}
  >
    {Array.from({ length: bands }, (_, i) => {
      const center = (height * i) / bands;
      const step = height / bands;
      const blur = ui.topChromeMaxBlur * (1 - i / bands);
      const mask =
        i === 0
          ? `linear-gradient(to bottom, black 0px, transparent ${step}px)`
          : `linear-gradient(to bottom, transparent ${center - step}px, black ${center}px, transparent ${center + step}px)`;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        />
      );
    })}
  </div>
);
