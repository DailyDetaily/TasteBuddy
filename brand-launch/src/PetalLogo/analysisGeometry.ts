type Circle = { x: number; y: number; radius: number };

/** Maps the existing projected petal sides; no replacement strokes or fade. */
export const analysisRayTransform = (
  seconds: number,
  circle: Circle,
  angleDegrees: number,
  outer: number,
  inner: number,
  anchors: { top: Circle; arrival: Circle },
) => {
  const ease = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  // Centered entry/exit with zero endpoint velocity, preserving the source path.
  const amount = ease(seconds / 0.4) * ease((3 - seconds) / 0.4);
  const ratio = outer / 316;
  let dx = (circle.x - 320) * ratio * amount;
  let dy = (circle.y - 320) * ratio * amount;
  let radius = inner + (circle.radius - 79) * ratio * amount;
  // Grow in place before each move; shrink during travel. The original path
  // resumes unchanged at 1.5 on the editable analysis clock.
  if (seconds < 1.5) {
    const large = inner + 48 * ratio;
    const topX = (anchors.top.x - 320) * ratio;
    const topY = (anchors.top.y - 320) * ratio;
    if (seconds < 0.18) {
      dx = 0;
      dy = 0;
      radius = inner + (large - inner) * ease(seconds / 0.18);
    } else if (seconds < 0.55) {
      const t = ease((seconds - 0.18) / 0.37);
      dx = topX * t;
      dy = topY * t;
      radius = large + (inner - large) * t;
    } else if (seconds < 0.8) {
      dx = topX;
      dy = topY;
      radius = inner + (large - inner) * ease((seconds - 0.55) / 0.25);
    } else {
      const t = ease((seconds - 0.8) / 0.7);
      dx = topX + ((anchors.arrival.x - 320) * ratio - topX) * t;
      dy = topY + ((anchors.arrival.y - 320) * ratio - topY) * t;
      const arrivalRadius = inner + (anchors.arrival.radius - 79) * ratio;
      radius = large + (arrivalRadius - large) * t;
    }
  }
  const angle = (angleDegrees * Math.PI) / 180;
  const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
  const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);
  const length = outer - inner;
  // Aim from each fixed outer endpoint directly at the moving inner center.
  // Rotate the cross-section as well: shear would leave diagonal cut ends.
  const distance = Math.hypot(localX, outer + localY);
  const directionX = localX / distance;
  const directionY = (outer + localY) / distance;
  const stretch = (distance - radius) / length;
  const alongX = directionX * stretch;
  const alongY = directionY * stretch;
  return {
    dx,
    dy,
    radius,
    // The outer endpoint (0, -outer) remains fixed under this affine map.
    matrix: [
      directionY,
      -directionX,
      alongX,
      alongY,
      outer * alongX,
      outer * (alongY - 1),
    ],
  };
};
