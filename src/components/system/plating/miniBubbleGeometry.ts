import { COMPONENT_TOKENS } from '../../../constants/designTokens';

/** A row of area-proportional circles. Placement carries no data value. */
export function miniBubbleGeometry(values: readonly (number | null)[]) {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const positive = values.flatMap((value, index) =>
    value != null && Number.isFinite(value) && value > 0 ? [{ index, value }] : []);
  if (!positive.length) return [];
  const maximum = positive.reduce((max, item) => Math.max(max, item.value), 0);
  const gap = Math.min(4, width / (positive.length * 2));
  const diameters = positive.map(item => height * Math.sqrt(item.value / maximum));
  const totalDiameter = diameters.reduce((sum, diameter) => sum + diameter, 0);
  const gapsWidth = gap * (positive.length - 1);
  const scale = Math.min(1, (width - gapsWidth) / totalDiameter);
  let cursor = width - totalDiameter * scale - gapsWidth;
  return positive.map((item, i) => {
    const diameter = diameters[i] * scale;
    const circle = { ...item, cx: cursor + diameter / 2, cy: height / 2, radius: diameter / 2 };
    cursor += diameter + gap;
    return circle;
  });
}
