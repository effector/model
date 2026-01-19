import { describe, it, expect } from 'vitest';
import { model, implement } from '../model';
import { define } from '../define';
import { facet } from '../facet';

describe('model', () => {
  it('should create model configuration', () => {
    const visualFacet = facet({
      $color: define.store<string>(),
    });

    const config = {
      input: {
        $score: define.store(0),
      },
      facets: {
        visual: visualFacet,
      },
      variant: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        source: (i: any) => i.$score,
        cases: {
          winning: (s: number) => s > 0,
        },
      },
      impl: {
        winning: () => ({
          visual: { $color: define.store('green') },
        }),
      },
    };

    const m = model(config);

    expect(m.config).toBe(config);
  });

  it('should handle empty model', () => {
    const m = model({});
    expect(m.config).toEqual({});
  });

  it('should create implementation via implement()', () => {
    const f = facet({ $val: define.store(0) });
    const impl = implement(f, { $val: define.store(10) });

    expect(impl).toEqual({
      type: 'implementation',
      facet: f,
      impl: { $val: define.store(10) },
    });
  });
});
