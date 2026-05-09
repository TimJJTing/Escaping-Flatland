if (!globalThis.requestAnimationFrame) {
  // @ts-ignore - setTimeout returns NodeJS.Timeout but raf expects number; acceptable in test env
  globalThis.requestAnimationFrame = (/** @type {FrameRequestCallback} */ cb) => setTimeout(() => cb(performance.now()), 0);
  globalThis.cancelAnimationFrame = clearTimeout;
}
