import { describe, it, expect } from 'vitest';
import { createStore, is } from 'effector';
import { model, facet, define, create, ref } from '../index';

describe('ref.tag', () => {
  it('resolves a tag from reactiveInputs', () => {
    const $id = createStore('user-1');

    const myFacet = facet({
      parentId: ref.tag('id'),
    });

    const myModel = model({
      input: {
        id: define.store<string>(),
      },
      facets: {
        f: myFacet,
      },
    });

    const instance = create(myModel, {
      input: { id: $id },
    });

    expect(is.store(instance.facets.f.parentId)).toBe(true);
    expect(instance.facets.f.parentId.getState()).toBe('user-1');
  });

  it('resolves a tag from fnResult', () => {
    const myFacet = facet({
      parentId: ref.tag('internalId'),
    });

    const myModel = model({
      facets: {
        f: myFacet,
      },
      fn: () => {
        const $internalId = createStore('internal-123');
        return {
          internalId: $internalId,
        };
      },
    });

    const instance = create(myModel);

    expect(is.store(instance.facets.f.parentId)).toBe(true);
    expect(instance.facets.f.parentId.getState()).toBe('internal-123');
  });
});

describe('ref.self', () => {
  it('is identified as a ref', () => {
    expect(ref.self.type).toBe('ref');
    expect(ref.self.kind).toBe('self');
  });

  it('can be used in model definition', () => {
    const categoryModel = model({
      input: {
        name: define.store<string>(),
        children: define.array(ref.self),
      },
    });

    const instance = create(categoryModel, {
      input: {
        name: createStore('Root'),
        children: [],
      },
    });

    expect(instance.input.name.getState()).toBe('Root');
  });
});
