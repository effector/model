import { expect, test } from 'vitest';
import { createStore } from 'effector';
import { keyval } from '@effector/model';

test('key string', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $count = createStore(0);
    return {
      key: 'id',
      state: { id: $id, count: $count },
    };
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
