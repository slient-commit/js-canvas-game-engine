import { describe, it, expect } from 'vitest';

describe('Vec2', () => {
  describe('constructor', () => {
    it('defaults to (0, 0)', () => {
      const v = new Vec2();
      expect(v.X).toBe(0);
      expect(v.Y).toBe(0);
    });

    it('accepts x and y', () => {
      const v = new Vec2(3, 7);
      expect(v.X).toBe(3);
      expect(v.Y).toBe(7);
    });

    it('accepts negative values', () => {
      const v = new Vec2(-5, -10);
      expect(v.X).toBe(-5);
      expect(v.Y).toBe(-10);
    });
  });

  describe('add', () => {
    it('adds two vectors', () => {
      const r = new Vec2(1, 2).add(new Vec2(3, 4));
      expect(r.X).toBe(4);
      expect(r.Y).toBe(6);
    });

    it('returns a new Vec2 (immutable)', () => {
      const a = new Vec2(1, 2);
      const b = new Vec2(3, 4);
      const r = a.add(b);
      expect(r).not.toBe(a);
      expect(r).not.toBe(b);
      expect(a.X).toBe(1);
    });
  });

  describe('sub', () => {
    it('subtracts two vectors', () => {
      const r = new Vec2(5, 7).sub(new Vec2(2, 3));
      expect(r.X).toBe(3);
      expect(r.Y).toBe(4);
    });

    it('returns a new Vec2', () => {
      const a = new Vec2(5, 7);
      const r = a.sub(new Vec2(1, 1));
      expect(r).not.toBe(a);
    });
  });

  describe('scale', () => {
    it('scales by a scalar', () => {
      const r = new Vec2(3, 4).scale(2);
      expect(r.X).toBe(6);
      expect(r.Y).toBe(8);
    });

    it('scales by zero', () => {
      const r = new Vec2(3, 4).scale(0);
      expect(r.X).toBe(0);
      expect(r.Y).toBe(0);
    });

    it('scales by negative', () => {
      const r = new Vec2(3, 4).scale(-1);
      expect(r.X).toBe(-3);
      expect(r.Y).toBe(-4);
    });
  });

  describe('length', () => {
    it('returns 0 for zero vector', () => {
      expect(new Vec2(0, 0).length()).toBe(0);
    });

    it('returns correct length for 3-4-5 triangle', () => {
      expect(new Vec2(3, 4).length()).toBe(5);
    });

    it('returns 1 for unit vectors', () => {
      expect(new Vec2(1, 0).length()).toBe(1);
      expect(new Vec2(0, 1).length()).toBe(1);
    });
  });

  describe('distance', () => {
    it('returns 0 for same point', () => {
      expect(new Vec2(5, 5).distance(new Vec2(5, 5))).toBe(0);
    });

    it('returns correct distance', () => {
      expect(new Vec2(0, 0).distance(new Vec2(3, 4))).toBe(5);
    });
  });

  describe('dot', () => {
    it('returns 0 for perpendicular vectors', () => {
      expect(new Vec2(1, 0).dot(new Vec2(0, 1))).toBe(0);
    });

    it('returns positive for parallel vectors', () => {
      expect(new Vec2(2, 3).dot(new Vec2(2, 3))).toBeGreaterThan(0);
    });

    it('returns negative for anti-parallel vectors', () => {
      expect(new Vec2(1, 0).dot(new Vec2(-1, 0))).toBeLessThan(0);
    });

    it('computes correctly', () => {
      expect(new Vec2(2, 3).dot(new Vec2(4, 5))).toBe(23);
    });
  });

  describe('normalize', () => {
    it('returns unit length vector', () => {
      const n = new Vec2(3, 4).normalize();
      expect(n.length()).toBeCloseTo(1);
    });

    it('preserves direction', () => {
      const n = new Vec2(10, 0).normalize();
      expect(n.X).toBeCloseTo(1);
      expect(n.Y).toBeCloseTo(0);
    });

    it('returns (0,0) for zero vector', () => {
      const n = new Vec2(0, 0).normalize();
      expect(n.X).toBe(0);
      expect(n.Y).toBe(0);
    });
  });

  describe('lerp', () => {
    it('returns start at t=0', () => {
      const r = new Vec2(0, 0).lerp(new Vec2(10, 20), 0);
      expect(r.X).toBe(0);
      expect(r.Y).toBe(0);
    });

    it('returns end at t=1', () => {
      const r = new Vec2(0, 0).lerp(new Vec2(10, 20), 1);
      expect(r.X).toBe(10);
      expect(r.Y).toBe(20);
    });

    it('returns midpoint at t=0.5', () => {
      const r = new Vec2(0, 0).lerp(new Vec2(10, 20), 0.5);
      expect(r.X).toBe(5);
      expect(r.Y).toBe(10);
    });
  });

  describe('clone', () => {
    it('returns equal but different object', () => {
      const a = new Vec2(3, 7);
      const c = a.clone();
      expect(c.X).toBe(3);
      expect(c.Y).toBe(7);
      expect(c).not.toBe(a);
    });
  });

  describe('equals', () => {
    it('returns true for equal vectors', () => {
      expect(new Vec2(1, 2).equals(new Vec2(1, 2))).toBe(true);
    });

    it('returns false for different vectors', () => {
      expect(new Vec2(1, 2).equals(new Vec2(1, 3))).toBe(false);
    });
  });

  describe('toString', () => {
    it('formats as (X, Y)', () => {
      expect(new Vec2(3, 7).toString()).toBe('(3, 7)');
    });
  });

  describe('static factories', () => {
    it('zero returns (0, 0)', () => {
      const v = Vec2.zero();
      expect(v.X).toBe(0);
      expect(v.Y).toBe(0);
    });

    it('up returns (0, -1)', () => {
      const v = Vec2.up();
      expect(v.X).toBe(0);
      expect(v.Y).toBe(-1);
    });

    it('down returns (0, 1)', () => {
      const v = Vec2.down();
      expect(v.X).toBe(0);
      expect(v.Y).toBe(1);
    });

    it('left returns (-1, 0)', () => {
      const v = Vec2.left();
      expect(v.X).toBe(-1);
      expect(v.Y).toBe(0);
    });

    it('right returns (1, 0)', () => {
      const v = Vec2.right();
      expect(v.X).toBe(1);
      expect(v.Y).toBe(0);
    });
  });

  describe('aliases', () => {
    it('Point is Vec2', () => {
      expect(Point).toBe(Vec2);
    });

    it('Position is Vec2', () => {
      expect(Position).toBe(Vec2);
    });
  });
});
