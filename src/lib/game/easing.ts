// Classic easing functions normalized to t in [0,1] and range [0,1].
// Multiply by amplitude and add start offset as needed.

export function easeLinear(t: number) {
  return t;
}

export function easeInCubic(t: number) {
  return t * t * t;
}

export function easeOutCubic(t: number) {
  const u = 1 - t;
  return 1 - u * u * u;
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBack(t: number, overshoot = 1.70158) {
  const u = 1 - t;
  return 1 - (u * u * ((overshoot + 1) * u - overshoot));
}

export function easeOutElastic(t: number) {
  const c4 = (2 * Math.PI) / 3;
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeOutBounce(t: number) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

export function easeInOutBack(t: number, overshoot = 1.70158) {
  const c2 = overshoot * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

export function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

/** Remap a value from one range to another. */
export function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Simple tween: given a progress in [0,1], an easing function and start/end values, return current value. */
export function tween(progress: number, from: number, to: number, easingFn: (t: number) => number) {
  return from + (to - from) * easingFn(clamp01(progress));
}
