import { WordmarkTerminalFill } from "../LogoGrid/WordmarkTerminalFill";
import { letterFillAt } from "./motion";
import { shapeStatement } from "./typography";

export const TerminalStatement = ({
  text,
  frame,
  start,
  fillFrames,
  stagger,
  width,
  size,
  maxLines,
  color,
  prefix,
}: {
  text: string;
  frame: number;
  start: number;
  fillFrames: number;
  stagger: number;
  width: number;
  size: number;
  maxLines: number;
  color: string;
  prefix: string;
}) => {
  const shaped = shapeStatement(text, width, size, maxLines);
  const weightFilter = `${prefix}-kalice-weight`;
  // Thicken the revealed ink, so the weight is consistent during the fill and
  // at the settled endpoint. The underlying Kalice outlines/fields stay intact.
  const weightRadius = shaped.size * 0.009;
  return (
    <svg
      role="img"
      aria-label={text}
      width={width}
      height={shaped.height}
      viewBox={`0 0 ${width} ${shaped.height}`}
      data-kalice-statement={prefix}
      data-font="Kalice"
      data-weight-radius={weightRadius}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <filter
          id={weightFilter}
          x="-2%"
          y="-20%"
          width="104%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius={weightRadius}
            result="thickerInk"
          />
          <feFlood floodColor={color} />
          <feComposite in2="thickerInk" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${weightFilter})`}>
        {shaped.lines
          .flat()
          .filter(({ glyph }) => glyph.d)
          .map(({ glyph, x, baseline, letterIndex }) => (
            <g
              key={letterIndex}
              transform={`translate(${x} ${baseline}) scale(${shaped.size / 100})`}
            >
              <WordmarkTerminalFill
                node={{
                  index: glyph.index,
                  name: glyph.name,
                  role: "kinetic.statement",
                  tag: "path",
                  props: { d: glyph.d, fill: color },
                  center: [0, 0],
                }}
                map={glyph.map}
                progress={letterFillAt(
                  frame,
                  start,
                  letterIndex,
                  fillFrames,
                  stagger,
                )}
                prefix={`${prefix}-${letterIndex}-`}
              />
            </g>
          ))}
      </g>
    </svg>
  );
};
