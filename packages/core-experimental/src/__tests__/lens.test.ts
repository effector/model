import { describe, it, expect } from 'vitest';
import { createStore, allSettled, fork } from 'effector';
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
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .path((x: any) => x.staticVal)
      .fallback(0);
    expect(scope.getState($static)).toBe(123);

    // Nested path
    const $nested = select(item)
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .path((x: any) => x.nonExistent)
      .fallback(999);
    expect(scope.getState($missing)).toBe(999);

    const $missingDeep = select(item)
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .path((x: any) => x.nested.nonExistent)
      .fallback(999);
    expect(scope.getState($missingDeep)).toBe(999);
  });

  it('should support chained lenses', async () => {
    const scope = fork();
    await allSettled(list.add, {
      scope,
      params: { id: '1', input: { $v: createStore(10) } },
    });

    const item = list.getItem('1');

    // Chain: select(item).facet('f').path(...)
    const $val = select(item)
      .facet('f')
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .path((x: any) => x.$val)
      .fallback(0);

    expect(scope.getState($val)).toBe(10);
  });

  it('should be immutable', () => {
    const item = list.getItem('1');
    const b1 = select(item).facet('f');
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b2 = b1.path((x: any) => x.x);
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b3 = b1.path((x: any) => x.y);

    // b1 should not be modified by b2 call
    expect(b2).not.toBe(b1);
    expect(b3).not.toBe(b1);
  });
});
