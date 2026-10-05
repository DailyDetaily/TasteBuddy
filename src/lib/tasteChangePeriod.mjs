// Calendar months match TasteChangeFocusView; clamp month-end dates before filtering.
function addMonths(timestamp, months) {
  const date = new Date(timestamp);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date.getTime();
}

export function tasteChangeBounds(points, months, offset = 0, now = Date.now()) {
  const latest = points.length ? Math.max(...points.map(point => point.date)) : now;
  if (months === 0) return { start: points.length ? Math.min(...points.map(point => point.start)) : latest, end: latest };
  const end = addMonths(latest, offset * months);
  return { start: addMonths(end, -months), end };
}
