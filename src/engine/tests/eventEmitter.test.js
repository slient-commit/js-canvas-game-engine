import { describe, it, expect, vi } from 'vitest';

describe('EventEmitter', () => {
  describe('on + emit', () => {
    it('fires callback on emit', () => {
      const ee = new EventEmitter();
      const fn = vi.fn();
      ee.on('test', fn);
      ee.emit('test');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('passes arguments to callback', () => {
      const ee = new EventEmitter();
      const fn = vi.fn();
      ee.on('data', fn);
      ee.emit('data', 42, 'hello');
      expect(fn).toHaveBeenCalledWith(42, 'hello');
    });

    it('supports multiple listeners on same event', () => {
      const ee = new EventEmitter();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      ee.on('evt', fn1);
      ee.on('evt', fn2);
      ee.emit('evt');
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).toHaveBeenCalledOnce();
    });

    it('does not fire listeners for other events', () => {
      const ee = new EventEmitter();
      const fn = vi.fn();
      ee.on('a', fn);
      ee.emit('b');
      expect(fn).not.toHaveBeenCalled();
    });

    it('fires on each emit', () => {
      const ee = new EventEmitter();
      const fn = vi.fn();
      ee.on('evt', fn);
      ee.emit('evt');
      ee.emit('evt');
      ee.emit('evt');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('once', () => {
    it('fires exactly once', () => {
      const ee = new EventEmitter();
      const fn = vi.fn();
      ee.once('evt', fn);
      ee.emit('evt');
      ee.emit('evt');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('passes arguments', () => {
      const ee = new EventEmitter();
      const fn = vi.fn();
      ee.once('evt', fn);
      ee.emit('evt', 'arg1');
      expect(fn).toHaveBeenCalledWith('arg1');
    });
  });

  describe('off', () => {
    it('removes specific listener', () => {
      const ee = new EventEmitter();
      const fn = vi.fn();
      ee.on('evt', fn);
      ee.off('evt', fn);
      ee.emit('evt');
      expect(fn).not.toHaveBeenCalled();
    });

    it('keeps other listeners', () => {
      const ee = new EventEmitter();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      ee.on('evt', fn1);
      ee.on('evt', fn2);
      ee.off('evt', fn1);
      ee.emit('evt');
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledOnce();
    });

    it('does not error when removing from nonexistent event', () => {
      const ee = new EventEmitter();
      expect(() => ee.off('nope', () => {})).not.toThrow();
    });
  });

  describe('removeAll', () => {
    it('removes all listeners for a specific event', () => {
      const ee = new EventEmitter();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      ee.on('a', fn1);
      ee.on('a', fn2);
      ee.removeAll('a');
      ee.emit('a');
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });

    it('keeps listeners for other events', () => {
      const ee = new EventEmitter();
      const fnA = vi.fn();
      const fnB = vi.fn();
      ee.on('a', fnA);
      ee.on('b', fnB);
      ee.removeAll('a');
      ee.emit('b');
      expect(fnB).toHaveBeenCalledOnce();
    });

    it('removes all listeners when no event specified', () => {
      const ee = new EventEmitter();
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      ee.on('a', fn1);
      ee.on('b', fn2);
      ee.removeAll();
      ee.emit('a');
      ee.emit('b');
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
    });
  });

  describe('chaining', () => {
    it('on returns the emitter', () => {
      const ee = new EventEmitter();
      expect(ee.on('evt', () => {})).toBe(ee);
    });

    it('once returns the emitter', () => {
      const ee = new EventEmitter();
      expect(ee.once('evt', () => {})).toBe(ee);
    });

    it('off returns the emitter', () => {
      const ee = new EventEmitter();
      expect(ee.off('evt', () => {})).toBe(ee);
    });
  });

  describe('emit with no listeners', () => {
    it('does not throw', () => {
      const ee = new EventEmitter();
      expect(() => ee.emit('nothing')).not.toThrow();
    });
  });
});
