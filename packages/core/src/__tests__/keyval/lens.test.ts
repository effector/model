import { expect, test, describe } from 'vitest';
import { createStore, createEvent, sample } from 'effector';
import { keyval, lens } from '@effector/model';

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

function createNestedEntities(
  fill?: Array<{
    id: string;
    childs: {
      id: string;
      count: number;
    }[];
  }>,
) {
  const entities = keyval(() => {
    const $id = createStore('');
    const childs = keyval(() => {
      const $id = createStore('');
      const updateCount = createEvent<number>();
      const $count = createStore(0);
      $count.on(updateCount, (_, upd) => upd);
      return {
        key: 'id',
        state: { id: $id, count: $count },
        api: { updateCount },
      };
    });
    return {
      key: 'id',
      state: { id: $id, childs },
      api: { updateCount: childs.api.updateCount },
    };
  });
  if (fill) {
    entities.edit.replaceAll(fill);
  }
  return entities;
}

describe('defaultValue behavior', () => {
  test('null when no match and no default value', () => {
    const setCurrentKey = createEvent<string>();
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
      { id: 'baz', count: 0, tag: 'z' },
    ]);

    const $currentKey = createStore('none');

    sample({
      clock: setCurrentKey,
      target: $currentKey,
    });

    const $currentTag = lens(entities, $currentKey).tag.store();
    expect($currentTag.getState()).toBe(null);
    setCurrentKey('bar');
    expect($currentTag.getState()).toBe('y');
  });
  test('with defaultValue', () => {
    const setCurrentKey = createEvent<string>();
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
      { id: 'baz', count: 0, tag: 'z' },
    ]);

    const $currentKey = createStore('none');

    sample({
      clock: setCurrentKey,
      target: $currentKey,
    });

    const $currentTag = lens(entities, $currentKey).tag.store('missed value');
    expect($currentTag.getState()).toBe('missed value');
    setCurrentKey('bar');
    expect($currentTag.getState()).toBe('y');
  });
  test('itemStore default is model default values', () => {
    const setCurrentKeyB = createEvent<string>();
    const entities = createNestedEntities([
      {
        id: 'foo',
        childs: [{ id: 'foo1', count: 0 }],
      },
      {
        id: 'bar',
        childs: [
          { id: 'bar1', count: 1 },
          { id: 'bar2', count: 2 },
        ],
      },
    ]);

    const $currentKeyA = createStore('bar');
    const $currentKeyB = createStore('none');

    sample({
      clock: setCurrentKeyB,
      target: $currentKeyB,
    });

    const $child = lens(entities, $currentKeyA).childs.itemStore($currentKeyB);
    expect($child.getState()).toEqual({
      id: '',
      count: 0,
    });
    setCurrentKeyB('bar2');
    expect($child.getState()).toEqual({
      id: 'bar2',
      count: 2,
    });
  });
});

describe('lens read value of field in keyval', () => {
  test('with store', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
      { id: 'baz', count: 0, tag: 'z' },
    ]);

    const $currentKey = createStore('bar');

    const $currentTag = lens(entities, $currentKey).tag.store();
    expect($currentTag.getState()).toBe('y');
  });
  test('with constant', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);

    const $currentTag = lens(entities, 'bar').tag.store();
    expect($currentTag.getState()).toBe('y');
  });
});

test('lens store change value when entity changed', () => {
  const entities = createUpdatableEntities([
    { id: 'foo', count: 0, tag: 'x' },
    { id: 'bar', count: 0, tag: 'y' },
  ]);

  const $currentTag = lens(entities, 'bar').tag.store();
  expect($currentTag.getState()).toBe('y');

  entities.edit.update({ id: 'bar', tag: 'z' });
  expect($currentTag.getState()).toBe('z');
});

test('lens store change value when key changed', () => {
  const entities = createUpdatableEntities([
    { id: 'foo', count: 0, tag: 'x' },
    { id: 'bar', count: 0, tag: 'y' },
  ]);

  const changeKey = createEvent<string>();
  const $currentKey = createStore('bar');
  sample({ clock: changeKey, target: $currentKey });

  const $currentTag = lens(entities, $currentKey).tag.store();
  expect($currentTag.getState()).toBe('y');

  changeKey('foo');
  expect($currentTag.getState()).toBe('x');
});

