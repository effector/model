import { useState } from 'react';
import { GameDemo } from './GameDemo';
import { UserDemo } from './UserDemo';
import { TreeDemo } from './TreeDemo';
import { AppView as FoodDemo } from '../food/view/AppView';

export default function App() {
  const [tab, setTab] = useState<'game' | 'user' | 'tree' | 'food'>('food');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-indigo-600">
          Effector Models Research
        </h1>
        <div className="flex space-x-2 md:space-x-4 mb-6 md:mb-8 bg-white p-1.5 md:p-2 rounded-lg shadow-sm inline-flex overflow-x-auto max-w-full">
          <button
            disabled={tab === 'game'}
            onClick={() => setTab('game')}
            className={`px-4 py-2 rounded-md transition-colors duration-200 whitespace-nowrap ${
              tab === 'game'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Game Model (Variants)
          </button>
          <button
            disabled={tab === 'user'}
            onClick={() => setTab('user')}
            className={`px-4 py-2 rounded-md transition-colors duration-200 whitespace-nowrap ${
              tab === 'user'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Chat User (Polymorphism)
          </button>
          <button
            disabled={tab === 'tree'}
            onClick={() => setTab('tree')}
            className={`px-4 py-2 rounded-md transition-colors duration-200 whitespace-nowrap ${
              tab === 'tree'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Recursive Tree
          </button>
          <button
            disabled={tab === 'food'}
            onClick={() => setTab('food')}
            className={`px-4 py-2 rounded-md transition-colors duration-200 whitespace-nowrap ${
              tab === 'food'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Food Order (New)
          </button>
        </div>

        {tab === 'game' && <GameDemo />}
        {tab === 'user' && <UserDemo />}
        {tab === 'tree' && <TreeDemo />}
        {tab === 'food' && <FoodDemo />}
      </div>
    </div>
  );
}
