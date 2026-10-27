import { getLength, getPointAtLength } from "@remotion/paths";
import type { LinePoint } from "./line-motion";
import { buildRoundedLinePath } from "../../../src/components/system/roundedLinePath";

/** All product and motion surfaces share the complete, fixed path. */
export const roundedLineTrackPath = (points: LinePoint[], radius: number) =>
  buildRoundedLinePath(points, radius * 2);

export type RoundedLineTrack = {
  path: string;
  length: number;
  points: LinePoint[];
  distances: number[];
};

// Studio can render many frames with identical geometry. Bound the caches so
// editing Inspector values does not retain an unlimited number of old paths.
const trackCache = new Map<string, RoundedLineTrack>();
const distanceCache = new Map<string, number>();

export const pointOnRoundedTrack = (
  track: Pick<RoundedLineTrack, "path" | "length" | "points">,
  distance: number,
): LinePoint => {
  if (distance <= 0) return { ...track.points[0] };
  if (distance >= track.length)
    return { ...track.points[track.points.length - 1] };
  return getPointAtLength(track.path, distance)!;
};

/** Monotone x is guaranteed by the chronological mini-line layout. */
export const roundedTrackDistanceAtX = (
  track: Pick<RoundedLineTrack, "path" | "length" | "points">,
  x: number,
) => {
  if (x <= track.points[0].x) return 0;
  if (x >= track.points[track.points.length - 1].x) return track.length;
  const key = `${track.path}|${x}`;
  const cached = distanceCache.get(key);
  if (cached !== undefined) return cached;
  let from = 0,
    to = track.length;
  for (let step = 0; step < 36; step++) {
    const mid = (from + to) / 2;
    if (pointOnRoundedTrack(track, mid).x < x) from = mid;
    else to = mid;
  }
  const distance = (from + to) / 2;
  if (distanceCache.size >= 256) distanceCache.clear();
  distanceCache.set(key, distance);
  return distance;
};

export const roundedLineTrack = (
  points: LinePoint[],
  radius: number,
): RoundedLineTrack => {
  const path = roundedLineTrackPath(points, radius);
  const cached = trackCache.get(path);
  if (cached) return cached;
  const track = { path, length: path ? getLength(path) : 0, points };
  const result = {
    ...track,
    distances: points.map((point) => roundedTrackDistanceAtX(track, point.x)),
  };
  if (trackCache.size >= 16) trackCache.clear();
  trackCache.set(path, result);
  return result;
};

/** One visible interval on an unchanged SVG path, with round end caps. */
export const roundedTrackWindow = (
  length: number,
  from: number,
  to: number,
) => ({
  strokeDasharray: `${Math.max(0, to - from)} ${length + 1}`,
  strokeDashoffset: -from,
});
