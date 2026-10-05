import { kaliceGlyphs, kaliceKerning } from "./kalice.generated";

const tracking = -0.8;
const measure = (text: string) =>
  [...text].reduce(
    (width, char, index) =>
      width +
      kaliceGlyphs[char].advance +
      (index ? tracking + (kaliceKerning[text[index - 1] + char] ?? 0) : 0),
    0,
  );

const wrap = (text: string, maxUnits: number) => {
  const lines: string[] = [];
  let current = "";
  for (const word of text.trim().split(/\s+/)) {
    const proposed = current ? `${current} ${word}` : word;
    if (current && measure(proposed) > maxUnits) {
      lines.push(current);
      current = word;
    } else current = proposed;
  }
  if (current) lines.push(current);
  return lines;
};

export const shapeStatement = (
  text: string,
  maxWidth: number,
  maxSize: number,
  maxLines: number,
) => {
  const copy = text.trim().replace(/\s+/g, " ");
  for (const char of copy)
    if (!kaliceGlyphs[char])
      throw new Error(`Unsupported Kalice glyph: ${char}`);
  let size = maxSize;
  let lines = wrap(copy, (maxWidth * 100) / size);
  while (
    size > 12 &&
    (lines.length > maxLines ||
      lines.some((line) => (measure(line) * size) / 100 > maxWidth))
  ) {
    size -= 1;
    lines = wrap(copy, (maxWidth * 100) / size);
  }
  let letterIndex = 0;
  return {
    size,
    height: lines.length * size * 1.16,
    lines: lines.map((line, row) => {
      let x = (maxWidth - (measure(line) * size) / 100) / 2;
      return [...line].map((char, index) => {
        const glyph = kaliceGlyphs[char];
        if (index)
          x +=
            ((tracking + (kaliceKerning[line[index - 1] + char] ?? 0)) * size) /
            100;
        const placement = {
          glyph,
          x,
          baseline: size * (0.84 + row * 1.16),
          letterIndex: glyph.d ? letterIndex++ : -1,
        };
        x += (glyph.advance * size) / 100;
        return placement;
      });
    }),
  };
};
