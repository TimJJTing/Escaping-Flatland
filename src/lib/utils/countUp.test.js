import { describe, it, expect } from 'vitest';
import { animateValue, easeInOutQuad } from './countUp.js';

describe('easeInOutQuad', () => {
  it('returns 0 at t=0', () => expect(easeInOutQuad(0)).toBe(0));
  it('returns 1 at t=1', () => expect(easeInOutQuad(1)).toBe(1));
  it('returns 0.5 at t=0.5', () => expect(easeInOutQuad(0.5)).toBe(0.5));
  it('is symmetric around 0.5', () => {
    expect(easeInOutQuad(0.25)).toBeCloseTo(1 - easeInOutQuad(0.75));
  });
});

describe('animateValue', () => {
  it('returns a cancel function', () => {
    const cancel = animateValue(0, 1, 2, 400, () => {});
    expect(typeof cancel).toBe('function');
    cancel();
  });

  it('calls onTick with toFixed(decimals) string at t=1', () => {
    /** @type {string[]} */ const ticks = [];
    /** @param {FrameRequestCallback} cb */ const mockRaf = (cb) => { cb(performance.now() + 9999); return 1; };
    animateValue(0, 5, 2, 400, (v) => ticks.push(v), mockRaf);
    expect(ticks[0]).toBe('5.00');
  });

  it('stops scheduling RAF after t=1', () => {
    let calls = 0;
    /** @param {FrameRequestCallback} cb */ const mockRaf = (cb) => { calls++; cb(performance.now() + 9999); return calls; };
    animateValue(10, 20, 0, 400, () => {}, mockRaf);
    expect(calls).toBe(1);
  });

  it('value at t~0 is close to `from`', () => {
    /** @type {number[]} */ const ticks = [];
    let fired = false;
    /** @param {FrameRequestCallback} cb */ const mockRaf = (cb) => { if (!fired) { fired = true; cb(performance.now() + 1); } return 1; };
    animateValue(10, 20, 2, 400, (v) => ticks.push(parseFloat(v)), mockRaf);
    expect(ticks[0]).toBeCloseTo(10, 0);
  });
});
