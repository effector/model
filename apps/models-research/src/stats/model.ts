import { model } from '@effector-model/core-experimental';
import { createStore, sample } from 'effector';
import { interval } from 'patronum';
import { gameModel } from '../game/model';

export const statsModel = model({
  input: {
    game: gameModel,
  },
  fn: ({ game }: any) => {
    const $totalLosingTime = createStore(0);
    const timer = interval({ timeout: 1000 });

    sample({
      clock: game.variant.losing.enter,
      target: timer.start,
    });

    sample({
      clock: game.variant.losing.leave,
      target: timer.stop,
    });

    sample({
      clock: timer.tick,
      source: $totalLosingTime,
      fn: (time) => time + 1,
      target: $totalLosingTime,
    });

    return {
      $totalLosingTime,
    };
  },
});