describe('nested store lens', () => {
  describe('lens read value of field in keyval', () => {
    test('with store', () => {
      const entities = createNestedEntities([
        {
          id: 'foo',
          childs: [{ id: 'foo1', count: 0 }],
        },
        {
          id: 'bar',
          childs: [
            { id: 'bar1', count: 1 },
            { id: 'bar2', count: 2 },
          ],
        },
      ]);

      const $currentKeyA = createStore('bar');
      const $currentKeyB = createStore('bar2');

      const $currentCount = lens(entities, $currentKeyA)
        .childs($currentKeyB)
        .count.store();
      expect($currentCount.getState()).toBe(2);
    });
    test('with constant', () => {
      const entities = createNestedEntities([
        {
          id: 'foo',
          childs: [{ id: 'foo1', count: 0 }],
        },
        {
          id: 'bar',
          childs: [
            { id: 'bar1', count: 1 },
            { id: 'bar2', count: 2 },
          ],
        },
      ]);

      const $currentKey = createStore('bar2');

      const $currentCount = lens(entities, 'bar')
        .childs($currentKey)
        .count.store();
      expect($currentCount.getState()).toBe(2);
    });
  });
  test('lens store change value when entity changed', () => {
    const entities = createNestedEntities([
      {
        id: 'foo',
        childs: [{ id: 'foo1', count: 0 }],
      },
      {
        id: 'bar',
        childs: [
          { id: 'bar1', count: 1 },
          { id: 'bar2', count: 2 },
        ],
      },
    ]);

    const $currentKeyA = createStore('bar');
    const $currentKeyB = createStore('bar1');

    const $currentCount = lens(entities, $currentKeyA)
      .childs($currentKeyB)
      .count.store();
    expect($currentCount.getState()).toBe(1);

    entities.api.updateCount({
      key: 'bar',
      data: {
        key: 'bar1',
        data: 3,
      },
    });
    expect($currentCount.getState()).toBe(3);
  });

  test('lens store change value when key changed', () => {
    const entities = createNestedEntities([
      {
        id: 'foo',
        childs: [{ id: 'foo1', count: 0 }],
      },
      {
        id: 'bar',
        childs: [
          { id: 'bar1', count: 1 },
          { id: 'bar2', count: 2 },
        ],
      },
    ]);

    const updateKeyB = createEvent<string>();

    const $currentKeyA = createStore('bar');
    const $currentKeyB = createStore('bar1');

    $currentKeyB.on(updateKeyB, (_, upd) => upd);

    const $currentCount = lens(entities, $currentKeyA)
      .childs($currentKeyB)
      .count.store();
    expect($currentCount.getState()).toBe(1);

    updateKeyB('bar2');
    expect($currentCount.getState()).toBe(2);
  });

  test('itemStore return store with all model fields in one object', () => {
    const entities = createNestedEntities([
      {
        id: 'foo',
        childs: [{ id: 'foo1', count: 0 }],
      },
      {
        id: 'bar',
        childs: [
          { id: 'bar1', count: 1 },
          { id: 'bar2', count: 2 },
        ],
      },
    ]);

    const $currentKeyA = createStore('bar');
    const $currentKeyB = createStore('bar2');

    const $child = lens(entities, $currentKeyA).childs.itemStore($currentKeyB);
    expect($child.getState()).toEqual({
      id: 'bar2',
      count: 2,
    });
  });
  test('has return store which show that item exists', () => {
    const setCurrentKeyB = createEvent<string>();
    const entities = createNestedEntities([
      {
        id: 'foo',
        childs: [{ id: 'foo1', count: 0 }],
      },
      {
        id: 'bar',
        childs: [
          { id: 'bar1', count: 1 },
          { id: 'bar2', count: 2 },
        ],
      },
    ]);

    const $currentKeyA = createStore('bar');
    const $currentKeyB = createStore('none');

    sample({
      clock: setCurrentKeyB,
      target: $currentKeyB,
    });

    const $hasChild = lens(entities, $currentKeyA).childs.has($currentKeyB);
    expect($hasChild.getState()).toBe(false);
    setCurrentKeyB('bar2');
    expect($hasChild.getState()).toBe(true);
  });
});
