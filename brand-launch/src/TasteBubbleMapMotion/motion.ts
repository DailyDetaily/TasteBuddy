import {
  BASE_BUBBLES,
  GRID_FINAL_ZOOM,
  MAP,
  buildBubbleGrid,
  expandBubbleGrid,
  relaxBubbles,
} from "./layout";
import {
  NATIVE_SHEET_SETTLING,
  nativeSheetSpring,
  nativeVeilOpacity,
} from "./native-spring";
import { FINALE, finaleState, reverseBubbleExit, rotateMapPoint } from "./finale";
import type { BubbleMapProps } from "./settings";
import type { Bubble, MapFrame, Point } from "./types";

export const BUBBLE_FPS = 30;
export const INTRO_SECONDS =
  Math.max(...BASE_BUBBLES.map((bubble) => bubble.introDelay)) +
  NATIVE_SHEET_SETTLING;
export const LOOP_SECONDS = 14;
export const MAIN_DEMO_SECONDS = FINALE.end;
export const DEMO_IDS = [
  "salty-balanced",
  "umami-clear",
  "fat-buttery",
] as const;
export const FULL_MAP_ZOOM = GRID_FINAL_ZOOM;
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const ease = (n: number) => {
  const t = clamp01(n);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const between = (a: Point, b: Point, p: number): Point => ({
  x: mix(a.x, b.x, p),
  y: mix(a.y, b.y, p),
});

type Pose = {
  time: number;
  focus: string | null;
  selected: readonly string[];
  enlarged: readonly string[];
  highlight: readonly string[];
  pan: Point;
  zoom: number;
  fullMapReveal: number;
  atlasReveal: number;
  drift: number;
};
const overview: Omit<Pose, "time"> = {
  focus: null,
  selected: [],
  enlarged: [],
  highlight: [],
  pan: { x: 0, y: 0 },
  zoom: MAP.entryZoom,
  fullMapReveal: 0,
  atlasReveal: 1,
  drift: 1,
};
const fullOverview: Omit<Pose, "time"> = {
  focus: null,
  selected: [],
  enlarged: [],
  highlight: [],
  pan: { x: 0, y: 0 },
  zoom: FULL_MAP_ZOOM,
  fullMapReveal: 1,
  atlasReveal: 1,
  drift: 0,
};
const mapCenter = (enlarged: readonly string[] = []): Omit<Pose, "time"> => ({
  focus: null,
  selected: [],
  enlarged,
  highlight: [],
  pan: { x: 0, y: 0 },
  zoom: MAP.selectedZoom,
  fullMapReveal: 0,
  atlasReveal: 1,
  drift: 0,
});
const centered = (
  focus: string,
  selected: readonly string[],
  enlarged: readonly string[] = selected.includes(focus)
    ? selected
    : [...selected, focus],
): Omit<Pose, "time"> => ({
  focus,
  selected,
  enlarged,
  highlight: enlarged,
  pan: { x: 0, y: 0 },
  zoom: MAP.selectedZoom,
  fullMapReveal: 0,
  atlasReveal: 1,
  drift: 1,
});
// Main film: preserve the original interaction through the 3-selection state,
// then separate deselection, shrink, full-map reveal and final hold.
export const POSES: readonly Pose[] = [
  { time: 0, ...overview },
  { time: 0.8, ...overview, pan: { x: 26, y: -14 } },
  { time: 2.4, ...centered(DEMO_IDS[0], []) },
  { time: 3.0, ...centered(DEMO_IDS[0], DEMO_IDS.slice(0, 1)) },
  { time: 4.0, ...centered(DEMO_IDS[0], DEMO_IDS.slice(0, 1)) },
  { time: 5.6, ...centered(DEMO_IDS[1], DEMO_IDS.slice(0, 1)) },
  { time: 6.2, ...centered(DEMO_IDS[1], DEMO_IDS.slice(0, 2)) },
  { time: 7.2, ...centered(DEMO_IDS[1], DEMO_IDS.slice(0, 2)) },
  { time: 8.8, ...centered(DEMO_IDS[2], DEMO_IDS.slice(0, 2)) },
  { time: 9.4, ...centered(DEMO_IDS[2], DEMO_IDS) },
  { time: 10.4, ...centered(DEMO_IDS[2], DEMO_IDS) },
  { time: 11.2, ...centered(DEMO_IDS[2], DEMO_IDS) },
  {
    time: 11.8,
    ...centered(DEMO_IDS[2], [], DEMO_IDS),
    highlight: [],
  },
  {
    time: 12.4,
    ...mapCenter(DEMO_IDS),
  },
  {
    time: 13.2,
    ...mapCenter([]),
  },
  { time: 13.5, ...mapCenter([]) },
  { time: 13.6, ...fullOverview },
  { time: MAIN_DEMO_SECONDS, ...fullOverview },
];
const IDLE_POSES: readonly Pose[] = [
  { time: 0, ...overview },
  { time: 0.8, ...overview, pan: { x: 26, y: -14 } },
  { time: 2.4, ...centered(DEMO_IDS[0], []) },
  { time: 3.0, ...centered(DEMO_IDS[0], DEMO_IDS.slice(0, 1)) },
  { time: 4.0, ...centered(DEMO_IDS[0], DEMO_IDS.slice(0, 1)) },
  { time: 5.6, ...centered(DEMO_IDS[1], DEMO_IDS.slice(0, 1)) },
  { time: 6.2, ...centered(DEMO_IDS[1], DEMO_IDS.slice(0, 2)) },
  { time: 7.2, ...centered(DEMO_IDS[1], DEMO_IDS.slice(0, 2)) },
  { time: 8.8, ...centered(DEMO_IDS[2], DEMO_IDS.slice(0, 2)) },
  { time: 9.4, ...centered(DEMO_IDS[2], DEMO_IDS) },
  { time: 10.4, ...centered(DEMO_IDS[2], DEMO_IDS) },
  {
    time: 12.2,
    ...overview,
    selected: DEMO_IDS,
    enlarged: DEMO_IDS,
    highlight: DEMO_IDS,
  },
  { time: 13.0, ...overview },
  { time: LOOP_SECONDS, ...overview },
];
for (const id of DEMO_IDS)
  if (!BASE_BUBBLES.some((b) => b.id === id))
    throw new Error(`Unknown native bubble ${id}`);

export function bubbleMapDuration(props: BubbleMapProps): number {
  const seconds =
    props.재생 === "모션 줄이기"
      ? 3
      : props.재생 === "전체 흐름"
        ? MAIN_DEMO_SECONDS + INTRO_SECONDS
        : LOOP_SECONDS;
  return Math.max(1, Math.ceil((seconds * BUBBLE_FPS) / props["재생 속도"]));
}
function poseAt(
  seconds: number,
  poses: readonly Pose[],
  duration: number,
  loops: boolean,
) {
  const time = loops
    ? ((seconds % duration) + duration) % duration
    : Math.max(0, Math.min(duration, seconds));
  let index = 0;
  while (index < poses.length - 2 && time > poses[index + 1].time) index++;
  const a = poses[index],
    b = poses[index + 1];
  return { a, b, p: ease((time - a.time) / (b.time - a.time)), time };
}
const hash = (id: string) => {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h / 4294967296;
};
export function bubbleDrift(seconds: number, id: string): Point {
  const p =
    (((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS) / LOOP_SECONDS;
  const seed = hash(id),
    phase = seed * Math.PI * 2;
  const gate = Math.sin(Math.PI * p) ** 2;
  // Frame-clock-only, independent drift. Zero displacement AND velocity at loop seam.
  return {
    x:
      1.8 *
      gate *
      Math.sin(2 * Math.PI * p * (1 + Math.floor(seed * 3)) + phase),
    y:
      1.5 *
      gate *
      Math.cos(2 * Math.PI * p * (2 + Math.floor(seed * 2)) - phase),
  };
}
export function bubbleEntrance(seconds: number, bubble: Bubble): number {
  if (bubble.kind === "extended") return 1;
  // Exact SwiftUI .sheet spring sampled from Spring(duration: 0.50, bounce: 0.18).
  // The response slightly overshoots 1, which produces the native 0.72→1 settle.
  return nativeSheetSpring(seconds - bubble.introDelay);
}

/** Smooth version of native spacing-based 80/60/40/20% fill; never a dark veil. */
export function focusAttenuation(distance: number): number {
  const stops = [1, 0.8, 0.6, 0.4, 0.2];
  const step = Math.max(0, distance / MAP.spacing);
  const index = Math.min(3, Math.floor(step));
  return step >= 4
    ? 0.2
    : mix(stops[index], stops[index + 1], ease(step - index));
}

export function bubbleMapFrame(frame: number, props: BubbleMapProps): MapFrame {
  if (!Number.isFinite(frame) || !(props["재생 속도"] > 0))
    throw new Error("Invalid bubble-map clock.");
  const reduced = props.재생 === "모션 줄이기";
  const seconds = (Math.max(0, frame) / BUBBLE_FPS) * props["재생 속도"];
  const hasIntro = props.재생 === "전체 흐름";
  const clock = reduced
    ? 3.3
    : Math.max(0, seconds - (hasIntro ? INTRO_SECONDS : 0));
  const pose = reduced
    ? poseAt(3.3, IDLE_POSES, LOOP_SECONDS, true)
    : hasIntro
      ? poseAt(clock, POSES, MAIN_DEMO_SECONDS, false)
      : poseAt(clock, IDLE_POSES, LOOP_SECONDS, true);
  const listWeight = (
    id: string,
    key: "selected" | "enlarged" | "highlight",
  ) => {
    const value = (p: Pose) => Number(p[key].includes(id));
    return mix(value(pose.a), value(pose.b), pose.p);
  };
  const enlarged = new Map(
    BASE_BUBBLES.map((b) => [b.id, listWeight(b.id, "enlarged")]),
  );
  const driftStrength = mix(pose.a.drift, pose.b.drift, pose.p);
  const fullMapReveal = mix(pose.a.fullMapReveal, pose.b.fullMapReveal, pose.p);
  const atlasReveal = mix(pose.a.atlasReveal, pose.b.atlasReveal, pose.p);
  const restPointFor = (p: Pose): Point => {
    const bubble = BASE_BUBBLES.find((b) => b.id === p.focus);
    return bubble ?? { x: MAP.center + p.pan.x, y: MAP.center + p.pan.y };
  };
  const samplingCamera = between(
    restPointFor(pose.a),
    restPointFor(pose.b),
    pose.p,
  );
  const finale = finaleState(pose.time, hasIntro && !reduced);
  const zoom = hasIntro && pose.time >= FINALE.start
    ? mix(MAP.selectedZoom, FULL_MAP_ZOOM, finale.progress)
    : mix(pose.a.zoom, pose.b.zoom, pose.p);
  // The accelerating shrink can reveal more than the fixed world-space guard
  // band in one frame. Preload that next viewport without changing this frame's
  // camera or zoom; keep this stateless so seeking and export stay identical.
  const nextFinale = finaleState(
    pose.time + props["재생 속도"] / BUBBLE_FPS,
    hasIntro && !reduced,
  );
  const samplingZoom = nextFinale.progress > finale.progress
    ? Math.min(zoom, mix(MAP.selectedZoom, FULL_MAP_ZOOM, nextFinale.progress))
    : zoom;
  const grid = finale.phase === "blank" ? []
    : buildBubbleGrid(samplingCamera, samplingZoom, finale.rotationDegrees);

  const bases = grid.map((b) => {
    const amount = enlarged.get(b.id) ?? 0;
    const drift =
      reduced || b.kind === "extended"
        ? { x: 0, y: 0 }
        : bubbleDrift(pose.time, b.id);
    return {
      ...b,
      x: b.x + drift.x * props["미세 이동"] * (1 - amount) * driftStrength,
      y: b.y + drift.y * props["미세 이동"] * (1 - amount) * driftStrength,
      diameter: mix(MAP.diameter, MAP.selectedDiameter, amount),
    };
  });
  const expansions = bases
    .filter((b) => (enlarged.get(b.id) ?? 0) > 0)
    .map((b) => ({ id: b.id, x: b.x, y: b.y, amount: enlarged.get(b.id)! }));
  const displaced = expandBubbleGrid(bases, expansions);
  // Same grid and same spacing rule for both native and added cells.
  // No extendedPushScale and no second transform/repulsion path.
  const needsRelaxation =
    expansions.length > 0 ||
    (driftStrength > 0 && !reduced && props["미세 이동"] > 0);
  const positions = needsRelaxation ? relaxBubbles(displaced) : displaced;
  const pointFor = (p: Pose): Point => {
    const bubble = positions.find((b) => b.id === p.focus);
    return bubble ?? { x: MAP.center + p.pan.x, y: MAP.center + p.pan.y };
  };
  const camera = between(pointFor(pose.a), pointFor(pose.b), pose.p);
  const currentFocus = pose.p < 0.5 ? pose.a.focus : pose.b.focus;
  const intro = reduced || !hasIntro ? 1 : clamp01(seconds / INTRO_SECONDS);
  const veilOpacity = reduced || !hasIntro ? 0 : nativeVeilOpacity(seconds);
  const displayCamera = rotateMapPoint(camera, finale.rotationDegrees);
  const bubbles = positions.map((b) => {
    const enlargement = enlarged.get(b.id) ?? 0;
    const selected = listWeight(b.id, "selected");
    const highlight = listWeight(b.id, "highlight");
    const d = Math.hypot(b.x - camera.x, b.y - camera.y);
    const focusedAttenuation = mix(
      0.8,
      focusAttenuation(d),
      props["주변 감쇠"],
    );
    const attenuation = mix(focusedAttenuation, 1, fullMapReveal);
    const fillOpacity = Math.max(
      0.2,
      clamp01(mix(attenuation, 1, enlargement)),
    );
    const entrance = reduced || !hasIntro ? 1 : bubbleEntrance(seconds, b);
    const entranceOpacity = clamp01(entrance);
    const exit = reverseBubbleExit(b, finale.exitProgress);
    const rotated = rotateMapPoint(b, finale.rotationDegrees);
    const displayX = MAP.center + (rotated.x - MAP.center) * exit.positionScale;
    const displayY = MAP.center + (rotated.y - MAP.center) * exit.positionScale;
    return {
      ...b,
      screenX: MAP.viewport / 2 + (displayX - displayCamera.x) * zoom,
      screenY: MAP.viewport / 2 + (displayY - displayCamera.y) * zoom,
      screenRadius: (b.diameter / 2) * zoom * mix(0.72, 1, entrance) * exit.scale,
      exitScale: exit.scale,
      exitOpacity: exit.opacity,
      renderOpacity: clamp01(entranceOpacity * exit.opacity),
      entrance,
      entranceOpacity,
      fillOpacity,
      labelOpacity: clamp01(
        mix(Math.max(0.54, attenuation + 0.18), 1, enlargement),
      ),
      enlarged: enlargement,
      selected,
      highlight,
      outline: highlight * entrance,
      priority: DEMO_IDS.includes(b.id as (typeof DEMO_IDS)[number])
        ? DEMO_IDS.indexOf(b.id as (typeof DEMO_IDS)[number])
        : null,
    };
  });
  return {
    bubbles,
    camera,
    zoom,
    intro,
    veilOpacity,
    fullMapReveal,
    atlasReveal,
    loopSeconds: pose.time,
    focusID: currentFocus,
    activeCellCount: grid.length,
    addedCellCount: Math.max(0, grid.length - BASE_BUBBLES.length),
    physicsCellCount: needsRelaxation ? grid.length : 0,
    rotationDegrees: finale.rotationDegrees,
    exitProgress: finale.exitProgress,
    finalePhase: finale.phase,
  };
}
