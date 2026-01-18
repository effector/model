import { model } from '@effector-model/core-experimental';
import { createStore, sample, createEvent } from 'effector';
import { interval } from 'patronum';
import { gameModel } from '../game/model';

export const statsModel = model({
  input: {
    game: gameModel,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: ({ game }: any) => {
    const $totalLosingTime = createStore(0);

    const start = createEvent();
    const stop = createEvent();
    const { tick } = interval({ timeout: 1000, start, stop });

    // Bind to lifecycle
    sample({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clock: game.variant.losing.enter as any,
      target: start,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    sample({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clock: game.variant.losing.leave as any,
      target: stop,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
