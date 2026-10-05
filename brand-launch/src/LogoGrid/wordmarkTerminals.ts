// Rounded terminals measured on the supplied SVG, in its original coordinates.
// Every source is inside its own glyph. Counters and neighboring letters are
// excluded when the propagation field is generated.
export const wordmarkTerminals: Record<
  number,
  readonly (readonly [number, number])[]
> = {
  2: [
    [441, 176.2],
    [511.1, 176.2],
    [461.5, 240],
    [490.7, 240],
  ],
  3: [
    [500.8, 199.7],
    [547.8, 234.5],
  ],
  4: [
    [545, 224.4],
    [579.8, 198.1],
  ],
  5: [
    [593.6, 164.2],
    [577.6, 185.3],
    [615.1, 185],
    [615.8, 229.4],
  ],
  6: [[659.8, 224.7]],
  7: [
    [461.5, 258],
    [461.5, 337],
    [487.7, 295.7],
  ],
  8: [
    [521.2, 285],
    [559.7, 285],
    [587, 331.3],
  ],
  9: [
    [615, 258],
    [643.4, 332],
  ],
  10: [
    [671, 258],
    [699.2, 332],
  ],
  11: [
    [687.6, 281.5],
    [711.5, 281.3],
    [729.6, 281.5],
    [751.5, 281.5],
    [694, 360.2],
  ],
};
