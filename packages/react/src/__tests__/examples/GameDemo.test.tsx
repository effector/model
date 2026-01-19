import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { useUnit } from 'effector-react';
import { createStore, allSettled, fork, createEvent, sample } from 'effector';
import { Provider } from 'effector-react';
import {
  model,
  define,
  facet,
  create,
} from '@effector-model/core-experimental';

// --- Definitions (Copied) ---

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      };
    },
  },
});

// --- Component ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GameDemo({ game, $score, updateScore }: any) {
  const [score, update] = useUnit([$score, updateScore]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const color = useUnit(game.facets.visual.$color) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeVariant = useUnit(game.activeVariant) as any;

  return (
    <div>
      <div data-testid="score">{score as React.ReactNode}</div>
      <div data-testid="color">{color as React.ReactNode}</div>
      <div data-testid="variant">{activeVariant as React.ReactNode}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <button onClick={() => (update as any)(10)}>Win</button>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <button onClick={() => (update as any)(-10)}>Lose</button>
    </div>
  );
}

// --- Test ---

describe('GameDemo Integration', () => {
  it('should render and react to changes', async () => {
    const scope = fork();

    const $score = createStore(0);
    const updateScore = createEvent<number>();
    sample({ clock: updateScore, target: $score });

    const game = create(gameModel, { input: { $score } });

    render(
      <Provider value={scope}>
        <GameDemo game={game} $score={$score} updateScore={updateScore} />
      </Provider>,
    );

    // Initial state
    expect(screen.getByTestId('score').textContent).toBe('0');
    expect(screen.getByTestId('color').textContent).toBe('gray');
    expect(screen.getByTestId('variant').textContent).toBe('draw');

    // Click Win
    fireEvent.click(screen.getByText('Win'));
    await allSettled(scope); // Wait for updates

    expect(screen.getByTestId('score').textContent).toBe('10');
    expect(screen.getByTestId('color').textContent).toBe('green');
    expect(screen.getByTestId('variant').textContent).toBe('winning');

    // Click Lose
    fireEvent.click(screen.getByText('Lose'));
    await allSettled(scope);

    expect(screen.getByTestId('score').textContent).toBe('-10');
    expect(screen.getByTestId('color').textContent).toContain(
      'rgba(255, 0, 0,',
    );
    expect(screen.getByTestId('variant').textContent).toBe('losing');
  });
});
