// Sauce Splatter (소스 스플래터). Contract: docs/design/motion-system.md.
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

const OMEGA = 14;
const DAMPING = 0.58;
const FREQUENCY = OMEGA * Math.sqrt(1 - DAMPING * DAMPING);
const DECAY = OMEGA * DAMPING;
const PEAK_TIME = Math.PI / FREQUENCY;
const PEAK_AMOUNT = Math.exp(-DECAY * PEAK_TIME);
export const CHIP_DETACH_SECONDS = 0.22;
export const chipStart = (index: number) =>
  index === 0 ? 0 : 0.28 + (index - 1) * 0.38;
export const chipGrowStart = (index: number) =>
  index === 0 ? 0.12 : CHIP_DETACH_SECONDS;
export const chipPeak = (index: number) =>
  chipStart(index) + chipGrowStart(index) + PEAK_TIME;
export const chipRowDuration = (count: number) =>
  count > 0 ? chipStart(count - 1) + chipGrowStart(count - 1) + 0.8 : 0;

const spring = (seconds: number) => {
  if (seconds <= 0) return 0;
  if (seconds >= 0.8) return 1;
  return (
    1 -
    Math.exp(-DECAY * seconds) *
      (Math.cos(FREQUENCY * seconds) +
        (DECAY / FREQUENCY) * Math.sin(FREQUENCY * seconds))
  );
};

export type ChipPose = {
  x: number;
  width: number;
  height: number;
  age: number;
  visible: boolean;
  textOpacity: number;
};

export type ChipSeparation = {
  travelSeconds: number;
  neckStartSeconds: number;
  neckDurationSeconds: number;
};

export const chipRowPoses = (
  elapsed: number,
  widths: number[],
  height: number,
  gap = 6,
  separation?: ChipSeparation,
): ChipPose[] => {
  let left = 0;
  const poses: ChipPose[] = [];
  widths.forEach((width, index) => {
    const age = elapsed - chipStart(index);
    const growAt = chipGrowStart(index);
    const growthTime = age - growAt;
    const growth = spring(growthTime);
    const radius = (height / 2) * mix(0.2, 1, smooth(age / 0.12));
    const parent = poses[index - 1];
    const center = parent
      ? mix(
          parent.x + parent.width - 2,
          left + height / 2,
          smooth(age / (separation?.travelSeconds ?? 0.18)),
        )
      : left + height / 2;
    const squash = Math.max(0, growth - 1) / PEAK_AMOUNT;
    const rebound =
      growthTime > PEAK_TIME
        ? clamp((1 - growth) / (PEAK_AMOUNT * PEAK_AMOUNT))
        : 0;
    poses.push({
      age,
      visible: age >= 0,
      x: age < growAt ? center - radius : left,
      width: age < growAt ? radius * 2 : mix(height, width, growth),
      height:
        age < growAt
          ? radius * 2
          : height * (1 - 0.14 * squash + 0.025 * rebound),
      textOpacity: smooth((growth - 0.5) / 0.45),
    });
    left += width + gap;
  });
  return poses;
};

// A shrinking, tangent-aligned neck between the parent's right cap and the
// emerging circle. It is drawn into one silhouette with both chip bodies.
export const chipBridge = (
  parent: ChipPose,
  child: ChipPose,
  rowHeight: number,
  separation?: ChipSeparation,
) => {
  const neckStart = separation?.neckStartSeconds ?? 0.1;
  const neckDuration = separation?.neckDurationSeconds ?? 0.12;
  const detachAt = Math.min(CHIP_DETACH_SECONDS, neckStart + neckDuration);
  if (!parent.visible || !child.visible || child.age >= detachAt)
    return "";
  const detach = smooth((child.age - neckStart) / neckDuration);
  const angle = mix(1.1, 0.12, detach);
  const sin = Math.sin(angle),
    cos = Math.cos(angle);
  const a = parent.height / 2,
    b = child.height / 2;
  const centerY = rowHeight / 2;
  const ax = parent.x + parent.width - a + a * cos;
  const bx = child.x + b - b * cos;
  if (bx <= ax) return "";
  const ay = a * sin,
    by = b * sin;
  const neck = Math.min(a, b) * 0.5 * (1 - detach);
  const handle = Math.min(
    Math.max(0, ((ay + by) / 2 - neck) / (0.75 * cos)),
    ((bx - ax) * 0.48) / sin,
  );
  const dx = handle * sin,
    dy = handle * cos;
  return (
    `M${ax} ${centerY - ay}` +
    `C${ax + dx} ${centerY - ay + dy} ${bx - dx} ${centerY - by + dy} ${bx} ${centerY - by}` +
    `L${bx} ${centerY + by}` +
    `C${bx - dx} ${centerY + by - dy} ${ax + dx} ${centerY + ay - dy} ${ax} ${centerY + ay}Z`
  );
};
