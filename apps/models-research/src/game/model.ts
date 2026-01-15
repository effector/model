import { model, define } from '@effector-model/core-experimental';
import { visualFacet } from './facets';

export const gameModel = model({
  input: {
    $score: define.store<number>(0),
  },
  facets: {
    visual: visualFacet,
  },
  variant: {
    source: (input) => input.$score,
    cases: {
      winning: (score) => score > 0,
      losing: (score) => score < 0,
      draw: (score) => score === 0,
    },
  },
  impl: {
    winning: () => ({
      visual: { $color: define.store('green') },
    }),
    draw: () => ({
      visual: { $color: define.store('gray') },
    }),
    losing: ({ $score }) => {
      const $intensity = $score.map((s: number) =>
        Math.min(Math.abs(s) * 5, 100),
      );
      const $dynamicRed = $intensity.map(
        (i: number) => `rgba(255, 0, 0, ${0.3 + i / 140})`,
      );

      return {
        visual: {
          $color: $dynamicRed,
        },
        $intensity,
      };
    },
  },
});
