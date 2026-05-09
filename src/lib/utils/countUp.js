/**
 * @param {number} t - progress 0..1
 * @returns {number}
 */
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Animate from `from` to `to`, calling `onTick` each frame with a formatted
 * string. Returns a cancel function.
 *
 * @param {number} from
 * @param {number} to
 * @param {number} decimals
 * @param {number} duration - ms
 * @param {(value: string) => void} onTick
 * @param {(cb: FrameRequestCallback) => number} [raf]
 * @param {(id: number) => void} [caf]
 * @returns {() => void}
 */
export function animateValue(from, to, decimals, duration, onTick, raf = requestAnimationFrame, caf = cancelAnimationFrame) {
  if (duration <= 0) {
    onTick(to.toFixed(decimals));
    return () => {};
  }

  const start = performance.now();
  let rafId = -1;

  /** @param {number} now */
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    onTick((from + (to - from) * easeInOutQuad(t)).toFixed(decimals));
    if (t < 1) rafId = raf(tick);
  }

  rafId = raf(tick);
  return () => caf(rafId);
}
