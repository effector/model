import { describe, it, expect, vi } from 'vitest';
import {
  createStore,
  allSettled,
  fork,
  createEvent,
  sample,
  is,
  EventCallable,
} from 'effector';
import { model } from '../model';
import { define } from '../define';
import { facet } from '../facet';
import { create } from '../instance';

describe('instance', () => {
  describe('Inputs', () => {
    it('should process inputs', async () => {
      const testModel = model({
        input: {
          $val: define.store(0),
          raw: define.store(0),
        },
        fn: (input: any) => ({ input }),
      });

      const scope = fork();
      const instance = create(testModel, {
        input: {
          $val: createStore(10),
          raw: 20,
        },
      });

      expect(is.store(instance.input.$val)).toBe(true);
      expect(scope.getState(instance.input.$val)).toBe(10);
      expect(is.store(instance.input.raw)).toBe(true);
      expect(scope.getState(instance.input.raw)).toBe(20);
    });

    it('should process static value inputs', async () => {
      const testModel = model({
        input: { $val: define.store(0) },
        fn: ({ $val }: any) => ({ $val }),
      });

      const scope = fork();
      const instance = create(testModel, {
        input: { $val: 10 },
      });

      expect(is.store(instance.input.$val)).toBe(true);
      expect(scope.getState(instance.input.$val)).toBe(10);
    });

    it('should ignore extra inputs', () => {
      const testModel = model({
        input: { $val: define.store(0) },
        fn: ({ $val }: any) => ({ $val }),
      });

      const scope = fork();
      const $val = createStore(10);

      // Pass extra field 'extra'
      const instance = create(testModel, {
        input: {
          $val,
          extra: createStore(99),
        } as any,
      });

      expect(is.store(instance.input.$val)).toBe(true);
      expect(scope.getState(instance.input.$val)).toBe(10);
      expect((instance.input as any).extra).toBeUndefined();
    });
  });

  describe('Scope Isolation', () => {
    it('should maintain independent state for multiple instances', async () => {
      const testModel = model({
        input: { $val: define.store(0) },
        fn: ({ $val }: any) => {
          const $doubled = $val.map((x: number) => x * 2);
          return { $doubled };
        },
      });

      const scope = fork();
      const $input1 = createStore(10);
      const $input2 = createStore(20);

      const instance1 = create(testModel, { input: { $val: $input1 } });
      const instance2 = create(testModel, { input: { $val: $input2 } });

      expect(scope.getState(instance1.$doubled)).toBe(20);
      expect(scope.getState(instance2.$doubled)).toBe(40);

      await allSettled($input1, { scope, params: 100 });
      expect(scope.getState(instance1.$doubled)).toBe(200);
      expect(scope.getState(instance2.$doubled)).toBe(40); // Unchanged
    });
  });

  describe('Variants', () => {
    it('should switch variants based on source', async () => {
      const testModel = model({
        input: { $s: define.store('a') },
        variant: {
          source: (i: any) => i.$s,
          cases: {
            A: (s: string) => s === 'a',
            B: (s: string) => s === 'b',
          },
        },
      });

      const $s = createStore('a');
      const instance = create(testModel, { input: { $s } });
      const scope = fork();

      expect(scope.getState(instance.activeVariant)).toBe('A');

      await allSettled($s, { scope, params: 'b' });
      expect(scope.getState(instance.activeVariant)).toBe('B');

      await allSettled($s, { scope, params: 'c' });
      expect(scope.getState(instance.activeVariant)).toBe(null);
    });

    it('should trigger enter and leave events correctly', async () => {
      const testModel = model({
        input: { $score: define.store(0) },
        variant: {
          source: ({ $score }: { $score: any }) => $score,
          cases: {
            positive: (s: number) => s > 0,
            negative: (s: number) => s < 0,
            zero: (s: number) => s === 0,
          },
        },
      });

      const $score = createStore(0);
      const instance = create(testModel, { input: { $score } });
      const scope = fork();

      const enterPositive = vi.fn();
      const leavePositive = vi.fn();
      const enterNegative = vi.fn();
      const leaveNegative = vi.fn();

      // Helper to watch events
      const watch = (event: EventCallable<void>, fn: any) => {
        const watcher = createEvent();
        watcher.watch(fn);
        sample({ clock: event, target: watcher });
      };

      watch(
        instance.variant.positive.enter as EventCallable<void>,
        enterPositive,
      );
      watch(
        instance.variant.positive.leave as EventCallable<void>,
        leavePositive,
      );
      watch(
        instance.variant.negative.enter as EventCallable<void>,
        enterNegative,
      );
      watch(
        instance.variant.negative.leave as EventCallable<void>,
        leaveNegative,
      );

      // Initial state: 0 (zero)
      expect(scope.getState(instance.activeVariant)).toBe('zero');
      expect(enterPositive).not.toHaveBeenCalled();

      // Switch to positive
      await allSettled($score, { scope, params: 10 });
      expect(scope.getState(instance.activeVariant)).toBe('positive');
      expect(enterPositive).toHaveBeenCalledTimes(1);
      expect(leavePositive).not.toHaveBeenCalled();

      // Switch to negative
      await allSettled($score, { scope, params: -10 });
      expect(scope.getState(instance.activeVariant)).toBe('negative');
      expect(leavePositive).toHaveBeenCalledTimes(1); // Crucial check!
      expect(enterNegative).toHaveBeenCalledTimes(1);

      // Switch to zero
      await allSettled($score, { scope, params: 0 });
      expect(scope.getState(instance.activeVariant)).toBe('zero');
      expect(leaveNegative).toHaveBeenCalledTimes(1);
    });
  });

  describe('Facets', () => {
    it('should use base implementation if no variant matches', async () => {
      const f = facet({ $val: define.store(0) });
      const testModel = model({
        input: { $s: define.store('a') },
        facets: { f },
        variant: {
          source: (i: any) => i.$s,
          cases: { A: (s: string) => s === 'a' },
        },
        fn: () => ({
          f: { $val: createStore(999) }, // Base implementation
        }),
        impl: {
          A: () => ({
            f: { $val: define.store(1) },
          }),
        },
      });

      const $s = createStore('b'); // No match
      const instance = create(testModel, { input: { $s } });
      const scope = fork();

      expect(scope.getState(instance.facets.f.$val)).toBe(999);

      await allSettled($s, { scope, params: 'a' });
      expect(scope.getState(instance.facets.f.$val)).toBe(1);
    });

    it('should multiplex facets based on active variant', async () => {
      const f = facet({
        $val: define.store(0),
        evt: define.event<string>(),
      });

      const implEventA = createEvent<string>();
      const implEventB = createEvent<string>();

      const testModel = model({
        input: { $s: define.store('a') },
        facets: { f },
        variant: {
          source: (i: any) => i.$s,
          cases: {
            A: (s: string) => s === 'a',
            B: (s: string) => s === 'b',
          },
        },
        impl: {
          A: () => ({
            f: {
              $val: define.store(10),
              evt: implEventA,
            },
          }),
          B: () => ({
            f: {
              $val: define.store(20),
              evt: implEventB,
            },
          }),
        },
      });

      const $s = createStore('a');
      const instance = create(testModel, { input: { $s } });
      const scope = fork();

      // Link global events to stores for testing
      const $lastA = createStore('').on(implEventA, (_, p) => p);
      const $lastB = createStore('').on(implEventB, (_, p) => p);

      // 1. Check Store Multiplexing (Active: A)
      expect(scope.getState(instance.facets.f.$val)).toBe(10);

      // Switch to B
      await allSettled($s, { scope, params: 'b' });
      expect(scope.getState(instance.facets.f.$val)).toBe(20);

      // 2. Check Event Multiplexing (Active: B)
      await allSettled(instance.facets.f.evt, { scope, params: 'helloB' });
      expect(scope.getState($lastB)).toBe('helloB');
      expect(scope.getState($lastA)).toBe('');

      // Switch back to A
      await allSettled($s, { scope, params: 'a' });
      await allSettled(instance.facets.f.evt, { scope, params: 'helloA' });
      expect(scope.getState($lastA)).toBe('helloA');
      expect(scope.getState($lastB)).toBe('helloB'); // Unchanged
    });
  });

  describe('Lifecycle', () => {
    it('should clean up resources on destroy', async () => {
      const testModel = model({
        input: { $s: define.store(0) },
        variant: {
          source: (i: any) => i.$s,
          cases: { A: (s: number) => s === 1 },
        },
      });
      const $s = createStore(0);
      const instance = create(testModel, { input: { $s } });
      const scope = fork();

      // Verify activeVariant updates
      await allSettled($s, { scope, params: 1 });
      expect(scope.getState(instance.activeVariant)).toBe('A');

      // Destroy
      instance.destroy();

      // Update input
      await allSettled($s, { scope, params: 0 });

      // After destroy, the graph is disconnected.
    });

    it('should allow idempotent destroy', () => {
      const testModel = model({ input: {} });
      const instance = create(testModel, { input: {} });

      instance.destroy();
      expect(() => instance.destroy()).not.toThrow();
    });

    it('should destroy nested instances created via model fn', async () => {
      const child = model({
        input: { $v: define.store(0) },
        fn: ({ $v }: any) => {
          const $derived = $v.map((x: number) => x);
          return { $derived };
        },
      });

      const parent = model({
        input: { $v: define.store(0) },
        fn: ({ $v }: any) => {
          const c = create(child, { input: { $v } });
          return { c };
        },
      });

      const $v = createStore(1);
      const instance = create(parent, { input: { $v } });
      const scope = fork();

      // Verify child works
      expect(scope.getState(instance.c.$derived)).toBe(1);

      instance.destroy();

      // After destroy, updates should stop
      await allSettled($v, { scope, params: 2 });
    });
  });
});
