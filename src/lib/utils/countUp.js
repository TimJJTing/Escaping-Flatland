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
 * @returns {() => void}
 */
export function animateValue(from, to, decimals, duration, onTick, raf = requestAnimationFrame) {
  const start = performance.now();
  let rafId = -1;
  let lastNow = -Infinity;

  /** @param {number} now */
  function tick(now) {
    // Guard against tight loops when time doesn't meaningfully advance (< 1ms)
    if (now - lastNow < 1) return;
    lastNow = now;

    const t = Math.min((now - start) / duration, 1);
    onTick((from + (to - from) * easeInOutQuad(t)).toFixed(decimals));
    if (t < 1) rafId = raf(tick);
  }

  rafId = raf(tick);
  return () => cancelAnimationFrame(rafId);
}
