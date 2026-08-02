// Shared by particle-field.tsx / orbit-debris.tsx / ambient-particles.tsx —
// eases an RGB triple (or a plain scalar) toward a target each frame
// instead of snapping instantly, so a theme switch reads as the canvas
// scene gracefully shifting hue rather than jump-cutting.
export type RGB = [number, number, number];

// Exponential ease toward target, framerate-independent via dt (ms).
// ~90% of the distance closes in ~450ms at the default rate.
const DEFAULT_RATE = 0.005;

export function stepRGB(current: RGB, target: RGB, dt: number, rate = DEFAULT_RATE): RGB {
  const t = 1 - Math.exp(-rate * dt);
  return [
    current[0] + (target[0] - current[0]) * t,
    current[1] + (target[1] - current[1]) * t,
    current[2] + (target[2] - current[2]) * t,
  ];
}

export function stepScalar(current: number, target: number, dt: number, rate = DEFAULT_RATE): number {
  const t = 1 - Math.exp(-rate * dt);
  return current + (target - current) * t;
}

export function rgbToCss(c: RGB): string {
  return `${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}`;
}
