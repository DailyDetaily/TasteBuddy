import { useId } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const countingChange = (value: number, progress: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${(Math.abs(value) * clamp(progress)).toFixed(1)}%`;

export const AnimatedTasteIndicator: React.FC<{
  colors: string[];
  weights?: number[];
  progress: number;
}> = ({ colors, weights = [], progress }) => {
  const id = useId().replace(/:/g, "");
  const p = clamp(progress);
  const first = colors[0] ?? "#D1D1D1";
  const last = colors[colors.length - 1] ?? first;
  const total = colors.reduce(
    (sum, _, index) => sum + Math.abs(weights[index] ?? 0),
    0,
  );
  const normalized = colors.map((_, index) =>
    total > 0 ? Math.abs(weights[index] ?? 0) / total : 1 / colors.length,
  );
  let cumulative = 0;
  const stops = [{ color: first, offset: 0 }];
  colors.slice(0, -1).forEach((color, index) => {
    cumulative += normalized[index];
    const half = Math.min(
      0.16,
      normalized[index] / 2,
      normalized[index + 1] / 2,
    );
    stops.push(
      { color, offset: Math.max(0, cumulative - half) },
      { color: colors[index + 1], offset: Math.min(1, cumulative + half) },
    );
  });
  stops.push({ color: last, offset: 1 });
  // Soft color diffusion from the upper/lower edges inside a fixed circle.
  // Sample a feathered front, rather than expanding two circular reveals.
  const diffusion = Array.from({ length: 33 }, (_, index) => {
    const y = index / 32;
    const distance = Math.min(y, 1 - y);
    const t = clamp((p * 0.94 - distance) / 0.44);
    return { offset: y, opacity: t * t * (3 - 2 * t) };
  });
  return (
    <svg
      data-taste-indicator={p}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${id}-color`} x1="0" y1="0" x2="0" y2="1">
          {stops.map((stop, index) => (
            <stop key={index} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-diffusion`} x1="0" y1="0" x2="0" y2="1">
          {diffusion.map((stop, index) => (
            <stop
              key={index}
              offset={stop.offset}
              stopColor="white"
              stopOpacity={stop.opacity}
            />
          ))}
        </linearGradient>
        <mask
          id={`${id}-reveal`}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={16}
          height={16}
          style={{ maskType: "alpha" }}
        >
          <rect width={16} height={16} fill={`url(#${id}-diffusion)`} />
        </mask>
      </defs>
      <circle cx={8} cy={8} r={8} fill="#D1D1D1" />
      {p > 0 && (
        <circle
          cx={8}
          cy={8}
          r={8}
          fill={`url(#${id}-color)`}
          mask={p < 1 ? `url(#${id}-reveal)` : undefined}
        />
      )}
    </svg>
  );
};

export const AnimatedTrendArrow: React.FC<{
  value: number;
  color: string;
  progress: number;
}> = ({ value, color, progress }) => {
  const id = useId().replace(/:/g, "");
  const p = clamp(progress);
  const angle = value > 0 ? -45 : value < 0 ? 45 : 0;
  const path =
    value > 0
      ? "M7 7H17V17M7 17L17 7"
      : value < 0
        ? "M7 7L17 17M17 7V17H7"
        : "M5 12H19";
  return (
    <svg
      data-trend-arrow={p}
      width={18}
      height={18}
      viewBox="0 0 18 18"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <clipPath id={`${id}-fill`}>
          {/* Sweep along the shaft from its tail toward the arrowhead. */}
          <rect
            x={4.5}
            y={-9}
            width={9 * p}
            height={36}
            transform={`rotate(${angle} 9 9)`}
          />
        </clipPath>
      </defs>
      <rect width={18} height={18} rx={4} fill={color} />
      {p > 0 && (
        <g clipPath={p < 1 ? `url(#${id}-fill)` : undefined}>
          <svg x={3} y={3} width={12} height={12} viewBox="0 0 24 24">
            <path
              d={path}
              fill="none"
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </g>
      )}
    </svg>
  );
};
