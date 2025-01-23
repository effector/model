import { expect, test, describe } from 'vitest';
import { keyval } from '@effector/model';
import { createEvent, createStore } from 'effector';
import { readonly } from 'patronum';

describe('support nested keyval', () => {
  test('nested keyval becomes an array', () => {
    const entities = keyval({
      key: 'id',
      create() {
        const $id = createStore('');
        const childs = keyval({
          key: 'id',
          create() {
            const $id = createStore('');
            const $count = createStore(0);
            return {
              id: $id,
              count: $count,
            };
          },
        });
        return { id: $id, childs };
      },
    });
    entities.edit.add({ id: 'baz' });
    expect(entities.$items.getState()).toEqual([{ id: 'baz', childs: [] }]);
  });
  test('updates nested keyval', () => {
    const entities = keyval({
      key: 'id',
      create() {
        const childs = keyval({
          key: 'id',
          create() {
            const $id = createStore('');
            const sum = createEvent<number>();
            const $count = createStore(0);
            $count.on(sum, (x, y) => x + y);
            return {
              state: {
                id: $id,
                count: readonly($count),
              },
              api: { sum },
            };
          },
        });
        const $id = createStore('');
        return {
          state: { id: $id, childs },
          api: {
            sum: childs.api.sum,
            addChild: childs.edit.add,
          },
        };
      },
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
  const entities = keyval({
    key: 'id',
    create() {
      const $id = createStore('');
      const incBy = createEvent<number>();
      const $count = createStore(0);
      $count.on(incBy, (x, y) => x + y);
      return {
        state: { id: $id, count: readonly($count) },
        api: { incBy },
      };
    },
  });
  entities.edit.add([{ id: 'foo' }, { id: 'bar' }]);
  entities.api.incBy({ key: 'foo', data: 2 });
  expect(entities.$items.getState()).toEqual([
    { id: 'foo', count: 2 },
    { id: 'bar', count: 0 },
  ]);
});
