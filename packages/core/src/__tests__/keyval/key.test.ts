import { expect, test } from 'vitest';
import { keyval, define } from '@effector/model';

test('getKey function', () => {
  const entities = keyval({
    key: ({ id }) => id,
    props: {
      id: define.store<string>(),
      count: define.store<number>(),
    },
    create() {
      return {};
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

test('getKey string', () => {
  const entities = keyval({
    key: 'id',
    props: {
      id: define.store<string>(),
      count: define.store<number>(),
    },
    create() {
      return {};
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
