import { model } from '@effector-model/core-experimental';
import { createStore, sample, createEvent, createEffect } from 'effector';
import { gameModel } from '../game/model';

export const statsModel = model({
  input: {
    game: gameModel,
  },
  fn: ({ game }: any) => {
    const $totalLosingTime = createStore(0);

    // Custom Interval Implementation
    const startTimer = createEvent();
    const stopTimer = createEvent();
    const tick = createEvent();
    const $isRunning = createStore(false)
      .on(startTimer, () => true)
      .on(stopTimer, () => false);

    const loopFx = createEffect(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    });

    sample({
      clock: [startTimer, loopFx.done],
      source: $isRunning,
      filter: (running) => running,
      target: [tick, loopFx],
    });

    // Bind to lifecycle
    sample({
      clock: game.variant.losing.enter as any,
      target: startTimer,
    } as any);

    sample({
      clock: game.variant.losing.leave as any,
      target: stopTimer,
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
