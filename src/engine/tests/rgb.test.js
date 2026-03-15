import { describe, it, expect } from 'vitest';

describe('RGB', () => {
  describe('constructor', () => {
    it('defaults to white (255,255,255,1)', () => {
      const c = new RGB();
      expect(c.red).toBe(255);
      expect(c.green).toBe(255);
      expect(c.blue).toBe(255);
      expect(c.alpha).toBe(1);
    });

    it('accepts custom values', () => {
      const c = new RGB(100, 150, 200, 0.5);
      expect(c.red).toBe(100);
      expect(c.green).toBe(150);
      expect(c.blue).toBe(200);
      expect(c.alpha).toBe(0.5);
    });

    it('accepts zero alpha', () => {
      const c = new RGB(0, 0, 0, 0);
      expect(c.alpha).toBe(0);
    });
  });

  describe('toString', () => {
    it('returns rgb string with alpha', () => {
      const c = new RGB(100, 150, 200, 0.5);
      expect(c.toString()).toBe('rgb(100, 150, 200, 0.5)');
    });

    it('includes alpha=1 for opaque colors', () => {
      const c = new RGB(255, 0, 0);
      expect(c.toString()).toBe('rgb(255, 0, 0, 1)');
    });

    it('handles zero values', () => {
      const c = new RGB(0, 0, 0, 0);
      expect(c.toString()).toBe('rgb(0, 0, 0, 0)');
    });
  });

  describe('toStringWithoutAlpha', () => {
    it('returns rgb string without alpha', () => {
      const c = new RGB(100, 150, 200, 0.5);
      expect(c.toStringWithoutAlpha()).toBe('rgb(100, 150, 200)');
    });

    it('omits alpha even when 1', () => {
      const c = new RGB(255, 128, 0);
      expect(c.toStringWithoutAlpha()).toBe('rgb(255, 128, 0)');
    });
  });
});
