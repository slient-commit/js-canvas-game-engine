import { describe, it, expect } from 'vitest';
const { isPathSafe, isSafeFilename } = require('../fileHandlers');

describe('isPathSafe', () => {
  it('returns true for path within allowed directory', () => {
    expect(isPathSafe('/projects/game/assets/img.png', '/projects/game')).toBe(true);
  });

  it('returns true for deeply nested path', () => {
    expect(isPathSafe('/projects/game/assets/sprites/walk.png', '/projects/game')).toBe(true);
  });

  it('returns true when path equals the allowed directory', () => {
    expect(isPathSafe('/projects/game', '/projects/game')).toBe(true);
  });

  it('returns false for path outside allowed directory', () => {
    expect(isPathSafe('/other/file.txt', '/projects/game')).toBe(false);
  });

  it('returns false for path traversal with ../', () => {
    expect(isPathSafe('/projects/game/../secret.txt', '/projects/game')).toBe(false);
  });

  it('returns false for sibling directory with similar prefix', () => {
    // /projects/game-hack should NOT match /projects/game
    expect(isPathSafe('/projects/game-hack/file.txt', '/projects/game')).toBe(false);
  });

  it('returns false for null filePath', () => {
    expect(isPathSafe(null, '/projects/game')).toBe(false);
  });

  it('returns false for null allowedDir', () => {
    expect(isPathSafe('/projects/game/file.txt', null)).toBe(false);
  });

  it('returns false for both null', () => {
    expect(isPathSafe(null, null)).toBe(false);
  });

  it('returns false for empty filePath', () => {
    expect(isPathSafe('', '/projects/game')).toBe(false);
  });

  it('returns false for empty allowedDir', () => {
    expect(isPathSafe('/projects/game/file.txt', '')).toBe(false);
  });
});

describe('isSafeFilename', () => {
  it('returns true for normal filename', () => {
    expect(isSafeFilename('sprite.png')).toBe(true);
  });

  it('returns true for filename without extension', () => {
    expect(isSafeFilename('README')).toBe(true);
  });

  it('returns true for filename with spaces', () => {
    expect(isSafeFilename('my sprite.png')).toBe(true);
  });

  it('returns true for filename with dashes and underscores', () => {
    expect(isSafeFilename('walk-cycle_01.png')).toBe(true);
  });

  it('returns false for filename with forward slash', () => {
    expect(isSafeFilename('sub/file.txt')).toBe(false);
  });

  it('returns false for filename with backslash', () => {
    expect(isSafeFilename('sub\\file.txt')).toBe(false);
  });

  it('returns false for double dot', () => {
    expect(isSafeFilename('..')).toBe(false);
  });

  it('returns false for single dot', () => {
    expect(isSafeFilename('.')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isSafeFilename('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isSafeFilename(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isSafeFilename(undefined)).toBe(false);
  });
});
