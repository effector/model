import { expect, test, describe, vi } from 'vitest';
import { keyval, lazy, KeyvalWithState } from '@effector/model';
import { combine, createStore } from 'effector';

test('support self as child field', () => {
  type Entity = {
    id: string;
    childs: Entity[];
  };
  const entities = keyval(() => {
    const $id = createStore('');
    const childs = keyval(entities) as KeyvalWithState<Entity, Entity>;
    return {
      key: 'id',
      state: {
        id: $id,
        childs,
      },
    };
  });
  entities.edit.add([
    { id: 'a', childs: [] },
    { id: 'b', childs: [{ id: 'c', childs: [{ id: 'd', childs: [] }] }] },
  ]);
  expect(entities.$items.getState()).toEqual([
    { id: 'a', childs: [] },
    { id: 'b', childs: [{ id: 'c', childs: [{ id: 'd', childs: [] }] }] },
  ]);
});

test('support duplicated ids in childs', () => {
  type Entity = {
    id: string;
    childs: Entity[];
  };
  const entities = keyval(() => {
    const $id = createStore('');
    const childs = keyval(entities) as KeyvalWithState<Entity, Entity>;
    return {
      key: 'id',
      state: {
        id: $id,
        childs,
      },
    };
  });
  entities.edit.add([
    { id: 'a', childs: [] },
    { id: 'b', childs: [{ id: 'a', childs: [] }] },
  ]);
  expect(entities.$items.getState()).toEqual([
    { id: 'a', childs: [] },
    { id: 'b', childs: [{ id: 'a', childs: [] }] },
  ]);
});

test('lazy support recursive computations with childs', () => {
  type Entity = {
    id: string;
    childs: Entity[];
    childsAmount: number;
  };
  type EntityInput = {
    id: string;
    childs: EntityInput[];
  };
  const entities = keyval(() => {
    const $id = createStore('');
    const childs = keyval(entities) as KeyvalWithState<EntityInput, Entity>;
    const $childsAmount = lazy(() => {
      return combine(childs.$items, (items) => items.length);
    });
    return {
      key: 'id',
      state: {
        id: $id,
        childs,
        childsAmount: $childsAmount,
      },
    };
  });
  entities.edit.add([
    { id: 'a', childs: [] },
    { id: 'b', childs: [{ id: 'c', childs: [] }] },
  ]);
  expect(entities.$items.getState()).toEqual([
    { id: 'a', childs: [], childsAmount: 0 },
    {
      id: 'b',
      childs: [{ id: 'c', childs: [], childsAmount: 0 }],
      childsAmount: 1,
    },
  ]);
});

test('lazy will not break combine callbacks', () => {
  type Entity = {
    id: string;
    childs: Entity[];
    childsAmount: number;
    amountStr: string;
  };
  type EntityInput = {
    id: string;
    childs: EntityInput[];
  };
  const fn = vi.fn();
  const entities = keyval(() => {
    const $id = createStore('');
    const childs = keyval(entities) as KeyvalWithState<EntityInput, Entity>;
    const $childsAmount = lazy(() => {
      return combine(childs.$items, (items) => items.length);
    });
    const $amountStr = combine($childsAmount, (amount) => {
      fn(amount);
      return String(amount);
    });
    return {
      key: 'id',
      state: {
        id: $id,
        childs,
        childsAmount: $childsAmount,
        amountStr: $amountStr,
      },
    };
  });
  entities.edit.add([
    { id: 'a', childs: [] },
    { id: 'b', childs: [{ id: 'c', childs: [] }] },
  ]);

  expect(entities.$items.getState()).toEqual([
    { id: 'a', childs: [], childsAmount: 0, amountStr: '0' },
    {
      id: 'b',
      childs: [{ id: 'c', childs: [], childsAmount: 0, amountStr: '0' }],
      childsAmount: 1,
      amountStr: '1',
    },
  ]);
  // TODO fix combine breaking
  expect(fn.mock.calls.filter(([val]) => typeof val !== 'number')).toEqual([]);
});
