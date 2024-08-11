import { expect, test, describe } from 'vitest';
import { combine } from 'effector';
import { model, keyval, define } from '@effector/model';

describe('keyval.edit', () => {
  function createEntities() {
    return keyval({
      getKey: ({ id }) => id,
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
});
