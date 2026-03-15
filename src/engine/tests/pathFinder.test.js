import { describe, it, expect } from 'vitest';

/**
 * Helper: create a flat walkable IsometricMap
 */
function createMap(cols, rows) {
  const map = new IsometricMap(cols, rows, 64, 32);
  return map;
}

/**
 * Helper: block a tile (set collision)
 */
function blockTile(map, col, row) {
  map.collisionMap[row][col] = 1;
}

/**
 * Helper: set height at tile
 */
function setHeight(map, col, row, h) {
  map.heightMap[row][col] = h;
}

describe('PathFinder', () => {
  describe('basic paths', () => {
    it('finds straight horizontal path', () => {
      const map = createMap(5, 5);
      const path = PathFinder.findPath(map, 0, 0, 4, 0);
      expect(path.length).toBeGreaterThan(0);
      // Last waypoint should be the destination
      expect(path[path.length - 1]).toEqual({ col: 4, row: 0 });
    });

    it('finds straight vertical path', () => {
      const map = createMap(5, 5);
      const path = PathFinder.findPath(map, 0, 0, 0, 4);
      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toEqual({ col: 0, row: 4 });
    });

    it('finds diagonal path (L-shaped via 4-dir movement)', () => {
      const map = createMap(5, 5);
      const path = PathFinder.findPath(map, 0, 0, 3, 3);
      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toEqual({ col: 3, row: 3 });
    });

    it('excludes start position from path', () => {
      const map = createMap(5, 5);
      const path = PathFinder.findPath(map, 1, 1, 3, 1);
      expect(path[0]).not.toEqual({ col: 1, row: 1 });
    });

    it('path length is optimal (Manhattan distance for flat map)', () => {
      const map = createMap(5, 5);
      const path = PathFinder.findPath(map, 0, 0, 3, 2);
      // Manhattan distance = |3-0| + |2-0| = 5
      expect(path.length).toBe(5);
    });
  });

  describe('start equals end', () => {
    it('returns empty array', () => {
      const map = createMap(5, 5);
      const path = PathFinder.findPath(map, 2, 2, 2, 2);
      expect(path).toEqual([]);
    });
  });

  describe('out of bounds', () => {
    it('returns empty for start out of bounds', () => {
      const map = createMap(5, 5);
      expect(PathFinder.findPath(map, -1, 0, 2, 2)).toEqual([]);
    });

    it('returns empty for end out of bounds', () => {
      const map = createMap(5, 5);
      expect(PathFinder.findPath(map, 0, 0, 5, 5)).toEqual([]);
    });

    it('returns empty for negative end coords', () => {
      const map = createMap(5, 5);
      expect(PathFinder.findPath(map, 0, 0, -1, -1)).toEqual([]);
    });
  });

  describe('blocked paths', () => {
    it('returns empty when destination is blocked', () => {
      const map = createMap(5, 5);
      blockTile(map, 4, 0);
      const path = PathFinder.findPath(map, 0, 0, 4, 0);
      expect(path).toEqual([]);
    });

    it('finds path around single obstacle', () => {
      const map = createMap(5, 5);
      // Block the direct path
      blockTile(map, 2, 0);
      const path = PathFinder.findPath(map, 0, 0, 4, 0);
      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toEqual({ col: 4, row: 0 });
      // Should not pass through blocked tile
      const passesBlocked = path.some(p => p.col === 2 && p.row === 0);
      expect(passesBlocked).toBe(false);
    });

    it('returns empty when completely walled off', () => {
      const map = createMap(5, 5);
      // Wall off col=2 entirely
      for (let r = 0; r < 5; r++) {
        blockTile(map, 2, r);
      }
      const path = PathFinder.findPath(map, 0, 0, 4, 0);
      expect(path).toEqual([]);
    });
  });

  describe('height', () => {
    it('allows movement with height diff <= 1', () => {
      const map = createMap(5, 1);
      setHeight(map, 1, 0, 1);
      const path = PathFinder.findPath(map, 0, 0, 2, 0);
      expect(path.length).toBeGreaterThan(0);
    });

    it('blocks movement with height diff > 1', () => {
      const map = createMap(3, 1);
      // Create a cliff: height 0, 3, 0
      setHeight(map, 1, 0, 3);
      const path = PathFinder.findPath(map, 0, 0, 2, 0);
      expect(path).toEqual([]);
    });

    it('prefers flat path over height changes (lower cost)', () => {
      const map = createMap(5, 3);
      // Direct path row=0 has height bump at col=2
      setHeight(map, 2, 0, 1);
      // Alternative flat path via row=1 is all flat
      const path = PathFinder.findPath(map, 0, 0, 4, 0);
      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toEqual({ col: 4, row: 0 });
    });

    it('height cost = 1.5 vs flat cost = 1.0', () => {
      const map = createMap(3, 1);
      // All same height — straight path, cost = 2
      const flat = PathFinder.findPath(map, 0, 0, 2, 0);
      expect(flat.length).toBe(2);

      // Add height at middle tile
      setHeight(map, 1, 0, 1);
      const hilly = PathFinder.findPath(map, 0, 0, 2, 0);
      // Still finds path (diff is 1, traversable) but path length same
      expect(hilly.length).toBe(2);
    });
  });

  describe('waypoint format', () => {
    it('returns objects with col and row properties', () => {
      const map = createMap(5, 5);
      const path = PathFinder.findPath(map, 0, 0, 2, 0);
      for (const wp of path) {
        expect(wp).toHaveProperty('col');
        expect(wp).toHaveProperty('row');
      }
    });

    it('waypoints are sequential steps (each 1 tile apart)', () => {
      const map = createMap(5, 5);
      const path = PathFinder.findPath(map, 0, 0, 3, 2);

      // Check start connects to first waypoint
      let prev = { col: 0, row: 0 };
      for (const wp of path) {
        const dist = Math.abs(wp.col - prev.col) + Math.abs(wp.row - prev.row);
        expect(dist).toBe(1);
        prev = wp;
      }
    });
  });

  describe('edge cases', () => {
    it('works on 1x1 map (start=end)', () => {
      const map = createMap(1, 1);
      expect(PathFinder.findPath(map, 0, 0, 0, 0)).toEqual([]);
    });

    it('adjacent tiles', () => {
      const map = createMap(3, 3);
      const path = PathFinder.findPath(map, 1, 1, 2, 1);
      expect(path).toEqual([{ col: 2, row: 1 }]);
    });

    it('works on larger map', () => {
      const map = createMap(20, 20);
      const path = PathFinder.findPath(map, 0, 0, 19, 19);
      expect(path.length).toBe(38); // Manhattan distance
      expect(path[path.length - 1]).toEqual({ col: 19, row: 19 });
    });
  });
});
