import { expect, test, describe } from 'vitest';
import { keyval, define } from '@effector/model';
import { createEvent, createStore } from 'effector';

describe('support nested keyval', () => {
  test('nested keyval becomes an array', () => {
    const entities = keyval({
      key: 'id',
      props: {
        id: define.store<string>(),
      },
      create() {
        const childs = keyval({
          key: 'id',
          props: {
            id: define.store<string>(),
            count: define.store<number>(),
          },
          create() {
            return {};
          },
        });
        return { childs };
      },
    });
    entities.edit.add({ id: 'baz' });
    expect(entities.$items.getState()).toEqual([{ id: 'baz', childs: [] }]);
  });
  test('updates nested keyval', () => {
    const entities = keyval({
      key: 'id',
      props: {
        id: define.store<string>(),
      },
      create() {
        const childs = keyval({
          key: 'id',
          props: {
            id: define.store<string>(),
          },
          create() {
            const sum = createEvent<number>();
            const $count = createStore(0);
            $count.on(sum, (x, y) => x + y);
            return {
              state: { count: $count },
              api: { sum },
            };
          },
        });
        return {
          state: { childs },
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
  test.skip('support nested keyval', () => {
    const entities = keyval({
      key: 'id',
      props: {
        id: define.store<string>(),
      },
      create() {
        const childs = keyval({
          key: 'id',
          props: {
            id: define.store<string>(),
            count: define.store<number>(),
          },
          create() {
            return {};
          },
        });
        return { childs };
      },
    });
    entities.edit.add([
      {
        id: 'foo',
        childs: [
          { id: 'foo1', count: 0 },
          { id: 'foo2', count: 0 },
        ],
      },
      {
        id: 'bar',
        childs: [
          { id: 'bar1', count: 0 },
          { id: 'bar2', count: 0 },
        ],
      },
    ]);
    expect(entities.$items.getState()).toEqual([
      {
        id: 'foo',
        childs: [
          { id: 'foo1', count: 0 },
          { id: 'foo2', count: 0 },
        ],
      },
      {
        id: 'bar',
        childs: [
          { id: 'bar1', count: 0 },
          { id: 'bar2', count: 0 },
        ],
      },
    ]);
    console.log(entities.$items.getState());
  });
});

test('api support', () => {
  const entities = keyval({
    key: 'id',
    props: {
      id: define.store<string>(),
    },
    create() {
      const incBy = createEvent<number>();
      const $count = createStore(0);
      $count.on(incBy, (x, y) => x + y);
      return {
        state: { count: $count },
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
