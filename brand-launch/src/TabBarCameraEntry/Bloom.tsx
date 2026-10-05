import { useId } from "react";
import { rgba } from "../TabBarPlusButton/motion";
import { FeedbackBackground } from "../DiningFeedbackMotion/Background";
import {
  bloomGeometry,
  bloomState,
  radialBlobPath,
  resultBackgroundColors,
  type EntryColorState,
  smoothStep,
  type Point,
  type Viewport,
} from "./motion";

export const CameraEntryBloom = ({
  elapsed,
  size,
  origin,
  sourceRadius,
  background,
  opacity,
  buttonState,
}: {
  elapsed: number;
  size: Viewport;
  origin: Point;
  sourceRadius: number;
  background: string;
  opacity: number;
  buttonState: EntryColorState;
}) => {
  const id = useId().replace(/:/g, "");
  const ref = (name: string) => `url(#${id}-${name})`;
  const { progress, expansion, phase, colors } = bloomState(
    elapsed,
    buttonState,
  );
  const geometry = bloomGeometry(size, origin, expansion, sourceRadius);
  const outer = radialBlobPath(
    size,
    origin,
    geometry.radius,
    phase,
    expansion,
    sourceRadius,
  );
  const inner = radialBlobPath(
    size,
    origin,
    geometry.revealRadius,
    phase - Math.PI / 7,
    expansion,
    sourceRadius,
  );
  const edgeOpacity =
    smoothStep(progress / 0.1) * (1 - smoothStep((progress - 0.92) / 0.08));
  const region = {
    x: -80,
    y: -80,
    width: size.width + 160,
    height: size.height + 160,
  };

  return (
    <svg
      viewBox={`0 0 ${size.width} ${size.height}`}
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-label="버튼에서 확장되는 카메라 진입 그라데이션"
    >
      <defs>
        <filter
          id={`${id}-outer-blur`}
          filterUnits="userSpaceOnUse"
          {...region}
        >
          <feGaussianBlur stdDeviation={geometry.maskFeather} />
        </filter>
        <filter
          id={`${id}-inner-blur`}
          filterUnits="userSpaceOnUse"
          {...region}
        >
          <feGaussianBlur stdDeviation={geometry.revealFeather} />
        </filter>
        <filter id={`${id}-edge-blur`} filterUnits="userSpaceOnUse" {...region}>
          <feGaussianBlur stdDeviation={geometry.edgeBlur} />
        </filter>
        <mask id={`${id}-outer`} maskUnits="userSpaceOnUse" {...region}>
          <path d={outer} fill="white" filter={ref("outer-blur")} />
        </mask>
        <mask id={`${id}-reveal`} maskUnits="userSpaceOnUse" {...region}>
          <rect {...region} fill="white" />
          {geometry.revealRadius > 0 && (
            <path
              d={inner}
              fill="black"
              filter={ref("inner-blur")}
            />
          )}
        </mask>
        <radialGradient
          id={`${id}-edge`}
          gradientUnits="userSpaceOnUse"
          cx={origin.x}
          cy={origin.y}
          r={geometry.radius + 120}
          fr={Math.max(geometry.radius - 120, 0)}
        >
          <stop stopColor={rgba(colors[0])} stopOpacity={0.46} />
          <stop offset={0.58} stopColor={rgba(colors[1])} stopOpacity={0.38} />
          <stop offset={1} stopColor="white" stopOpacity={0.16} />
        </radialGradient>
        <linearGradient
          id={`${id}-rim`}
          gradientUnits="userSpaceOnUse"
          x1={origin.x - geometry.radius}
          y1={origin.y + geometry.radius}
          x2={origin.x + geometry.radius}
          y2={origin.y - geometry.radius}
        >
          <stop stopColor={rgba(colors[0])} stopOpacity={0.92} />
          <stop offset={0.52} stopColor={rgba(colors[1])} stopOpacity={0.82} />
          <stop offset={1} stopColor={rgba(colors[0])} stopOpacity={0.92} />
        </linearGradient>
      </defs>
      <g mask={ref("reveal")}>
        {/* Static material surrogate: exported video has no live camera backdrop. */}
        <rect width={size.width} height={size.height} fill={background} />
        <rect
          width={size.width}
          height={size.height}
          fill="white"
          opacity={0.34 + 0.48 * smoothStep(progress / 0.18)}
        />
        <g mask={ref("outer")}>
          <foreignObject x={0} y={0} width={size.width} height={size.height}>
            <div
              style={{
                position: "relative",
                width: size.width,
                height: size.height,
              }}
            >
              <FeedbackBackground
                colors={resultBackgroundColors(buttonState)}
                elapsed={(buttonState.phase * 3.6) / (Math.PI * 2)}
                width={size.width}
                height={size.height}
              />
            </div>
          </foreignObject>
        </g>
      </g>
      <g opacity={edgeOpacity} filter={ref("edge-blur")} fill="none">
        <path d={outer} stroke={ref("edge")} strokeWidth={geometry.edgeWidth} />
        <path d={outer} stroke={ref("rim")} strokeWidth={2.2} />
      </g>
    </svg>
  );
};
