import { useUnit } from 'effector-react';
import { $score, updateScore, game, stats } from '../game/instance';

export function GameDemo() {
  const [score, update] = useUnit([$score, updateScore]);
  const color = useUnit(game.facets.visual.$color) as any;
  const totalLosingTime = useUnit((stats as any).$totalLosingTime) as any;
  const activeVariant = useUnit(game.activeVariant) as any;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Game Model Demo
      </h2>
      <div className="mb-8 space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Score: {score}
        </label>
        <input
          type="range"
          min="-100"
          max="100"
          value={score}
          onChange={(e) => update(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      <div
        className="w-32 h-32 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner transition-colors duration-300 mx-auto mb-8"
        style={{
          backgroundColor: color,
          textShadow: '0 0 4px rgba(0,0,0,0.5)',
        }}
      >
        {activeVariant}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <strong className="text-gray-900">Total Time Lost:</strong>{' '}
        <span className="text-indigo-600 font-mono">{totalLosingTime}s</span>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed">
        Move slider below 0 to trigger "losing" variant and red color intensity.
        Timer runs only when losing.
      </p>
    </div>
  );
}
