import { expect, test, describe } from 'vitest';
import { combine } from 'effector';
import { model, keyval, define } from '@effector/model';

describe('getKey', () => {
  test('getKey function', () => {
    const entities = keyval({
      getKey: ({ id }) => id,
      model: model({
        props: {
          id: define.store<string>(),
          count: define.store<number>(),
        },
        create() {
          return {};
        },
      }),
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
      getKey: 'id',
      model: model({
        props: {
          id: define.store<string>(),
          count: define.store<number>(),
        },
        create() {
          return {};
        },
      }),
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
});

describe('keyval.edit', () => {
  function createEntities() {
    return keyval({
      getKey: 'id',
      model: model({
        props: {
          id: define.store<string>(),
        },
        create({ id: $id }) {
          return {
            idSize: combine($id, (id) => id.length),
          };
        },
      }),
    });
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
  });
  describe('edit.remove', () => {
    test('remove one', () => {
      const entities = createEntities();
      entities.edit.add([{ id: 'foo' }, { id: 'ba' }]);
      entities.edit.remove('foo');
      expect(entities.$items.getState()).toEqual([{ id: 'ba', idSize: 2 }]);
    });
    test('remove many', () => {
      const entities = createEntities();
      entities.edit.add([{ id: 'foo' }, { id: 'ba' }, { id: 'baz' }]);
      entities.edit.remove(['foo', 'baz']);
      expect(entities.$items.getState()).toEqual([{ id: 'ba', idSize: 2 }]);
    });
    test('remove by function', () => {
      const entities = createEntities();
      entities.edit.add([{ id: 'foo' }, { id: 'ba' }]);
      entities.edit.remove((entity) => entity.id === 'foo');
      expect(entities.$items.getState()).toEqual([{ id: 'ba', idSize: 2 }]);
    });
  });
  describe('edit.update', () => {
    function createUpdatableEntities() {
      return keyval({
        getKey: 'id',
        model: model({
          props: {
            id: define.store<string>(),
            count: define.store<number>(),
            tag: define.store<string>(),
          },
          create() {
            return {};
          },
        }),
      });
    }
    test('update one', () => {
      const entities = createUpdatableEntities();
      entities.edit.add([
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
      const entities = createUpdatableEntities();
      entities.edit.add([
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
  });
});
