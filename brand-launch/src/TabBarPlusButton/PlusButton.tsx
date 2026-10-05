import { useId } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  beamState,
  blobGeometry,
  COLOR_INSET,
  filterColor,
  limitLuminance,
  pairNames,
  rgba,
  type BeamColor,
  type BeamState,
} from "./motion";
import type { PlusButtonProps } from "./settings";

type Pair = readonly [BeamColor, BeamColor];
type Stop = readonly [BeamColor, number, number];
const white: BeamColor = [1, 1, 1];
const circle = { cx: 24, cy: 24 };
const plus = "M24 17V31M17 24H31";
const url = (id: string) => `url(#${id})`;

const colors = (
  state: BeamState,
  brightness: number,
  saturation: number,
  contrast = 1,
  maximum?: number,
  hueMultiplier = 1,
): Pair => {
  const result = [state.first, state.second].map((color) => {
    const filtered = filterColor(
      color,
      state.hue * hueMultiplier,
      brightness,
      saturation,
      contrast,
    );
    return maximum === undefined ? filtered : limitLuminance(filtered, maximum);
  });
  return [result[0], result[1]];
};

const Conic = ({
  stops,
  angle,
  mask,
  opacity = 1,
}: {
  stops: readonly Stop[];
  angle: number;
  mask?: string;
  opacity?: number;
}) => (
  <foreignObject
    x={0}
    y={0}
    width={48}
    height={48}
    mask={mask}
    opacity={opacity}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: `conic-gradient(from ${(angle * 180) / Math.PI + 90}deg, ${stops.map(([color, alpha, position]) => `${rgba(color, alpha)} ${position * 100}%`).join(",")})`,
      }}
    />
  </foreignObject>
);

const BlobTrack = ({
  id,
  phase,
  pair,
}: {
  id: string;
  phase: number;
  pair: Pair;
}) => (
  <g>
    <defs>
      {pair.map((color, index) => (
        <radialGradient
          key={index}
          id={`${id}-${index}`}
          colorInterpolation="sRGB"
        >
          <stop offset={0} stopColor={rgba(color)} />
          <stop offset={0.78} stopColor={rgba(color)} stopOpacity={0} />
          <stop offset={1} stopColor={rgba(color)} stopOpacity={0} />
        </radialGradient>
      ))}
    </defs>
    {blobGeometry(phase)
      .map((blob, index) => ({ ...blob, index }))
      .reverse()
      .map((blob) => (
        <ellipse
          key={blob.index}
          cx={blob.cx}
          cy={blob.cy}
          rx={blob.rx}
          ry={blob.ry}
          fill={url(`${id}-${blob.color}`)}
        />
      ))}
  </g>
);

