import { describe, it, expect } from 'vitest';
import { facet } from '../facet';
import { define } from '../define';

describe('facet', () => {
  it('should create facet definition', () => {
    const f = facet({
      $val: define.store(0),
      evt: define.event<void>(),
    });

    expect(f).toEqual({
      type: 'facet',
      shape: {
        $val: { type: 'store', initial: 0 },
        evt: { type: 'event' },
      },
    });
  });

  it('should handle empty facet', () => {
    const f = facet({});
    expect(f.shape).toEqual({});
  });

  it('should handle nested facets', () => {
    const child = facet({ $v: define.store(0) });
    const parent = facet({
      child,
      $p: define.store(1),
    });

    expect(parent.shape.child).toBe(child);
  });
});
