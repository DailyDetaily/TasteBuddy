import { COMPONENT_TOKENS } from '../../../constants/designTokens';

/** Calendar layout: Monday-first columns, then chronological week rows. */
export function miniHeatmapGeometry(values: readonly (number | null)[], startDay = 0) {
  const { width, height } = COMPONENT_TOKENS.miniChart;
  const offset = Number.isInteger(startDay) && startDay >= 0 && startDay < 7 ? startDay : 0;
  if (!values.length) return [];
  const columns = 7;
  const rows = Math.ceil((values.length + offset) / 7);
  const gap = Math.min(2, Math.min(width / (columns * 2), height / (rows * 2)));
  const cellWidth = (width - gap * (columns - 1)) / columns;
  const cellHeight = (height - gap * (rows - 1)) / rows;
  return Array.from({ length: rows * columns }, (_, slot) => {
    const index = slot - offset;
    const padding = index < 0 || index >= values.length;
    const value = padding ? null : values[index];
    const valid = value != null && Number.isFinite(value) && value >= 0;
    return {
      index, padding, value: valid ? value : null,
      level: padding ? 0 : !valid ? null : value === 0 ? 0 : Math.min(4, Math.ceil(value)),
      x: slot % columns * (cellWidth + gap),
      y: Math.floor(slot / columns) * (cellHeight + gap),
      width: cellWidth, height: cellHeight,
    };
  });
}
