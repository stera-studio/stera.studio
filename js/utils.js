/* small shared helpers */

export const PARAMS = new URLSearchParams(location.search);
export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const ease = (t) => t * t * (3 - 2 * t);

export function stepSpring(s, k = 0.18, damp = 0.8) {
  s.vel += -s.v * k;
  s.vel *= damp;
  s.v += s.vel;
}
