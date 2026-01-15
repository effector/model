import { useUnit } from 'effector-react';
import { $score, updateScore, game, stats } from '../game/instance';

export function GameDemo() {
  const [score, update] = useUnit([$score, updateScore]);
  const color = useUnit(game.facets.visual.$color);
  const totalLosingTime = useUnit(stats.$totalLosingTime);
  const activeVariant = useUnit(game.activeVariant);

  return (
    <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Game Model Demo</h2>
      <div style={{ marginBottom: 20 }}>
        <label>Score: {score}</label>
        <br />
        <input
          type="range"
          min="-100"
          max="100"
          value={score}
          onChange={(e) => update(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div
        style={{
          width: 100,
          height: 100,
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          marginBottom: 20,
          textShadow: '0 0 4px black',
        }}
      >
        {activeVariant}
      </div>

      <div>
        <strong>Total Time Lost:</strong> {totalLosingTime}s
      </div>

      <p style={{ fontSize: '0.8em', color: '#666' }}>
        Move slider below 0 to trigger "losing" variant and red color intensity.
        Timer runs only when losing.
      </p>
    </div>
  );
}
