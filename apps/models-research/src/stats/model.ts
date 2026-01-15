import { model } from '@effector-model/core-experimental';
import { createStore, sample, createEvent } from 'effector';
import { interval } from 'patronum';
import { gameModel } from '../game/model';

export const statsModel = model({
  input: {
    game: gameModel,
  },
  fn: ({ game }: any) => {
    const $totalLosingTime = createStore(0);

    const start = createEvent();
    const stop = createEvent();
    const { tick } = interval({ timeout: 1000, start, stop });

    // Bind to lifecycle
    sample({
      clock: game.variant.losing.enter as any,
      target: start,
    } as any);

    sample({
      clock: game.variant.losing.leave as any,
      target: stop,
    } as any);

    sample({
      clock: tick,
      source: $totalLosingTime,
      fn: (time: number) => time + 1,
      target: $totalLosingTime,
    });

    return {
      $totalLosingTime,
    };
  },
});
