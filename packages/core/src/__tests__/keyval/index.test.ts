import { expect, test, describe } from 'vitest';
import { keyval, define } from '@effector/model';
import { createEvent, createStore } from 'effector';

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
  const data = [
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
  ];
  entities.edit.add(data);
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
