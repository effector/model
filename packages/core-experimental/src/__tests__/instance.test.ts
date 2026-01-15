import { describe, it, expect, vi } from 'vitest';
import {
  createStore,
  allSettled,
  fork,
  createEvent,
  sample,
  is,
} from 'effector';
import { model } from '../model';
import { define } from '../define';
import { facet } from '../facet';
import { create } from '../instance';

describe('instance', () => {
  it('should process inputs', async () => {
    const m = model({
      input: {
        $val: define.store(0),
        raw: define.store(0),
      },
      fn: (input: any) => ({ input }),
    });

    const scope = fork();
    const instance = create(m, {
      input: {
        $val: createStore(10),
        raw: 20,
      },
    });

    expect(is.store(instance.input.$val)).toBe(true);
    expect(scope.getState(instance.input.$val)).toBe(10);
    expect(instance.input.raw).toBe(20);
  });

  it('should switch variants', async () => {
    const m = model({
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
    const instance = create(m, { input: { $s } });
    const scope = fork();

    expect(scope.getState(instance.activeVariant)).toBe('A');

    await allSettled($s, { scope, params: 'b' });
    expect(scope.getState(instance.activeVariant)).toBe('B');

    await allSettled($s, { scope, params: 'c' });
    expect(scope.getState(instance.activeVariant)).toBe(null);
  });

  it('should trigger lifecycle events', async () => {
    const m = model({
      input: { $s: define.store(0) },
      variant: {
        source: (i: any) => i.$s,
        cases: {
          one: (s: number) => s === 1,
        },
      },
    });

    const $s = createStore(0);
    const instance = create(m, { input: { $s } });
    const scope = fork();

    // Watch enter event
    const enterWatcher = createEvent();
    sample({
      clock: instance.variant.one.enter as any,
      target: enterWatcher,
    } as any);

    const $enterCount = createStore(0).on(enterWatcher, (x) => x + 1);

    await allSettled($s, { scope, params: 1 });
    expect(scope.getState($enterCount)).toBe(1);

    await allSettled($s, { scope, params: 0 });
    // Switch back
    await allSettled($s, { scope, params: 1 });
    expect(scope.getState($enterCount)).toBe(2);
  });

  it('should multiplex facets', async () => {
    const f = facet({
      $val: define.store(0),
      evt: define.event<string>(),
    });

    // We need to spy on the implementation event.
    // We can do this by creating the event outside and passing it in, OR by exposing it from impl.
    const implEventA = createEvent<string>();
    const implEventB = createEvent<string>();

    const m = model({
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
    const instance = create(m, { input: { $s } });
    const scope = fork();

    const spyA = vi.fn();
    const spyB = vi.fn();

    // We can't watch global events easily in scope without linking them to stores/effects.
    // Let's link them to stores.
    const $lastA = createStore('').on(implEventA, (_, p) => p);
    const $lastB = createStore('').on(implEventB, (_, p) => p);

    // 1. Check Store Multiplexing
    expect(scope.getState(instance.facets.f.$val)).toBe(10);

    await allSettled($s, { scope, params: 'b' });
    expect(scope.getState(instance.facets.f.$val)).toBe(20);

    // 2. Check Event Multiplexing (Active: B)
    await allSettled(instance.facets.f.evt, { scope, params: 'helloB' });
    expect(scope.getState($lastB)).toBe('helloB');
    expect(scope.getState($lastA)).toBe(''); // A should not receive it

    // Switch to A
    await allSettled($s, { scope, params: 'a' });
    await allSettled(instance.facets.f.evt, { scope, params: 'helloA' });
    expect(scope.getState($lastA)).toBe('helloA');
    expect(scope.getState($lastB)).toBe('helloB'); // Unchanged
  });

  it('should clean up on destroy', async () => {
    const m = model({
      input: { $s: define.store(0) },
      variant: {
        source: (i: any) => i.$s,
        cases: { A: (s: number) => s === 1 },
      },
    });
    const $s = createStore(0);
    const instance = create(m, { input: { $s } });
    const scope = fork();

    // Verify activeVariant updates
    await allSettled($s, { scope, params: 1 });
    expect(scope.getState(instance.activeVariant)).toBe('A');

    // Destroy
    instance.destroy();

    // Update input
    await allSettled($s, { scope, params: 0 });

    // activeVariant should NOT update because the graph is disconnected
    // Wait, activeVariant is a store. If we cleared its node, it might effectively be dead.
    // However, if we hold a reference to it (instance.activeVariant), and we check its state...
    // In Effector, clearNode destroys the logic (links).
    // So the subscription from $s to activeVariant should be gone.

    expect(scope.getState(instance.activeVariant)).toBe('A'); // Stale value
  });
});
