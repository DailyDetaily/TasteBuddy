import type { Point } from "./types";

type Body = {
  id: string;
  group: string;
  record: boolean;
  partner: number;
  at: number;
  start: Point;
  goal: Point;
};
type Sample = { positions: Point[]; growth: number[]; tint: number[] };
export type ExperienceSimulation = {
  start: Point[];
  samples: Sample[];
  contacts: number[];
  partners: number[];
  firstContact: number[];
  collisions: { a: number; b: number; time: number }[];
  step: number;
  unresolved: number;
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const CENTER = 320;
const RADIUS = 9.5;
const GROWTH = 1.3;
const GAP = 7;

/** Fixed 120 Hz integration. Cached per fixture; seeking never restarts a running simulation. */
export function simulateExperience(
  bodies: Body[],
  startTime: number,
  endTime: number,
): ExperienceSimulation {
  const step = 1 / 120,
    n = bodies.length;
  const p = bodies.map((b) => ({ ...b.start }));
  const v = bodies.map(() => ({ x: 0, y: 0 }));
  const contacts = bodies.map(() => Infinity),
    firstContact = bodies.map(() => Infinity);
  const collisions: ExperienceSimulation["collisions"] = [];
  const partners = bodies.map((b) => b.partner);
  const growth = bodies.map(() => 0),
    tint = bodies.map(() => 0);
  const samples: Sample[] = [];
  const radius = (i: number) =>
    RADIUS + (bodies[i].record ? GROWTH * growth[i] : 0);
  const shield = (i: number, time: number) =>
    bodies[i].record ? ease((time - firstContact[i]) / 0.45) : 0;
  function confine(i: number) {
    const dx = p[i].x - CENTER,
      dy = p[i].y - CENTER,
      r = Math.hypot(dx, dy);
    const target = Math.max(207, Math.min(284, r));
    if (r === target) return;
    const nx = dx / r,
      ny = dy / r,
      speed = v[i].x * nx + v[i].y * ny;
    p[i] = { x: CENTER + nx * target, y: CENTER + ny * target };
    if ((r > 284 && speed > 0) || (r < 207 && speed < 0)) {
      v[i].x -= speed * nx * 1.2;
      v[i].y -= speed * ny * 1.2;
    }
  }
  function collide(time: number, settling: boolean, initial = false) {
    // These are constant throughout every solver pass at this time step.
    const radii = bodies.map((_, i) => radius(i));
    const shields = bodies.map((_, i) => shield(i, time));
    const broadDistance = 2 * (RADIUS + GROWTH) + 0.35 + GAP;
    for (let pass = 0; pass < (initial ? 100 : 14); pass++) {
      let maximum = 0;
      for (let a = 0; a < n; a++)
        for (let b = a + 1; b < n; b++) {
          const dx = p[b].x - p[a].x,
            dy = p[b].y - p[a].y;
          // Distant pairs cannot touch; retain the original exact solver for nearby pairs.
          if (dx >= broadDistance || dx <= -broadDistance || dy >= broadDistance || dy <= -broadDistance) continue;
          const minimum = radii[a] + radii[b] + 0.35 + GAP * Math.max(shields[a], shields[b]);
          if (dx >= minimum || dx <= -minimum || dy >= minimum || dy <= -minimum) continue;
          const d = Math.hypot(dx, dy);
          if (d >= minimum) continue;
          maximum = Math.max(maximum, minimum - d);
          const nx = d > 0.001 ? dx / d : 1,
            ny = d > 0.001 ? dy / d : 0;
          const correction = (minimum - d + 0.00001) / 2;
          p[a].x -= nx * correction;
          p[a].y -= ny * correction;
          p[b].x += nx * correction;
          p[b].y += ny * correction;
          if (!initial) {
            const relative = (v[b].x - v[a].x) * nx + (v[b].y - v[a].y) * ny;
            if (relative < 0) {
              if (relative < -8 && pass === 0) collisions.push({ a, b, time });
              const impulse = (-(1 + (settling ? 0.12 : 0.45)) * relative) / 2;
              v[a].x -= impulse * nx;
              v[a].y -= impulse * ny;
              v[b].x += impulse * nx;
              v[b].y += impulse * ny;
            }
            if (bodies[a].group === bodies[b].group) {
              if (bodies[a].record)
                firstContact[a] = Math.min(firstContact[a], time);
              if (bodies[b].record)
                firstContact[b] = Math.min(firstContact[b], time);
              if (!bodies[a].record) contacts[a] = Math.min(contacts[a], time);
              if (!bodies[b].record) contacts[b] = Math.min(contacts[b], time);
              if (!bodies[a].record && bodies[b].record) partners[a] = b;
              if (!bodies[b].record && bodies[a].record) partners[b] = a;
            }
          }
        }
      for (let i = 0; i < n; i++) confine(i);
      if (maximum < 0.001) break;
    }
  }
  collide(startTime, false, true);
  const start = p.map((q) => ({ ...q }));
  const capture = () =>
    samples.push({
      positions: p.map((q) => ({ ...q })),
      growth: [...growth],
      tint: [...tint],
    });
  capture();
  const count = Math.round((endTime - startTime) / step);
  for (let tick = 1; tick <= count; tick++) {
    const time = startTime + tick * step;
    const settle = ease((time - (endTime - 1.55)) / 1.15);
    const placement = ease((time - 2.5) / (endTime - 2.9));
    const stiffness = lerp(18, 240, settle),
      damping = lerp(7, 31, settle);
    const force = bodies.map((body, i) => {
      const target = {
        x: lerp(start[i].x, body.goal.x, placement),
        y: lerp(start[i].y, body.goal.y, placement),
      };
      return {
        x: (target.x - p[i].x) * stiffness,
        y: (target.y - p[i].y) * stiffness,
      };
    });
    for (let i = 0; i < n; i++) {
      const body = bodies[i];
      if (
        body.record ||
        time < body.at - 0.65 ||
        Number.isFinite(contacts[i]) ||
        settle > 0.7
      )
        continue;
      const core = body.partner,
        dx = p[core].x - p[i].x,
        dy = p[core].y - p[i].y,
        d = Math.hypot(dx, dy);
      const activation = ease((time - body.at + 0.65) / 0.35);
      // Spring forces act on velocity. A collision releases the attraction and transfers momentum.
      const pull =
        Math.max(0, d - radius(i) - radius(core) + 2) * 160 * activation;
      const fx = (dx / Math.max(d, 0.001)) * pull,
        fy = (dy / Math.max(d, 0.001)) * pull;
      force[i].x += fx;
      force[i].y += fy;
      force[core].x -= fx * 0.45;
      force[core].y -= fy * 0.45;
    }
    for (let i = 0; i < n; i++) {
      v[i].x = (v[i].x + force[i].x * step) * Math.exp(-damping * step);
      v[i].y = (v[i].y + force[i].y * step) * Math.exp(-damping * step);
      const speed = Math.hypot(v[i].x, v[i].y),
        limit = lerp(90, 120, settle);
      if (speed > limit) {
        v[i].x *= limit / speed;
        v[i].y *= limit / speed;
      }
      p[i].x += v[i].x * step;
      p[i].y += v[i].y * step;
      growth[i] = bodies[i].record
        ? Math.max(
            ease((time - firstContact[i]) / 0.55),
            ease((time - (endTime - 0.8)) / 0.65),
          )
        : 0;
      tint[i] = bodies[i].record ? 0 : ease((time - contacts[i]) / 0.24);
      confine(i);
    }
    collide(time, settle > 0.5);
    capture();
  }
  return {
    start,
    samples,
    contacts,
    partners,
    firstContact,
    collisions,
    step,
    unresolved: bodies.filter(
      (b, i) => !b.record && !Number.isFinite(contacts[i]),
    ).length,
  };
}

export function simulationSample(
  simulation: ExperienceSimulation,
  time: number,
): Sample {
  const cursor = Math.max(
    0,
    Math.min(simulation.samples.length - 1, time / simulation.step),
  );
  const before = simulation.samples[Math.floor(cursor)],
    after =
      simulation.samples[
        Math.min(simulation.samples.length - 1, Math.ceil(cursor))
      ],
    amount = cursor % 1;
  return {
    positions: before.positions.map((p, i) => ({
      x: lerp(p.x, after.positions[i].x, amount),
      y: lerp(p.y, after.positions[i].y, amount),
    })),
    growth: before.growth.map((v, i) => lerp(v, after.growth[i], amount)),
    tint: before.tint.map((v, i) => lerp(v, after.tint[i], amount)),
  };
}
