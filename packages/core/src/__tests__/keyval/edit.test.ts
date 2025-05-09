import { expect, test, describe } from 'vitest';
import { createStore, combine, createEvent, sample } from 'effector';
import { keyval } from '@effector/model';

function createEntities(fill?: Array<{ id: string }>) {
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
  if (fill) {
    entities.edit.replaceAll(fill);
  }
  return entities;
}

function createUpdatableEntities(
  fill?: Array<{ id: string; count: number; tag: string }>,
) {
  const entities = keyval(() => {
    const $id = createStore('');
    const $count = createStore(0);
    const $tag = createStore('');
    return {
      key: 'id',
      state: { id: $id, count: $count, tag: $tag },
    };
  });
  if (fill) {
    entities.edit.replaceAll(fill);
  }
  return entities;
}

describe('edit.add', () => {
  test('add one', () => {
    const entities = createEntities();
    entities.edit.add({ id: 'foo' });
    entities.edit.add({ id: 'ba' });
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', idSize: 3 },
      { id: 'ba', idSize: 2 },
    ]);
  });
  test('add many', () => {
    const entities = createEntities();
    entities.edit.add([{ id: 'foo' }, { id: 'ba' }]);
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', idSize: 3 },
      { id: 'ba', idSize: 2 },
    ]);
  });
  test('do nothing on re-add', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);
    entities.edit.add({ id: 'foo', count: 1, tag: 'x' });
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);
  });
  test('support nested keyvals', () => {
    const entities = keyval(() => {
      const $id = createStore('');
      const childs = keyval(() => {
        const $id = createStore('');
        const childs = keyval(() => {
          const $id = createStore('');
          return {
            key: 'id',
            state: {
              id: $id,
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
      return {
        key: 'id',
        state: {
          id: $id,
          childs,
        },
      };
    });
    entities.edit.add({
      id: 'a',
      childs: [{ id: 'b', childs: [{ id: 'c' }] }],
    });
    expect(entities.$items.getState()).toEqual([
      {
        id: 'a',
        childs: [{ id: 'b', childs: [{ id: 'c' }] }],
      },
    ]);
  });
});

describe('edit.remove', () => {
  test('remove one', () => {
    const entities = createEntities([{ id: 'foo' }, { id: 'ba' }]);
    entities.edit.remove('foo');
    expect(entities.$items.getState()).toEqual([{ id: 'ba', idSize: 2 }]);
  });
  test('remove many', () => {
    const entities = createEntities([
      { id: 'foo' },
      { id: 'ba' },
      { id: 'baz' },
    ]);
    entities.edit.remove(['foo', 'baz']);
    expect(entities.$items.getState()).toEqual([{ id: 'ba', idSize: 2 }]);
  });
  test('remove by function', () => {
    const entities = createEntities([{ id: 'foo' }, { id: 'ba' }]);
    entities.edit.remove((entity) => entity.id === 'foo');
    expect(entities.$items.getState()).toEqual([{ id: 'ba', idSize: 2 }]);
  });
});

describe('edit.set', () => {
  test('set one', () => {
    const entities = createEntities();
    entities.edit.set({ id: 'foo' });
    entities.edit.set({ id: 'ba' });
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', idSize: 3 },
      { id: 'ba', idSize: 2 },
    ]);
  });
  test('set many', () => {
    const entities = createEntities();
    entities.edit.set([{ id: 'foo' }, { id: 'ba' }]);
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', idSize: 3 },
      { id: 'ba', idSize: 2 },
    ]);
  });
  test('replace on re-add', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);
    entities.edit.set({ id: 'foo', count: 1, tag: 'x' });
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', count: 1, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);
  });
});

