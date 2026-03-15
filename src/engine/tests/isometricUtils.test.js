import { describe, it, expect } from 'vitest';

describe('IsometricUtils', () => {
  const tileW = 64;
  const tileH = 32;

  describe('toScreen', () => {
    it('returns origin for col=0, row=0 without offset', () => {
      const pos = IsometricUtils.toScreen(0, 0, tileW, tileH, 0, 0, null);
      expect(pos.X).toBe(0);
      expect(pos.Y).toBe(0);
    });

    it('computes x = (col - row) * tileW/2', () => {
      const pos = IsometricUtils.toScreen(2, 0, tileW, tileH, 0, 0, null);
      expect(pos.X).toBe(2 * tileW / 2);
      expect(pos.Y).toBe(2 * tileH / 2);
    });

    it('row increases move left and down', () => {
      const pos = IsometricUtils.toScreen(0, 2, tileW, tileH, 0, 0, null);
      expect(pos.X).toBe(-2 * tileW / 2);
      expect(pos.Y).toBe(2 * tileH / 2);
    });

    it('equal col and row produce x=0', () => {
      const pos = IsometricUtils.toScreen(3, 3, tileW, tileH, 0, 0, null);
      expect(pos.X).toBe(0);
      expect(pos.Y).toBe(3 * tileH); // (3+3) * tileH/2
    });

    it('applies height offset (subtracts from y)', () => {
      const noHeight = IsometricUtils.toScreen(1, 1, tileW, tileH, 0, 16, null);
      const withHeight = IsometricUtils.toScreen(1, 1, tileW, tileH, 2, 16, null);
      expect(withHeight.X).toBe(noHeight.X);
      expect(withHeight.Y).toBe(noHeight.Y - 2 * 16);
    });

    it('applies screen offset', () => {
      const offset = new Vec2(100, 200);
      const pos = IsometricUtils.toScreen(0, 0, tileW, tileH, 0, 0, offset);
      expect(pos.X).toBe(100);
      expect(pos.Y).toBe(200);
    });

    it('combines height and offset', () => {
      const offset = new Vec2(50, 50);
      const pos = IsometricUtils.toScreen(1, 0, tileW, tileH, 1, 10, offset);
      expect(pos.X).toBe(1 * tileW / 2 + 50);
      expect(pos.Y).toBe(1 * tileH / 2 - 10 + 50);
    });

    it('handles zero height and heightStep gracefully', () => {
      const pos = IsometricUtils.toScreen(1, 1, tileW, tileH, 0, 0, null);
      expect(pos.Y).toBe((1 + 1) * tileH / 2);
    });
  });

  describe('toGrid', () => {
    it('returns origin for screen (0,0)', () => {
      const grid = IsometricUtils.toGrid(0, 0, tileW, tileH, null);
      expect(grid.X).toBeCloseTo(0);
      expect(grid.Y).toBeCloseTo(0);
    });

    it('round-trips with toScreen (no height)', () => {
      const col = 3, row = 2;
      const screen = IsometricUtils.toScreen(col, row, tileW, tileH, 0, 0, null);
      const grid = IsometricUtils.toGrid(screen.X, screen.Y, tileW, tileH, null);
      expect(grid.X).toBeCloseTo(col);
      expect(grid.Y).toBeCloseTo(row);
    });

    it('round-trips with offset', () => {
      const offset = new Vec2(200, 100);
      const col = 4, row = 1;
      const screen = IsometricUtils.toScreen(col, row, tileW, tileH, 0, 0, offset);
      const grid = IsometricUtils.toGrid(screen.X, screen.Y, tileW, tileH, offset);
      expect(grid.X).toBeCloseTo(col);
      expect(grid.Y).toBeCloseTo(row);
    });

    it('returns fractional grid coords for mid-tile positions', () => {
      const screen = IsometricUtils.toScreen(0, 0, tileW, tileH, 0, 0, null);
      // Slightly offset from origin
      const grid = IsometricUtils.toGrid(screen.X + 5, screen.Y + 3, tileW, tileH, null);
      expect(grid.X).not.toBe(Math.floor(grid.X));
    });

    it('subtracts offset before computing', () => {
      const offset = new Vec2(100, 100);
      const gridNoOff = IsometricUtils.toGrid(100, 100, tileW, tileH, null);
      const gridWithOff = IsometricUtils.toGrid(200, 200, tileW, tileH, offset);
      expect(gridWithOff.X).toBeCloseTo(gridNoOff.X);
      expect(gridWithOff.Y).toBeCloseTo(gridNoOff.Y);
    });
  });

  describe('getDiamondVertices', () => {
    it('returns 4 vertices', () => {
      const verts = IsometricUtils.getDiamondVertices(100, 50, tileW, tileH);
      expect(verts).toHaveLength(4);
    });

    it('top vertex is at (screenX, screenY)', () => {
      const verts = IsometricUtils.getDiamondVertices(100, 50, tileW, tileH);
      expect(verts[0].X).toBe(100);
      expect(verts[0].Y).toBe(50);
    });

    it('right vertex is at (screenX + tileW/2, screenY + tileH/2)', () => {
      const verts = IsometricUtils.getDiamondVertices(100, 50, tileW, tileH);
      expect(verts[1].X).toBe(100 + tileW / 2);
      expect(verts[1].Y).toBe(50 + tileH / 2);
    });

    it('bottom vertex is at (screenX, screenY + tileH)', () => {
      const verts = IsometricUtils.getDiamondVertices(100, 50, tileW, tileH);
      expect(verts[2].X).toBe(100);
      expect(verts[2].Y).toBe(50 + tileH);
    });

    it('left vertex is at (screenX - tileW/2, screenY + tileH/2)', () => {
      const verts = IsometricUtils.getDiamondVertices(100, 50, tileW, tileH);
      expect(verts[3].X).toBe(100 - tileW / 2);
      expect(verts[3].Y).toBe(50 + tileH / 2);
    });

    it('diamond width equals tileW', () => {
      const verts = IsometricUtils.getDiamondVertices(0, 0, tileW, tileH);
      const width = verts[1].X - verts[3].X;
      expect(width).toBe(tileW);
    });

    it('diamond height equals tileH', () => {
      const verts = IsometricUtils.getDiamondVertices(0, 0, tileW, tileH);
      const height = verts[2].Y - verts[0].Y;
      expect(height).toBe(tileH);
    });
  });
});
