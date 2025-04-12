import { expect, test } from 'vitest';
import { createStore, combine } from 'effector';
import { keyval } from '@effector/model';

test('provide event for field update', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $count = createStore(0);
    return {
      key: 'id',
      state: {
        id: $id,
        count: $count,
      },
      optional: ['count'],
    };
  });
  entities.edit.add({ id: 'foo' });
  entities.editField.count({ key: 'foo', data: 1 });
  expect(entities.$items.getState()).toEqual([{ id: 'foo', count: 1 }]);
});

test('provide event for update multiple items at once', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $count = createStore(0);
    return {
      key: 'id',
      state: {
        id: $id,
        count: $count,
      },
      optional: ['count'],
    };
  });
  entities.edit.add([{ id: 'foo' }, { id: 'bar' }]);
  entities.editField.count({ key: ['foo', 'bar'], data: [1, 2] });
  expect(entities.$items.getState()).toEqual([
    { id: 'foo', count: 1 },
    { id: 'bar', count: 2 },
  ]);
});

test('derived stores are omitted', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    return {
      key: 'id',
      state: {
        id: $id,
        idSize: combine($id, (id) => id.length),
      },
    };
  });
  //@ts-expect-error
  expect(entities.editField.idSize).toBe(undefined);
});

test.skip('inner keyval support', () => {
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
      state: {
        id: $id,
        childs,
      },
    };
  });
  entities.edit.add({
    id: 'foo',
    childs: [
      { id: 'childA', count: 0 },
      { id: 'childB', count: 1 },
    ],
  });
  entities.editField.childs({ key: 'foo', data: [{ id: 'childC', count: 2 }] });
  expect(entities.$items.getState()).toEqual([
    { id: 'foo', childs: [{ id: 'childC', count: 2 }] },
  ]);
});
