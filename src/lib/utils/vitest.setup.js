if (!globalThis.window) {
  // @ts-ignore - stub object not assignable to Window type; acceptable in test env
  globalThis.window = { innerWidth: 800, innerHeight: 600 };
}

if (!globalThis.requestAnimationFrame) {
  // @ts-ignore - setTimeout returns NodeJS.Timeout but raf expects number; acceptable in test env
  globalThis.requestAnimationFrame = (/** @type {FrameRequestCallback} */ cb) => setTimeout(() => cb(performance.now()), 0);
  globalThis.cancelAnimationFrame = clearTimeout;
}
