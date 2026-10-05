import type { Viewport } from "./motion";

export const StatusBar = ({
  size,
  light,
}: {
  size: Viewport;
  light: boolean;
}) => (
  <svg
    viewBox={`0 0 ${size.width} ${size.height}`}
    width="100%"
    height="100%"
    aria-label="상태표시줄: 9시 41분, 통신 신호, Wi-Fi, 배터리"
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 10,
      color: light ? "#FFFFFF" : "#111111",
    }}
  >
    <text
      x={31}
      y={36}
      fill="currentColor"
      fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
      fontSize={17}
      fontWeight={600}
    >
      9:41
    </text>
    <g transform={`translate(${size.width - 106},24)`} fill="currentColor">
      {[6, 9, 12, 15].map((height, i) => (
        <rect
          key={height}
          x={i * 5.5}
          y={15 - height}
          width={3.7}
          height={height}
          rx={1.1}
        />
      ))}
    </g>
    <g
      transform={`translate(${size.width - 77},23)`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
    >
      <path d="M0 4 Q9 -3 18 4 M3.5 8 Q9 3.5 14.5 8 M7 12 Q9 10.5 11 12" />
      <circle cx={9} cy={15} r={1.1} fill="currentColor" stroke="none" />
    </g>
    <g transform={`translate(${size.width - 48},24)`} fill="currentColor">
      <rect
        width={25}
        height={13}
        rx={3.5}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.1}
        opacity={0.5}
      />
      <rect x={2.2} y={2.2} width={19} height={8.6} rx={1.5} />
      <path d="M27 4.2 V8.8 Q30 6.5 27 4.2" opacity={0.5} />
    </g>
  </svg>
);
