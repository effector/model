import { describe, it, expect, vi } from 'vitest';
import {
  createStore,
  allSettled,
  fork,
  createEvent,
  sample,
  Event,
} from 'effector';
import { model } from '../model';
import { define } from '../define';
import { keyval, union } from '../keyval';
import { match } from '../match';
import { facet } from '../facet';

describe('match', () => {
  const f = facet({ evt: define.event<void>() });

  const mA = model({
    facets: { f },
    fn: () => ({ f: { evt: createEvent() } }),
  });

  const mB = model({
    facets: { f },
    fn: () => ({ f: { evt: createEvent() } }),
  });

  const u = union({ A: mA, B: mB });
  const list = keyval({ model: u });

  it('should route events based on variant', async () => {
    const scope = fork();

    // Add A and B
    await allSettled(list.add, {
      scope,
      params: { id: '1', variant: 'A', input: {} },
    });

    await allSettled(list.add, {
      scope,
      params: { id: '2', variant: 'B', input: {} },
    });

    // Setup match
    const trigger = createEvent<string>();
    const item = list.getItem(trigger);

    const spyA = vi.fn();
    const spyB = vi.fn();

    const watcherA = createEvent();
    watcherA.watch(spyA);
    const watcherB = createEvent();
    watcherB.watch(spyB);

    match({
      source: item.activeVariant,
      cases: {
        A: (scope: any, trg: Event<string>) => {
          sample({
            clock: trg,
            target: watcherA,
          });
        },
        B: (scope: any, trg: Event<string>) => {
          sample({
            clock: trg,
            target: watcherB,
          });
        },
      },
    });

    // Trigger for A (id='1')
    await allSettled(trigger, { scope, params: '1' });
    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(0);

    // Trigger for B (id='2')
    await allSettled(trigger, { scope, params: '2' });
    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(1);

    // Trigger for non-existent (should be ignored by filter)
    await allSettled(trigger, { scope, params: '3' });
    expect(spyA).toHaveBeenCalledTimes(1); // Unchanged
    expect(spyB).toHaveBeenCalledTimes(1); // Unchanged
  });

  it('should ignore if source is invalid', () => {
    // match() checks if source has _sourceEvent and _instances
    // If we pass something else, it should do nothing.
    expect(() => match({ source: {}, cases: {} })).not.toThrow();
  });
});
