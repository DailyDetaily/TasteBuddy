/** Includes the actual + input and +N widths when finding the longest visible prefix. */
export function visibleChipCount(widths, available, gap, leadingWidth, countWidths) {
  for (let count = widths.length; count >= 0; count--) {
    const hidden = widths.length - count;
    const elements = count + Number(leadingWidth > 0) + Number(hidden > 0);
    const required = leadingWidth + widths.slice(0, count).reduce((sum, width) => sum + width, 0)
      + (hidden ? countWidths[hidden - 1] : 0) + Math.max(0, elements - 1) * gap;
    if (required <= available) return count;
  }
  return 0;
}
