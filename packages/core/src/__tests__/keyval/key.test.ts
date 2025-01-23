import { expect, test } from 'vitest';
import { createStore } from 'effector';
import { keyval } from '@effector/model';

test('key function', () => {
  const entities = keyval({
    key: ({ id }) => id,
    create() {
      const $id = createStore('');
      const $count = createStore(0);
      return { id: $id, count: $count };
    },
  });
  entities.edit.add([
    { id: 'foo', count: 0 },
    { id: 'bar', count: 0 },
  ]);
  entities.edit.update({ id: 'foo', count: 1 });
  expect(entities.$items.getState()).toEqual([
    { id: 'foo', count: 1 },
    { id: 'bar', count: 0 },
  ]);
});

test('key string', () => {
  const entities = keyval({
    key: 'id',
    create() {
      const $id = createStore('');
      const $count = createStore(0);
      return { id: $id, count: $count };
    },
  });
  entities.edit.add([
    { id: 'foo', count: 0 },
    { id: 'bar', count: 0 },
  ]);
  entities.edit.update({ id: 'foo', count: 1 });
  expect(entities.$items.getState()).toEqual([
    { id: 'foo', count: 1 },
    { id: 'bar', count: 0 },
  ]);
});
