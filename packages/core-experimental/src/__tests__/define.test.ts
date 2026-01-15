import { describe, it, expect } from 'vitest';
import { define, ref } from '../define';

describe('define', () => {
  it('should create store definition', () => {
    const def = define.store(0);
    expect(def).toEqual({
      type: 'store',
      initial: 0,
    });
  });

  it('should create event definition', () => {
    const def = define.event<number>();
    expect(def).toEqual({
      type: 'event',
    });
  });

  it('should create array definition', () => {
    const def = define.array({ id: define.store('1') });
    expect(def).toEqual({
      type: 'array',
      item: { id: { type: 'store', initial: '1' } },
    });
  });
});

describe('ref', () => {
  it('should create self ref', () => {
    const r = ref.self;
    expect(r).toEqual({
      type: 'ref',
      kind: 'self',
    });
  });

  it('should create tag ref', () => {
    const r = ref.tag('someTag');
    expect(r).toEqual({
      type: 'ref',
      kind: 'tag',
      name: 'someTag',
    });
  });
});
