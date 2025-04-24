import { expect, test, describe, vi } from 'vitest';
import { keyval } from '@effector/model';
import { combine, createEvent, createStore } from 'effector';
import { readonly } from 'patronum';

describe('support nested keyval', () => {
  test('nested keyval becomes an array', () => {
    const entities = keyval(() => {
      const $id = createStore('');
      const childs = keyval(() => {
        const $id = createStore('');
        const $count = createStore(0);
        return {
          key: 'id',
          state: {
            id: $id,
            count: $count,
          },
        };
      });
      return {
        key: 'id',
        state: { id: $id, childs },
        optional: ['childs'],
      };
    });
    entities.edit.add({ id: 'baz' });
    expect(entities.$items.getState()).toEqual([{ id: 'baz', childs: [] }]);
  });
  test('updates nested keyval', () => {
    const entities = keyval(() => {
      const childs = keyval(() => {
        const $id = createStore('');
        const sum = createEvent<number>();
        const $count = createStore(0);
        $count.on(sum, (x, y) => x + y);
        return {
          key: 'id',
          state: {
            id: $id,
            count: readonly($count),
          },
          api: { sum },
        };
      });
      const $id = createStore('');
      return {
        key: 'id',
        state: { id: $id, childs },
        api: {
          sum: childs.api.sum,
          addChild: childs.edit.add,
        },
        optional: ['childs'],
      };
    });
    entities.edit.add([{ id: 'foo' }, { id: 'bar' }]);
    entities.api.addChild({
      key: 'foo',
      data: [{ id: 'fooA' }, { id: 'fooB' }],
    });
    expect(entities.$items.getState()).toEqual([
      {
        id: 'foo',
        childs: [
          { id: 'fooA', count: 0 },
          { id: 'fooB', count: 0 },
        ],
      },
      { id: 'bar', childs: [] },
    ]);
    entities.api.sum({
      key: 'foo',
      data: {
        key: 'fooB',
        data: 2,
      },
    });
    expect(entities.$items.getState()).toEqual([
      {
        id: 'foo',
        childs: [
          { id: 'fooA', count: 0 },
          { id: 'fooB', count: 2 },
        ],
      },
      { id: 'bar', childs: [] },
    ]);
  });
});

test('api support', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const incBy = createEvent<number>();
    const $count = createStore(0);
    $count.on(incBy, (x, y) => x + y);
    return {
      key: 'id',
      state: { id: $id, count: readonly($count) },
      api: { incBy },
    };
  });
  entities.edit.add([{ id: 'foo' }, { id: 'bar' }]);
  entities.api.incBy({ key: 'foo', data: 2 });
  expect(entities.$items.getState()).toEqual([
    { id: 'foo', count: 2 },
    { id: 'bar', count: 0 },
  ]);
});

test('onMount support', () => {
  const fn = vi.fn();
  const entities = keyval(() => {
    const $id = createStore(0);
    const onMount = createEvent();
    onMount.watch(() => fn());
    return {
      key: 'id',
      state: { id: $id },
      onMount,
    };
  });
  expect(fn).toBeCalledTimes(0);
  entities.edit.add({ id: 1 });
  expect(fn).toBeCalledTimes(1);
  entities.edit.add({ id: 2 });
  expect(fn).toBeCalledTimes(2);
});

test('.defaultState', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $size = combine($id, (str) => str.length);
    return {
      key: 'id',
      state: {
        id: $id,
        size: $size,
      },
    };
  });
  expect(entities.defaultState()).toEqual({
    id: '',
    size: 0,
  });
});