describe('edit.update', () => {
  test('update one', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);
    entities.edit.update({ id: 'foo', count: 1 });
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', count: 1, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);
  });
  test('update many', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
      { id: 'baz', count: 0, tag: 'z' },
    ]);
    entities.edit.update([
      { id: 'foo', count: 1 },
      { id: 'baz', count: 2 },
    ]);
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', count: 1, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
      { id: 'baz', count: 2, tag: 'z' },
    ]);
  });
  test('do nothing if entity not exists', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
    ]);
    entities.edit.update({ id: 'bar', count: 0, tag: 'y' });
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', count: 0, tag: 'x' },
    ]);
  });
  test('sync stores after update', () => {
    const entities = keyval(() => {
      const $id = createStore('');
      const $fieldA = createStore('');
      const $count = createStore(0);
      const inc = createEvent();
      sample({
        clock: inc,
        source: $count,
        fn: (n) => n + 1,
        target: $count,
      });
      return {
        key: 'id',
        state: {
          id: $id,
          fieldA: $fieldA,
          count: $count,
        },
        api: {
          inc,
        },
        optional: ['count', 'fieldA'],
      };
    });
    entities.edit.replaceAll([{ id: 'a' }, { id: 'b' }]);
    entities.edit.update({ id: 'b', fieldA: 'x' });
    expect(entities.$items.getState()).toEqual([
      { id: 'a', fieldA: '', count: 0 },
      { id: 'b', fieldA: 'x', count: 0 },
    ]);
    entities.api.inc({ key: 'b', data: undefined });
    expect(entities.$items.getState()).toEqual([
      { id: 'a', fieldA: '', count: 0 },
      { id: 'b', fieldA: 'x', count: 1 },
    ]);
  });
});

describe('edit.replaceAll', () => {
  test('plain replaceAll', () => {
    const entities = createEntities([{ id: 'foo' }, { id: 'ba' }]);
    entities.edit.replaceAll([{ id: 'baz' }]);
    expect(entities.$items.getState()).toEqual([{ id: 'baz', idSize: 3 }]);
  });
  test('nested replaceAll', () => {
    const entities = keyval(() => {
      const $id = createStore('');
      const childs = keyval(() => {
        const $id = createStore('');
        return {
          key: 'id',
          state: { id: $id },
        };
      });
      return {
        key: 'id',
        state: { id: $id, childs },
        optional: ['childs'],
      };
    });
    entities.edit.replaceAll([{ id: 'foo', childs: [{ id: 'fooA' }] }]);
    entities.edit.replaceAll([{ id: 'bar' }]);
    entities.edit.replaceAll([
      { id: 'foo', childs: [{ id: 'fooA' }] },
      { id: 'bar' },
    ]);
    expect(entities.$items.getState()).toEqual([
      { id: 'foo', childs: [{ id: 'fooA' }] },
      { id: 'bar', childs: [] },
    ]);
  });
});

describe('edit.map', () => {
  test('map one', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);

    entities.edit.map({
      keys: 'foo',
      map: ({ count }) => ({ count: count + 1 }),
    });

    expect(entities.$items.getState()).toEqual([
      { id: 'foo', count: 1, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);
  });
  test('map many', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
      { id: 'baz', count: 1, tag: 'z' },
    ]);

    entities.edit.map({
      keys: ['foo', 'baz'],
      map: ({ count }) => ({ count: count + 1 }),
    });

    expect(entities.$items.getState()).toEqual([
      { id: 'foo', count: 1, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
      { id: 'baz', count: 2, tag: 'z' },
    ]);
  });
  test('do nothing if entity not exists', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);

    entities.edit.map({
      keys: 'baz',
      map: ({ count }) => ({ count: count + 1 }),
    });

    expect(entities.$items.getState()).toEqual([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);
  });
  test('sync stores after update', () => {
    const entities = keyval(() => {
      const $id = createStore('');
      const $fieldA = createStore('');
      const $count = createStore(0);
      const inc = createEvent();
      sample({
        clock: inc,
        source: $count,
        fn: (n) => n + 1,
        target: $count,
      });
      return {
        key: 'id',
        state: {
          id: $id,
          fieldA: $fieldA,
          count: $count,
        },
        api: {
          inc,
        },
        optional: ['count', 'fieldA'],
      };
    });
    entities.edit.replaceAll([{ id: 'a' }, { id: 'b' }]);
    entities.edit.map({
      keys: 'b',
      map: () => ({ fieldA: 'x' }),
    });
    expect(entities.$items.getState()).toEqual([
      { id: 'a', fieldA: '', count: 0 },
      { id: 'b', fieldA: 'x', count: 0 },
    ]);
    entities.api.inc({ key: 'b', data: undefined });
    expect(entities.$items.getState()).toEqual([
      { id: 'a', fieldA: '', count: 0 },
      { id: 'b', fieldA: 'x', count: 1 },
    ]);
  });
});
