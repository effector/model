import { expect, test, describe } from 'vitest';
import { createStore, createEvent, sample } from 'effector';
import { keyval, define, lens } from '@effector/model';

function createUpdatableEntities(
  fill?: Array<{ id: string; count: number; tag: string }>,
) {
  const entities = keyval({
    key: 'id',
    props: {
      id: define.store<string>(),
      count: define.store<number>(),
      tag: define.store<string>(),
    },
    create() {
      return {};
    },
  });
  if (fill) {
    entities.edit.add(fill);
  }
  return entities;
}

describe('lens read value of field in keyval', () => {
  test('with store', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
      { id: 'baz', count: 0, tag: 'z' },
    ]);

    const $currentKey = createStore('bar');

    const $currentTag = lens(entities, $currentKey).tag.store;
    expect($currentTag.getState()).toBe('y');
  });
  test('with constant', () => {
    const entities = createUpdatableEntities([
      { id: 'foo', count: 0, tag: 'x' },
      { id: 'bar', count: 0, tag: 'y' },
    ]);

    const $currentTag = lens(entities, 'bar').tag.store;
    expect($currentTag.getState()).toBe('y');
  });
});

test('lens store change value when entity changed', () => {
  const entities = createUpdatableEntities([
    { id: 'foo', count: 0, tag: 'x' },
    { id: 'bar', count: 0, tag: 'y' },
  ]);

  const $currentTag = lens(entities, 'bar').tag.store;
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

  const $currentTag = lens(entities, $currentKey).tag.store;
  expect($currentTag.getState()).toBe('y');

  changeKey('foo');
  expect($currentTag.getState()).toBe('x');
});

describe.skip('nested store lens', () => {
  function createNestedEntities(
    fill?: Array<{
      id: string;
      childs: {
        id: string;
        count: number;
      }[];
    }>,
  ) {
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
    if (fill) {
      entities.edit.add(fill);
    }
    return entities;
  }
  test('it fills correctly', () => {
    const entities = createNestedEntities([
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
    ]);
    console.log(entities.$items.getState());
    // expect(entities.$items.getState()).toEqual([
    //   {
    //     id: 'foo',
    //     childs: [
    //       { id: 'foo1', count: 0 },
    //       { id: 'foo2', count: 0 },
    //     ],
    //   },
    //   {
    //     id: 'bar',
    //     childs: [
    //       { id: 'bar1', count: 0 },
    //       { id: 'bar2', count: 1 },
    //     ],
    //   },
    // ]);
    console.log('bar');
  });
});
