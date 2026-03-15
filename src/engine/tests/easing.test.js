import { describe, it, expect } from 'vitest';

describe('Easing', () => {
  const functions = [
    'linear', 'easeIn', 'easeOut', 'easeInOut',
    'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
    'bounce', 'elastic'
  ];

  describe('boundary values', () => {
    for (const name of functions) {
      it(`${name}(0) === 0`, () => {
        expect(Easing[name](0)).toBeCloseTo(0, 5);
      });

      it(`${name}(1) === 1`, () => {
        expect(Easing[name](1)).toBeCloseTo(1, 5);
      });
    }
  });

  describe('linear', () => {
    it('f(0.5) = 0.5', () => {
      expect(Easing.linear(0.5)).toBe(0.5);
    });

    it('f(0.25) = 0.25', () => {
      expect(Easing.linear(0.25)).toBe(0.25);
    });
  });

  describe('easeIn (quadratic)', () => {
    it('starts slower than linear — f(0.5) < 0.5', () => {
      expect(Easing.easeIn(0.5)).toBeLessThan(0.5);
    });

    it('f(0.5) = 0.25', () => {
      expect(Easing.easeIn(0.5)).toBeCloseTo(0.25);
    });
  });

  describe('easeOut (quadratic)', () => {
    it('starts faster than linear — f(0.5) > 0.5', () => {
      expect(Easing.easeOut(0.5)).toBeGreaterThan(0.5);
    });

    it('f(0.5) = 0.75', () => {
      expect(Easing.easeOut(0.5)).toBeCloseTo(0.75);
    });
  });

  describe('easeInOut', () => {
    it('f(0.5) = 0.5 (symmetric)', () => {
      expect(Easing.easeInOut(0.5)).toBeCloseTo(0.5);
    });

    it('first half is slower — f(0.25) < 0.25', () => {
      expect(Easing.easeInOut(0.25)).toBeLessThan(0.25);
    });

    it('second half is faster — f(0.75) > 0.75', () => {
      expect(Easing.easeInOut(0.75)).toBeGreaterThan(0.75);
    });
  });

  describe('easeInCubic', () => {
    it('f(0.5) = 0.125', () => {
      expect(Easing.easeInCubic(0.5)).toBeCloseTo(0.125);
    });
  });

  describe('bounce', () => {
    it('stays within [0, 1] for all inputs', () => {
      for (let t = 0; t <= 1; t += 0.05) {
        const v = Easing.bounce(t);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1.001);
      }
    });
  });

  describe('elastic', () => {
    it('may overshoot but returns to 0 and 1 at boundaries', () => {
      expect(Easing.elastic(0)).toBe(0);
      expect(Easing.elastic(1)).toBe(1);
    });

    it('has oscillation (some values outside [0,1])', () => {
      // Elastic typically overshoots
      let hasOvershoot = false;
      for (let t = 0.01; t < 1; t += 0.01) {
        const v = Easing.elastic(t);
        if (v < 0 || v > 1) { hasOvershoot = true; break; }
      }
      expect(hasOvershoot).toBe(true);
    });
  });
});
