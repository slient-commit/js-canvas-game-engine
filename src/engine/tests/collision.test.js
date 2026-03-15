import { describe, it, expect } from 'vitest';

describe('Collision', () => {
  describe('rectRect', () => {
    it('detects overlapping rectangles', () => {
      expect(Collision.rectRect(
        new Vec2(0, 0), new Size(10, 10),
        new Vec2(5, 5), new Size(10, 10)
      )).toBe(true);
    });

    it('detects non-overlapping rectangles', () => {
      expect(Collision.rectRect(
        new Vec2(0, 0), new Size(10, 10),
        new Vec2(20, 20), new Size(10, 10)
      )).toBe(false);
    });

    it('detects touching edges as non-overlapping', () => {
      // Touching exactly at edge: posA.X + sizeA.width == posB.X → not overlapping
      expect(Collision.rectRect(
        new Vec2(0, 0), new Size(10, 10),
        new Vec2(10, 0), new Size(10, 10)
      )).toBe(false);
    });

    it('detects contained rectangle', () => {
      expect(Collision.rectRect(
        new Vec2(0, 0), new Size(20, 20),
        new Vec2(5, 5), new Size(5, 5)
      )).toBe(true);
    });

    it('handles same position and size', () => {
      expect(Collision.rectRect(
        new Vec2(5, 5), new Size(10, 10),
        new Vec2(5, 5), new Size(10, 10)
      )).toBe(true);
    });

    it('detects horizontal separation', () => {
      expect(Collision.rectRect(
        new Vec2(0, 0), new Size(5, 10),
        new Vec2(6, 0), new Size(5, 10)
      )).toBe(false);
    });

    it('detects vertical separation', () => {
      expect(Collision.rectRect(
        new Vec2(0, 0), new Size(10, 5),
        new Vec2(0, 6), new Size(10, 5)
      )).toBe(false);
    });
  });

  describe('circleCircle', () => {
    it('detects overlapping circles', () => {
      expect(Collision.circleCircle(
        new Vec2(0, 0), 10,
        new Vec2(5, 0), 10
      )).toBe(true);
    });

    it('detects separated circles', () => {
      expect(Collision.circleCircle(
        new Vec2(0, 0), 5,
        new Vec2(20, 0), 5
      )).toBe(false);
    });

    it('detects touching circles (distance = sum of radii)', () => {
      expect(Collision.circleCircle(
        new Vec2(0, 0), 5,
        new Vec2(10, 0), 5
      )).toBe(true);
    });

    it('detects concentric circles', () => {
      expect(Collision.circleCircle(
        new Vec2(5, 5), 10,
        new Vec2(5, 5), 3
      )).toBe(true);
    });

    it('handles zero radius', () => {
      expect(Collision.circleCircle(
        new Vec2(0, 0), 0,
        new Vec2(0, 0), 0
      )).toBe(true);
    });
  });

  describe('circleRect', () => {
    it('detects circle inside rectangle', () => {
      expect(Collision.circleRect(
        new Vec2(15, 15), 5,
        new Vec2(0, 0), new Size(30, 30)
      )).toBe(true);
    });

    it('detects circle outside rectangle', () => {
      expect(Collision.circleRect(
        new Vec2(50, 50), 5,
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(false);
    });

    it('detects circle touching rectangle edge', () => {
      expect(Collision.circleRect(
        new Vec2(15, 5), 5,
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(true);
    });

    it('detects circle overlapping rectangle corner', () => {
      // Circle centered at (12, 12) with radius 5, rect at (0,0) size (10,10)
      // Closest point on rect to circle: (10, 10), distance = sqrt(4+4) = 2.83 < 5
      expect(Collision.circleRect(
        new Vec2(12, 12), 5,
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(true);
    });

    it('detects circle missing rectangle corner', () => {
      // Circle centered at (16, 16) with radius 2, rect at (0,0) size (10,10)
      // Closest: (10,10), distance = sqrt(36+36) = 8.49 > 2
      expect(Collision.circleRect(
        new Vec2(16, 16), 2,
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(false);
    });
  });

  describe('pointRect', () => {
    it('detects point inside rectangle', () => {
      expect(Collision.pointRect(
        new Vec2(5, 5),
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(true);
    });

    it('detects point outside rectangle', () => {
      expect(Collision.pointRect(
        new Vec2(15, 5),
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(false);
    });

    it('detects point on edge', () => {
      expect(Collision.pointRect(
        new Vec2(0, 5),
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(true);
    });

    it('detects point on corner', () => {
      expect(Collision.pointRect(
        new Vec2(10, 10),
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(true);
    });

    it('detects point at origin of rect', () => {
      expect(Collision.pointRect(
        new Vec2(0, 0),
        new Vec2(0, 0), new Size(10, 10)
      )).toBe(true);
    });
  });

  describe('pointCircle', () => {
    it('detects point inside circle', () => {
      expect(Collision.pointCircle(
        new Vec2(3, 3),
        new Vec2(5, 5), 10
      )).toBe(true);
    });

    it('detects point outside circle', () => {
      expect(Collision.pointCircle(
        new Vec2(20, 20),
        new Vec2(0, 0), 5
      )).toBe(false);
    });

    it('detects point on boundary', () => {
      expect(Collision.pointCircle(
        new Vec2(5, 0),
        new Vec2(0, 0), 5
      )).toBe(true);
    });

    it('detects point at center', () => {
      expect(Collision.pointCircle(
        new Vec2(5, 5),
        new Vec2(5, 5), 10
      )).toBe(true);
    });
  });
});
