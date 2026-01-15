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
});
