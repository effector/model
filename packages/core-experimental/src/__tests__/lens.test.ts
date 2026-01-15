import { describe, it, expect, vi } from 'vitest';
import { createStore, allSettled, fork, createEvent, sample } from 'effector';
import { model } from '../model';
import { define } from '../define';
import { keyval } from '../keyval';
import { facet } from '../facet';
import { select } from '../lens';

describe('lens', () => {
  const f = facet({ $val: define.store(0) });
  const m = model({
    input: { $v: define.store(0) },
    facets: { f },
    fn: ({ $v }: any) => ({
      f: { $val: $v },
      staticVal: 123,
      nested: {
        deep: {
          val: 456,
        },
      },
    }),
  });
  const list = keyval({ model: m });

  it('should throw if source is not a lens', () => {
    expect(() => select(createStore(null))).toThrow(
      'select() source must be a Lens',
    );
  });

  it('should select data from keyval', async () => {
    const scope = fork();

    // Add item
    const $v = createStore(10);
    await allSettled(list.add, {
      scope,
      params: { id: '1', input: { $v } },
    });

    // Select
    const $selectedId = createStore<string | null>('1');
    const item = list.getItem($selectedId);

    // Test builder methods
    const $val = select(item)
      .variant('ignored') // Should return builder
      .facet('f')
      .path((x: any) => x.$val)
      .fallback(-1);

    expect(scope.getState($val)).toBe(10);

    // Update source store
    await allSettled($v, { scope, params: 20 });
    expect(scope.getState($val)).toBe(20);

    // Change ID to missing
    await allSettled($selectedId, { scope, params: '2' });
    expect(scope.getState($val)).toBe(-1);

    // Change ID back
    await allSettled($selectedId, { scope, params: '1' });
    expect(scope.getState($val)).toBe(20);
  });

  it('should handle static values and nested paths', async () => {
    const scope = fork();
    await allSettled(list.add, {
      scope,
      params: { id: '1', input: { $v: createStore(0) } },
    });

    const item = list.getItem('1');

    // Static value
    const $static = select(item)
      .path((x: any) => x.staticVal)
      .fallback(0);
    expect(scope.getState($static)).toBe(123);

    // Nested path
    const $nested = select(item)
      .path((x: any) => x.nested.deep.val)
      .fallback(0);
    expect(scope.getState($nested)).toBe(456);
  });

  it('should handle missing path gracefully', async () => {
    const scope = fork();
    await allSettled(list.add, {
      scope,
      params: { id: '1', input: { $v: createStore(0) } },
    });
    const item = list.getItem('1');
    const $missing = select(item)
      .path((x: any) => x.nonExistent)
      .fallback(999);
    expect(scope.getState($missing)).toBe(999);

    const $missingDeep = select(item)
      .path((x: any) => x.nested.nonExistent)
      .fallback(999);
    expect(scope.getState($missingDeep)).toBe(999);
  });
});
