import { describe, it, expect, vi } from 'vitest';

describe('Tween', () => {
  describe('basic interpolation', () => {
    it('interpolates property from start to end', () => {
      const obj = { x: 0 };
      const tween = new Tween(obj, { x: 100 }, 1);
      tween.update(0.5);
      expect(obj.x).toBeCloseTo(50);
      tween.update(0.5);
      expect(obj.x).toBeCloseTo(100);
    });

    it('handles multiple properties', () => {
      const obj = { x: 0, y: 10 };
      const tween = new Tween(obj, { x: 100, y: 50 }, 1);
      tween.update(1);
      expect(obj.x).toBeCloseTo(100);
      expect(obj.y).toBeCloseTo(50);
    });

    it('captures start values on first update', () => {
      const obj = { x: 20 };
      const tween = new Tween(obj, { x: 120 }, 1);
      tween.update(0.5);
      // Should go from 20 to 120, at t=0.5 → 70
      expect(obj.x).toBeCloseTo(70);
    });
  });

  describe('easing', () => {
    it('uses linear by default', () => {
      const obj = { v: 0 };
      const tween = new Tween(obj, { v: 100 }, 1);
      tween.update(0.5);
      expect(obj.v).toBeCloseTo(50);
    });

    it('applies custom easing function', () => {
      const obj = { v: 0 };
      const tween = new Tween(obj, { v: 100 }, 1, Easing.easeIn);
      tween.update(0.5);
      // easeIn(0.5) = 0.25, so v = 25
      expect(obj.v).toBeCloseTo(25);
    });
  });

  describe('completion', () => {
    it('returns true while running', () => {
      const tween = new Tween({ x: 0 }, { x: 10 }, 1);
      expect(tween.update(0.5)).toBe(true);
    });

    it('returns false when completed (no chain)', () => {
      const tween = new Tween({ x: 0 }, { x: 10 }, 1);
      expect(tween.update(1)).toBe(false);
    });

    it('caps values at target when overshooting', () => {
      const obj = { x: 0 };
      const tween = new Tween(obj, { x: 100 }, 1);
      tween.update(2); // overshoot duration
      expect(obj.x).toBeCloseTo(100);
    });

    it('marks completed flag', () => {
      const tween = new Tween({ x: 0 }, { x: 10 }, 1);
      tween.update(1);
      expect(tween.completed).toBe(true);
    });
  });

  describe('onComplete', () => {
    it('fires when tween completes', () => {
      const fn = vi.fn();
      const tween = new Tween({ x: 0 }, { x: 10 }, 1);
      tween.onComplete(fn);
      tween.update(0.5);
      expect(fn).not.toHaveBeenCalled();
      tween.update(0.5);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('returns tween for chaining', () => {
      const tween = new Tween({ x: 0 }, { x: 10 }, 1);
      expect(tween.onComplete(() => {})).toBe(tween);
    });
  });

  describe('onUpdate', () => {
    it('fires each frame with progress t', () => {
      const fn = vi.fn();
      const tween = new Tween({ x: 0 }, { x: 10 }, 1);
      tween.onUpdate(fn);
      tween.update(0.3);
      expect(fn).toHaveBeenCalledWith(expect.closeTo(0.3, 5));
      tween.update(0.2);
      expect(fn).toHaveBeenCalledWith(expect.closeTo(0.5, 5));
    });
  });

  describe('then (chaining)', () => {
    it('starts second tween after first completes', () => {
      const obj = { x: 0 };
      const tween = new Tween(obj, { x: 50 }, 1);
      tween.then(obj, { x: 100 }, 1);

      // First tween
      tween.update(1);
      expect(obj.x).toBeCloseTo(50);

      // Second tween starts
      tween.update(0.5);
      expect(obj.x).toBeCloseTo(75);

      tween.update(0.5);
      expect(obj.x).toBeCloseTo(100);
    });

    it('returns the chained tween', () => {
      const tween = new Tween({ x: 0 }, { x: 10 }, 1);
      const chained = tween.then({ y: 0 }, { y: 10 }, 1);
      expect(chained).toBeInstanceOf(Tween);
      expect(chained).not.toBe(tween);
    });

    it('returns true while chain is running', () => {
      const tween = new Tween({ x: 0 }, { x: 10 }, 1);
      tween.then({ y: 0 }, { y: 10 }, 1);

      tween.update(1); // first completes
      expect(tween.update(0.5)).toBe(true); // chain still running
    });
  });

  describe('static factory', () => {
    it('Tween.to creates a tween', () => {
      const obj = { x: 0 };
      const t = Tween.to(obj, { x: 10 }, 1);
      expect(t).toBeInstanceOf(Tween);
      t.update(1);
      expect(obj.x).toBeCloseTo(10);
    });
  });
});

describe('TweenManager', () => {
  describe('to', () => {
    it('creates and tracks a tween', () => {
      const mgr = new TweenManager();
      const obj = { x: 0 };
      const t = mgr.to(obj, { x: 100 }, 1);
      expect(t).toBeInstanceOf(Tween);
      mgr.update(1);
      expect(obj.x).toBeCloseTo(100);
    });
  });

  describe('add', () => {
    it('adds an existing tween', () => {
      const mgr = new TweenManager();
      const obj = { x: 0 };
      const t = new Tween(obj, { x: 50 }, 1);
      mgr.add(t);
      mgr.update(1);
      expect(obj.x).toBeCloseTo(50);
    });
  });

  describe('update', () => {
    it('updates all managed tweens', () => {
      const mgr = new TweenManager();
      const a = { x: 0 };
      const b = { y: 0 };
      mgr.to(a, { x: 10 }, 1);
      mgr.to(b, { y: 20 }, 1);
      mgr.update(1);
      expect(a.x).toBeCloseTo(10);
      expect(b.y).toBeCloseTo(20);
    });

    it('removes completed tweens', () => {
      const mgr = new TweenManager();
      mgr.to({ x: 0 }, { x: 10 }, 1);
      mgr.update(1);
      expect(mgr._tweens.length).toBe(0);
    });

    it('keeps running tweens', () => {
      const mgr = new TweenManager();
      mgr.to({ x: 0 }, { x: 10 }, 2);
      mgr.update(1);
      expect(mgr._tweens.length).toBe(1);
    });
  });

  describe('clear', () => {
    it('removes all tweens', () => {
      const mgr = new TweenManager();
      mgr.to({ x: 0 }, { x: 10 }, 1);
      mgr.to({ y: 0 }, { y: 10 }, 1);
      mgr.clear();
      expect(mgr._tweens.length).toBe(0);
    });
  });
});
