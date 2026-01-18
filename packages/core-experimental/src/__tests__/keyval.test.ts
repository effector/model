import { describe, it, expect, vi } from 'vitest';
import { createStore, allSettled, fork, createEvent, is } from 'effector';
import { model } from '../model';
import { define } from '../define';
import { keyval, union } from '../keyval';
import { facet } from '../facet';
import { select } from '../lens';

describe('keyval', () => {
  const m = model({
    input: { $id: define.store('default') },
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: ({ $id }: any) => ({ $id }),
  });

  it('should add and remove items', async () => {
    const list = keyval({ model: m });
    const scope = fork();

    // Add
    await allSettled(list.add, {
      scope,
      params: {
        id: '1',
        input: { $id: createStore('1') },
      },
    });

    expect(scope.getState(list.$items)).toEqual(['1']);

    // Check idempotency (add same id)
    await allSettled(list.add, {
      scope,
      params: {
        id: '1',
        input: { $id: createStore('2') },
      },
    });
    expect(scope.getState(list.$items)).toEqual(['1']); // No duplicate

    // Remove
    await allSettled(list.remove, { scope, params: '1' });
    expect(scope.getState(list.$items)).toEqual([]);

    // Remove non-existent
    await allSettled(list.remove, { scope, params: '99' });
    expect(scope.getState(list.$items)).toEqual([]);
  });

  it('should handle union models', async () => {
    const m1 = model({ input: { $a: define.store(0) } });
    const m2 = model({ input: { $b: define.store(0) } });
    const u = union({ a: m1, b: m2 });
    const list = keyval({ model: u });
    const scope = fork();

    await allSettled(list.add, {
      scope,
      params: {
        id: '1',
        variant: 'a',
        input: { $a: createStore(1) },
      },
    });

    expect(scope.getState(list.$items)).toEqual(['1']);

    // Test invalid variant
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await allSettled(list.add, {
      scope,
      params: {
        id: '2',
        variant: 'invalid',
        input: {},
      },
    });
    expect(scope.getState(list.$items)).toEqual(['1']); // Should not add
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should create proxies via getItem', async () => {
    const list = keyval({ model: m });
    const scope = fork();
    await allSettled(list.add, {
      scope,
      params: { id: '1', input: { $id: createStore('val1') } },
    });
    await allSettled(list.add, {
      scope,
      params: { id: '2', input: { $id: createStore('val2') } },
    });

    // 1. String ID
    const p1 = list.getItem('1');
    expect(p1.__type).toBe('lens');
    expect(is.store(p1.id)).toBe(true);
    expect(scope.getState(p1.id)).toBe('1');
    expect(p1.path).toEqual([]);

    // 2. Store ID (Dynamic selection)
    const $currentId = createStore('1');
    const p2 = list.getItem($currentId);
    expect(p2.__type).toBe('lens');
    expect(p2.id).toBe($currentId);

    const $val = select(p2)
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .path((x: any) => x.$id)
      .fallback('missing');

    expect(scope.getState($val)).toBe('val1');

    await allSettled($currentId, { scope, params: '2' });
    expect(scope.getState($val)).toBe('val2');

    await allSettled($currentId, { scope, params: '3' });
    expect(scope.getState($val)).toBe('missing');

    // 3. Event ID (Action routing)
    const evt = createEvent<string>();
    const p3 = list.getItem(evt);
    // Event proxy is NOT a lens, it's a proxy for triggering methods
    expect(p3.__type).toBeUndefined(); // It's a proxy

    // Check properties on Event Proxy
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((p3.activeVariant as any)._sourceEvent).toBe(evt);
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(is.store((p3.activeVariant as any)._instances)).toBe(true);

    // Check caching
    expect(list.getItem('1')).toBe(p1);
    expect(list.getItem($currentId)).toBe(p2);
    expect(list.getItem(evt)).toBe(p3);
  });

  it('should handle facets and activeVariant in proxies', () => {
    const mWithFacets = model({
      input: {},
      facets: {
        f: facet({
          field: define.store(0),
          method: define.event<void>(),
        }),
      },
      fn: () => ({}),
    });
    const list = keyval({ model: mWithFacets });

    // Store/String Proxy
    const p1 = list.getItem('1');
    expect(p1.activeVariant.__type).toBe('lens');
    expect(p1.activeVariant.path).toEqual(['activeVariant']);

    expect(p1.facets.f.field.__type).toBe('lens');
    expect(p1.facets.f.field.path).toEqual(['facets', 'f', 'field']);

    // Event Proxy
    const evt = createEvent<string>();
    const p2 = list.getItem(evt);
    // Accessing facets returns another proxy that eventually returns a Unit
    const unitProxy = p2.facets.f.method;
    // This unitProxy is a Unit (Trigger)
    expect(is.event(unitProxy)).toBe(true);
  });

  it('should clean up on remove', async () => {
    const onCleanup = vi.fn();
    const mWithCleanup = model({
      input: {},
      fn: () => ({
        destroy: onCleanup,
      }),
    });

    const list = keyval({ model: mWithCleanup });
    const scope = fork();

    await allSettled(list.add, {
      scope,
      params: { id: '1', input: {} },
    });

    expect(scope.getState(list.$items)).toEqual(['1']);

    await allSettled(list.remove, { scope, params: '1' });
    expect(scope.getState(list.$items)).toEqual([]);
    expect(onCleanup).toHaveBeenCalled();
  });

  it('should handle removing item with active lens', async () => {
    const list = keyval({ model: m });
    const scope = fork();
    await allSettled(list.add, {
      scope,
      params: { id: '1', input: { $id: createStore('1') } },
    });

    const item = list.getItem('1');
    // Direct access to lens definition (not value)
    const lensDef = item.input.$id;
    expect(lensDef.__type).toBe('lens');

    // We can't easily check "value" of a definition without selecting it or binding it.
    // But we can check if remove throws.
    await allSettled(list.remove, { scope, params: '1' });
  });

  it('should prevent duplicate add', async () => {
    const list = keyval({ model: m });
    const scope = fork();

    await allSettled(list.add, {
      scope,
      params: { id: '1', input: { $id: createStore('1') } },
    });

    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Add same ID with different input
    await allSettled(list.add, {
      scope,
      params: { id: '1', input: { $id: createStore('2') } },
    });

    // Should still be '1' (original)
    // We need to select to see value
    // But we can rely on $items list being length 1
    expect(scope.getState(list.$items)).toHaveLength(1);

    spy.mockRestore();
  });

  it('should validate missing inputs', async () => {
    const mRequired = model({
      input: { $id: define.store<string>() }, // No default
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fn: ({ $id }: any) => ({ $id }),
    });
    const list = keyval({ model: mRequired });
    const scope = fork();

    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await allSettled(list.add, {
      scope,
      params: {
        id: '1',
        // type-coverage:ignore-next-line
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input: {} as any, // Missing $id
      },
    });

    expect(scope.getState(list.$items)).toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