export const LiquidPlusButton = ({
  state,
  size,
  pressed,
  glass,
}: {
  state: BeamState;
  size: number;
  pressed: boolean;
  glass: number;
}) => {
  const id = `plus-${useId().replace(/:/g, "")}`;
  const wash = colors(state, 1.04, 1.46, 1.1, 0.58);
  const core = colors(state, 1.1, 1.58, 1.12, 0.62);
  const inner = colors(state, 1, 1);
  const stroke = colors(state, 1.28, 1.46, 1.08, undefined, 26 / 18);
  const bloom = colors(state, 1.04, 1);
  const iconShadow = colors(state, 0.9, 1.74, 1.18, 0.46);
  const edge = colors(state, 1.16, 1.82, 1.1, 0.7).map(
    (c) => c.map((v) => v + (1 - v) * 0.03) as unknown as BeamColor,
  ) as unknown as Pair;
  const coreScale = 1.06 * (pressed ? 0.94 : 1);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Taste Buddy liquid glass plus button"
      style={{ overflow: "visible", transform: `scale(${pressed ? 0.98 : 1})` }}
    >
      <defs>
        <clipPath id={`${id}-body`}>
          <circle {...circle} r={24} />
        </clipPath>
        <clipPath id={`${id}-color`}>
          <circle {...circle} r={24 - COLOR_INSET} />
        </clipPath>
        <filter
          id={`${id}-coreBlur`}
          filterUnits="userSpaceOnUse"
          x={-1}
          y={-1}
          width={50}
          height={50}
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={0.15} />
        </filter>
        <filter
          id={`${id}-bloomBlur`}
          filterUnits="userSpaceOnUse"
          x={-10}
          y={-10}
          width={68}
          height={68}
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={3.25} />
        </filter>
        <filter
          id={`${id}-glassBlur`}
          filterUnits="userSpaceOnUse"
          x={-3}
          y={-3}
          width={54}
          height={54}
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={0.55 * glass} />
        </filter>
        <filter
          id={`${id}-causticBlur`}
          filterUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={48}
          height={48}
        >
          <feGaussianBlur stdDeviation={0.8} />
        </filter>
        <filter
          id={`${id}-iconBlur`}
          filterUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={48}
          height={48}
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation={3.4} />
        </filter>
        <linearGradient id={`${id}-innerY`} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="white" />
          <stop offset={20 / 48} stopColor="white" stopOpacity={0} />
          <stop offset={1 - 20 / 48} stopColor="white" stopOpacity={0} />
          <stop offset={1} stopColor="white" />
        </linearGradient>
        <linearGradient id={`${id}-innerX`} x1="0" y1="0" x2="1" y2="0">
          <stop offset={0} stopColor="white" />
          <stop offset={20 / 48} stopColor="white" stopOpacity={0} />
          <stop offset={1 - 20 / 48} stopColor="white" stopOpacity={0} />
          <stop offset={1} stopColor="white" />
        </linearGradient>
        <mask id={`${id}-inner`} style={{ maskType: "alpha" }}>
          <rect width={48} height={48} fill={url(`${id}-innerY`)} />
          <rect width={48} height={48} fill={url(`${id}-innerX`)} />
        </mask>
        <mask id={`${id}-stroke`}>
          <circle
            {...circle}
            r={24}
            fill="none"
            stroke="white"
            strokeWidth={1.65}
          />
        </mask>
        <mask id={`${id}-rim`}>
          <circle
            {...circle}
            r={24 - 1.25 / 2}
            fill="none"
            stroke="white"
            strokeWidth={1.25}
          />
        </mask>
        <mask id={`${id}-pressedWide`}>
          <circle
            {...circle}
            r={24 - 8.5 / 2}
            fill="none"
            stroke="white"
            strokeWidth={8.5}
          />
        </mask>
        <mask id={`${id}-pressedFine`}>
          <circle
            {...circle}
            r={20 - 4.5 / 2}
            fill="none"
            stroke="white"
            strokeWidth={4.5}
          />
        </mask>
        <radialGradient id={`${id}-pressedFill`}>
          <stop offset={0} stopColor="white" stopOpacity={0} />
          <stop offset={0.48} stopColor={rgba(edge[0])} stopOpacity={0.04} />
          <stop offset={0.7} stopColor={rgba(edge[1])} stopOpacity={0.3} />
          <stop offset={0.91} stopColor={rgba(edge[0])} stopOpacity={0.72} />
          <stop offset={1} stopColor={rgba(edge[1])} stopOpacity={0.54} />
        </radialGradient>
        <radialGradient id={`${id}-lens`}>
          <stop offset={0.65} stopColor="white" stopOpacity={0} />
          <stop offset={0.88} stopColor="white" stopOpacity={0.02} />
          <stop offset={0.96} stopColor="white" stopOpacity={0.21} />
          <stop offset={1} stopColor="white" stopOpacity={0.55} />
        </radialGradient>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
          <stop offset={0} stopColor="white" stopOpacity={0.1} />
          <stop offset={0.43} stopColor="white" stopOpacity={0} />
          <stop offset={1} stopColor="white" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id={`${id}-iconColor`} x1="0" y1="0" x2="1" y2="1">
          <stop offset={0} stopColor={rgba(iconShadow[0], 0.46)} />
          <stop offset={0.46} stopColor={rgba(iconShadow[1], 0.38)} />
          <stop offset={1} stopColor={rgba(iconShadow[0], 0.46)} />
        </linearGradient>
      </defs>

      <g clipPath={url(`${id}-body`)}>
        <circle {...circle} r={24} fill="white" fillOpacity={0.44 * glass} />
        <g clipPath={url(`${id}-color`)}>
          <g filter={url(`${id}-glassBlur`)}>
            <Conic
              angle={state.phase}
              opacity={0.82 * (pressed ? 0.46 : 1)}
              stops={[
                [wash[0], 0.95, 0],
                [wash[0], 0.18, 0.21],
                [wash[1], 0.92, 0.44],
                [wash[1], 0.24, 0.62],
                [wash[0], 0.88, 0.78],
                [wash[0], 0.95, 1],
              ]}
            />
            <g
              opacity={pressed ? 0.36 : 1}
              filter={url(`${id}-coreBlur`)}
              transform={`translate(24 24) scale(${coreScale}) translate(-24 -24)`}
            >
              <BlobTrack id={`${id}-core`} phase={state.phase} pair={core} />
            </g>
            <g mask={url(`${id}-inner`)} opacity={0.8}>
              <BlobTrack id={`${id}-inside`} phase={state.phase} pair={inner} />
            </g>
            <g mask={url(`${id}-stroke`)}>
              <BlobTrack id={`${id}-edge`} phase={state.phase} pair={stroke} />
            </g>
            <g filter={url(`${id}-bloomBlur`)}>
              <g mask={url(`${id}-stroke`)}>
                <BlobTrack
                  id={`${id}-bloom`}
                  phase={state.phase}
                  pair={bloom}
                />
              </g>
            </g>
            {pressed ? (
              <g opacity={0.96} style={{ mixBlendMode: "plus-lighter" }}>
                <circle {...circle} r={24} fill={url(`${id}-pressedFill`)} />
                <Conic
                  angle={state.phase * 1.22}
                  mask={url(`${id}-pressedWide`)}
                  stops={[
                    [edge[0], 0.98, 0],
                    [edge[1], 0.68, 0.28],
                    [edge[0], 0.2, 0.48],
                    [edge[1], 0.86, 0.72],
                    [edge[0], 0.98, 1],
                  ]}
                />
                <Conic
                  angle={-state.phase * 0.84 + Math.PI / 5}
                  mask={url(`${id}-pressedFine`)}
                  stops={[
                    [edge[1], 0.84, 0],
                    [edge[0], 0.24, 0.36],
                    [edge[1], 0.74, 0.64],
                    [edge[0], 0.84, 1],
                  ]}
                />
              </g>
            ) : null}
          </g>
        </g>

        {/* Optical approximation of iOS .glassEffect; native motion above is ported directly. */}
        <circle
          {...circle}
          r={24}
          fill="white"
          fillOpacity={(pressed ? 0.56 : 0.48) * glass}
        />
        <circle {...circle} r={24} fill={url(`${id}-lens`)} opacity={glass} />
        <circle {...circle} r={24} fill={url(`${id}-light`)} opacity={glass} />
        <Conic
          angle={(-28 * Math.PI) / 180}
          opacity={0.82 * glass}
          mask={url(`${id}-rim`)}
          stops={[
            [white, 0.84, 0],
            [white, 0.18, 0.18],
            [white, 0.1, 0.33],
            [white, 0.28, 0.49],
            [white, 0.56, 0.72],
            [white, 0.84, 1],
          ]}
        />
        <circle
          {...circle}
          r={22}
          fill="none"
          stroke="white"
          strokeOpacity={0.32 * glass}
          strokeWidth={1}
          filter={url(`${id}-causticBlur`)}
        />
        <g opacity={0.3 * (pressed ? 1.18 : 1)} filter={url(`${id}-iconBlur`)}>
          <path
            d={plus}
            fill="none"
            stroke={url(`${id}-iconColor`)}
            strokeWidth={3}
            strokeLinecap="round"
            transform="translate(24 25.2) scale(1.42) translate(-24 -24)"
          />
        </g>
        <path
          d={plus}
          fill="none"
          stroke="white"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export const TabBarPlusButton = (props: PlusButtonProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const state = beamState(
    frame,
    fps,
    props.속도,
    pairNames.indexOf(props["시작 색 조합"]),
    props.재생 === "정지",
  );
  return (
    <AbsoluteFill
      style={{
        backgroundColor: props["배경 색"],
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LiquidPlusButton
        state={state}
        size={props["버튼 크기"]}
        pressed={props.상태 === "누름"}
        glass={props["글래스 강도"]}
      />
    </AbsoluteFill>
  );
};
