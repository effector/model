import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createStore,
  allSettled,
  fork,
  createEvent,
  sample,
  EventCallable,
  createEffect,
  scopeBind,
} from 'effector';
import { model } from '../../model';
import { define } from '../../define';
import { facet } from '../../facet';
import { create } from '../../instance';

// --- Definitions (Copied from apps/models-research) ---

const visualFacet = facet({
  $color: define.store<string>(),
});

const gameModel = model({
  input: {
    $score: define.store<number>(0),
  },
  facets: {
    visual: visualFacet,
  },
  variant: {
    source: (input: { $score: any }) => input.$score,
    cases: {
      winning: (score: number) => score > 0,
      losing: (score: number) => score < 0,
      draw: (score: number) => score === 0,
    },
  },
  impl: {
    winning: () => ({
      visual: { $color: define.store('green') },
    }),
    draw: () => ({
      visual: { $color: define.store('gray') },
    }),
    losing: ({ $score }: { $score: any }) => {
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

const statsModel = model({
  input: {
    game: gameModel,
  },
  fn: ({ game }: any) => {
    const $totalLosingTime = createStore(0);
    const start = createEvent();
    const stop = createEvent();

    const tick = createEvent();
    const internalTick = createEvent();
    const $isRunning = createStore(false)
      .on(start, () => true)
      .on(stop, () => false);

    const tickFx = createEffect(() => {
      const trigger = scopeBind(internalTick, { safe: true });
      setTimeout(trigger, 1000);
    });

    sample({
      clock: start,
      target: tickFx,
    });

    sample({
      clock: internalTick,
      source: $isRunning,
      filter: (running) => running,
      target: tick,
    });

    sample({
      clock: tick,
      target: tickFx,
    });

    sample({
      clock: game.variant.losing.enter as EventCallable<void>,
      target: start,
    });

    sample({
      clock: game.variant.losing.leave as EventCallable<void>,
      target: stop,
    });

    sample({
      clock: tick,
      source: $totalLosingTime,
      fn: (time: number) => time + 1,
      target: $totalLosingTime,
    });

    return {
      $totalLosingTime,
      $isRunning,
    };
  },
});

// --- Tests ---

describe('GameModel & StatsModel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should switch colors based on score', async () => {
    const $score = createStore(0);
    const game = create(gameModel, { input: { $score } });

    const scope = fork();

    expect(scope.getState(game.facets.visual.$color)).toBe('gray');

    await allSettled($score, { scope, params: 10 });
    expect(scope.getState(game.facets.visual.$color)).toBe('green');

    await allSettled($score, { scope, params: -10 });
    expect(scope.getState(game.facets.visual.$color)).toContain(
      'rgba(255, 0, 0,',
    );
  });

  it('should track losing time in statsModel', { timeout: 10000 }, async () => {
    const $score = createStore(10);
    const game = create(gameModel, { input: { $score } });
    const stats = create(statsModel, { input: { game } });

    const scope = fork();

    expect(scope.getState(stats.$isRunning)).toBe(false);
    expect(scope.getState(stats.$totalLosingTime)).toBe(0);

    await allSettled($score, { scope, params: -10 });
    expect(scope.getState(stats.$isRunning)).toBe(true);

    // Advance time and wait for effect
    await vi.advanceTimersByTimeAsync(1100);

    expect(scope.getState(stats.$totalLosingTime)).toBeGreaterThan(0);

    await allSettled($score, { scope, params: 10 });
    expect(scope.getState(stats.$isRunning)).toBe(false);

    const timeLocked = scope.getState(stats.$totalLosingTime);

    await vi.advanceTimersByTimeAsync(2000);
    expect(scope.getState(stats.$totalLosingTime)).toBe(timeLocked);
  });

  it('should handle rapid score switching', async () => {
    const $score = createStore(0);
    const game = create(gameModel, { input: { $score } });
    const scope = fork();

    await allSettled($score, { scope, params: 10 });
    await allSettled($score, { scope, params: -10 });
    await allSettled($score, { scope, params: 5 });

    expect(scope.getState(game.facets.visual.$color)).toBe('green');
  });

  it('should handle score = 0 as draw', async () => {
    const $score = createStore(10);
    const game = create(gameModel, { input: { $score } });
    const scope = fork();

    await allSettled($score, { scope, params: 0 });
    expect(scope.getState(game.facets.visual.$color)).toBe('gray');
    expect(scope.getState(game.activeVariant)).toBe('draw');
  });
});
