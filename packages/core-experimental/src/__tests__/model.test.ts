import { describe, it, expect } from 'vitest';
import { model } from '../model';
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
});
