import { palette, tasteAxes } from "../DiningFeedbackMotion/colors";

const mainColors = tasteAxes.map((axis) => palette[axis].main);
const tintColors = tasteAxes.map((axis) => palette[axis].tint);

// A closed cubic color curve carries velocity through each palette stop.
// Unlike the card-change easing, it does not settle before every next color.
const flowingColor = (position: number, colors: readonly string[]) => {
  const slot = Math.floor(position);
  const t = position - slot;
  const color = (offset: number) =>
    colors[(slot + offset + colors.length) % colors.length];
  return (
    "#" +
    [1, 3, 5]
      .map((channel) => {
        const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((offset) =>
          parseInt(color(offset).slice(channel, channel + 2), 16),
        );
        const value =
          0.5 *
          (2 * p1 +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
        return Math.round(Math.max(0, Math.min(255, value)))
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
};

export const gridGradientPose = (
  frame: number,
  durationInFrames: number,
  still: boolean,
  cycles = 1,
) => {
  const duration = Math.max(2, durationInFrames);
  const local = still ? 0 : ((frame % duration) + duration) % duration;
  // Longer compositions repeat the same field while closing on their final frame.
  const phase = ((local / (duration - 1)) * cycles) % 1;
  const position = phase * mainColors.length;
  const support = flowingColor(position + 1, mainColors);
  return {
    mainCoverage: 0.6,
    motionRange: 2,
    colors: {
      background: flowingColor(position, tintColors),
      main: flowingColor(position, mainColors),
      // One main + the next taste in sequence. Both support blobs share one color.
      secondary: support,
      tertiary: support,
    },
    // Keep the result carousel's closed time path, with 1.2x color motion.
    elapsed: (1 - Math.cos(phase * Math.PI * 2)) * 3 * 2 * 1.2,
  };
};
