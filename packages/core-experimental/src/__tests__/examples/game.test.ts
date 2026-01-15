import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createStore,
  allSettled,
  fork,
  createEvent,
  sample,
  createEffect,
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
    game: gameModel, // abstract model definition
  },
  fn: ({ game }: any) => {
    // game here is the INSTANCE passed to create
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
    });

    sample({
      clock: game.variant.losing.leave as any,
      target: stopTimer,
    });

    sample({
      clock: tick,
      source: $totalLosingTime,
      fn: (time: number) => time + 1,
      target: $totalLosingTime,
    });

    return {
      $totalLosingTime,
      $isRunning, // exposed for testing
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

    // Initial state (draw)
    expect(scope.getState(game.facets.visual.$color)).toBe('gray');

    // Winning
    await allSettled($score, { scope, params: 10 });
    expect(scope.getState(game.facets.visual.$color)).toBe('green');

    // Losing
    await allSettled($score, { scope, params: -10 });
    // rgba(255, 0, 0, 0.3 + 50/140) -> 0.3 + 0.357 = 0.657
    expect(scope.getState(game.facets.visual.$color)).toContain(
      'rgba(255, 0, 0,',
    );
  });

  it('should track losing time in statsModel', async () => {
    const $score = createStore(10); // Start winning
    const game = create(gameModel, { input: { $score } });
    const stats = create(statsModel, { input: { game } });

    const scope = fork();

    // 1. Start winning - timer should be stopped
    expect(scope.getState(stats.$isRunning)).toBe(false);
    expect(scope.getState(stats.$totalLosingTime)).toBe(0);

    // 2. Switch to losing
    await allSettled($score, { scope, params: -10 });
    expect(scope.getState(stats.$isRunning)).toBe(true);

    // 3. Advance time
    await vi.advanceTimersByTimeAsync(1100);
    // tick should have happened
    expect(scope.getState(stats.$totalLosingTime)).toBeGreaterThan(0);

    // 4. Switch back to winning
    await allSettled($score, { scope, params: 10 });
    expect(scope.getState(stats.$isRunning)).toBe(false);

    const timeLocked = scope.getState(stats.$totalLosingTime);

    // 5. Advance time more - should not increase
    await vi.advanceTimersByTimeAsync(2000);
    expect(scope.getState(stats.$totalLosingTime)).toBe(timeLocked);
  });
});
